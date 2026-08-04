import React, { useState } from 'react';
import { Check, Hourglass, Loader2 } from 'lucide-react';

export default function RecentPurchaseOrders({ purchaseOrders: realPurchaseOrders = [] }) {
  const [selectedPOs, setSelectedPOs] = useState([]);

  const defaultPurchaseOrders = [
    {
      poNo: 'PO-250520-086',
      vendor: 'Tata Steel Ltd.',
      poDate: '20 May 2025',
      deliveryDate: '28 May 2025',
      amount: '₹18,75,000',
      status: 'In Progress',
      statusType: 'in-progress'
    },
    {
      poNo: 'PO-250520-085',
      vendor: 'Jindal Aluminium',
      poDate: '19 May 2025',
      deliveryDate: '26 May 2025',
      amount: '₹12,40,000',
      status: 'Approved',
      statusType: 'approved'
    },
    {
      poNo: 'PO-250520-084',
      vendor: 'Polycab India Ltd.',
      poDate: '18 May 2025',
      deliveryDate: '25 May 2025',
      amount: '₹8,90,000',
      status: 'In Progress',
      statusType: 'in-progress'
    },
    {
      poNo: 'PO-250520-083',
      vendor: 'Havells India Ltd.',
      poDate: '17 May 2025',
      deliveryDate: '24 May 2025',
      amount: '₹6,35,000',
      status: 'Approved',
      statusType: 'approved'
    },
    {
      poNo: 'PO-250520-082',
      vendor: 'Ultratech Cement',
      poDate: '16 May 2025',
      deliveryDate: '23 May 2025',
      amount: '₹5,80,000',
      status: 'In Progress',
      statusType: 'in-progress'
    }
  ];

  const purchaseOrders = realPurchaseOrders.length > 0 ? realPurchaseOrders.slice(0, 5) : defaultPurchaseOrders;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPOs(purchaseOrders.map(po => po.poNo));
    } else {
      setSelectedPOs([]);
    }
  };

  const handleSelectRow = (poNo) => {
    if (selectedPOs.includes(poNo)) {
      setSelectedPOs(selectedPOs.filter(item => item !== poNo));
    } else {
      setSelectedPOs([...selectedPOs, poNo]);
    }
  };

  const renderStatusBadge = (type, label) => {
    let bg = '';
    let text = '';
    let border = '';
    let Icon = null;

    const normalizedType = type === 'shipped' || type === 'billed' || type === 'in-progress' ? 'in-progress' : 
                           type === 'approved' || type === 'open' ? 'approved' : 'pending';

    if (normalizedType === 'approved') {
      bg = '#f0fdf4';
      text = '#15803d';
      border = '1px solid #bbf7d0';
      Icon = Check;
    } else if (type === 'in-progress') {
      bg = '#eff6ff';
      text = '#1d4ed8';
      border = '1px solid #bfdbfe';
      Icon = Loader2;
    } else { // pending
      bg = '#fffbeb';
      text = '#b45309';
      border = '1px solid #fde68a';
      Icon = Hourglass;
    }

    return (
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '12px',
          backgroundColor: bg,
          color: text,
          border: border,
          fontSize: '11px',
          fontWeight: '600'
        }}
      >
        {Icon && (
          <Icon 
            style={{ 
              width: '10px', 
              height: '10px', 
              animation: type === 'in-progress' ? 'spin 2s linear infinite' : 'none' 
            }} 
          />
        )}
        {label}
      </span>
    );
  };

  return (
    <div className="section-card span-2" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
      {/* Title Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 24px 12px 24px' 
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
          Recent Purchase Orders
        </span>
        <a 
          href="#" 
          style={{ 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: 'var(--color-primary-blue)', 
            textDecoration: 'none' 
          }}
        >
          View All
        </a>
      </div>

      {/* Table Container */}
      <div className="table-responsive" style={{ border: 'none', borderRadius: 0, margin: 0, flex: 1 }}>
        <table className="ds-table" style={{ fontSize: '13px', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={purchaseOrders.length > 0 && purchaseOrders.every(po => selectedPOs.includes(po.poNo))}
                />
              </th>
              <th>PO No.</th>
              <th>Vendor</th>
              <th>PO Date</th>
              <th>Delivery Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((po, idx) => {
              const isChecked = selectedPOs.includes(po.poNo);
              return (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: idx === purchaseOrders.length - 1 ? 'none' : '1px solid #f1f5f9',
                    transition: 'background-color 0.2s',
                    backgroundColor: isChecked ? '#f8fafc' : 'transparent'
                  }}
                  className="table-row-hover"
                >
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleSelectRow(po.poNo)}
                    />
                  </td>
                  <td>
                    <a href="#" style={{ fontWeight: '600', color: '#2563eb', textDecoration: 'none' }}>
                      {po.poNo}
                    </a>
                  </td>
                  <td style={{ fontWeight: '500', color: '#1e293b' }}>{po.vendor}</td>
                  <td style={{ color: '#64748b' }}>{po.poDate}</td>
                  <td style={{ color: '#64748b' }}>{po.deliveryDate}</td>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>{po.amount}</td>
                  <td>
                    {renderStatusBadge(po.statusType, po.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
