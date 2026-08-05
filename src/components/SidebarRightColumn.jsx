import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, ArrowRight } from 'lucide-react';

export default function SidebarRightColumn() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const approvals = [
    {
      vendor: 'AKEYEM SONS',
      initials: 'AS',
      avatarBg: '#2563EB',
      poNo: 'PO Value: ₹1.28 Cr (29.9%)',
      amount: '92.3% On-Time',
      date: 'Rating: ★★★★★',
      requestor: 'Top Vendor • 29.9% of Total PO Value',
      tags: [
        { label: 'PO Value: ₹1.28 Cr', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' },
        { label: '29.9% Share', color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7' },
        { label: '92.3% On-Time', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' }
      ]
    },
    {
      vendor: 'ARUMUGA STEEL',
      initials: 'ST',
      avatarBg: '#DC2626',
      poNo: 'PO Value: ₹0.86 Cr (20.1%)',
      amount: '89.6% On-Time',
      date: 'Rating: ★★★★★',
      requestor: 'Key Supplier • 20.1% of Total PO Value',
      tags: [
        { label: 'PO Value: ₹0.86 Cr', color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' },
        { label: '20.1% Share', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' }
      ]
    },
    {
      vendor: 'VAIBOV POLES',
      initials: 'VP',
      avatarBg: '#16A34A',
      poNo: 'PO Value: ₹0.64 Cr (15.0%)',
      amount: '95.4% On-Time',
      date: 'Rating: ★★★★★',
      requestor: 'Preferred Vendor • 15.0% of Total PO Value',
      tags: [
        { label: 'PO Value: ₹0.64 Cr', color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7' },
        { label: '95.4% On-Time', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' }
      ]
    },
    {
      vendor: 'KPR Mill',
      initials: 'KM',
      avatarBg: '#9333EA',
      poNo: 'PO Value: ₹0.42 Cr (9.8%)',
      amount: '88.0% On-Time',
      date: 'Rating: ★★★★☆',
      requestor: 'Supplier • 9.8% of Total PO Value',
      tags: [
        { label: 'PO Value: ₹0.42 Cr', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
        { label: '88.0% On-Time', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' }
      ]
    },
    {
      vendor: 'SHREE GANESH TRADERS',
      initials: 'SG',
      avatarBg: '#0284C7',
      poNo: 'PO Value: ₹0.38 Cr (8.9%)',
      amount: '90.1% On-Time',
      date: 'Rating: ★★★★★',
      requestor: 'Supplier • 8.9% of Total PO Value',
      tags: [
        { label: 'PO Value: ₹0.38 Cr', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
        { label: '90.1% On-Time', color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7' }
      ]
    }
  ];

  const handleNext = () => {
    if (currentIndex < approvals.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const current = approvals[currentIndex];

  return (
    <div 
      className="section-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0, 
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        backgroundColor: 'white',
        boxShadow: 'var(--shadow-sm)',
        alignSelf: 'flex-start'
      }}
    >
      {/* 1. Header Row (Inside the Card) */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 24px 12px 24px',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
          Pending Approvals
        </span>
        
        {/* Pagination Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn btn-icon"
            style={{ 
              width: '24px', 
              height: '24px', 
              opacity: currentIndex === 0 ? 0.3 : 1, 
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
              backgroundColor: 'transparent'
            }}
          >
            <ChevronLeft style={{ width: '14px', height: '14px', color: '#64748b' }} />
          </button>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
            {currentIndex + 1} of {approvals.length}
          </span>
          <button 
            onClick={handleNext}
            disabled={currentIndex === approvals.length - 1}
            className="btn btn-icon"
            style={{ 
              width: '24px', 
              height: '24px', 
              opacity: currentIndex === approvals.length - 1 ? 0.3 : 1, 
              cursor: currentIndex === approvals.length - 1 ? 'not-allowed' : 'pointer',
              border: 'none',
              backgroundColor: 'transparent'
            }}
          >
            <ChevronRight style={{ width: '14px', height: '14px', color: '#64748b' }} />
          </button>
        </div>
      </div>

      {/* 2. Main content area */}
      <div 
        style={{ 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          backgroundColor: '#fafbfc',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        {/* Top Details Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Round Avatar Container */}
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: current.avatarBg,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {current.initials}
            </div>

            {/* Vendor labels */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{current.vendor}</span>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{current.poNo}</span>
            </div>

          </div>

          {/* Request Date */}
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            {current.date}
          </span>
        </div>

        {/* Large Amount Display */}
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', fontFamily: 'Inter, system-ui' }}>
          {current.amount}
        </div>

        {/* Tags Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {current.tags.map((tag, idx) => (
            <span 
              key={idx}
              style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '4px 10px',
                borderRadius: '6px',
                color: tag.color,
                backgroundColor: tag.bg,
                border: `1px solid ${tag.border}`
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>

        {/* Quick Decision Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button 
            className="btn" 
            style={{ 
              flex: 1, 
              height: '36px', 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0', 
              color: '#334155',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <X style={{ width: '12px', height: '12px', color: '#ef4444' }} />
            Decline
          </button>
          <button 
            className="btn" 
            style={{ 
              flex: 1, 
              height: '36px', 
              backgroundColor: '#2563eb', 
              border: 'none', 
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Check style={{ width: '12px', height: '12px', color: 'white' }} />
            Approve
          </button>
        </div>

      </div>

      {/* 3. Bottom Footer Action link (Inside Card) */}
      <div 
        style={{ 
          padding: '12px 24px', 
          backgroundColor: 'white',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <button 
          style={{ 
            width: '100%',
            height: '38px',
            backgroundColor: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          View all Pending PO
          <ArrowRight style={{ width: '12px', height: '12px', color: '#64748b' }} />
        </button>
      </div>

    </div>
  );
}
