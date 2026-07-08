/**
 * Meraki AutoChain — Insurance Dashboard
 */
const API_BASE = "http://localhost:5000/api";

let session = null;
const recentLookups = [];

document.addEventListener('DOMContentLoaded', async () => {
  session = requireRole('insurance');
  if (!session) return;

  initSidebar('insurance', session, 'dashboard');
  initProfile(session);

  const firstName = (session.name || '').split(' ')[0];
  document.getElementById('welcome-msg').textContent = `Welcome, ${firstName}`;

  await loadStats();

  // Quick lookup
  document.getElementById('quick-lookup-btn').addEventListener('click', handleQuickLookup);
  document.getElementById('quick-reg').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleQuickLookup();
  });
  document.getElementById('quick-reg').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });
});

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/insurance/dashboard`, {
      headers: authHeaders()
    });
    if (!res.ok) return;
    const data = await res.json();
    const d = data.dashboard || {};
    setText('stat-lookups',  d.totalVerifiedInspections ?? '—');
    setText('stat-reports',  d.recentVerifications?.length ?? '—');
    setText('stat-verified', d.totalVerifiedVehicles    ?? '—');
  } catch {
    console.warn('Stats unavailable');
  }
}

async function handleQuickLookup() {
  const reg = document.getElementById('quick-reg').value.trim().toUpperCase();
  if (!reg) return;

  const btn = document.getElementById('quick-lookup-btn');
  btn.disabled = true;
  btn.textContent = 'Searching...';

  // Hide info panel, show result panel
  document.getElementById('info-panel').style.display = 'none';
  document.getElementById('quick-result-panel').style.display = 'block';

  const resultBody = document.getElementById('quick-result-body');
  resultBody.innerHTML = `
    <div class="lookup-loading">
      <div class="lookup-loading-spinner"></div>
      <div class="lookup-loading-text">Checking verification records for ${esc(reg)}...</div>
    </div>`;

  try {
    // Backend lookup uses merakiId as a path param; try to find by reg number
    // by searching reports endpoint first to resolve merakiId
    const reportsRes = await fetch(`${API_BASE}/insurance/reports?limit=200`, {
      headers: authHeaders()
    });
    let merakiId = null;
    if (reportsRes.ok) {
      const rData = await reportsRes.json();
      const match = (rData.reports || []).find(v =>
        v.registrationNumber && v.registrationNumber.toUpperCase() === reg
      );
      if (match) merakiId = match.merakiId;
    }

    if (!merakiId) {
      resultBody.innerHTML = renderNotFound(reg);
      btn.disabled = false;
      btn.textContent = 'Verify Now';
      return;
    }

    const res = await fetch(`${API_BASE}/insurance/lookup/${encodeURIComponent(merakiId)}`, {
      headers: authHeaders()
    });

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (res.status === 404 || !data.vehicle) {
      resultBody.innerHTML = renderNotFound(reg);
    } else if (!res.ok) {
      resultBody.innerHTML = `<p class="text-danger t-small" style="padding:16px">${esc(data.message || 'Lookup failed.')}</p>`;
    } else {
      resultBody.innerHTML = renderQuickResult(data);
      addToRecentLookups(reg, data.vehicle?.verificationStatus);
    }

  } catch {
    resultBody.innerHTML = `<p class="text-danger t-small" style="padding:16px">Could not reach the server. Check your connection.</p>`;
  }

  btn.disabled = false;
  btn.textContent = 'Verify Now';
}

function renderQuickResult(data) {
  const v = data.vehicle || {};
  return `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;letter-spacing:0.04em">
          ${esc(v.registrationNumber || '—')}
        </div>
        ${statusBadge(v.verificationStatus)}
      </div>
      <div class="divider"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <div class="t-caption">Make / Model</div>
          <div style="font-family:var(--font-display);font-size:0.84rem;font-weight:600;margin-top:2px">
            ${esc(v.make || '—')} ${esc(v.model || '')}
          </div>
        </div>
        <div>
          <div class="t-caption">Year</div>
          <div style="font-family:var(--font-display);font-size:0.84rem;font-weight:600;margin-top:2px">${esc(v.year || '—')}</div>
        </div>
        <div>
          <div class="t-caption">Inspections</div>
          <div style="font-family:var(--font-display);font-size:0.84rem;font-weight:600;margin-top:2px">${data.inspectionCount ?? '—'}</div>
        </div>
        <div>
          <div class="t-caption">Last Inspected</div>
          <div style="font-family:var(--font-display);font-size:0.84rem;font-weight:600;margin-top:2px">${formatDate((data.inspectionHistory || []).at(-1)?.inspectionDate)}</div>
        </div>
      </div>
      ${(data.hashProofs || []).length ? `
        <div class="divider"></div>
        <div>
          <div class="t-caption" style="margin-bottom:5px">Latest blockchain hash</div>
          <div class="hash-display">${esc(data.hashProofs.at(-1)?.transactionHash || data.hashProofs.at(-1)?.hash || '')}</div>
        </div>
      ` : ''}
      <a href="reports.html?reg=${encodeURIComponent(v.registrationNumber || '')}" class="btn btn-dark btn-sm" style="align-self:flex-start;margin-top:4px">
        Full Report
      </a>
    </div>`;
}

function renderNotFound(reg) {
  return `
    <div style="padding:20px 0;text-align:center">
      <div style="font-family:var(--font-display);font-size:0.84rem;font-weight:600;color:var(--text-secondary);margin-bottom:6px">
        No records found for ${esc(reg)}
      </div>
      <p class="t-small text-muted">
        This vehicle has no inspection record on Meraki AutoChain yet.
      </p>
    </div>`;
}

function addToRecentLookups(reg, status) {
  recentLookups.unshift({ reg, status, time: new Date() });
  const wrap = document.getElementById('recent-lookups-wrap');
  wrap.innerHTML = recentLookups.slice(0, 8).map(l => `
    <div class="report-history-item">
      <div class="report-history-left">
        <div class="report-history-reg">${esc(l.reg)}</div>
        <div class="report-history-date">${timeAgo(l.time)}</div>
      </div>
      ${statusBadge(l.status)}
    </div>
  `).join('');
}

/* ─── Helpers ─── */
function statusBadge(status) {
  const map = { verified: 'badge-verified', pending: 'badge-pending', unverified: 'badge-unverified' };
  const label = status || 'unverified';
  return `<span class="badge ${map[label.toLowerCase()] || 'badge-unverified'}">${label}</span>`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function authHeaders() {
  return {
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
