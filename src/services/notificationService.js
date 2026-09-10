// ===================================================================================
// CONTROLROOM WORKFLOW NOTIFICATION & AUDIO SERVICE
// ===================================================================================
// Manages real-time multi-stage notifications with synthesized Web Audio chimes,
// cross-tab BroadcastChannel sync, and deep linking across workflow stages:
// 1. Sales -> Dispatch (BOM received to pack) -> redirects to 'Dispatch Orders'
// 2. Dispatch -> Sales & Accounts (BOM packed & ready for accounts) -> redirects to 'Accounts Verification' / 'BOM Orders'
// 3. Accounts -> Billing (Verified & ready for invoicing) -> redirects to 'Invoice Management'
// 4. Billing -> Sales & Dispatch (Invoice completed & ready to dispatch) -> redirects to 'BOM Orders' / 'Dispatch Orders'
// ===================================================================================

let audioCtx = null;

/**
 * Returns or initializes a Web Audio Context, handling browser autoplay resumption.
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio Context not available:', e);
    return null;
  }
}

// Automatically unlock audio context on initial user click/keypress in the window
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
}

/**
 * Synthesizes a melodic, professional chime using the Web Audio API.
 * Never requires external audio files, works offline, zero latency, and sounds crisp.
 * @param {'chime' | 'success' | 'alert' | 'invoice'} soundType 
 */
export function playWorkflowNotificationSound(soundType = 'chime') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playMelody(ctx, soundType)).catch(() => {});
    } else {
      playMelody(ctx, soundType);
    }
  } catch (e) {
    console.warn('Error playing workflow notification sound:', e);
  }
}

function playMelody(ctx, soundType) {
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.35, now);

  let notes = [];
  if (soundType === 'success') {
    // Uplifting major chord progression: C5 -> E5 -> G5 -> C6
    notes = [
      { freq: 523.25, time: 0.0,  duration: 0.28, type: 'sine' },
      { freq: 659.25, time: 0.10, duration: 0.28, type: 'sine' },
      { freq: 783.99, time: 0.20, duration: 0.35, type: 'triangle' },
      { freq: 1046.5, time: 0.32, duration: 0.65, type: 'sine' }
    ];
  } else if (soundType === 'invoice') {
    // Crisp energetic two-tone chime
    notes = [
      { freq: 659.25, time: 0.0,  duration: 0.22, type: 'sine' },
      { freq: 987.77, time: 0.12, duration: 0.55, type: 'sine' }
    ];
  } else if (soundType === 'alert') {
    // Double ding attention tone
    notes = [
      { freq: 880.00, time: 0.0,  duration: 0.18, type: 'sine' },
      { freq: 880.00, time: 0.16, duration: 0.45, type: 'sine' }
    ];
  } else {
    // Default 'chime' (Slack/Apple style pleasant 3-bell ring: D5 -> A5 -> D6)
    notes = [
      { freq: 587.33, time: 0.0,  duration: 0.30, type: 'sine' },
      { freq: 880.00, time: 0.12, duration: 0.35, type: 'sine' },
      { freq: 1174.66, time: 0.24, duration: 0.65, type: 'sine' }
    ];
  }

  notes.forEach(({ freq, time, duration, type }) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    // Exponential decay envelope (natural bell strike)
    noteGain.gain.setValueAtTime(0.001, now + time);
    noteGain.gain.exponentialRampToValueAtTime(0.8, now + time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(now + time);
    osc.stop(now + time + duration + 0.05);
  });
}

/**
 * Checks whether a given role matches the notification's target roles.
 * System administrators and Executives always receive all notifications.
 */
export function isRoleTargeted(userRole, targetRoles) {
  if (!userRole) return true;
  
  // Executive Leadership & Tech Admins have global visibility
  const adminRoles = ['CEO', 'Managing Director', 'MD', 'Technical Administrator', 'Developer'];
  if (adminRoles.includes(userRole) || (userRole || '').startsWith('TA')) {
    return true;
  }

  if (!targetRoles || targetRoles === 'All' || targetRoles === '*' || targetRoles.length === 0) {
    return true;
  }

  const roleList = Array.isArray(targetRoles) ? targetRoles : [targetRoles];

  // Direct match
  if (roleList.includes(userRole)) return true;

  // Departmental fuzzy matches
  const normalizedUserRole = userRole.toLowerCase();

  for (const t of roleList) {
    const norm = (t || '').toLowerCase();
    
    // Dispatch department
    if ((norm.includes('dispatch') || norm.includes('production')) && 
        (normalizedUserRole.includes('dispatch') || normalizedUserRole.includes('production') || normalizedUserRole.includes('floor'))) {
      return true;
    }
    
    // Sales department
    if (norm.includes('sales') && normalizedUserRole.includes('sales')) {
      return true;
    }
    
    // Accounts department
    if (norm.includes('account') && normalizedUserRole.includes('account')) {
      return true;
    }
    
    // Billing department
    if ((norm.includes('billing') || norm.includes('invoice')) && 
        (normalizedUserRole.includes('billing') || normalizedUserRole.includes('invoice') || normalizedUserRole.includes('account'))) {
      return true;
    }
  }

  return false;
}

// Setup cross-tab BroadcastChannel if supported
let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('controlroom_notifications_channel');
    broadcastChannel.onmessage = (event) => {
      if (event && event.data && event.data.type === 'VRM_WORKFLOW_NOTIFICATION') {
        const notif = event.data.payload;
        // Dispatch local event in this tab
        window.dispatchEvent(new CustomEvent('vrm_workflow_toast', { detail: notif }));
        window.dispatchEvent(new Event('vrm_notifications_updated'));
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel not initialized:', e);
  }
}

/**
 * Core function to send and persist a workflow notification.
 * Plays sound, displays live toast banner, syncs to localStorage & broadcast channel.
 */
export function sendWorkflowNotification({
  title,
  message,
  targetTab,
  targetRoles = ['All'],
  type = 'info',
  soundType = 'chime',
  metadata = {}
}) {
  const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const notification = {
    id: notifId,
    title,
    message,
    targetTab,
    targetRoles: Array.isArray(targetRoles) ? targetRoles : [targetRoles],
    role: Array.isArray(targetRoles) ? targetRoles[0] : targetRoles,
    type,
    soundType,
    time: timeStr,
    createdAt: new Date().toISOString(),
    metadata,
    unread: true
  };

  // 1. Save to persistent storage for Header Bell icon
  try {
    const existing = JSON.parse(localStorage.getItem('vrm_live_notifications') || '[]');
    const updated = [notification, ...existing.filter(n => n.id !== notifId)].slice(0, 50);
    localStorage.setItem('vrm_live_notifications', JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving live notification:', e);
  }

  // 2. Play sound immediately in this window
  playWorkflowNotificationSound(soundType);

  // 3. Emit local event for current tab toast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vrm_workflow_toast', { detail: notification }));
    window.dispatchEvent(new Event('vrm_notifications_updated'));
  }

  // 4. Broadcast to other open browser tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'VRM_WORKFLOW_NOTIFICATION',
        payload: notification
      });
    } catch (e) {
      console.warn('Error posting to BroadcastChannel:', e);
    }
  }

  return notification;
}

// ===================================================================================
// DEDICATED WORKFLOW HELPERS AS REQUESTED
// ===================================================================================

/**
 * STEP 1: Sales person creates/proceeds with a BOM to Dispatch / Production.
 * Dispatch team receives message: "You have received a BOM to pack: [BOM ID / Customer]"
 * Clicking redirects to 'Dispatch Orders' screen.
 */
export function notifyBomSentToDispatch({ bomCode, customerName, salesPerson }) {
  const safeCustomer = customerName || 'Customer';
  return sendWorkflowNotification({
    title: `📦 New BOM Received to Pack`,
    message: `You have received BOM ${bomCode} (${safeCustomer}) to pack. Click to open and begin packing.`,
    targetTab: 'Dispatch Orders',
    targetRoles: ['Dispatch Head', 'Production Head', 'Production Admin', 'Dispatch Executive', 'Floor Supervisor'],
    type: 'info',
    soundType: 'chime',
    metadata: {
      bomCode,
      customerName: safeCustomer,
      salesPerson: salesPerson || 'Sales Executive',
      step: 'BOM_SENT_TO_DISPATCH'
    }
  });
}

/**
 * STEP 2: Dispatch / Production finishes packing the BOM.
 * 1. Sales person receives notification: "BOM [BOM ID] is packed and proceeded to Accounts verification"
 * 2. Accounts team receives notification: "BOM [BOM ID] is packed and ready for Accounts verification"
 * Clicking redirects to 'Accounts Verification' or 'BOM Orders'.
 */
export function notifyBomPackedAndSentToAccounts({ bomCode, customerName, salesPerson }) {
  const safeCustomer = customerName || 'Customer';

  // 2a. Notification for Sales Person
  sendWorkflowNotification({
    title: `📦 BOM Packed & Sent to Accounts`,
    message: `BOM ${bomCode} (${safeCustomer}) has been packed and proceeded to Accounts verification.`,
    targetTab: 'BOM Orders',
    targetRoles: ['Sales Executive', 'Sales Head'],
    type: 'success',
    soundType: 'success',
    metadata: {
      bomCode,
      customerName: safeCustomer,
      salesPerson: salesPerson || 'Sales Executive',
      step: 'BOM_PACKED_SALES_NOTIF'
    }
  });

  // 2b. Notification for Accounts Team
  return sendWorkflowNotification({
    title: `💳 New BOM for Accounts Verification`,
    message: `BOM ${bomCode} (${safeCustomer}) is fully packed and ready for payment & accounts verification.`,
    targetTab: 'Accounts Verification',
    targetRoles: ['Accounts Head', 'Accounts Executive'],
    type: 'info',
    soundType: 'chime',
    metadata: {
      bomCode,
      customerName: safeCustomer,
      step: 'BOM_PACKED_ACCOUNTS_NOTIF'
    }
  });
}

/**
 * STEP 3: Accounts verification completed.
 * Proceeds to Billing team for invoice generation.
 * Billing team gets notified: "BOM [BOM ID] verified by Accounts, ready for Invoicing"
 * Clicking redirects to 'Invoice Management'.
 */
export function notifyAccountsVerificationCompleted({ bomCode, customerName, invoiceNo, salesPerson }) {
  const safeCustomer = customerName || 'Customer';
  const invText = invoiceNo ? ` (${invoiceNo})` : '';

  // 3a. Notification for Billing / Invoice Team
  sendWorkflowNotification({
    title: `🧾 BOM Verified — Ready for Invoicing`,
    message: `BOM ${bomCode} (${safeCustomer}) has been approved by Accounts. Ready for Invoice creation${invText}.`,
    targetTab: 'Invoice Management',
    targetRoles: ['Billing', 'Invoice Executive', 'Accounts Executive', 'Accounts Head'],
    type: 'info',
    soundType: 'invoice',
    metadata: {
      bomCode,
      invoiceNo,
      customerName: safeCustomer,
      step: 'ACCOUNTS_VERIFIED_BILLING_NOTIF'
    }
  });

  // 3b. Notification for Sales Person
  return sendWorkflowNotification({
    title: `💳 Accounts Approved BOM`,
    message: `Accounts verification passed for BOM ${bomCode} (${safeCustomer}). Forwarded to Billing for invoice generation.`,
    targetTab: 'BOM Orders',
    targetRoles: ['Sales Executive', 'Sales Head'],
    type: 'info',
    soundType: 'chime',
    metadata: {
      bomCode,
      customerName: safeCustomer,
      salesPerson,
      step: 'ACCOUNTS_VERIFIED_SALES_NOTIF'
    }
  });
}

/**
 * STEP 4: Invoice completed by Billing team.
 * 1. Sales person receives notification: "Invoice is completed for BOM [BOM ID] and ready to dispatch."
 * 2. Dispatch team receives notification: "Invoice cleared. Ready for vehicle loading & dispatch!"
 * Clicking redirects to 'BOM Orders' or 'Dispatch Orders'.
 */
export function notifyInvoiceCompletedReadyForDispatch({ invoiceNo, bomCode, customerName, salesPerson }) {
  const safeCustomer = customerName || 'Customer';
  const safeInv = invoiceNo || 'INV-2026';

  // 4a. Notification for Sales Person
  sendWorkflowNotification({
    title: `✅ Invoice Completed & Ready to Dispatch`,
    message: `Invoice ${safeInv} is completed for BOM ${bomCode} (${safeCustomer}) and ready to dispatch.`,
    targetTab: 'BOM Orders',
    targetRoles: ['Sales Executive', 'Sales Head'],
    type: 'success',
    soundType: 'success',
    metadata: {
      invoiceNo: safeInv,
      bomCode,
      customerName: safeCustomer,
      salesPerson: salesPerson || 'Sales Executive',
      step: 'INVOICE_COMPLETED_SALES_NOTIF'
    }
  });

  // 4b. Notification for Dispatch Team
  return sendWorkflowNotification({
    title: `🚚 Order Cleared for Vehicle Loading`,
    message: `Invoice ${safeInv} cleared for BOM ${bomCode} (${safeCustomer}). Ready for vehicle loading and final dispatch!`,
    targetTab: 'Dispatch Orders',
    targetRoles: ['Dispatch Head', 'Production Head', 'Dispatch Executive', 'Floor Supervisor'],
    type: 'success',
    soundType: 'chime',
    metadata: {
      invoiceNo: safeInv,
      bomCode,
      customerName: safeCustomer,
      step: 'INVOICE_COMPLETED_DISPATCH_NOTIF'
    }
  });
}
