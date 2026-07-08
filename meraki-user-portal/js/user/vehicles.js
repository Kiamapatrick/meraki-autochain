/* ============================================================
   MERAKI AUTOCHAIN — VEHICLES PAGE
   Connects to the live backend API
   ============================================================ */

let allVehicles = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Router.requireUser()) return;
  Auth.populateSidebar();

  /* Filter buttons */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderVehicles(allVehicles, btn.dataset.filter);
    });
  });

  await loadVehicles();
});

async function loadVehicles() {
  const grid = document.getElementById('vehicles-grid');
  if (!grid) return;

  grid.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;grid-column:1/-1;">Loading vehicles...</p>`;

  try {
    const data = await API.vehicles.list();
    allVehicles = data.vehicles || [];
    renderVehicles(allVehicles, 'all');
  } catch (err) {
    console.warn('Could not load vehicles:', err);
    grid.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;grid-column:1/-1;">Could not load vehicles. Please try again.</p>`;
  }
}

function renderVehicles(vehicles, filter = 'all') {
  const grid = document.getElementById('vehicles-grid');
  if (!grid) return;

  const filtered = filter === 'all' ? vehicles : vehicles.filter(v => v.status === filter);

  if (!filtered.length) {
    grid.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;grid-column:1/-1;">No vehicles found.</p>`;
    return;
  }

  const badgeClass = s => s === 'verified' ? 'badge-verified' : 'badge-pending';
  const badgeLabel = s => s === 'verified' ? 'Verified' : 'Pending';

  grid.innerHTML = filtered.map(v => `
    <div class="vehicle-card" data-status="${esc(v.status)}">
      <div class="vehicle-card-image">
        <svg class="vehicle-silhouette" viewBox="0 0 120 60" fill="none">
          <path d="M10 40 L20 20 L40 15 L80 15 L100 20 L110 40 L10 40Z" fill="white"/>
          <circle cx="30" cy="42" r="8" fill="white"/>
          <circle cx="90" cy="42" r="8" fill="white"/>
        </svg>
        <div class="vehicle-badge" style="position:absolute;top:12px;right:12px;">
          <span class="badge ${badgeClass(v.status)}"><span class="badge-dot"></span>${badgeLabel(v.status)}</span>
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
        </div>
        <div class="vehicle-card-actions">
          ${v.status === 'verified'
            ? `<a href="vehicle-passport.html?id=${encodeURIComponent(v.merakiId)}" class="btn btn-primary btn-sm">View passport</a>`
            : `<a href="vehicle-passport.html?id=${encodeURIComponent(v.merakiId)}" class="btn btn-ghost btn-sm">View record</a>`
          }
          <a href="shared-access.html?id=${encodeURIComponent(v.merakiId)}" class="btn btn-ghost btn-sm">Share</a>
        </div>
      </div>
    </div>
  `).join('');
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
