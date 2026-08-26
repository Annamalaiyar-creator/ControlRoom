import React, { useState, useEffect } from 'react';
import { Bell, HelpCircle, ChevronDown, LogOut, Check, RotateCcw, CheckCircle2, ArrowRight, Code } from 'lucide-react';

export const addLiveNotification = (notif) => {
  try {
    const existing = JSON.parse(localStorage.getItem('vrm_live_notifications') || '[]');
    const updated = [notif, ...existing.filter(n => n.id !== notif.id)];
    localStorage.setItem('vrm_live_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('vrm_notifications_updated'));
  } catch (e) {
    console.error('Error adding live notification:', e);
  }
};

export default function Header({ activeTab, userRole = 'Procurement Admin', onSwitchRole, onOpenLoginModal, onSelectTab }) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('controlroom_read_notification_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [liveNotifications, setLiveNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('vrm_live_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('vrm_live_notifications');
        setLiveNotifications(saved ? JSON.parse(saved) : []);
      } catch (e) {}
    };
    window.addEventListener('vrm_notifications_updated', handleUpdate);
    return () => window.removeEventListener('vrm_notifications_updated', handleUpdate);
  }, []);

  const isProdAdmin = userRole === 'Production Admin' || (userRole && userRole.includes('Production'));
  
  // Filter notifications strictly based on active user login role
  const roleNotifications = liveNotifications.filter(n => {
    if (isProdAdmin) {
      return n.role === 'Production Admin';
    } else {
      return n.role === 'Procurement Admin';
    }
  });

  const unreadNotifications = roleNotifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const userName = isProdAdmin ? 'Senthil Kumar' : 'Arun';
  const avatarLetter = isProdAdmin ? 'S' : 'A';

  const markItemAsRead = (id, e) => {
    if (e) e.stopPropagation();
    const updated = Array.from(new Set([...readIds, id]));
    setReadIds(updated);
    try {
      localStorage.setItem('controlroom_read_notification_ids', JSON.stringify(updated));
      localStorage.setItem('controlroom_notifications_read', 'true');
    } catch (err) {}
  };

  const markAllAsRead = (e) => {
    if (e) e.stopPropagation();
    const currentRoleIds = roleNotifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...currentRoleIds]));
    setReadIds(updated);
    try {
      localStorage.setItem('controlroom_read_notification_ids', JSON.stringify(updated));
      localStorage.setItem('controlroom_notifications_read', 'true');
    } catch (err) {}
  };

  const handleNotificationItemClick = (notif) => {
    // 1. Mark read so it disappears from the notification spot
    markItemAsRead(notif.id);
    // 2. Close notification menu
    setShowNotificationMenu(false);
    // 3. Navigate to the respective screen
    if (onSelectTab && notif.targetTab) {
      onSelectTab(notif.targetTab);
    }
  };

  return (
    <header 
      className="top-navigation" 
      style={{
        height: '60px',
        borderRadius: '16px',
        margin: '16px 16px 12px 16px',
        background: 'linear-gradient(135deg, #075985 0%, #0E7490 50%, #0891B2 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        boxShadow: '0 6px 22px rgba(14, 116, 144, 0.25)',
        position: 'relative',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Dynamic Keyframes CSS for Disappearing Badge Animation */}
      <style>{`
        @keyframes disappearInAir {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: translate3d(0, -32px, 0) scale(2);
            opacity: 0;
            filter: blur(8px);
          }
        }
      `}</style>

      {/* Left side: Breadcrumb & Title */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#BAE6FD', fontWeight: '600', fontSize: '13.5px' }}>ControlRoom</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontWeight: '300' }}>|</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{
            fontSize: '17px',
            fontWeight: '800',
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.3px'
          }}>
            {activeTab || 'Dashboard'}
          </h2>
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* Neumorphism Help & Support Button */}
        <button 
          title="Help & Support"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            backgroundColor: '#FFFFFF',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            transition: 'transform 0.15s ease, boxShadow 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
          }}
        >
          <HelpCircle style={{ width: '20px', height: '20px', color: '#1E293B' }} />
        </button>

        {/* Neumorphism Notification Icon Button with Disappearing Badge Animation */}
        <div style={{ position: 'relative' }}>
          <button 
            title="Notifications"
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              transition: 'transform 0.15s ease, boxShadow 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
            }}
          >
            {/* Solid Dark Slate Bell Icon */}
            <Bell style={{ width: '20px', height: '20px', color: '#1E293B', fill: '#1E293B' }} />
            
            {/* Red Circle Badge with count */}
            {unreadCount > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '18px',
                  height: '18px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  fontSize: '11px',
                  fontWeight: '900',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                  lineHeight: '1',
                  pointerEvents: 'none'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotificationMenu && (
            <div
              style={{
                position: 'absolute',
                top: '52px',
                right: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.2)',
                width: '320px',
                padding: '16px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                color: '#0F172A'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '10px', backgroundColor: '#EFF6FF', color: '#0284C7', fontWeight: '800', padding: '2px 7px', borderRadius: '10px' }}>
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{ border: 'none', background: 'none', color: '#0284C7', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationItemClick(notif)}
                      style={{ 
                        backgroundColor: '#F8FAFC', 
                        padding: '10px 12px', 
                        borderRadius: '10px', 
                        border: '1px solid #F1F5F9', 
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F1F5F9';
                        e.currentTarget.style.borderColor = '#CBD5E1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                        e.currentTarget.style.borderColor = '#F1F5F9';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: notif.badgeColor || '#0284C7', display: 'inline-block' }}></span>
                          {notif.title}
                        </div>
                        <button
                          title="Mark as read"
                          onClick={(e) => markItemAsRead(notif.id, e)}
                          style={{ border: 'none', background: 'none', color: '#94A3B8', fontSize: '12px', cursor: 'pointer', padding: '0 2px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#DC2626'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                        >
                          ✕
                        </button>
                      </div>
                      <div style={{ color: '#475569', fontSize: '11px', marginTop: '3px' }}>{notif.message}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ color: '#94A3B8', fontSize: '10px' }}>{notif.time}</span>
                        <span style={{ color: '#0284C7', fontSize: '10.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          Open {notif.targetTab} <ArrowRight style={{ width: '10px', height: '10px' }} />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px 10px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 style={{ width: '26px', height: '26px', color: '#16A34A' }} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>No unread notifications</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>All notifications have been read and cleared</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Separator */}
        <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />

        {/* Profile Details Dropdown Trigger */}
        <div 
          onClick={() => setShowRoleMenu(!showRoleMenu)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', position: 'relative' }}
        >
          {/* Circular Profile Photo Initials Avatar */}
          <div 
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              color: '#0E7490',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {avatarLetter}
          </div>

          {/* Name of the person */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2', letterSpacing: '-0.2px' }}>
              {userName}
            </span>
            <span style={{ fontSize: '10.5px', color: '#BAE6FD', fontWeight: '600' }}>
              {userRole}
            </span>
          </div>
          <ChevronDown style={{ width: '15px', height: '15px', color: '#FFFFFF', opacity: 0.9 }} />

          {/* Role & Login Menu Popup */}
          {showRoleMenu && (
            <div 
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.2)',
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
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{userName}</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>{isProdAdmin ? 'senthil@armsai.com' : 'arun@armsai.com'}</div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    onSwitchRole && onSwitchRole('Technical Administrator');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#F0F9FF',
                    color: '#0284C7',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginBottom: '4px'
                  }}
                >
                  <Code style={{ width: '15px', height: '15px' }} />
                  Developer Console
                </button>

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
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#FEF2F2',
                    color: '#EF4444',
                    fontSize: '12.5px',
                    fontWeight: '700',
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
