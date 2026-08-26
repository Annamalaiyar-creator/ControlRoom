import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function NotificationToast({ alert, onClose, onRetry, onLearnMore }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alert, onClose]);

  if (!alert) return null;

  const isError = alert.type === 'error' || alert.type === 'danger' || (alert.message && (
    alert.message.toLowerCase().includes('wrong') ||
    alert.message.toLowerCase().includes('error') ||
    alert.message.toLowerCase().includes('failed') ||
    alert.message.toLowerCase().includes('unable')
  ));
  const isWarning = alert.type === 'warning';
  const isSuccess = alert.type === 'success';

  const containerBg = isError
    ? '#FFF0F2'
    : isWarning
      ? '#FFF7ED'
      : isSuccess
        ? '#F0FDF4'
        : '#EFF6FF';

  const iconBg = isError
    ? '#FEE2E2'
    : isWarning
      ? '#FFEDD5'
      : isSuccess
        ? '#DCFCE7'
        : '#DBEAFE';

  const iconFg = isError
    ? '#DC2626'
    : isWarning
      ? '#EA580C'
      : isSuccess
        ? '#16A34A'
        : '#2563EB';

  const titleText = alert.title || (isError ? 'Uh oh! Something went wrong' : isSuccess ? 'Action Successful' : isWarning ? 'Attention Required' : 'System Notification');
  const bodyText = alert.message || (isError ? 'We apologize for the inconvenience you experienced.' : 'Operation completed successfully.');

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999999,
      maxWidth: '640px',
      width: '92%',
      backgroundColor: containerBg,
      borderRadius: '24px',
      padding: '12px 14px 14px 14px',
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    }}>
      {/* Inner White Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Left Side: Circular Red/Theme Icon + Title/Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: iconBg,
            color: iconFg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {isError ? (
              <AlertCircle size={24} strokeWidth={2.2} />
            ) : isWarning ? (
              <AlertTriangle size={24} strokeWidth={2.2} />
            ) : isSuccess ? (
              <CheckCircle size={24} strokeWidth={2.2} />
            ) : (
              <Info size={24} strokeWidth={2.2} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0, lineHeight: '1.3' }}>
              {titleText}
            </h4>
            <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.4', wordBreak: 'break-word' }}>
              {bodyText}
            </div>
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Countdown Timer Banner Text */}
      <div style={{
        textAlign: 'center',
        marginTop: '10px',
        fontSize: '12.5px',
        fontWeight: '600',
        color: '#64748B'
      }}>
        This message will automatically close in <span style={{ color: iconFg, fontWeight: '800' }}>{countdown} sec</span>
      </div>
    </div>
  );
}
