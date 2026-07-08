/**
 * Meraki AutoChain — Partner Router
 * Guards all dashboard pages. Reads session, verifies role.
 * Import first in every dashboard HTML file.
 */

const ROLE_REDIRECT = {
  inspector: '/pages/partner/inspector/dashboard.html',
  dealer:    '/pages/partner/dealer/dashboard.html',
  insurance: '/pages/partner/insurance/dashboard.html',
};

const LOGIN_URL = '/pages/partner/login.html';

/**
 * Call on every protected page with the expected role.
 * Returns the session object if valid, otherwise redirects.
 *
 * @param {string} expectedRole - 'inspector' | 'dealer' | 'insurance'
 * @returns {{ name, email, role, token }}
 */
function requireRole(expectedRole) {
  const session = getSession();

  if (!session) {
    redirectToLogin();
    return null;
  }

  if (session.role !== expectedRole) {
    // Wrong role — redirect to their correct dashboard
    const correct = ROLE_REDIRECT[session.role];
    if (correct) {
      window.location.href = correct;
    } else {
      redirectToLogin();
    }
    return null;
  }

  return session;
}

/**
 * Retrieve session from storage.
 */
function getSession() {
  try {
    const s = sessionStorage.getItem('meraki_session')
           || localStorage.getItem('meraki_session');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

/**
 * Destroy session and go to login.
 */
function logout() {
  try {
    sessionStorage.removeItem('meraki_session');
    localStorage.removeItem('meraki_session');
  } catch (e) {}
  redirectToLogin();
}

function redirectToLogin() {
  window.location.href = LOGIN_URL;
}
