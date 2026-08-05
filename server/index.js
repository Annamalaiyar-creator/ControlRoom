import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Parse credentials directly from the .env file to bypass environment caching
const loadCredentialsFromEnv = () => {
  const credentials = { orgId: '', apiToken: '', connected: false };
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join('=').trim();
          if (key === 'ZOHO_ORG_ID') {
            credentials.orgId = value;
          } else if (key === 'ZOHO_REFRESH_TOKEN') {
            credentials.apiToken = value;
          }
        }
      }
    }
    credentials.connected = !!(credentials.orgId && credentials.apiToken);
    
    // Fallback to process.env if the file is missing or empty (essential for Vercel environment variables)
    if (!credentials.connected) {
      credentials.orgId = process.env.ZOHO_ORG_ID || '';
      credentials.apiToken = process.env.ZOHO_REFRESH_TOKEN || '';
      credentials.connected = !!(credentials.orgId && credentials.apiToken);
    }
  } catch (err) {
    console.error("Failed to load credentials from .env:", err);
  }
  return credentials;
};

const initialCreds = loadCredentialsFromEnv();

// In-memory session store for Zoho OAuth tokens, initializing from env if present
let zohoSession = {
  connected: initialCreds.connected,
  orgId: initialCreds.orgId,
  apiToken: initialCreds.apiToken,
  accessToken: '',
  tokenExpiresAt: 0,
  organizationName: 'VRM Structures India Pvt Ltd'
};

const saveCredentialsToEnv = (orgId, apiToken) => {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
    
    // Replace or append ZOHO_ORG_ID
    if (content.includes('ZOHO_ORG_ID=')) {
      content = content.replace(/ZOHO_ORG_ID=.*/, `ZOHO_ORG_ID=${orgId}`);
    } else {
      content += `\nZOHO_ORG_ID=${orgId}`;
    }
    
    // Replace or append ZOHO_REFRESH_TOKEN
    if (content.includes('ZOHO_REFRESH_TOKEN=')) {
      content = content.replace(/ZOHO_REFRESH_TOKEN=.*/, `ZOHO_REFRESH_TOKEN=${apiToken}`);
    } else {
      content += `\nZOHO_REFRESH_TOKEN=${apiToken}`;
    }
    
    fs.writeFileSync(envPath, content.trim() + '\n', 'utf8');
  } catch (err) {
    console.error("Failed to write credentials to .env file:", err);
  }
};

// 1. Check Connection Status and Credentials
app.get('/api/zoho/status', (req, res) => {
  res.json({
    connected: zohoSession.connected,
    orgId: zohoSession.orgId,
    apiToken: zohoSession.apiToken,
    organizationName: 'VRM Structures India Pvt Ltd'
  });
});

// 2. Save Credentials (API Token & Org ID)
app.post('/api/zoho/credentials', (req, res) => {
  const { orgId, apiToken } = req.body;
  if (!orgId || !apiToken) {
    return res.status(400).json({ error: 'Organization ID and API Token are required.' });
  }

  zohoSession.connected = true;
  zohoSession.orgId = orgId;
  zohoSession.apiToken = apiToken;
  
  // Persist to .env
  saveCredentialsToEnv(orgId, apiToken);
  
  res.json({ success: true, organizationName: zohoSession.organizationName });
});

// 3. Disconnect from Zoho
app.post('/api/zoho/disconnect', (req, res) => {
  zohoSession = {
    connected: false,
    orgId: '',
    apiToken: '',
    organizationName: 'VRM Structures Pvt Ltd'
  };
  
  // Wipe from .env
  saveCredentialsToEnv('', '');
  
  res.json({ success: true });
});

// 4. Trigger Manual Sync
app.post('/api/zoho/sync', async (req, res) => {
  if (!zohoSession.connected) {
    return res.status(401).json({ error: 'Zoho not connected. Configure credentials first.' });
  }
  
  try {
    // Force testing Zoho access token validity
    const accessToken = await getZohoAccessToken();
    // Test fetch to confirm organization and access token are healthy
    await fetchZohoItems(accessToken);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Zoho Sync authentication or connection failed:", err);
    res.status(500).json({ error: `Sync failed: ${err.message || 'Check OAuth configuration'}` });
  }
});

let pendingTokenPromise = null;

const getZohoAccessToken = () => {
  const now = Date.now();
  // If we already have a valid access token (with a 5-minute buffer), resolve immediately
  if (zohoSession.accessToken && zohoSession.tokenExpiresAt > now + 300000) {
    return Promise.resolve(zohoSession.accessToken);
  }

  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      refresh_token: zohoSession.apiToken,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }).toString();

    const options = {
      hostname: 'accounts.zoho.in',
      port: 443,
      path: '/oauth/v2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            zohoSession.accessToken = parsed.access_token;
            // Cache token and set expiration timestamp
            zohoSession.tokenExpiresAt = Date.now() + (parsed.expires_in || 3600) * 1000;
            resolve(parsed.access_token);
          } else {
            reject(new Error(parsed.error || 'No access token returned.'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  }).finally(() => {
    pendingTokenPromise = null;
  });

  return pendingTokenPromise;
};


const fetchZohoVendors = (accessToken) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.zohoapis.in',
      port: 443,
      path: `/books/v3/contacts?organization_id=${zohoSession.orgId}&contact_type=vendor`,
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

// Real-time synchronization endpoint retrieving live vendors from Zoho Books
app.get('/api/zoho/vendors', async (req, res) => {
  if (!zohoSession.connected) {
    return res.json([]);
  }

  try {
    const accessToken = await getZohoAccessToken();
    const data = await fetchZohoVendors(accessToken);
    
    if (data.contacts) {
      const translated = data.contacts.map(c => ({
        id: c.contact_id,
        code: c.contact_id,
        name: c.contact_name,
        companyName: c.company_name || c.contact_name,
        type: c.contact_type === 'customer_vendor' ? 'Manufacturer' : 'Supplier',
        contact: c.primary_contact_name || '—',
        phone: c.phone || c.mobile || '—',
        mobile: c.mobile || '—',
        email: c.email || '—',
        cat: 'General Vendor',
        status: c.status === 'active' ? 'Active' : 'Inactive',
        spend: c.outstanding_payable_amount ? `₹${Number(c.outstanding_payable_amount).toLocaleString('en-IN')}` : '—',
        payable: c.outstanding_payable_amount ? `₹${Number(c.outstanding_payable_amount).toLocaleString('en-IN')}` : '₹0.00',
        terms: c.payment_terms_label || (c.payment_terms ? `Net ${c.payment_terms} Days` : 'Net 30 Days'),
        gstin: c.gst_no || c.gstin || '—',
        gstTreatment: c.gst_treatment_formatted || c.gst_treatment || '—',
        sourceOfSupply: c.place_of_contact_formatted || c.place_of_contact || c.source_of_supply || '—',
        pan: c.pan_no || c.pan || '—',
        currency: c.currency_code || 'INR',
        website: c.website || '—'
      }));
      res.json(translated);
    } else {
      res.status(500).json({ error: data.message || 'Failed to fetch contacts from Zoho.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Connection to Zoho Books failed.' });
  }
});

// Single vendor details endpoint from Zoho Books
app.get('/api/zoho/vendors/:id', async (req, res) => {
  if (!zohoSession.connected) {
    return res.status(400).json({ error: 'Zoho session not connected.' });
  }

  try {
    const accessToken = await getZohoAccessToken();
    const { id } = req.params;
    
    const options = {
      hostname: 'www.zohoapis.in',
      port: 443,
      path: `/books/v3/contacts/${id}?organization_id=${zohoSession.orgId}`,
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.contact) {
            const c = parsed.contact;
            let billingObj = c.billing_address || {};
            let shippingObj = c.shipping_address || {};

            if (Array.isArray(c.addresses)) {
              const bFound = c.addresses.find(a => a.address_type === 'billing');
              if (bFound) billingObj = bFound;
              const sFound = c.addresses.find(a => a.address_type === 'shipping');
              if (sFound) shippingObj = sFound;
            }

            const formatAddr = (a) => {
              if (!a || typeof a !== 'object') return '—';
              const parts = [
                a.attention ? `Attn: ${a.attention}` : '',
                a.address || a.street || a.address_1 || '',
                a.street2 || a.address_2 || '',
                a.city || '',
                a.state || a.province || '',
                a.zip || a.zipcode || a.postal_code || a.pincode || '',
                a.country || a.country_name || ''
              ].filter(p => p && String(p).trim().length > 0);
              return parts.length > 0 ? parts.join(', ') : '—';
            };

            const billingAddressStr = formatAddr(billingObj);
            const shippingAddressStr = formatAddr(shippingObj);

            const detailedVendor = {
              id: c.contact_id,
              code: c.contact_id,
              name: c.contact_name,
              companyName: c.company_name || c.contact_name,
              type: c.contact_type === 'customer_vendor' ? 'Manufacturer' : 'Supplier',
              contact: c.primary_contact_name || (c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : '—'),
              firstName: c.first_name || '—',
              lastName: c.last_name || '—',
              email: c.email || '—',
              phone: c.phone || '—',
              mobile: c.mobile || '—',
              cat: 'General Vendor',
              status: c.status === 'active' ? 'Active' : 'Inactive',
              spend: c.outstanding_payable_amount ? `₹${Number(c.outstanding_payable_amount).toLocaleString('en-IN')}` : '—',
              payable: c.outstanding_payable_amount ? `₹${Number(c.outstanding_payable_amount).toLocaleString('en-IN')}` : '₹0.00',
              unusedCredits: c.unused_credits_receivable_amount ? `₹${Number(c.unused_credits_receivable_amount).toLocaleString('en-IN')}` : '₹0.00',
              terms: c.payment_terms_label || (c.payment_terms ? `Net ${c.payment_terms} Days` : 'Net 30 Days'),
              gstin: c.gst_no || c.gstin || '—',
              gstTreatment: c.gst_treatment_formatted || c.gst_treatment || '—',
              sourceOfSupply: c.place_of_contact_formatted || c.place_of_contact || c.source_of_supply || (billingObj.state || '—'),
              pan: c.pan_no || c.pan || '—',
              currency: c.currency_code || 'INR',
              website: c.website || '—',
              billingAddressObj: billingObj,
              shippingAddressObj: shippingObj,
              billingAddress: billingAddressStr,
              shippingAddress: shippingAddressStr,
              notes: c.notes || '—',
              contactPersons: Array.isArray(c.contact_persons) ? c.contact_persons.map(cp => ({
                name: `${cp.first_name || ''} ${cp.last_name || ''}`.trim(),
                email: cp.email || '—',
                phone: cp.phone || cp.mobile || '—',
                designation: cp.designation || '—'
              })) : [],
              rawZohoContact: c
            };
            res.json(detailedVendor);
          } else {
            res.status(500).json({ error: parsed.message || 'Failed to fetch vendor detail from Zoho.' });
          }
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });
    });

    request.on('error', (e) => res.status(500).json({ error: e.message }));
    request.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to connect to Zoho Books API.' });
  }
});
const fetchZohoPurchaseOrders = async (accessToken) => {
  let allOrders = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pageData = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.zohoapis.in',
        port: 443,
        path: `/books/v3/purchaseorders?organization_id=${zohoSession.orgId}&page=${page}&per_page=200`,
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.end();
    });

    if (pageData && Array.isArray(pageData.purchaseorders)) {
      allOrders = allOrders.concat(pageData.purchaseorders);
      if (pageData.page_context && pageData.page_context.has_more_page) {
        page++;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return { purchaseorders: allOrders };
};

const fetchZohoInvoices = (accessToken) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.zohoapis.in',
      port: 443,
      path: `/books/v3/invoices?organization_id=${zohoSession.orgId}`,
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

// Real-time synchronization endpoint retrieving live purchase orders from Zoho Books
app.get('/api/zoho/purchaseorders', async (req, res) => {
  if (!zohoSession.connected) {
    return res.json([]);
  }

  try {
    const accessToken = await getZohoAccessToken();
    const data = await fetchZohoPurchaseOrders(accessToken);
    
    if (data.purchaseorders) {
      const translated = data.purchaseorders.map(po => {
        let statusType = 'pending';
        let statusText = 'Pending Approval';
        if (po.status === 'open') {
          statusType = 'approved';
          statusText = 'Approved';
        } else if (po.status === 'billed') {
          statusType = 'shipped';
          statusText = 'Shipped';
        } else if (po.status === 'draft') {
          statusType = 'draft';
          statusText = 'Draft';
        }
        
        return {
          id: po.purchaseorder_id,
          poNo: po.purchaseorder_number,
          vendor: po.vendor_name,
          poDate: po.date,
          deliveryDate: po.delivery_date || '—',
          amount: `₹${Number(po.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          status: statusText,
          statusType: statusType,
          items: []
        };
      });
      res.json(translated);
    } else {
      res.status(500).json({ error: data.message || 'Failed to fetch purchase orders from Zoho.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Connection to Zoho Books failed.' });
  }
});

const fetchZohoPurchaseOrderDetail = (accessToken, id) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.zohoapis.in',
      port: 443,
      path: `/books/v3/purchaseorders/${id}?organization_id=${zohoSession.orgId}`,
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

// Real-time synchronization endpoint retrieving live purchase order details from Zoho Books
app.get('/api/zoho/purchaseorders/:id', async (req, res) => {
  if (!zohoSession.connected) {
    return res.status(401).json({ error: 'Zoho not connected.' });
  }

  try {
    const accessToken = await getZohoAccessToken();
    const data = await fetchZohoPurchaseOrderDetail(accessToken, req.params.id);
    
    if (data.purchaseorder) {
      const po = data.purchaseorder;
      const items = (po.line_items || []).map(item => ({
        name: item.name,
        description: item.description || '',
        account: item.account_name || 'Raw Material',
        qty: item.quantity,
        unit: item.unit || 'NOS',
        rate: item.rate,
        tax: item.tax_percentage || 0
      }));

      const translated = {
        id: po.purchaseorder_id,
        poNo: po.purchaseorder_number,
        vendor: po.vendor_name,
        branch: po.branch_name || '',
        contactPerson: po.contact_person_name || '',
        contactNo: po.phone || '',
        email: po.email || '',
        gstNo: po.gst_no || po.tax_registration_number || '',
        deliveryAddress: po.delivery_address ? `${po.delivery_address.address || ''}, ${po.delivery_address.city || ''}, ${po.delivery_address.state || ''}`.trim() : '—',
        billingAddress: po.billing_address ? `${po.billing_address.address || ''}, ${po.billing_address.city || ''}, ${po.billing_address.state || ''}`.trim() : '—',
        poDate: po.date,
        deliveryDate: po.delivery_date || '—',
        paymentTerms: po.payment_terms_label || 'Net 30 Days',
        purchaser: po.purchaser_name || '—',
        shipmentPref: po.shipment_preference || 'Road Transport',
        currency: po.currency_code || 'INR',
        project: po.project_name || '',
        priority: po.priority || 'High',
        items: items,
        shippingCharges: po.shipping_charge || 0,
        otherCharges: po.adjustment || 0,
        discountPct: po.discount_percent || 0,
        notes: po.notes || '',
        terms: po.terms || '',
        amount: `₹${Number(po.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        status: po.status === 'open' ? 'Approved' : (po.status === 'billed' ? 'Shipped' : 'Draft'),
        statusType: po.status === 'open' ? 'approved' : (po.status === 'billed' ? 'shipped' : 'draft')
      };
      res.json(translated);
    } else {
      res.status(500).json({ error: data.message || 'Failed to fetch purchase order details.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Connection to Zoho Books failed.' });
  }
});

// Real-time synchronization endpoint retrieving live invoices from Zoho Books
app.get('/api/zoho/invoices', async (req, res) => {
  if (!zohoSession.connected) {
    return res.json([]);
  }

  try {
    const accessToken = await getZohoAccessToken();
    const data = await fetchZohoInvoices(accessToken);
    
    if (data.invoices) {
      const translated = data.invoices.map(inv => {
        return {
          invNo: inv.invoice_number,
          date: inv.date,
          vendor: inv.customer_name,
          poNo: inv.reference_number || '—',
          grnNo: '—',
          invAmt: Number(inv.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          poVal: '—',
          grnVal: '—',
          diff: '0.00',
          match: 'Matched',
          pay: inv.status === 'paid' ? 'Ready' : (inv.status === 'overdue' ? 'Blocked' : 'Hold')
        };
      });
      res.json(translated);
    } else {
      res.status(500).json({ error: data.message || 'Failed to fetch invoices from Zoho.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Connection to Zoho Books failed.' });
  }
});

const fetchZohoItems = (accessToken) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.zohoapis.in',
      port: 443,
      path: `/books/v3/items?organization_id=${zohoSession.orgId}`,
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

// Real-time synchronization endpoint retrieving live items catalog from Zoho Books
app.get('/api/zoho/items', async (req, res) => {
  if (!zohoSession.connected) {
    return res.json([]);
  }

  try {
    const accessToken = await getZohoAccessToken();
    const data = await fetchZohoItems(accessToken);
    
    if (data.items) {
      const translated = data.items.map(item => ({
        itemId: item.item_id,
        name: item.name,
        rate: item.rate,
        sku: item.sku || '—',
        status: item.status === 'active' ? 'Active' : 'Inactive',
        description: item.description || '—',
        unit: item.unit || 'NOS'
      }));
      res.json(translated);
    } else {
      res.status(500).json({ error: data.message || 'Failed to fetch items from Zoho.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Connection to Zoho Books failed.' });
  }
});

const fetchZohoItemDetail = (accessToken, id) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.zohoapis.in',
      port: 443,
      path: `/books/v3/items/${id}?organization_id=${zohoSession.orgId}`,
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

// Real-time synchronization endpoint retrieving live item details from Zoho Books
app.get('/api/zoho/items/:id', async (req, res) => {
  if (!zohoSession.connected) {
    return res.status(401).json({ error: 'Zoho not connected.' });
  }

  try {
    const accessToken = await getZohoAccessToken();
    const data = await fetchZohoItemDetail(accessToken, req.params.id);
    
    if (data.item) {
      const item = data.item;
      res.json({
        itemId: item.item_id,
        name: item.name,
        sku: item.sku || '—',
        status: item.status === 'active' ? 'Active' : 'Inactive',
        description: item.description || '—',
        unit: item.unit || 'NOS',
        rate: item.rate || 0,
        purchaseRate: item.purchase_rate || 0,
        purchaseDescription: item.purchase_description || '—',
        stockOnHand: item.stock_on_hand !== undefined ? item.stock_on_hand : '—',
        reorderLevel: item.reorder_level || '—',
        itemType: item.item_type || 'sales_and_purchase',
        productType: item.product_type || 'goods',
        purchaseAccount: item.purchase_account_name || 'Cost of Goods Sold',
        salesAccount: item.account_name || 'Sales',
        taxName: item.tax_name || '—',
        taxPercentage: item.tax_percentage || 0
      });
    } else {
      res.status(500).json({ error: data.message || 'Failed to fetch item details.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Connection to Zoho Books failed.' });
  }
});

if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Zoho Integration Proxy Server running on port ${PORT}`);
  });
}

export default app;
