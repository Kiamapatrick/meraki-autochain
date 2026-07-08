/* ============================================================
   MERAKI AUTOCHAIN — DASHBOARD
   Connects to the live backend API
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Router.requireUser()) return;
  Auth.populateSidebar();

  const user = Auth.getUser();
  if (user) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = (user.name || '').split(' ')[0];
    const nameEl = document.getElementById('welcome-name');
    if (nameEl) nameEl.textContent = `${greeting}, ${firstName}`;
  }

  await Promise.all([loadVehicles(), loadShareCount()]);
});

async function loadVehicles() {
  try {
    const data = await API.vehicles.list();
    const vehicles = data.vehicles || [];

    // Stats
    setText('stat-total',    vehicles.length);
    setText('stat-verified', vehicles.filter(v => v.status === 'verified').length);

    // Recent vehicles (first 3)
    const container = document.getElementById('recent-vehicles');
    if (!container) return;

    if (!vehicles.length) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;">No vehicles registered yet.</p>`;
      return;
    }

    const badgeClass = s => s === 'verified' ? 'badge-verified' : 'badge-pending';
    const badgeLabel = s => s === 'verified' ? 'Verified' : 'Pending';

    container.innerHTML = vehicles.slice(0, 3).map((v, i) => `
      <div class="vehicle-card${i < vehicles.length - 1 ? '' : ''}" style="margin-bottom:12px;">
        <div class="vehicle-card-image">
          <svg class="vehicle-silhouette" viewBox="0 0 120 60" fill="none">
            <path d="M10 40 L20 20 L40 15 L80 15 L100 20 L110 40 L10 40Z" fill="white"/>
            <circle cx="30" cy="42" r="8" fill="white"/>
            <circle cx="90" cy="42" r="8" fill="white"/>
          </svg>
          <div style="position:absolute;top:12px;right:12px;">
            <span class="badge ${badgeClass(v.status)}">
              <span class="badge-dot"></span>${badgeLabel(v.status)}
            </span>
          </div>
        </div>
        <div class="vehicle-card-body">
          <div class="vehicle-card-make">${esc(v.make)}</div>
          <div class="vehicle-card-name">${esc(v.model)}</div>
          <div class="vehicle-card-year">${esc(String(v.year))}${v.bodyType ? ' &middot; ' + esc(v.bodyType) : ''}</div>
          <div class="vehicle-card-id">
            <div>
              <div class="meraki-id-label">Meraki ID</div>
              <div class="meraki-id-value">${esc(v.merakiId)}</div>
            </div>
            <a href="vehicle-passport.html?id=${encodeURIComponent(v.merakiId)}" class="btn btn-ghost btn-sm">View passport</a>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Could not load vehicles:', err);
    setText('stat-total', '—');
    setText('stat-verified', '—');
  }
}

async function loadShareCount() {
  try {
    const data = await API.sharing.listAll();
    const shares = data.shares || [];
    setText('stat-shared', shares.length);
  } catch {
    setText('stat-shared', '0');
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
