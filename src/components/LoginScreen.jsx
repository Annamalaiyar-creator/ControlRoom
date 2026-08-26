import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Factory, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  User, 
  Key, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Building2, 
  AlertCircle,
  Briefcase,
  Truck,
  TrendingUp,
  CreditCard,
  Compass,
  FileSpreadsheet,
  Users,
  Asterisk,
  Sparkles,
  Receipt
} from 'lucide-react';

export const USER_ROLES_CONFIG = [
  {
    role: 'Technical Administrator',
    category: 'System Engineering',
    user: 'dev@vrm.com',
    pass: 'dev123',
    name: 'Lead Developer & Tech Admin',
    icon: Asterisk,
    color: '#0284c7',
    desc: 'Full system engineering, server infrastructure, API monitoring & database administration.'
  },
  {
    role: 'CEO',
    category: 'Executive Leadership',
    user: 'ceo@vrm.com',
    pass: 'ceo123',
    name: 'Chief Executive Officer',
    icon: Building2,
    color: '#0284c7',
    desc: 'Complete organization oversight, high-level financial & operational metrics.'
  },
  {
    role: 'Production Head',
    category: 'Production Department',
    user: 'production.head@vrm.com',
    pass: 'prodhead123',
    name: 'Production Head',
    icon: Factory,
    color: '#9333ea',
    desc: 'Work Orders, Master Production Schedule & Plant Efficiency.'
  },
  {
    role: 'Dispatch Head',
    category: 'Production Department',
    user: 'dispatch@vrm.com',
    pass: 'dispatch123',
    name: 'Dispatch Head',
    icon: Truck,
    color: '#0891b2',
    desc: 'Finished Goods Dispatch, Logistics & Delivery Tracking.'
  },
  {
    role: 'Floor Supervisor',
    category: 'Production Department',
    user: 'supervisor@vrm.com',
    pass: 'super123',
    name: 'Floor Supervisor',
    icon: Users,
    color: '#d97706',
    desc: 'Shift Supervisor, Line Operations & Job Cards Execution.'
  },
  {
    role: 'Floor Employee',
    category: 'Production Department',
    user: 'operator@vrm.com',
    pass: 'op123',
    name: 'Floor Machine Operator',
    icon: User,
    color: '#64748b',
    desc: 'Machine Line Output Log & Stoppage / Downtime Incident Reporting.'
  },
  {
    role: 'Procurement Head',
    category: 'Procurement Department',
    user: 'admin@vrm.com',
    pass: 'vrm123',
    name: 'Procurement Head / Admin',
    icon: ShoppingCart,
    color: '#2563eb',
    desc: 'Purchase Orders, Vendor Directory, GRN & Material Requisitions.'
  },
  {
    role: 'Accounts Head',
    category: 'Accounts & Finance',
    user: 'accounts.head@vrm.com',
    pass: 'acchead123',
    name: 'Accounts Head',
    icon: CreditCard,
    color: '#059669',
    desc: 'Financial Reports, Ledger, Expense Approvals & Payment Terms.'
  },
  {
    role: 'Accounts Executive',
    category: 'Accounts & Finance',
    user: 'accounts@vrm.com',
    pass: 'acc123',
    name: 'Accounts Executive',
    icon: CreditCard,
    color: '#10b981',
    desc: 'Billing Verification, Vendor Invoices & Payments Processing.'
  },
  {
    role: 'Sales Head',
    category: 'Sales & Business',
    user: 'sales.head@vrm.com',
    pass: 'saleshead123',
    name: 'Sales Head',
    icon: TrendingUp,
    color: '#e11d48',
    desc: 'Sales Target, Customer Projects & Revenue Pipeline.'
  },
  {
    role: 'Sales Executive',
    category: 'Sales & Business',
    user: 'sales@vrm.com',
    pass: 'sales123',
    name: 'Sales Executive',
    icon: TrendingUp,
    color: '#f43f5e',
    desc: 'Sales Orders Creation, Customer CRM & Inquiries.'
  },
  {
    role: 'Design Engineer',
    category: 'Design & Engineering',
    user: 'design.head@vrm.com',
    pass: 'designhead123',
    name: 'Lead Design Engineer',
    icon: Compass,
    color: '#4f46e5',
    desc: 'BOM Creation, Technical Drawings & Engineering Revisions.'
  },
  {
    role: 'Design Executive',
    category: 'Design & Engineering',
    user: 'design@vrm.com',
    pass: 'design123',
    name: 'Design Executive',
    icon: Compass,
    color: '#6366f1',
    desc: 'CAD Models & Drawing Revisions Verification.'
  },
  {
    role: 'Invoice Executive',
    category: 'Billing & Invoicing',
    user: 'invoice@vrm.com',
    pass: 'invoice123',
    name: 'Invoice Executive',
    icon: Receipt,
    color: '#059669',
    desc: 'Dedicated Invoice Ledger, 3-Way Matching & Vendor Billing Verification.'
  },
  {
    role: 'BOM Executive',
    category: 'Engineering & Sales Operations',
    user: 'bom@vrm.com',
    pass: 'bom123',
    name: 'BOM Executive',
    icon: FileSpreadsheet,
    color: '#8b5cf6',
    desc: 'Bill of Materials (BOM) Management, Product Verification & Sales Orders.'
  }
];

export default function LoginScreen({ onLoginSuccess }) {
  const [selectedRoleObj, setSelectedRoleObj] = useState(USER_ROLES_CONFIG[0]);
  const [usernameInput, setUsernameInput] = useState(USER_ROLES_CONFIG[0].user);
  const [passwordInput, setPasswordInput] = useState(USER_ROLES_CONFIG[0].pass);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleSelect = (roleObj) => {
    setSelectedRoleObj(roleObj);
    setUsernameInput(roleObj.user);
    setPasswordInput(roleObj.pass);
    setErrorMsg('');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!usernameInput.trim()) {
      setErrorMsg('Please enter your email.');
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    const matchedRole = USER_ROLES_CONFIG.find(
      r => r.user.toLowerCase() === usernameInput.trim().toLowerCase() && r.pass === passwordInput
    ) || (selectedRoleObj.user.toLowerCase() === usernameInput.trim().toLowerCase() && selectedRoleObj.pass === passwordInput ? selectedRoleObj : null);

    if (!matchedRole && (usernameInput.trim().toLowerCase() !== selectedRoleObj.user.toLowerCase() || passwordInput !== selectedRoleObj.pass)) {
      setErrorMsg(`Invalid credentials for ${selectedRoleObj.name}. Check role selection.`);
      return;
    }

    const finalRoleName = matchedRole ? matchedRole.role : selectedRoleObj.role;

    localStorage.setItem('controlroom_is_authenticated', 'true');
    localStorage.setItem('controlroom_user_role', finalRoleName);
    localStorage.setItem('controlroom_logged_user', usernameInput);

    if (onLoginSuccess) {
      onLoginSuccess(finalRoleName);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#F5F5FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* OUTER ELEGANT MODAL CONTAINER MATCHING USER MOCKUP */}
      <div style={{
        width: '980px',
        maxWidth: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '32px',
        boxShadow: '0 25px 60px -15px rgba(100, 100, 160, 0.18)',
        display: 'grid',
        gridTemplateColumns: '430px 1fr',
        overflow: 'hidden',
        minHeight: '620px',
        border: '1px solid rgba(230, 230, 245, 0.8)'
      }}>
        
        {/* ================= LEFT MESH GRADIENT BANNER PANEL ================= */}
        <div style={{
          background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 25%, #4F46E5 50%, #9333EA 75%, #E9D5FF 100%)',
          borderRadius: '24px',
          margin: '16px',
          padding: '36px',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Star Logo */}
          <div style={{ zIndex: 2 }}>
            <div style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Asterisk style={{ width: '32px', height: '32px', color: '#FFFFFF', strokeWidth: 3 }} />
            </div>
          </div>

          {/* Bottom Hero Text */}
          <div style={{ zIndex: 2 }}>
            <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.9, letterSpacing: '0.01em', display: 'block', marginBottom: '12px' }}>
              You can easily
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: '700', lineHeight: '1.25', margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Get access your personal hub for clarity and productivity
            </h2>
          </div>

          {/* Soft Glassy Overlay Blobs */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* ================= RIGHT LOGIN FORM & ROLE SELECTOR ================= */}
        <div style={{
          padding: '40px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          
          <div>
            {/* Small Top Blue Star Icon */}
            <div style={{ marginBottom: '16px' }}>
              <Asterisk style={{ width: '26px', height: '26px', color: '#4F46E5', strokeWidth: 3 }} />
            </div>

            {/* Title & Subtitle */}
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Create an account
            </h1>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '8px 0 20px 0', lineHeight: '1.5', maxWidth: '360px' }}>
              Access your tasks, notes, and projects anytime, anywhere - and keep everything flowing in one place.
            </p>

            {/* ROLE SELECTOR DROPDOWN */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0F172A', marginBottom: '6px' }}>
                Select Role Account (13 Logins)
              </label>
              <select 
                value={selectedRoleObj.role}
                onChange={(e) => {
                  const found = USER_ROLES_CONFIG.find(r => r.role === e.target.value);
                  if (found) handleRoleSelect(found);
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1E293B',
                  backgroundColor: '#F8FAFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                {USER_ROLES_CONFIG.map((r, i) => (
                  <option key={i} value={r.role}>
                    {r.role} ({r.user})
                  </option>
                ))}
              </select>
            </div>

            {/* FORM */}
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Your email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0F172A', marginBottom: '6px' }}>
                  Your email
                </label>
                <input 
                  type="email"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="farazhaider786@gmail.com"
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    padding: '0 12px',
                    fontSize: '13px',
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#0F172A', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      padding: '0 36px 0 12px',
                      fontSize: '13px',
                      color: '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Get Started Button */}
              <button
                type="submit"
                style={{
                  height: '44px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                  marginTop: '4px'
                }}
              >
                Get Started
              </button>

            </form>

            {/* Divider Line: or continue with */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#CBD5E1' }} />
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#CBD5E1' }} />
            </div>

            {/* Social Icons Row (Interactive Single-Sign-On) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div 
                onClick={() => {
                  localStorage.setItem('controlroom_is_authenticated', 'true');
                  localStorage.setItem('controlroom_user_role', selectedRoleObj.role);
                  localStorage.setItem('controlroom_logged_user', usernameInput);
                  if (onLoginSuccess) onLoginSuccess(selectedRoleObj.role);
                }}
                style={{ 
                  height: '36px', 
                  backgroundColor: '#F1F5F9', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px', 
                  fontWeight: '800', 
                  color: '#0F172A', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                title="Sign in with Behance SSO"
              >
                Bē
              </div>

              <div 
                onClick={() => {
                  localStorage.setItem('controlroom_is_authenticated', 'true');
                  localStorage.setItem('controlroom_user_role', selectedRoleObj.role);
                  localStorage.setItem('controlroom_logged_user', usernameInput);
                  if (onLoginSuccess) onLoginSuccess(selectedRoleObj.role);
                }}
                style={{ 
                  height: '36px', 
                  backgroundColor: '#F1F5F9', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justify: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                title="Sign in with Google SSO"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>

              <div 
                onClick={() => {
                  localStorage.setItem('controlroom_is_authenticated', 'true');
                  localStorage.setItem('controlroom_user_role', selectedRoleObj.role);
                  localStorage.setItem('controlroom_logged_user', usernameInput);
                  if (onLoginSuccess) onLoginSuccess(selectedRoleObj.role);
                }}
                style={{ 
                  height: '36px', 
                  backgroundColor: '#F1F5F9', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justify: 'center', 
                  fontSize: '14px', 
                  fontWeight: '800', 
                  color: '#1877F2', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
                title="Sign in with Facebook SSO"
              >
                f
              </div>
            </div>

            {/* Sign up prompt */}
            <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '12px', color: '#64748B' }}>
              Don't have an account? <span 
                onClick={() => {
                  localStorage.setItem('controlroom_is_authenticated', 'true');
                  localStorage.setItem('controlroom_user_role', selectedRoleObj.role);
                  if (onLoginSuccess) onLoginSuccess(selectedRoleObj.role);
                }}
                style={{ color: '#4F46E5', fontWeight: '600', cursor: 'pointer' }}
              >
                Sign up
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
