/**
 * Meraki AutoChain — Inspector Vehicles
 */
const API_BASE = "http://localhost:5000/api";

let allVehicles = [];

document.addEventListener('DOMContentLoaded', async () => {
  const session = requireRole('inspector');
  if (!session) return;

  initSidebar('inspector', session, 'vehicles');
  initProfile(session);

  await loadVehicles(session);

  document.getElementById('search-input').addEventListener('input', filterTable);
  document.getElementById('status-filter').addEventListener('change', filterTable);
});

async function loadVehicles(session) {
  const tbody = document.getElementById('vehicles-tbody');
  try {
    const res = await fetch(`${API_BASE}/inspector/vehicles`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
      }
    });

    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    allVehicles = Array.isArray(data) ? data : (data.vehicles || []);
    renderTable(allVehicles);

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state"><p>Could not load vehicles. Check your connection.</p></div>
    </td></tr>`;
  }
}

function renderTable(vehicles) {
  const tbody = document.getElementById('vehicles-tbody');
  if (!vehicles.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state"><p>No vehicles found for your inspection records.</p></div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = vehicles.map(v => `
    <tr>
      <td class="col-reg">${esc(v.registrationNumber || '—')}</td>
      <td>
        <strong style="font-family:var(--font-display);font-size:0.84rem">${esc(v.make || '')} ${esc(v.model || '')}</strong>
      </td>
      <td class="col-muted">${esc(v.year || '—')}</td>
      <td class="col-muted">${v.mileage ? Number(v.mileage).toLocaleString() + ' km' : '—'}</td>
      <td class="col-muted">${formatDate(v.createdAt)}</td>
      <td>${statusBadge(v.status)}</td>
      <td><a class="table-action-link" href="#">View</a></td>
    </tr>
  `).join('');
}

function filterTable() {
  const query  = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;

  const filtered = allVehicles.filter(v => {
    const matchSearch = !query ||
      (v.registrationNumber || '').toLowerCase().includes(query) ||
      (v.make || '').toLowerCase().includes(query) ||
      (v.model || '').toLowerCase().includes(query);

    const matchStatus = !status || (v.status || '').toLowerCase() === status;
    return matchSearch && matchStatus;
  });

  renderTable(filtered);
}

function statusBadge(status) {
  const map = {
    verified: 'badge-verified',
    pending: 'badge-pending',
    submitted: 'badge-pending',
    unverified: 'badge-unverified',
    failed: 'badge-danger',
  };
  const label = status || 'pending';
  const cls = map[label.toLowerCase()] || 'badge-unverified';
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
