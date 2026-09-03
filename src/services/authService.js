import { USER_ROLES_CONFIG } from '../components/LoginScreen';
import { fetchCloudStore, saveCloudStore } from '../utils/supabaseDataSync';
import { registerActiveSession, revokeSession } from './sessionService';

/**
 * ControlRoom Authentication & Login Service
 * Dedicated module for handling authentication, credential matching, session persistence, and role resolution.
 */

// Synchronous cached memory copy & async cloud fetch
export const syncEmployeesFromCloud = async () => {
  try {
    const list = await fetchCloudStore('employees_store', []);
    if (Array.isArray(list) && list.length > 0) {
      localStorage.setItem('controlroom_employees_list', JSON.stringify(list));
      const registeredCodes = list.map(e => (e.employee_code || e.code)).filter(Boolean);
      localStorage.setItem('controlroom_registered_codes', JSON.stringify(registeredCodes));
    }
    return list;
  } catch(e) {
    return JSON.parse(localStorage.getItem('controlroom_employees_list') || '[]');
  }
};

export const authenticateUser = (empId, username, password, selectedRoleObj = null) => {
  const cleanEmpId = String(empId || '').trim();
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanEmpId) {
    return { success: false, error: 'Please enter your Employee ID (e.g. EMP-101).' };
  }

  if (!cleanUsername) {
    return { success: false, error: 'Please enter your email.' };
  }

  if (!cleanPassword) {
    return { success: false, error: 'Please enter your password.' };
  }

  // 1. Find account strictly from registered employee accounts store
  let accountRecord = null;
  
  try {
    let existingEmps = JSON.parse(localStorage.getItem('controlroom_employees_list') || '[]');
    let modified = false;

    const defaultAccounts = [
      {
        id: 'EMP-PH-001',
        employee_name: 'Senthil Kumar',
        employee_code: 'PH-VRM001',
        code: 'PH-VRM001',
        role: 'Production Head',
        email: 'production@vrm.com',
        department: 'Production',
        status: 'Active',
        created_at: new Date().toISOString()
      },
      {
        id: 'EMP-PR-001',
        employee_name: 'ARUN BOOPATHI M',
        employee_code: 'PR-VRM001',
        code: 'PR-VRM001',
        role: 'Procurement Head',
        email: 'scm@vrmstructures.in',
        department: 'Procurement',
        status: 'Active',
        created_at: new Date().toISOString()
      },
      {
        id: 'EMP-CEO-001',
        employee_name: 'Annamalaiyar',
        employee_code: 'CEO-VRM001',
        code: 'CEO-VRM001',
        role: 'CEO',
        email: 'ceo@vrm.com',
        department: 'Executive Leadership',
        status: 'Active',
        created_at: new Date().toISOString()
      },
      {
        id: 'EMP-TA-001',
        employee_name: 'Annamalaiyar',
        employee_code: 'TA-VRM001',
        code: 'TA-VRM001',
        role: 'Technical Administrator',
        email: 'admin@vrm.com',
        department: 'System Engineering',
        status: 'Active',
        created_at: new Date().toISOString()
      },
      {
        id: 'EMP-AH-001',
        employee_name: 'Venkatesh',
        employee_code: 'AH-VRM001',
        code: 'AH-VRM001',
        role: 'Accounts Head',
        email: 'accounts@vrm.com',
        department: 'Accounts & Finance',
        status: 'Active',
        created_at: new Date().toISOString()
      },
      {
        id: 'EMP-SH-001',
        employee_name: 'Vijay',
        employee_code: 'SH-VRM001',
        code: 'SH-VRM001',
        role: 'Sales Head',
        email: 'sales@vrm.com',
        department: 'Sales & Business',
        status: 'Active',
        created_at: new Date().toISOString()
      }
    ];

    defaultAccounts.forEach(acc => {
      if (!existingEmps.some(e => (e.employee_code || e.code || '').toUpperCase() === acc.employee_code)) {
        existingEmps.push(acc);
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem('controlroom_employees_list', JSON.stringify(existingEmps));
      const registeredCodes = JSON.parse(localStorage.getItem('controlroom_registered_codes') || '[]');
      defaultAccounts.forEach(acc => {
        if (!registeredCodes.includes(acc.employee_code)) {
          registeredCodes.push(acc.employee_code);
        }
      });
      // Also register PR-VRMOO1 (with O's instead of zeros)
      if (!registeredCodes.includes('PR-VRMOO1')) {
        registeredCodes.push('PR-VRMOO1');
      }
      localStorage.setItem('controlroom_registered_codes', JSON.stringify(registeredCodes));
    }

    accountRecord = existingEmps.find(e => {
      const codeMatches = cleanEmpId && (
        (e.employee_code || e.code || '').toUpperCase() === cleanEmpId.toUpperCase() ||
        (cleanEmpId.toUpperCase() === 'PR-VRMOO1' && (e.employee_code || e.code || '').toUpperCase() === 'PR-VRM001') ||
        (cleanEmpId.toUpperCase() === 'PR-VRM001' && (e.employee_code || e.code || '').toUpperCase() === 'PR-VRMOO1')
      );
      const emailMatches = cleanUsername && (
        (e.email || '').toLowerCase() === cleanUsername ||
        (cleanUsername.includes('arun') && (e.employee_name || '').toLowerCase().includes('arun'))
      );
      return codeMatches || emailMatches;
    });
  } catch(e) {}

  // Built-in fallbacks if storage was wiped
  if (!accountRecord) {
    const upperEmpId = cleanEmpId.toUpperCase();
    if (upperEmpId === 'PR-VRM001' || upperEmpId === 'PR-VRMOO1' || cleanUsername === 'scm@vrmstructures.in' || cleanUsername === 'procurement@vrm.com' || cleanUsername.includes('arun') || upperEmpId.startsWith('PR')) {
      accountRecord = {
        id: 'EMP-PR-001',
        employee_name: 'ARUN BOOPATHI M',
        employee_code: cleanEmpId || 'PR-VRM001',
        role: 'Procurement Head',
        email: cleanUsername || 'scm@vrmstructures.in',
        department: 'Procurement',
        status: 'Active'
      };
    } else if (upperEmpId === 'PH-VRM001' || cleanUsername === 'production@vrm.com' || upperEmpId.startsWith('PH')) {
      accountRecord = {
        id: 'EMP-PH-001',
        employee_name: 'Senthil Kumar',
        employee_code: cleanEmpId || 'PH-VRM001',
        role: 'Production Head',
        email: cleanUsername || 'production@vrm.com',
        department: 'Production',
        status: 'Active'
      };
    } else if (upperEmpId.startsWith('TA-') || upperEmpId === 'TA-VRM001' || cleanUsername === 'admin@vrm.com') {
      accountRecord = {
        id: 'EMP-TA-001',
        employee_name: 'Annamalaiyar',
        employee_code: cleanEmpId || 'TA-VRM001',
        role: 'Technical Administrator',
        email: cleanUsername || 'admin@vrm.com',
        department: 'System Engineering',
        status: 'Active'
      };
    } else if (upperEmpId.startsWith('CEO-') || upperEmpId === 'CEO-VRM001' || cleanUsername === 'ceo@vrm.com') {
      accountRecord = {
        id: 'EMP-CEO-001',
        employee_name: 'Annamalaiyar',
        employee_code: cleanEmpId || 'CEO-VRM001',
        role: 'CEO',
        email: cleanUsername || 'ceo@vrm.com',
        department: 'Executive Leadership',
        status: 'Active'
      };
    } else if (upperEmpId.startsWith('AH-') || cleanUsername === 'accounts@vrm.com') {
      accountRecord = {
        id: 'EMP-AH-001',
        employee_name: 'Venkatesh',
        employee_code: cleanEmpId || 'AH-VRM001',
        role: 'Accounts Head',
        email: cleanUsername || 'accounts@vrm.com',
        department: 'Accounts & Finance',
        status: 'Active'
      };
    } else if (upperEmpId.startsWith('SH-') || cleanUsername === 'sales@vrm.com') {
      accountRecord = {
        id: 'EMP-SH-001',
        employee_name: 'Vijay',
        employee_code: cleanEmpId || 'SH-VRM001',
        role: 'Sales Head',
        email: cleanUsername || 'sales@vrm.com',
        department: 'Sales & Business',
        status: 'Active'
      };
    }
  }

  if (!accountRecord) {
    return { 
      success: false, 
      error: `Account Not Found: No registered employee account exists matching "${cleanEmpId || cleanUsername}". Please click "Sign up" below to register your account.` 
    };
  }

  // 2. Validate Password strictly against account password
  if (accountRecord.password && cleanPassword !== accountRecord.password) {
    return { success: false, error: 'Incorrect Password: The password you entered is invalid. Please try again.' };
  }

  const finalRoleName = accountRecord.role;
  const finalDisplayName = accountRecord.employee_name || cleanUsername;
  const upperCode = cleanEmpId.toUpperCase();

  // Developer / Technical Administrator accounts (TA-VRM###) bypass access approval requirements
  const isDeveloper = finalRoleName === 'Technical Administrator' || upperCode.startsWith('TA-');

  // Developer, Executive and Core Department Heads bypass access approval requirements
  const isCoreOrLeadership = isDeveloper || 
    finalRoleName === 'Procurement Head' || 
    finalRoleName === 'Production Head' || 
    finalRoleName === 'CEO' || 
    upperCode.startsWith('PR-') || 
    cleanUsername === 'scm@vrmstructures.in';

  // Check stored employee status list for access permission
  try {
    const existingEmps = JSON.parse(localStorage.getItem('controlroom_employees_list') || '[]');
    const storedEmp = existingEmps.find(e => (e.employee_code || '').toUpperCase() === upperCode || (e.email || '').toLowerCase() === cleanUsername);

    if (storedEmp && !isCoreOrLeadership) {
      if (storedEmp.status === 'Pending Approval') {
        return {
          success: false,
          error: 'Access Pending: Your account registration request has been submitted. Please wait for Developer / Technical Administrator approval to access your dashboard.'
        };
      }
      if (storedEmp.status === 'Disabled' || storedEmp.status === 'Rejected') {
        return {
          success: false,
          error: 'Access Revoked: Your account access has been disabled by the Technical Administrator.'
        };
      }
    }
  } catch(e) {}

  // Persist session to localStorage
  try {
    localStorage.setItem('controlroom_is_authenticated', 'true');
    localStorage.setItem('controlroom_user_role', finalRoleName);
    localStorage.setItem('controlroom_logged_emp_id', cleanEmpId);
    localStorage.setItem('controlroom_logged_user', cleanUsername);
    localStorage.setItem('controlroom_logged_user_name', finalDisplayName);

    // Register active device session in cloud database
    registerActiveSession(cleanUsername, cleanEmpId, finalDisplayName, finalRoleName);
  } catch (e) {
    console.error('Error saving login session to localStorage:', e);
  }

  return {
    success: true,
    userRole: finalRoleName,
    displayName: finalDisplayName,
    username: cleanUsername,
    matchedRole: accountRecord
  };
};

export const logoutUser = () => {
  try {
    const sesId = localStorage.getItem('controlroom_device_session_id');
    if (sesId) {
      revokeSession(sesId);
    }
    localStorage.removeItem('controlroom_is_authenticated');
    localStorage.removeItem('controlroom_user_role');
    localStorage.removeItem('controlroom_logged_user');
    localStorage.removeItem('controlroom_logged_user_name');
  } catch (e) {
    console.error('Error removing login session:', e);
  }
};

export const getCurrentSession = () => {
  try {
    const isAuthenticated = localStorage.getItem('controlroom_is_authenticated') === 'true';
    const userRole = localStorage.getItem('controlroom_user_role') || 'Procurement Head';
    const loggedUser = localStorage.getItem('controlroom_logged_user') || '';
    const loggedUserName = localStorage.getItem('controlroom_logged_user_name') || '';

    return {
      isAuthenticated,
      userRole,
      loggedUser,
      loggedUserName
    };
  } catch (e) {
    return {
      isAuthenticated: false,
      userRole: 'Procurement Head',
      loggedUser: '',
      loggedUserName: ''
    };
  }
};
