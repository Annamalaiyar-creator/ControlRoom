import { supabase } from '../supabaseClient';

/**
 * Helper to detect device and browser from User Agent
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'Desktop PC';
  let browser = 'Chrome';

  if (/iPad|Tablet/i.test(ua)) {
    device = 'Tablet';
  } else if (/iPhone|Android.*Mobile/i.test(ua)) {
    device = 'Mobile Device';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = 'MacBook / Mac';
  } else if (/Windows NT/i.test(ua)) {
    device = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    device = 'Linux Station';
  }

  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Mozilla Firefox';
  }

  return { device, browser };
}

/**
 * Get or generate unique persistent session token for this browser client
 */
export function getOrCreateSessionId() {
  let sesId = localStorage.getItem('controlroom_device_session_id');
  if (!sesId) {
    sesId = 'SES-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem('controlroom_device_session_id', sesId);
  }
  return sesId;
}

/**
 * Register or update active session in Supabase cloud database
 */
export async function registerActiveSession(userEmail, empCode, displayName, userRole) {
  if (!userEmail) return null;
  const sessionId = getOrCreateSessionId();
  const { device, browser } = getDeviceInfo();
  const now = new Date().toISOString();

  const sessionPayload = {
    id: sessionId,
    email: userEmail.toLowerCase().trim(),
    empCode: empCode || 'EMP',
    user: displayName || userEmail,
    role: userRole || 'Employee',
    device: device,
    browser: browser,
    ip: 'Live Client',
    location: 'India',
    loginTime: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    lastActiveTimestamp: Date.now(),
    lastActive: 'Just now'
  };

  try {
    // Check if session record exists in 'leaves' table where employee = 'SESSION_REGISTRY'
    const { data: existing } = await supabase
      .from('leaves')
      .select('id, duration')
      .eq('employee', 'SESSION_REGISTRY')
      .eq('duration', sessionId)
      .maybeSingle();

    if (existing && existing.id) {
      await supabase
        .from('leaves')
        .update({
          reason: JSON.stringify(sessionPayload),
          dates: now,
          status: 'active'
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('leaves')
        .insert({
          employee: 'SESSION_REGISTRY',
          type: 'USER_SESSION',
          duration: sessionId,
          dates: now,
          reason: JSON.stringify(sessionPayload),
          status: 'active'
        });
    }
  } catch (err) {
    console.error('Error registering active device session:', err);
  }

  return sessionPayload;
}

/**
 * Update heartbeat / last active timestamp for current device
 */
export async function heartbeatActiveSession() {
  const sessionId = localStorage.getItem('controlroom_device_session_id');
  if (!sessionId) return;
  const isAuthenticated = localStorage.getItem('controlroom_is_authenticated') === 'true';
  if (!isAuthenticated) return;

  try {
    const { data: existing } = await supabase
      .from('leaves')
      .select('id, reason, status')
      .eq('employee', 'SESSION_REGISTRY')
      .eq('duration', sessionId)
      .maybeSingle();

    if (existing) {
      // If admin revoked this session
      if (existing.status === 'revoked') {
        localStorage.removeItem('controlroom_is_authenticated');
        localStorage.removeItem('controlroom_user_role');
        window.location.reload();
        return;
      }

      let payload = {};
      try {
        payload = JSON.parse(existing.reason);
      } catch (e) {}
      payload.lastActiveTimestamp = Date.now();
      payload.lastActive = 'Just now';

      await supabase
        .from('leaves')
        .update({
          reason: JSON.stringify(payload),
          dates: new Date().toISOString()
        })
        .eq('id', existing.id);
    }
  } catch (e) {}
}

/**
 * Fetch all active sessions across all devices from Supabase
 */
export async function fetchLiveActiveSessions() {
  const currentSessionId = getOrCreateSessionId();
  try {
    const { data, error } = await supabase
      .from('leaves')
      .select('id, duration, reason, status, dates')
      .eq('employee', 'SESSION_REGISTRY')
      .order('dates', { ascending: false });

    if (error || !Array.isArray(data)) return [];

    const now = Date.now();
    return data
      .filter(item => item.status === 'active')
      .map(item => {
        let parsed = {};
        try {
          parsed = JSON.parse(item.reason);
        } catch (e) {}

        const diffSeconds = Math.floor((now - (parsed.lastActiveTimestamp || 0)) / 1000);
        let activeLabel = 'Just now';
        if (diffSeconds > 120) {
          activeLabel = `${Math.floor(diffSeconds / 60)} mins ago`;
        }

        return {
          id: item.duration || ('SES-' + item.id),
          dbId: item.id,
          user: parsed.user || parsed.email || 'Employee',
          email: parsed.email,
          empCode: parsed.empCode,
          role: parsed.role,
          device: parsed.device || 'Desktop PC',
          browser: parsed.browser || 'Web Browser',
          ip: parsed.ip || 'Live Client',
          location: parsed.location || 'India',
          loginTime: parsed.loginTime || 'Today',
          lastActive: activeLabel,
          isCurrent: (item.duration === currentSessionId)
        };
      });
  } catch (err) {
    console.error('Error fetching live active sessions:', err);
    return [];
  }
}

/**
 * Revoke a specific session (forces logout on target device)
 */
export async function revokeSession(sessionId) {
  try {
    await supabase
      .from('leaves')
      .update({ status: 'revoked' })
      .eq('employee', 'SESSION_REGISTRY')
      .eq('duration', sessionId);
    return true;
  } catch (err) {
    console.error('Error revoking session:', err);
    return false;
  }
}

/**
 * Revoke all sessions except the current administrator's device
 */
export async function revokeAllOtherSessions() {
  const currentSessionId = getOrCreateSessionId();
  try {
    await supabase
      .from('leaves')
      .update({ status: 'revoked' })
      .eq('employee', 'SESSION_REGISTRY')
      .neq('duration', currentSessionId);
    return true;
  } catch (err) {
    console.error('Error revoking all other sessions:', err);
    return false;
  }
}
