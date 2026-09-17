/* ============================================================
   MERAKI AUTOCHAIN — MOBILE SIDEBAR DRAWER
   Slide-in drawer from left for mobile navigation
   ============================================================ */

const MobileSidebar = (function() {
  let isOpen = false;
  let sidebar = null;
  let overlay = null;
  let hamburgerBtn = null;
  let lastFocused = null;

  function init() {
    if (sidebar) return;

    // Create overlay
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(7,26,43,0.5);
      z-index: 98;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    `;
    document.body.appendChild(overlay);

    // Get sidebar reference
    sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Create hamburger button and insert into page header
    createHamburgerButton();

    // Event listeners
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', handleKeydown);

    // Handle resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && isOpen) close();
    });
  }

  function createHamburgerButton() {
    hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'mobile-menu-btn';
    hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-controls', 'sidebar');
    hamburgerBtn.style.cssText = `
      display: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition);
    `;
    hamburgerBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 6h14M3 10h14M3 14h14" stroke="var(--navy)"/>
      </svg>
    `;

    // Insert into page header (right side)
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
      const headerRight = pageHeader.querySelector('.page-header-right') || pageHeader;
      headerRight.insertAdjacentElement('beforeend', hamburgerBtn);
    }

    // Show on mobile
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    function handleMediaChange(e) {
      hamburgerBtn.style.display = e.matches ? 'flex' : 'none';
      if (!e.matches && isOpen) close();
    }
    mediaQuery.addEventListener('change', handleMediaChange);
    handleMediaChange(mediaQuery);

    hamburgerBtn.addEventListener('click', toggle);
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function open() {
    if (isOpen) return;
    isOpen = true;

    lastFocused = document.activeElement;

    sidebar.style.transform = 'translateX(0)';
    sidebar.style.boxShadow = 'var(--shadow-md)';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    overlay.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 6l6 6 6-6M4 14l6-6 6 6" stroke="var(--navy)"/>
      </svg>
    `;

    document.body.style.overflow = 'hidden';

    // Focus first focusable element in sidebar
    setTimeout(() => {
      const focusable = sidebar.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }, 100);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    sidebar.style.transform = '';
    sidebar.style.boxShadow = '';
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    overlay.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 6h14M3 10h14M3 14h14" stroke="var(--navy)"/>
      </svg>
    `;

    document.body.style.overflow = '';

    // Restore focus
    if (lastFocused) lastFocused.focus();
  }

  function handleKeydown(e) {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      close();
      return;
    }

    // Trap focus within sidebar
    if (e.key === 'Tab') {
      const focusable = sidebar.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init, open, close, toggle };
})();

// Add mobile sidebar styles
const sidebarStyle = document.createElement('style');
sidebarStyle.textContent = `
  @media (max-width: 900px) {
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 280px;
      max-width: 85vw;
      z-index: 99;
      transform: translateX(-100%);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      box-shadow: none;
    }
    .main-content { margin-left: 0; }
    .page-header { padding: 16px 20px; }
    .page-body { padding: 20px; }
  }
`;
document.head.appendChild(sidebarStyle);

if (typeof module !== 'undefined') module.exports = MobileSidebar;