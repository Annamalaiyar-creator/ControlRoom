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
  const mask = (str) => {
    if (!str) return 'empty';
    return `${str.substring(0, 5)}...${str.substring(str.length - 5)}`;
  };
  res.json({
    connected: zohoSession.connected,
    orgId: zohoSession.orgId,
    apiToken: mask(zohoSession.apiToken),
    clientId: mask(process.env.ZOHO_CLIENT_ID),
    clientSecret: mask(process.env.ZOHO_CLIENT_SECRET),
    organizationName: zohoSession.connected ? zohoSession.organizationName : null
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

const getZohoAccessToken = () => {
  return new Promise((resolve, reject) => {
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
  });
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
        code: c.contact_id,
        name: c.contact_name,
        type: c.contact_type === 'customer_vendor' ? 'Manufacturer' : 'Supplier',
        contact: c.primary_contact_name || '—',
        phone: c.phone || '—',
        cat: 'General Vendor',
        status: c.status === 'active' ? 'Active' : 'Inactive',
        spend: '—',
        terms: c.payment_terms_label || 'Net 30 Days'
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
const fetchZohoPurchaseOrders = (accessToken) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.zohoapis.in',
      port: 443,
      path: `/books/v3/purchaseorders?organization_id=${zohoSession.orgId}`,
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
