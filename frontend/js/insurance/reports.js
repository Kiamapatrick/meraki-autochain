/**
 * Meraki AutoChain — Insurance Reports
 * Full vehicle lookup with inspection history and blockchain verification.
 */
const API_BASE = "http://localhost:5000/api";

let session = null;
const lookupHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  session = requireRole('insurance');
  if (!session) return;

  initSidebar('insurance', session, 'reports');
  initProfile(session);

  // Pre-fill from URL param if coming from dashboard quick lookup
  const params = new URLSearchParams(window.location.search);
  const preReg = params.get('reg');
  if (preReg) {
    document.getElementById('lookup-reg').value = preReg.toUpperCase();
    runLookup(preReg.toUpperCase());
  }

  document.getElementById('lookup-btn').addEventListener('click', () => {
    const reg = document.getElementById('lookup-reg').value.trim().toUpperCase();
    if (reg) runLookup(reg);
  });

  document.getElementById('lookup-reg').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const reg = e.target.value.trim().toUpperCase();
      if (reg) runLookup(reg);
    }
  });

  document.getElementById('lookup-reg').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  document.getElementById('clear-btn').addEventListener('click', resetToHistory);
  document.getElementById('back-btn').addEventListener('click', resetToHistory);
});

async function runLookup(reg) {
  clearError();
  setLookupLoading(true);
  showView('none');

  try {
    const res = await fetch(`${API_BASE}/insurance/lookup?reg=${encodeURIComponent(reg)}`, {
      headers: authHeaders()
    });

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (res.status === 404 || data.found === false) {
      document.getElementById('not-found-text').textContent =
        `No verification record found for "${reg}" on Meraki AutoChain.`;
      showView('not-found');
      addHistory(reg, null);
      setLookupLoading(false);
      return;
    }

    if (!res.ok) {
      showError(data.message || data.error || 'Lookup failed. Try again.');
      showView('history');
      setLookupLoading(false);
      return;
    }

    renderReport(data);
    addHistory(reg, data.status);
    showView('report');

  } catch {
    showError('Could not reach the server. Check your connection and try again.');
    showView('history');
  }

  setLookupLoading(false);
}

function renderReport(data) {
  // Header
  setText('report-reg', data.registration_number || '—');
  setText('report-id',  data.vehicle_id ? `Meraki ID: ${data.vehicle_id}` : '');
  document.getElementById('report-status-badge').innerHTML = statusBadge(data.status);

  // Vehicle identity
  setText('rpt-make',      data.make      || '—');
  setText('rpt-model',     data.model     || '—');
  setText('rpt-year',      data.year      || '—');
  setText('rpt-vin',       data.vin       || 'Not recorded');
  setText('rpt-color',     data.color     || 'Not recorded');
  setText('rpt-mileage',   data.mileage   ? Number(data.mileage).toLocaleString() + ' km' : '—');

  // Inspection summary
  const inspections = data.inspections || [];
  setText('rpt-count',     inspections.length || '0');
  setText('rpt-last',      formatDate(data.last_inspection || (inspections[0] && inspections[0].inspection_date)));
  setText('rpt-condition', data.condition || (inspections[0] && inspections[0].condition) || '—');

  // Inspection history table
  const tbody = document.getElementById('inspection-history-tbody');
  if (inspections.length) {
    tbody.innerHTML = inspections.map(insp => `
      <tr>
        <td class="col-muted">${formatDate(insp.inspection_date || insp.created_at)}</td>
        <td style="text-transform:capitalize">${esc(insp.condition || '—')}</td>
        <td class="col-muted">${insp.mileage ? Number(insp.mileage).toLocaleString() + ' km' : '—'}</td>
        <td>${statusBadge(insp.status)}</td>
        <td class="col-muted">${esc(insp.inspector_name || insp.inspector || 'Verified Inspector')}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="5" class="col-muted" style="text-align:center;padding:16px">No inspection history available</td></tr>`;
  }

  // Blockchain panel
  if (data.hash) {
    setText('blockchain-hash',    data.hash);
    setText('blockchain-block',   data.block_number || '—');
    setText('blockchain-ts',      formatDate(data.blockchain_timestamp || data.verified_at));
    setText('blockchain-network', data.network || 'Meraki Chain');
    document.getElementById('blockchain-panel').style.display = 'block';
  } else {
    document.getElementById('blockchain-panel').style.display = 'none';
  }

  // Show clear button
  document.getElementById('clear-btn').style.display = 'inline-flex';
}

function showView(which) {
  document.getElementById('history-view').classList.add('hidden');
  document.getElementById('report-view').classList.add('hidden');
  document.getElementById('not-found-view').classList.add('hidden');

  if (which === 'history')   document.getElementById('history-view').classList.remove('hidden');
  if (which === 'report')    document.getElementById('report-view').classList.remove('hidden');
  if (which === 'not-found') document.getElementById('not-found-view').classList.remove('hidden');
}

function resetToHistory() {
  document.getElementById('lookup-reg').value = '';
  document.getElementById('clear-btn').style.display = 'none';
  clearError();
  showView('history');
  renderHistoryList();
}

function addHistory(reg, status) {
  lookupHistory.unshift({ reg, status, time: new Date() });
  renderHistoryList();
}

function renderHistoryList() {
  const list = document.getElementById('history-list');

  if (!lookupHistory.length) {
    list.innerHTML = `<div class="empty-state"><p>Enter a registration number above to run a verification.</p></div>`;
    return;
  }

  list.innerHTML = lookupHistory.slice(0, 10).map(h => `
    <div class="report-history-item">
      <div class="report-history-left">
        <div class="report-history-reg">${esc(h.reg)}</div>
        <div class="report-history-date">${timeAgo(h.time)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        ${h.status ? statusBadge(h.status) : '<span class="badge badge-unverified">Not found</span>'}
        <button
          class="btn btn-ghost btn-sm"
          onclick="document.getElementById('lookup-reg').value='${esc(h.reg)}';runLookup('${esc(h.reg)}')"
        >View</button>
      </div>
    </div>
  `).join('');
}

/* ─── Helpers ─── */
function setLookupLoading(state) {
  const btn   = document.getElementById('lookup-btn');
  const label = document.getElementById('lookup-btn-label');
  btn.disabled = state;
  label.textContent = state ? 'Searching...' : 'Run Verification';
}

function showError(msg) {
  document.getElementById('lookup-error-text').textContent = msg;
  document.getElementById('lookup-error').classList.remove('hidden');
}

function clearError() {
  document.getElementById('lookup-error').classList.add('hidden');
  document.getElementById('lookup-error-text').textContent = '';
}

function statusBadge(status) {
  const map = { verified: 'badge-verified', pending: 'badge-pending', unverified: 'badge-unverified' };
  const label = status || 'unverified';
  return `<span class="badge ${map[label.toLowerCase()] || 'badge-unverified'}">${label}</span>`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(val || '');
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
