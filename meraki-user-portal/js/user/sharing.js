/* ============================================================
   MERAKI AUTOCHAIN — SHARE ACCESS
   Connects to the live backend API
   ============================================================ */

let selectedVehicleId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Router.requireUser()) return;
  Auth.populateSidebar();

  await loadVehiclesForSharing();
  await loadActiveShares();

  /* Generate code button */
  const generateBtn = document.getElementById('generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerate);
  }

  /* Copy button */
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopy);
  }
});

async function loadVehiclesForSharing() {
  const container = document.querySelector('.share-vehicle-select');
  if (!container) return;

  try {
    const data = await API.vehicles.list();
    const vehicles = data.vehicles || [];

    if (!vehicles.length) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;">No vehicles in your garage.</p>`;
      return;
    }

    // Pre-select from URL param if provided
    const urlId = Router.getParam('id');
    selectedVehicleId = urlId || vehicles[0].merakiId;

    container.innerHTML = vehicles.map((v, i) => `
      <div class="share-vehicle-option${v.merakiId === selectedVehicleId ? ' selected' : ''}" data-id="${esc(v.merakiId)}">
        <div class="vehicle-icon">
          <svg viewBox="0 0 120 60" fill="none">
            <path d="M10 40 L20 20 L40 15 L80 15 L100 20 L110 40 L10 40Z" fill="currentColor"/>
            <circle cx="30" cy="42" r="8" fill="currentColor"/>
            <circle cx="90" cy="42" r="8" fill="currentColor"/>
          </svg>
        </div>
        <div class="share-vehicle-info">
          <div class="name">${esc(v.make)} ${esc(v.model)}</div>
          <div class="id">${esc(v.merakiId)}</div>
        </div>
        <div class="vehicle-check">
          <svg viewBox="0 0 10 10" fill="none" stroke="white" stroke-width="2">
            <path d="M1 5l3 3 5-5"/>
          </svg>
        </div>
      </div>
    `).join('');

    /* Vehicle selection */
    container.querySelectorAll('.share-vehicle-option').forEach(opt => {
      opt.addEventListener('click', () => {
        container.querySelectorAll('.share-vehicle-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedVehicleId = opt.dataset.id;
        const codeDisplay = document.getElementById('code-display');
        if (codeDisplay) codeDisplay.style.display = 'none';
      });
    });

  } catch (err) {
    console.warn('Could not load vehicles for sharing:', err);
    container.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;">Could not load vehicles.</p>`;
  }
}

async function handleGenerate() {
  const generateBtn = document.getElementById('generate-btn');
  const codeDisplay  = document.getElementById('code-display');
  const generatedCode = document.getElementById('generated-code');

  if (!selectedVehicleId) return;

  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';

  try {
    const res = await API.sharing.generate(selectedVehicleId);
    const code = res.share?.code;

    const fullLink = `${window.location.origin}/pages/user/shared-passport.html?code=${code}`;
    if (generatedCode) generatedCode.textContent = fullLink;
    if (codeDisplay)   codeDisplay.style.display = 'block';

    generateBtn.textContent = 'Generate new code';

    // Reload active shares list
    await loadActiveShares();

  } catch (err) {
    console.error('Failed to generate share code:', err);
    generateBtn.textContent = 'Generate share code';
  } finally {
    generateBtn.disabled = false;
  }
}

async function handleCopy() {
  const copyBtn = document.getElementById('copy-btn');
  const generatedCode = document.getElementById('generated-code');
  const code = generatedCode ? generatedCode.textContent : '';
  try {
    await navigator.clipboard.writeText(code);
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2 8l4 4 8-8"/>
      </svg>
      Copied
    `;
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="5" y="5" width="9" height="9" rx="1"/>
          <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2"/>
        </svg>
        Copy code
      `;
    }, 2500);
  } catch { /* clipboard denied */ }
}

async function loadActiveShares() {
  const tableBody = document.querySelector('.shares-table');
  if (!tableBody) return;

  try {
    const data = await API.sharing.listAll();
    const shares = data.shares || [];

    // Find the table header to keep it and replace rows
    const header = tableBody.querySelector('.shares-table-header');

    if (!shares.length) {
      const existingRows = tableBody.querySelectorAll('.shares-table-row');
      existingRows.forEach(r => r.remove());
      const msg = tableBody.querySelector('.shares-empty-msg') || document.createElement('p');
      msg.className = 'shares-empty-msg';
      msg.style.cssText = 'padding:16px 24px;color:var(--text-muted);font-size:0.875rem;';
      msg.textContent = 'No active share codes.';
      tableBody.appendChild(msg);
      return;
    }

    const existingMsg = tableBody.querySelector('.shares-empty-msg');
    if (existingMsg) existingMsg.remove();
    const existingRows = tableBody.querySelectorAll('.shares-table-row');
    existingRows.forEach(r => r.remove());

    shares.forEach(s => {
      const row = document.createElement('div');
      row.className = 'shares-table-row';
      row.innerHTML = `
        <span class="share-code-mono">${esc(s.code)}</span>
        <span style="color:var(--text-secondary);font-size:0.875rem;">${esc(s.vehicleName)}</span>
        <span style="color:var(--text-muted);font-size:0.8125rem;">${daysRemaining(s.expiresAt)}</span>
        <button class="revoke-btn" data-code="${esc(s.code)}">Revoke</button>
      `;
      tableBody.appendChild(row);
    });

    /* Attach revoke handlers */
    tableBody.querySelectorAll('.revoke-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        Modal.confirm({
          title: 'Revoke Share Code',
          message: 'Are you sure you want to revoke this share code? The recipient will no longer be able to access the vehicle passport.',
          confirmText: 'Revoke',
          cancelText: 'Cancel',
          type: 'danger',
          onConfirm: async () => {
            btn.disabled = true;
            btn.textContent = 'Revoking...';
            try {
              await API.sharing.revoke(btn.dataset.code);
              Toast.success('Share code revoked');
              await loadActiveShares();
            } catch (err) {
              Toast.error(err.message || 'Could not revoke share code');
              btn.textContent = 'Revoke';
              btn.disabled = false;
            }
          }
        });
      });
    });

  } catch (err) {
    console.warn('Could not load share codes:', err);
  }
}

function daysRemaining(expiresAt) {
  const days = Math.ceil((new Date(expiresAt) - Date.now()) / 86400000);
  if (days <= 0) return 'Expired';
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
