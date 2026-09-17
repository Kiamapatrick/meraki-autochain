document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  const loadingEl  = document.getElementById('loading-state');
  const errorEl    = document.getElementById('error-state');
  const contentEl  = document.getElementById('passport-content');

  if (!code) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    return;
  }

  try {
    const data = await API.publicSharing.view(code);
    const p = data.passport;

    setText('passport-vehicle-name', `${p.make} ${p.model}`);
    setText('passport-vehicle-sub', `${p.year}`);
    setText('passport-meraki-id', p.merakiId);
    setText('passport-color', p.color);
    setText('passport-inspection-count', p.inspectionCount ?? '0');
    setText('passport-last-inspected', p.lastInspectionDate ? formatDate(p.lastInspectionDate) : 'Not yet inspected');

    const badgeEl = document.getElementById('passport-status-badge');
    if (p.status === 'verified') {
      badgeEl.className = 'badge badge-verified';
      badgeEl.textContent = 'Verified';
    } else {
      badgeEl.className = 'badge badge-pending';
      badgeEl.textContent = 'Pending';
    }

    const listEl = document.getElementById('inspections-list');
    if (data.inspections && data.inspections.length) {
      listEl.innerHTML = data.inspections.map(insp => `
        <div class="inspection-row">
          <div>${formatDate(insp.inspectionDate)}</div>
          <div>${Number(insp.mileage).toLocaleString()} km</div>
          <div>${esc(insp.condition)}</div>
          <div>${insp.blockchainStatus === 'confirmed' ? 'Chain-confirmed' : 'Pending'}</div>
        </div>
      `).join('');
    } else {
      listEl.innerHTML = '<p>No inspections recorded yet.</p>';
    }

    // Copy link button
    const copyLinkBtn = document.getElementById('copy-link-btn');
    if (copyLinkBtn) {
      const shareUrl = window.location.href;
      copyLinkBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          const originalText = copyLinkBtn.innerHTML;
          copyLinkBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 8l4 4 8-8"/>
            </svg>
            Copied!
          `;
          setTimeout(() => { copyLinkBtn.innerHTML = originalText; }, 2000);
        } catch {}
      });
    }

    // Print button
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
  }
});

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '—';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
}