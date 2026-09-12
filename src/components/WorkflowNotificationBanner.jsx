import React, { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, VolumeX, ArrowRight, X, Package, CreditCard, Receipt, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { isRoleTargeted, playWorkflowNotificationSound, markNotificationAsRead, speakNotificationVoice, isVoiceNotificationEnabled, setVoiceNotificationEnabled, playPorterOrderAlert, getPorterVoiceCue } from '../services/notificationService';

export default function WorkflowNotificationBanner({ userRole, onNavigate }) {
  const [activeToast, setActiveToast] = useState(null);
  const [progress, setProgress] = useState(100);
  const [voiceEnabled, setVoiceEnabled] = useState(() => isVoiceNotificationEnabled());
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    const handleVoiceChange = (e) => {
      if (e && e.detail) setVoiceEnabled(e.detail.enabled);
    };
    window.addEventListener('controlroom_voice_setting_changed', handleVoiceChange);
    return () => window.removeEventListener('controlroom_voice_setting_changed', handleVoiceChange);
  }, []);

  useEffect(() => {
    const handleWorkflowToast = (event) => {
      const notif = event.detail;
      if (!notif) return;

      // Filter by role unless Admin or All
      if (!isRoleTargeted(userRole, notif.targetRoles, notif.metadata)) {
        return;
      }

      // If received from another tab via BroadcastChannel, play chime & voice in this tab for the targeted sales person
      if (notif.fromBroadcast) {
        playPorterOrderAlert();
        setTimeout(() => {
          const cue = getPorterVoiceCue(notif, notif.metadata);
          speakNotificationVoice(cue, { rate: 1.12, pitch: 1.05 });
        }, 320);
      }

      // Clear any previous timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      setActiveToast(notif);
      setProgress(100);

      // 8-second countdown timer with visual progress bar
      const durationMs = 8000;
      const stepMs = 50;
      const stepPct = (stepMs / durationMs) * 100;

      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(progressIntervalRef.current);
            return 0;
          }
          return Math.max(0, prev - stepPct);
        });
      }, stepMs);

      timerRef.current = setTimeout(() => {
        // Automatically mark as read once acknowledged on screen
        if (notif && notif.id) {
          markNotificationAsRead(notif.id);
        }
        setActiveToast(null);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }, durationMs);
    };

    window.addEventListener('vrm_workflow_toast', handleWorkflowToast);
    return () => {
      window.removeEventListener('vrm_workflow_toast', handleWorkflowToast);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [userRole]);

  if (!activeToast) return null;

  const handleActionClick = (e) => {
    if (e) e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    const targetTab = activeToast.targetTab;
    const notifId = activeToast.id;
    setActiveToast(null);

    // Mark as read in storage so it never persists unread on page reload
    if (notifId) {
      markNotificationAsRead(notifId);
    }

    if (onNavigate && targetTab) {
      onNavigate(targetTab);
    }
  };

  const handleDismiss = (e) => {
    if (e) e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    const notifId = activeToast.id;
    setActiveToast(null);

    // Mark as read in storage so it never persists unread on page reload
    if (notifId) {
      markNotificationAsRead(notifId);
    }
  };

  // Icon mapping
  let IconComponent = Bell;
  let accentColor = '#0E7490';
  let iconBg = '#ECFEFF';

  const titleLower = (activeToast.title || '').toLowerCase();
  const tabLower = (activeToast.targetTab || '').toLowerCase();

  if (tabLower.includes('dispatch') || titleLower.includes('pack')) {
    IconComponent = Package;
    accentColor = '#0891B2';
    iconBg = '#ECFEFF';
  } else if (tabLower.includes('account') || titleLower.includes('account')) {
    IconComponent = CreditCard;
    accentColor = '#059669';
    iconBg = '#ECFDF5';
  } else if (tabLower.includes('invoice') || titleLower.includes('invoice')) {
    IconComponent = Receipt;
    accentColor = '#2563EB';
    iconBg = '#EFF6FF';
  } else if (titleLower.includes('cleared') || titleLower.includes('completed')) {
    IconComponent = Truck;
    accentColor = '#16A34A';
    iconBg = '#F0FDF4';
  }

  const roleBadge = Array.isArray(activeToast.targetRoles) && activeToast.targetRoles.length > 0 && activeToast.targetRoles[0] !== 'All'
    ? activeToast.targetRoles[0]
    : 'Workflow Alert';

  return (
    <>
      <style>{`
        @keyframes toastBannerSlideDown {
          0% {
            transform: translateY(-20px) scale(0.96);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes audioPulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>
      <div 
        onClick={handleActionClick}
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999999,
          maxWidth: '430px',
          width: 'calc(100vw - 48px)',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          animation: 'toastBannerSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 24px 48px -8px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 20px 40px -8px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.08)';
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div style={{
          height: '4px',
          width: '100%',
          background: `linear-gradient(90deg, ${accentColor} 0%, #38BDF8 100%)`
        }} />

        <div style={{ padding: '14px 16px 14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Header Row: Role Tag, Audio Ping Indicator, Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                backgroundColor: iconBg,
                color: accentColor,
                fontSize: '10.5px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: `1px solid ${accentColor}25`
              }}>
                {roleBadge}
              </span>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextVal = !voiceEnabled;
                  setVoiceEnabled(nextVal);
                  setVoiceNotificationEnabled(nextVal);
                  if (nextVal && activeToast) {
                    playPorterOrderAlert();
                    setTimeout(() => {
                      const cue = getPorterVoiceCue(activeToast, activeToast.metadata);
                      speakNotificationVoice(cue, { rate: 1.12, pitch: 1.05 });
                    }, 320);
                  }
                }}
                title={voiceEnabled ? 'Voice Announcement Active (Click to Mute)' : 'Voice Muted (Click to Enable)'}
                style={{
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: voiceEnabled ? '#0E7490' : '#94A3B8',
                  backgroundColor: voiceEnabled ? '#ECFEFF' : '#F1F5F9',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {voiceEnabled ? (
                  <Volume2 size={13} style={{ animation: 'audioPulse 1.4s infinite' }} />
                ) : (
                  <VolumeX size={13} />
                )}
                <span>{voiceEnabled ? 'Voice ON' : 'Muted'}</span>
              </button>
            </div>

            <button
              onClick={handleDismiss}
              title="Dismiss notification"
              style={{
                border: 'none',
                background: 'transparent',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
            >
              <X size={16} />
            </button>
          </div>

          {/* Main Body: Icon + Title + Message */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: iconBg,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${accentColor}20`
            }}>
              <IconComponent size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13.5px',
                fontWeight: '800',
                color: '#0F172A',
                lineHeight: '1.3',
                marginBottom: '4px'
              }}>
                {activeToast.title}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#475569',
                lineHeight: '1.45',
                wordBreak: 'break-word'
              }}>
                {activeToast.message}
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          {activeToast.targetTab && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                onClick={handleActionClick}
                style={{
                  backgroundColor: accentColor,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: `0 2px 6px ${accentColor}35`,
                  transition: 'opacity 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <span>Open {activeToast.targetTab}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Progress Bar Countdown */}
        <div style={{
          height: '3px',
          width: '100%',
          backgroundColor: '#F1F5F9'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: accentColor,
            transition: 'width 0.05s linear'
          }} />
        </div>
      </div>
    </>
  );
}
