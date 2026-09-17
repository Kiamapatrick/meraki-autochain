/* ============================================================
   MERAKI AUTOCHAIN — MODAL COMPONENT
   Reusable accessible modal dialogs
   ============================================================ */

const Modal = (function() {
  let activeModal = null;
  let lastFocused = null;

  function createModal(options) {
    const {
      title = '',
      message = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      type = 'confirm', // 'confirm', 'alert', 'danger'
      onConfirm = () => {},
      onCancel = () => {},
      confirmVariant = 'primary' // 'primary', 'danger', 'ghost'
    } = options;

    // Remove any existing modal
    if (activeModal) removeModal(activeModal);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      background: rgba(7,26,43,0.5);
      opacity: 0;
      transition: opacity 0.2s ease;
      padding: 20px;
    `;

    const variantClasses = {
      primary: 'btn-primary',
      danger: 'btn-danger',
      ghost: 'btn-ghost'
    };

    const dangerStyle = type === 'danger' ? 'border-color: rgba(192,57,43,0.3);' : '';

    modal.innerHTML = `
      <div class="modal-content" style="
        background: var(--bg-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        max-width: 420px;
        width: 100%;
        transform: scale(0.95);
        transition: transform 0.2s ease;
        overflow: hidden;
      ">
        ${title ? `
          <div class="modal-header" style="
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-soft);
            ${dangerStyle}
          ">
            <h3 id="modal-title" style="
              font-family: var(--font-display);
              font-size: 1.125rem;
              font-weight: 600;
              color: ${type === 'danger' ? '#C0392B' : 'var(--navy)'};
              margin: 0;
            ">${escapeHtml(title)}</h3>
          </div>
        ` : ''}
        <div class="modal-body" style="padding: 24px;">
          <p style="
            font-size: 0.9375rem;
            color: var(--text-secondary);
            line-height: 1.6;
            margin: 0;
          ">${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer" style="
          padding: 16px 24px;
          border-top: 1px solid var(--border-soft);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        ">
          ${type !== 'alert' ? `
            <button class="btn btn-ghost btn-sm modal-cancel" style="
              ${confirmVariant === 'danger' ? 'border-color: rgba(192,57,43,0.2); color: #C0392B;' : ''}
            ">${escapeHtml(cancelText)}</button>
          ` : ''}
          <button class="btn ${variantClasses[confirmVariant] || 'btn-primary'} btn-sm modal-confirm">
            ${escapeHtml(confirmText)}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    activeModal = modal;

    // Animate in
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      modal.querySelector('.modal-content').style.transform = 'scale(1)';
    });

    // Focus management
    lastFocused = document.activeElement;
    const focusable = modal.querySelectorAll('button');
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    setTimeout(() => firstFocusable?.focus(), 50);

    // Event listeners
    const closeModal = (result) => {
      onConfirm = typeof onConfirm === 'function' ? onConfirm : () => {};
      onCancel = typeof onCancel === 'function' ? onCancel : () => {};

      if (result === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
      removeModal(modal);
    };

    modal.querySelector('.modal-confirm').addEventListener('click', () => closeModal('confirm'));
    if (type !== 'alert') {
      modal.querySelector('.modal-cancel').addEventListener('click', () => closeModal('cancel'));
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal('cancel');
    });

    // Keyboard handling
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        if (type !== 'alert') closeModal('cancel');
      } else if (e.key === 'Tab') {
        // Trap focus
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeydown);
    modal._cleanup = () => document.removeEventListener('keydown', handleKeydown);

    return modal;
  }

  function removeModal(modal) {
    if (!modal || !modal.parentNode) return;

    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'scale(0.95)';

    modal.addEventListener('transitionend', () => {
      modal.remove();
      if (activeModal === modal) activeModal = null;
      if (modal._cleanup) modal._cleanup();
      if (lastFocused) lastFocused.focus();
    }, { once: true });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
  }

  // Public API
  return {
    confirm: (options) => createModal({ ...options, type: 'confirm' }),
    alert: (options) => createModal({ ...options, type: 'alert', cancelText: '', confirmText: options.confirmText || 'OK' }),
    danger: (options) => createModal({ ...options, type: 'danger', confirmVariant: 'danger' }),
    close: () => activeModal && removeModal(activeModal)
  };
})();

if (typeof module !== 'undefined') module.exports = Modal;