/**
 * Meraki AutoChain — Dealer Requests
 */
const API_BASE = "http://localhost:5000/api";

let allRequests = [];
let session = null;

document.addEventListener('DOMContentLoaded', async () => {
  session = requireRole('dealer');
  if (!session) return;

  initSidebar('dealer', session, 'requests');
  initProfile(session);

  await loadRequests();

  document.getElementById('search-input').addEventListener('input', filterList);
  document.getElementById('status-filter').addEventListener('change', filterList);
});

async function loadRequests() {
  try {
    const res = await fetch(`${API_BASE}/dealer/requests`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    allRequests = Array.isArray(data) ? data : (data.requests || []);

    // Compute stats
    setText('stat-total',     allRequests.length);
    setText('stat-completed', allRequests.filter(r => r.status === 'completed').length);
    setText('stat-pending',   allRequests.filter(r => r.status === 'pending' || r.status === 'assigned').length);

    renderList(allRequests);
  } catch {
    document.getElementById('request-list').innerHTML = `
      <div class="empty-state"><p>Could not load requests. Check your connection and refresh.</p></div>`;
  }
}

function renderList(requests) {
  const list = document.getElementById('request-list');

  if (!requests.length) {
    list.innerHTML = `<div class="empty-state"><p>No verification requests found.</p></div>`;
    return;
  }

  list.innerHTML = requests.map(r => `
    <div class="request-item">
      <div class="request-item-left">
        <div class="request-vehicle">${esc(r.registration_number || r.vehicle || '—')}</div>
        <div class="request-id">Request ID: ${esc(r.id || r.request_id || '—')}</div>
        <div class="request-date">${formatDate(r.created_at)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        ${statusBadge(r.status)}
        ${r.status === 'completed' ? `
          <a class="table-action-link" href="../insurance/reports.html">View Report</a>
        ` : ''}
        ${r.status === 'pending' ? `
          <button class="btn btn-ghost btn-sm" onclick="cancelRequest('${esc(r.id || '')}')">Cancel</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function filterList() {
  const query  = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;

  const filtered = allRequests.filter(r => {
    const matchSearch = !query ||
      (r.registration_number || '').toLowerCase().includes(query) ||
      (r.vehicle || '').toLowerCase().includes(query) ||
      (r.id || '').toLowerCase().includes(query);
    const matchStatus = !status || (r.status || '').toLowerCase() === status;
    return matchSearch && matchStatus;
  });

  renderList(filtered);
}

async function cancelRequest(requestId) {
  if (!requestId) return;
  if (!confirm('Cancel this verification request?')) return;

  try {
    const res = await fetch(`${API_BASE}/dealer/requests/${requestId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });

    if (res.ok) {
      await loadRequests();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message || 'Could not cancel the request.');
    }
  } catch {
    alert('Could not reach the server.');
  }
}

/* ─── Helpers ─── */
function statusBadge(status) {
  const map = {
    completed: 'badge-verified',
    assigned:  'badge-pending',
    pending:   'badge-pending',
    cancelled: 'badge-unverified',
  };
  const label = status || 'pending';
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
