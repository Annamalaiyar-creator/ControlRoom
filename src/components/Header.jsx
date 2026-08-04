import React from 'react';
import { Bell, HelpCircle } from 'lucide-react';

export default function Header({ activeTab }) {
  return (
    <header 
      className="top-navigation" 
      style={{
        height: '56px',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border)',
        margin: 'var(--spacing-16)',
        backgroundColor: 'var(--color-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 var(--spacing-24)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Left side: Breadcrumb */}
      <div 
        style={{
          fontSize: 'var(--font-size-body)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-8)'
        }}
      >
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>ControlRoom</span>
        <span style={{ color: 'var(--color-border)', fontWeight: 'var(--font-weight-light)' }}>|</span>
        <span>{activeTab || 'Dashboard'}</span>
      </div>

      {/* Right side: Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* Help and Support */}
        <button 
          title="Help & Support"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
        >
          <HelpCircle style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Notifications */}
        <button 
          title="Notifications"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
        >
          <Bell style={{ width: '20px', height: '20px' }} />
          {/* Notification Dot */}
          <span 
            style={{
              position: 'absolute',
              top: '-1px',
              right: '-1px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white'
            }}
          />
        </button>

        {/* Vertical Separator */}
        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-border)' }} />

        {/* Profile Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          {/* Circular Profile Photo Initials Avatar */}
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            A
          </div>
          {/* Name of the person */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-primary)', lineHeight: '1.2' }}>
              Arun
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              Procurement Admin
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
