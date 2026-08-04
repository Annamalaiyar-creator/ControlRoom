import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, ArrowRight } from 'lucide-react';

export default function SidebarRightColumn() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const approvals = [
    {
      vendor: 'Tata Steel Ltd.',
      initials: 'TS',
      avatarBg: '#FF4A5A', // red circle
      poNo: 'PO-250520-087',
      amount: '₹22,60,000',
      date: '20 May 25',
      requestor: 'Karthik R • 1h ago',
      tags: [
        { label: 'Raw Materials', color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' },
        { label: 'Capital Spend', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
        { label: 'Urgent', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' }
      ]
    },
    {
      vendor: 'Jindal Aluminium',
      initials: 'JA',
      avatarBg: '#3B82F6', // blue circle
      poNo: 'PO-250520-088',
      amount: '₹15,75,000',
      date: '19 May 25',
      requestor: 'Meena S • 3h ago',
      tags: [
        { label: 'Aluminium Rails', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' },
        { label: 'Inventory Stock', color: '#0891b2', bg: '#ecfeff', border: '#cffafe' }
      ]
    },
    {
      vendor: 'Sun Source Energy',
      initials: 'SS',
      avatarBg: '#10B981', // green circle
      poNo: 'PO-250520-089',
      amount: '₹9,40,000',
      date: '18 May 25',
      requestor: 'Aravind K • 5h ago',
      tags: [
        { label: 'Solar Modules', color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7' },
        { label: 'Green Energy', color: '#0d9488', bg: '#f0fdfa', border: '#ccfbf1' }
      ]
    },
    {
      vendor: 'ABB India Ltd.',
      initials: 'AB',
      avatarBg: '#8B5CF6', // purple circle
      poNo: 'PO-250520-090',
      amount: '₹8,25,000',
      date: '17 May 25',
      requestor: 'Priya M • 1d ago',
      tags: [
        { label: 'Electrical items', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' },
        { label: 'Machinery', color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' }
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
