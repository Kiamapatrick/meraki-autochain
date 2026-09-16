/* ============================================================
   MERAKI AUTOCHAIN — ROUTER / GUARD
   Page-level access control and navigation utilities.
   ============================================================ */

const Router = {

  /* Pages that require the user to be logged in */
  protectedPages: [
    'dashboard.html',
    'vehicles.html',
    'vehicle-passport.html',
    'shared-access.html',
    'profile.html'
  ],

  /* Pages where logged-in users should be redirected away */
  guestOnlyPages: [
    'index.html'
  ],

  /* Current page filename */
  currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  },

  /* Guard: redirect to login if not authenticated */
  requireUser() {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  /* Guard: redirect to dashboard if already authenticated */
  requireGuest() {
    if (Auth.isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },

  /* Run the correct guard based on current page */
  init() {
    const page = this.currentPage();
    if (this.guestOnlyPages.includes(page))   return this.requireGuest();
    if (this.protectedPages.includes(page))   return this.requireUser();
    return true;
  },

  /* Extract query param from URL */
  getParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },

  /* Navigate to a page */
  go(page, params = {}) {
    const query = new URLSearchParams(params).toString();
    window.location.href = `${page}${query ? '?' + query : ''}`;
  }
};

/* Auto-init on load */
document.addEventListener('DOMContentLoaded', () => Router.init());