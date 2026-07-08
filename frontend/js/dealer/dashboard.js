/**
 * Meraki AutoChain — Dealer Dashboard
 */
const API_BASE = "http://localhost:5000/api";

document.addEventListener('DOMContentLoaded', async () => {
  const session = requireRole('dealer');
  if (!session) return;

  initSidebar('dealer', session, 'dashboard');
  initProfile(session);

  const firstName = (session.name || '').split(' ')[0];
  document.getElementById('welcome-msg').textContent = `Welcome back, ${firstName}`;

  await Promise.all([loadStats(session), loadRecentInventory(session), loadRecentRequests(session)]);
});

async function loadStats(session) {
  try {
    const res = await fetch(`${API_BASE}/dealer/dashboard`, {
      headers: authHeaders(session)
    });
    if (!res.ok) return;
    const data = await res.json();
    const d = data.dashboard || {};
    setText('stat-total',    d.inventoryCount       ?? '—');
    setText('stat-verified', d.verifiedVehicles     ?? '—');
    setText('stat-pending',  d.pendingVerification  ?? '—');
  } catch (e) {
    console.warn('Stats unavailable');
  }
}

async function loadRecentInventory(session) {
  try {
    const res = await fetch(`${API_BASE}/dealer/inventory?limit=5`, {
      headers: authHeaders(session)
    });
    if (!res.ok) return;
    const data = await res.json();
    const vehicles = Array.isArray(data) ? data : (data.vehicles || []);
    if (!vehicles.length) return;

    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = vehicles.map(v => `
      <tr>
        <td class="col-reg">${esc(v.registrationNumber || '—')}</td>
        <td>
          <div style="font-weight:600;font-size:0.84rem;font-family:var(--font-display)">${esc(v.make || '')} ${esc(v.model || '')}</div>
          <div class="col-muted">${esc(v.year || '')}</div>
        </td>
        <td>${statusBadge(v.status)}</td>
        <td><a class="table-action-link" href="inventory.html">View</a></td>
      </tr>
    `).join('');
  } catch (e) {
    console.warn('Inventory unavailable');
  }
}

async function loadRecentRequests(session) {
  try {
    // Fetch pending inspections for the dealer's vehicles using the dashboard endpoint
    const res = await fetch(`${API_BASE}/dealer/dashboard`, {
      headers: authHeaders(session)
    });
    if (!res.ok) return;
    const data = await res.json();
    const requests = (data.dashboard?.recentInventory || []).filter(v => v.status === 'pending').slice(0, 4);
    if (!requests.length) return;

    const list = document.getElementById('requests-list');
    list.innerHTML = requests.map(r => `
      <div class="activity-item">
        <div class="activity-dot activity-dot-warning"></div>
        <div class="activity-body">
          <div class="activity-text">
            <strong>${esc(r.registrationNumber || '—')}</strong>
            — ${esc(r.make || '')} ${esc(r.model || '')} · awaiting inspection
          </div>
          <div class="activity-time">${formatDate(r.createdAt)}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.warn('Requests unavailable');
  }
}

function statusBadge(status) {
  const map = { verified: 'badge-verified', pending: 'badge-pending', unverified: 'badge-unverified' };
  const label = status || 'pending';
  return `<span class="badge ${map[label.toLowerCase()] || 'badge-unverified'}">${label}</span>`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function authHeaders(session) {
  return {
    'Content-Type': 'application/json',
    ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
}
