/* ============================================================
   MERAKI AUTOCHAIN — AUTH UTILITY
   Handles token storage, user session and route protection.
   ============================================================ */

const Auth = {
  TOKEN_KEY: 'meraki_token',
  USER_KEY:  'meraki_user',

  /* Store token and user after login */
  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  /* Retrieve stored token */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /* Retrieve stored user object */
  getUser() {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /* True if a token exists */
  isLoggedIn() {
    return !!this.getToken();
  },

  /* Clear all session data */
  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  /* Redirect to login if not authenticated */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/pages/user/index.html';
      return false;
    }
    return true;
  },

  /* Redirect away from login if already authenticated */
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = '/pages/user/dashboard.html';
    }
  },

  /* Log out and redirect */
  logout() {
    this.clearSession();
    window.location.href = '/pages/user/index.html';
  },

  /* Inject user name into the sidebar */
  populateSidebar() {
    const user = this.getUser();
    if (!user) return;

    const nameEl = document.getElementById('sidebar-user-name');
    const initEl = document.getElementById('sidebar-user-initial');
    const roleEl = document.getElementById('sidebar-user-role');

    if (nameEl) nameEl.textContent = user.name || 'User';
    if (initEl) initEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
    if (roleEl) roleEl.textContent = user.role || 'owner';
  }
};

/* Attach logout to any element with data-action="logout" */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', () => Auth.logout());
  });
});
