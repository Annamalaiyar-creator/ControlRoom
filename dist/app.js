// Standalone Zoho proxy handler for dist
const https = require('https');
const http = require('http');
const url = require('url');

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || '1000.9U5BAN338075M5HBI3U8K1VBNKUU8K';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || 'e82079a5165e3b2e75fdc602f3e08fd38489d75f13';
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || '1000.69cd7dbd3da3ab8f107f8addf5e9e04c.87b4757d889f6ebd95a1bf897147a1c7';
const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID || '60082137608';

let cachedAccessToken = '';
let tokenExpiresAt = 0;

function getZohoAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && tokenExpiresAt > now + 300000) {
    return Promise.resolve(cachedAccessToken);
  }

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }).toString();

    const req = https.request({
      hostname: 'accounts.zoho.in',
      port: 443,
      path: '/oauth/v2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            cachedAccessToken = parsed.access_token;
            tokenExpiresAt = Date.now() + (parsed.expires_in || 3600) * 1000;
            resolve(parsed.access_token);
          } else {
            reject(new Error(parsed.error || 'Failed to obtain access token'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function callZoho(method, apiPath, body = null, accessToken) {
  return new Promise((resolve, reject) => {
    const separator = apiPath.includes('?') ? '&' : '?';
    const fullPath = `${apiPath}${separator}organization_id=${ZOHO_ORG_ID}`;
    const payloadStr = body ? JSON.stringify(body) : null;

    const req = https.request({
      hostname: 'www.zohoapis.in',
      port: 443,
      path: fullPath,
      method: method,
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
        ...(payloadStr ? { 'Content-Length': Buffer.byteLength(payloadStr) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (_) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payloadStr) req.write(payloadStr);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Read request body
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', async () => {
    let body = {};
    if (rawBody) {
      try { body = JSON.parse(rawBody); } catch (_) {}
    }

    try {
      // 1. Next PO Number
      if (pathname === '/api/zoho/next-po-number' || pathname.endsWith('/next-po-number')) {
        const token = await getZohoAccessToken();
        const zohoRes = await callZoho('GET', '/books/v3/purchaseorders?per_page=10&sort_column=created_time&sort_order=D', null, token);
        let maxNum = 91;
        if (zohoRes && Array.isArray(zohoRes.purchaseorders)) {
          zohoRes.purchaseorders.forEach(p => {
            const match = String(p.purchaseorder_number || '').match(/^PO-(\d+)/i);
            if (match) {
              const v = parseInt(match[1], 10);
              if (v > maxNum && v < 99999) maxNum = v;
            }
          });
        }
        const nextPoNumber = 'PO-' + String(maxNum + 1).padStart(5, '0');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, nextPoNumber, nextPoNo: nextPoNumber }));
      }

      // 2. Fetch or Create Purchase Orders
      if (pathname === '/api/zoho/purchaseorders' || pathname.endsWith('/purchaseorders')) {
        const token = await getZohoAccessToken();

        if (req.method === 'GET') {
          const zohoRes = await callZoho('GET', '/books/v3/purchaseorders?per_page=200&sort_column=created_time&sort_order=D', null, token);
          const mapped = ((zohoRes && zohoRes.purchaseorders) || []).map(p => ({
            id: p.purchaseorder_id,
            poNo: p.purchaseorder_number,
            vendor: p.vendor_name,
            poDate: p.date,
            deliveryDate: p.delivery_date,
            amount: `₹${Number(p.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            total: p.total,
            status: p.status === 'open' ? 'OPEN' : (p.status === 'draft' ? 'Draft' : p.status),
            statusType: p.status === 'open' ? 'approved' : (p.status === 'draft' ? 'draft' : 'pending'),
            items: []
          }));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(mapped));
        }

        if (req.method === 'POST') {
          const parseDate = (d) => {
            if (!d) return new Date().toISOString().split('T')[0];
            const dt = new Date(d);
            return isNaN(dt.getTime()) ? new Date().toISOString().split('T')[0] : dt.toISOString().split('T')[0];
          };

          const lineItems = (body.items || []).map(it => ({
            name: it.itemName || it.name || 'General Item',
            rate: Number(it.unitPrice || it.rate || it.price || 100),
            quantity: Number(it.qty || it.quantity || 1),
            account_id: '4080449000000000567'
          }));

          if (lineItems.length === 0) {
            lineItems.push({ name: 'General Procurement Item', rate: 1000, quantity: 1, account_id: '4080449000000000567' });
          }

          const zohoPayload = {
            purchaseorder_number: body.poNo || undefined,
            vendor_id: body.vendorId || '4080449000000039008',
            date: parseDate(body.poDate),
            delivery_date: parseDate(body.deliveryDate),
            line_items: lineItems
          };

          if (body.deliveryAddress) zohoPayload.delivery_address = String(body.deliveryAddress).slice(0, 80);
          if (body.billingAddress) zohoPayload.billing_address = String(body.billingAddress).slice(0, 80);
          if (body.notes) zohoPayload.notes = String(body.notes);
          if (body.terms) zohoPayload.terms = String(body.terms);

          console.log('[ZOHO STANDALONE CREATE]', JSON.stringify(zohoPayload));
          let zohoResult = await callZoho('POST', '/books/v3/purchaseorders', zohoPayload, token);

          // If Zoho warns about auto-generation mismatch, retry letting Zoho assign its exact sequence number
          if (zohoResult && zohoResult.code !== 0) {
            console.warn(`[ZOHO RETRY WITHOUT MANUAL PO NO] ${zohoResult.message}`);
            delete zohoPayload.purchaseorder_number;
            zohoResult = await callZoho('POST', '/books/v3/purchaseorders', zohoPayload, token);
          }

          if (zohoResult && (zohoResult.code === 0 || zohoResult.purchaseorder)) {
            const created = zohoResult.purchaseorder;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: true,
              message: 'Purchase Order created in Zoho Books successfully!',
              po: { ...body, id: created ? created.purchaseorder_id : body.poNo, poNo: created ? created.purchaseorder_number : body.poNo },
              zohoPo: created
            }));
          } else {
            console.warn('[ZOHO CREATE WARNING]', zohoResult);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: false,
              message: (zohoResult && zohoResult.message) || 'Zoho creation error',
              po: body
            }));
          }
        }
      }

      // If not an API request, serve the static frontend files
      const fs = require('fs');
      const path = require('path');

      let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
      
      // If file exists, serve it with proper content type
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        return fs.createReadStream(filePath).pipe(res);
      }

      // If it's a route and not /api/, fallback to index.html for SPA routing
      if (!pathname.startsWith('/api')) {
        const indexHtmlPath = path.join(__dirname, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          return fs.createReadStream(indexHtmlPath).pipe(res);
        }
      }

      // Default Health/Status check for /api
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Control Room Zoho Service is Online', time: new Date().toISOString() }));
    } catch (err) {
      console.error('[ZOHO SERVER ERROR]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Standalone Control Room Zoho Server running on port ${PORT}`);
});

module.exports = server;
