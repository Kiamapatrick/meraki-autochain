/**
 * Meraki AutoChain — Dealer Inventory
 */
const API_BASE = "http://localhost:5000/api";

let allVehicles = [];
let session = null;

document.addEventListener('DOMContentLoaded', async () => {
  session = requireRole('dealer');
  if (!session) return;

  initSidebar('dealer', session, 'inventory');
  initProfile(session);

  await loadInventory();

  // Search + filter
  document.getElementById('search-input').addEventListener('input', filterList);
  document.getElementById('status-filter').addEventListener('change', filterList);

  // Add vehicle modal
  document.getElementById('add-vehicle-btn').addEventListener('click', () => {
    document.getElementById('add-modal').classList.remove('hidden');
  });
  document.getElementById('close-add-modal').addEventListener('click', closeAddModal);
  document.getElementById('cancel-add-modal').addEventListener('click', closeAddModal);
  document.getElementById('add-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddModal();
  });

  document.getElementById('add-vehicle-form').addEventListener('submit', handleAddVehicle);

  // Share modal
  document.getElementById('close-share-modal').addEventListener('click', () => {
    document.getElementById('share-modal').classList.add('hidden');
  });
  document.getElementById('share-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('share-modal').classList.add('hidden');
  });

  document.getElementById('copy-link-btn').addEventListener('click', () => {
    const link = document.getElementById('share-link-text').textContent;
    navigator.clipboard.writeText(link).then(() => {
      document.getElementById('copy-link-btn').textContent = 'Copied';
      setTimeout(() => {
        document.getElementById('copy-link-btn').textContent = 'Copy';
      }, 2000);
    });
  });
});

async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE}/dealer/inventory`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    allVehicles = Array.isArray(data) ? data : (data.vehicles || []);
    renderList(allVehicles);
  } catch {
    document.getElementById('inventory-list').innerHTML = `
      <div class="empty-state">
        <p>Could not load inventory. Check your connection and refresh.</p>
      </div>`;
  }
}

function renderList(vehicles) {
  const list = document.getElementById('inventory-list');

  if (!vehicles.length) {
    list.innerHTML = `<div class="empty-state"><p>No vehicles match your search.</p></div>`;
    return;
  }

  list.innerHTML = vehicles.map(v => `
    <div class="inventory-row">
      <div class="inventory-row-reg">${esc(v.registrationNumber || '—')}</div>
      <div class="inventory-row-info">
        <div class="inventory-row-make">${esc(v.make || '')} ${esc(v.model || '')}</div>
        <div class="inventory-row-meta">${esc(v.year || '')}${v.vin ? ' &middot; VIN: ' + esc(v.vin) : ''}</div>
      </div>
      <div>${statusBadge(v.status)}</div>
      <div class="inventory-row-actions">
        <button class="btn btn-ghost btn-sm"
          onclick="requestVerification('${esc(v.merakiId || '')}', '${esc(v.registrationNumber || '')}')"
        >Request Inspection</button>
        <button class="btn btn-ghost btn-sm"
          onclick="openShareModal('${esc(v.merakiId || '')}', '${esc(v.registrationNumber || '')}')"
        >Share Passport</button>
      </div>
    </div>
  `).join('');
}

function filterList() {
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

  renderList(filtered);
}

async function handleAddVehicle(e) {
  e.preventDefault();
  clearAddError();
  setAddLoading(true);

  const form = e.target;
  const reg   = form.registration_number.value.trim();
  const make  = form.make.value.trim();
  const model = form.model.value.trim();

  if (!reg || !make || !model) {
    showAddError('Registration, Make and Model are required.');
    setAddLoading(false);
    return;
  }

  const payload = {
    registrationNumber: reg,
    make,
    model,
    year:  form.year.value  || null,
    vin:   form.vin.value   || null,
  };

  try {
    const res = await fetch(`${API_BASE}/dealer/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
      showAddError(data.message || data.error || 'Could not add vehicle. Try again.');
      setAddLoading(false);
      return;
    }

    closeAddModal();
    form.reset();
    await loadInventory();

  } catch {
    showAddError('Could not reach the server. Check your connection.');
    setAddLoading(false);
  }
}

async function requestVerification(vehicleId, regNo) {
  if (!vehicleId) return;
  if (!confirm(`Request an inspection for ${regNo}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/dealer/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ merakiId: vehicleId }),
    });

    if (res.ok) {
      alert(`Inspection request submitted for ${regNo}. An inspector will be assigned.`);
      await loadInventory();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message || 'Request failed. Try again.');
    }
  } catch {
    alert('Could not reach the server.');
  }
}

function openShareModal(vehicleId, regNo) {
  const link = `${window.location.origin}/verify/${vehicleId}`;
  document.getElementById('share-link-text').textContent = link;
  document.getElementById('copy-link-btn').textContent = 'Copy';
  document.getElementById('share-modal').classList.remove('hidden');
}

/* ─── Helpers ─── */
function closeAddModal() {
  document.getElementById('add-modal').classList.add('hidden');
  clearAddError();
  setAddLoading(false);
}

function setAddLoading(state) {
  const btn = document.getElementById('add-submit-btn');
  btn.disabled = state;
  btn.querySelector('.btn-label').classList.toggle('hidden', state);
  btn.querySelector('.btn-spinner').classList.toggle('hidden', !state);
}

function showAddError(msg) {
  const el = document.getElementById('add-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAddError() {
  const el = document.getElementById('add-error');
  el.classList.add('hidden');
  el.textContent = '';
}

function statusBadge(status) {
  const map = { verified: 'badge-verified', pending: 'badge-pending', unverified: 'badge-unverified' };
  const label = status || 'unverified';
  return `<span class="badge ${map[label.toLowerCase()] || 'badge-unverified'}">${label}</span>`;
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
