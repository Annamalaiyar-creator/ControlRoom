import React, { useState } from 'react';
import { Bell, HelpCircle, ChevronDown, User, Shield, LogOut, Factory, ShoppingCart } from 'lucide-react';

export default function Header({ activeTab, userRole = 'Procurement Admin', onSwitchRole, onOpenLoginModal }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const isProdAdmin = userRole === 'Production Admin';
  const userName = isProdAdmin ? 'Senthil Kumar' : 'Arun';
  const avatarLetter = isProdAdmin ? 'S' : 'A';
  const roleBadgeColor = isProdAdmin ? '#9333EA' : '#2563EB';

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
        boxShadow: 'var(--shadow-sm)',
        position: 'relative'
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

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
        >
          <Bell style={{ width: '20px', height: '20px' }} />
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

        {/* Profile Details Dropdown Trigger */}
        <div 
          onClick={() => setShowRoleMenu(!showRoleMenu)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}
        >
          {/* Circular Profile Photo Initials Avatar */}
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: roleBadgeColor,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {avatarLetter}
          </div>
          {/* Name of the person */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-primary)', lineHeight: '1.2' }}>
              {userName}
            </span>
            <span style={{ fontSize: '10px', color: roleBadgeColor, fontWeight: 'bold' }}>
              {userRole}
            </span>
          </div>
          <ChevronDown style={{ width: '14px', height: '14px', color: '#64748B' }} />

          {/* Role & Login Menu Popup */}
          {showRoleMenu && (
            <div 
              style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                width: '240px',
                padding: '8px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0F172A' }}>{userName}</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>{isProdAdmin ? 'senthil@armsai.com' : 'arun@armsai.com'}</div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    onOpenLoginModal && onOpenLoginModal();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#EF4444',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut style={{ width: '15px', height: '15px' }} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

