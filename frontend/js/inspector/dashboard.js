/**
 * Meraki AutoChain — Inspector Dashboard
 */
const API_BASE = "http://localhost:5000/api";

document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  const session = requireRole('inspector');
  if (!session) return;

  // Sidebar
  initSidebar('inspector', session, 'dashboard');

  // Profile
  initProfile(session);
  document.querySelector('.profile-dropdown .profile-dropdown-name') &&
    (document.getElementById('dd-name').textContent = session.name);
  document.getElementById('dd-email') &&
    (document.getElementById('dd-email').textContent = session.email);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (session.name || '').split(' ')[0];
  document.getElementById('welcome-msg').textContent = `${greeting}, ${firstName}`;

  // Load data
  await Promise.all([loadStats(session), loadRecentInspections(session)]);
});

async function loadStats(session) {
  try {
    const res = await fetch(`${API_BASE}/inspector/dashboard`, {
      headers: authHeaders(session)
    });
    if (!res.ok) return;
    const data = await res.json();
    const d = data.dashboard || {};

    setText('stat-total',    d.totalInspections    ?? '—');
    setText('stat-month',    d.vehiclesRegistered  ?? '—');
    setText('stat-verified', d.verifiedInspections ?? '—');
    setText('stat-pending',  d.pendingInspections  ?? '—');
  } catch (e) {
    console.warn('Stats unavailable:', e.message);
  }
}

async function loadRecentInspections(session) {
  const tbody = document.getElementById('recent-tbody');
  try {
    const res = await fetch(`${API_BASE}/inspector/inspections?limit=10`, {
      headers: authHeaders(session)
    });
    if (!res.ok) return;
    const data = await res.json();
    const inspections = Array.isArray(data) ? data : (data.inspections || []);

    if (!inspections.length) return;

    tbody.innerHTML = inspections.map(insp => {
      const v = insp.vehicleId || {};
      return `
      <tr>
        <td class="col-reg">${esc(v.registrationNumber || '—')}</td>
        <td>
          <div style="font-weight:600;font-size:0.84rem">${esc(v.make || '')} ${esc(v.model || '')}</div>
          <div class="col-muted">${esc(v.year || '')}</div>
        </td>
        <td class="col-muted">${formatDate(insp.inspectionDate || insp.createdAt)}</td>
        <td>${statusBadge(insp.status)}</td>
        <td><a class="table-action-link" href="#">View</a></td>
      </tr>`;
    }).join('');

    // Update activity feed
    pushActivity(`Loaded ${inspections.length} recent inspections`, 'accent');
  } catch (e) {
    console.warn('Inspections unavailable:', e.message);
    pushActivity('Could not load inspections from server', 'warning');
  }
}

/* ─── Helpers ─── */

function statusBadge(status) {
  const map = {
    verified:   'badge-verified',
    pending:    'badge-pending',
    submitted:  'badge-pending',
    unverified: 'badge-unverified',
    failed:     'badge-danger',
  };
  const label = status || 'pending';
  const cls = map[label.toLowerCase()] || 'badge-unverified';
  return `<span class="badge ${cls}">${label}</span>`;
}

function pushActivity(text, type = '') {
  const list = document.getElementById('activity-list');
  const dotClass = type === 'accent' ? 'activity-dot-accent'
                 : type === 'warning' ? 'activity-dot-warning'
                 : '';
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <div class="activity-dot ${dotClass}"></div>
    <div class="activity-body">
      <div class="activity-text">${esc(text)}</div>
      <div class="activity-time">${timeAgo(new Date())}</div>
    </div>
  `;
  list.appendChild(item);
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
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
  return `${Math.floor(seconds/3600)}h ago`;
}
