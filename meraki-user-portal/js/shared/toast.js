/* ============================================================
   MERAKI AUTOCHAIN — TOAST NOTIFICATIONS
   Lightweight, accessible toast system
   ============================================================ */

const Toast = (function() {
  let container = null;
  const MAX_TOASTS = 5;

  function init() {
    if (container) return;
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');
    container.setAttribute('aria-live', 'polite');
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  function createToast(message, type = 'info', duration = 3000) {
    init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.style.pointerEvents = 'auto';

    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8l4 4 8-8"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="9"/><path d="M10 6v6M10 14v.01"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3l7 14H3z"/><path d="M10 9v4M10 15v.01"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="9"/><path d="M10 6v6M10 14v.01"/></svg>'
    };

    const colors = {
      success: { bg: 'rgba(31,167,116,0.1)', border: 'rgba(31,167,116,0.3)', text: 'var(--green)', icon: 'var(--green)' },
      error: { bg: 'rgba(192,57,43,0.1)', border: 'rgba(192,57,43,0.3)', text: '#C0392B', icon: '#C0392B' },
      warning: { bg: 'rgba(180,130,30,0.1)', border: 'rgba(180,130,30,0.3)', text: '#B4821E', icon: '#B4821E' },
      info: { bg: 'rgba(18,59,93,0.1)', border: 'rgba(18,59,93,0.3)', text: 'var(--steel)', icon: 'var(--steel)' }
    };

    const c = colors[type] || colors.info;
    const icon = icons[type] || icons.info;

    toast.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 18px;
      background: ${c.bg};
      border: 1px solid ${c.border};
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      min-width: 280px;
      max-width: 420px;
      animation: toastIn 0.3s ease;
      pointer-events: auto;
    `;

    toast.innerHTML = `
      <span style="flex-shrink:0; color:${c.icon}; display:flex; align-items:center;">${icon}</span>
      <span style="flex:1; font-size:0.875rem; color:${c.text}; line-height:1.5;">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Dismiss" style="
        flex-shrink:0;
        width:24px; height:24px;
        display:flex; align-items:center; justify-content:center;
        background:transparent; border:none; border-radius:50%;
        color:${c.text}; opacity:0.5; cursor:pointer;
        transition:opacity var(--transition), background var(--transition);
      ">&times;</button>
    `;

    // Add to container
    container.appendChild(toast);

    // Limit number of toasts
    while (container.children.length > MAX_TOASTS) {
      removeToast(container.firstChild);
    }

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.animation = 'toastOut 0.2s ease forwards';
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
  }

  // Public API
  return {
    success: (msg, duration) => createToast(msg, 'success', duration),
    error: (msg, duration) => createToast(msg, 'error', duration),
    warning: (msg, duration) => createToast(msg, 'warning', duration),
    info: (msg, duration) => createToast(msg, 'info', duration),
    dismissAll: () => {
      if (container) {
        [...container.children].forEach(removeToast);
      }
    }
  };
})();

// Add toast animations to document
const style = document.createElement('style');
style.textContent = `
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
  .toast-close:hover { opacity: 1 !important; background: rgba(0,0,0,0.05) !important; }
`;
document.head.appendChild(style);

// Export for module usage
if (typeof module !== 'undefined') module.exports = Toast;