/* ============================================================
   MERAKI AUTOCHAIN — VEHICLE PASSPORT
   Connects to the live backend API
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Router.requireUser()) return;
  Auth.populateSidebar();

  const merakiId = Router.getParam('id');
  if (!merakiId) {
    window.location.href = 'vehicles.html';
    return;
  }

  await loadPassport(merakiId);
});

async function loadPassport(merakiId) {
  try {
    const data = await API.vehicles.passport(merakiId);
    const p = data.passport;

    if (!p) {
      window.location.href = 'vehicles.html';
      return;
    }

    /* ── Header ── */
    setText('passport-vehicle-name', `${p.make} ${p.model}`);
    setText('passport-vehicle-sub',  `${p.year}${p.bodyType ? ' · ' + p.bodyType : ''}${p.engineCapacity ? ' · ' + p.engineCapacity : ''}`);
    setText('passport-meraki-id',    p.merakiId);

    /* ── Status badge ── */
    const badgeEl = document.getElementById('passport-status-badge');
    if (badgeEl) {
      if (p.status === 'verified') {
        badgeEl.className = 'badge badge-verified';
        badgeEl.innerHTML = '<span class="badge-dot"></span>Verified';
      } else {
        badgeEl.className = 'badge badge-pending';
        badgeEl.innerHTML = '<span class="badge-dot"></span>Pending';
      }
    }

    /* ── Blockchain status ── */
    const indicatorEl  = document.getElementById('blockchain-indicator');
    const blockchainEl = document.getElementById('blockchain-status-text');
    if (p.blockchainStatus === 'confirmed') {
      if (indicatorEl)  indicatorEl.classList.remove('pending');
      if (blockchainEl) blockchainEl.textContent = 'Blockchain verified';
    } else {
      if (indicatorEl)  indicatorEl.classList.add('pending');
      if (blockchainEl) blockchainEl.textContent = 'Blockchain pending';
    }

    /* ── Spec fields ── */
    setTextIfExists('passport-reg',           p.registrationNumber);
    setTextIfExists('passport-vin',           p.vin);
    setTextIfExists('passport-make',          p.make);
    setTextIfExists('passport-model',         p.model);
    setTextIfExists('passport-year',          p.year);
    setTextIfExists('passport-color',         p.color);
    setTextIfExists('passport-fuel',          p.fuelType);
    setTextIfExists('passport-transmission',  p.transmission);
    setTextIfExists('passport-engine',        p.engineCapacity);
    setTextIfExists('passport-inspections',   p.inspectionCount ?? '—');
    setTextIfExists('passport-mileage',       p.mileage ? Number(p.mileage).toLocaleString() + ' km' : '—');
    setTextIfExists('passport-last-inspected',p.lastInspectionDate ? formatDate(p.lastInspectionDate) : '—');
    setTextIfExists('passport-hash',          p.latestHash || '—');

    /* ── Dynamic share link ── */
    const shareLink = document.getElementById('share-passport-link');
    if (shareLink) shareLink.href = `shared-access.html?id=${encodeURIComponent(p.merakiId)}`;

    /* ── Render inspection timeline ── */
    renderInspectionTimeline(data.inspections || []);

    /* ── Render verification panel ── */
    renderVerificationPanel(p, data.inspections || [], data.verifications || []);

    /* ── Page title ── */
    document.title = `${p.make} ${p.model} Passport — Meraki AutoChain`;

  } catch (err) {
    console.warn('Could not load passport:', err);
    if (err.status === 404) {
      window.location.href = 'vehicles.html';
    }
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '—';
}

function setTextIfExists(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '—';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

function renderInspectionTimeline(inspections) {
  const container = document.querySelector('.timeline');
  if (!container) return;

  if (!inspections.length) {
    container.innerHTML = `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-event">
            <div class="timeline-event-title">No inspections recorded yet</div>
            <div class="timeline-event-details">
              <div class="timeline-event-detail">Inspections will appear here once completed</div>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = inspections.map((insp, i) => {
    const isVerified = insp.blockchainStatus === 'confirmed' || insp.status === 'verified';
    const details = [];

    if (insp.mileage) details.push(`Mileage recorded: ${Number(insp.mileage).toLocaleString()} km`);
    if (insp.condition) details.push(`Body condition: ${esc(insp.condition)}`);
    if (insp.notes) details.push(`Notes: ${esc(insp.notes)}`);
    if (insp.blockchainStatus === 'confirmed') details.push('Inspector verified by Meraki');

    return `
      <div class="timeline-item">
        <div class="timeline-dot ${isVerified ? 'verified' : ''}"></div>
        <div class="timeline-content">
          <div class="timeline-year">${formatDate(insp.inspectionDate)}</div>
          <div class="timeline-event">
            <div class="timeline-event-title">${esc(insp.condition || 'Inspection completed')}</div>
            <div class="timeline-event-details">
              ${details.map(d => `<div class="timeline-event-detail">${d}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderVerificationPanel(passport, inspections, verifications) {
  const lastInspection = inspections[0];
  const latestVerification = verifications[0];

  // Verification status panel
  const statusEl = document.getElementById('v-stat-status');
  const lastInspectionEl = document.getElementById('v-stat-last-inspection');
  const totalInspectionsEl = document.getElementById('v-stat-total-inspections');
  const blockchainProofEl = document.getElementById('v-stat-blockchain-proof');

  if (statusEl) {
    statusEl.textContent = passport.status === 'verified' ? 'Meraki Verified' : 'Pending Verification';
    statusEl.className = 'v-stat-value ' + (passport.status === 'verified' ? 'green' : '');
  }
  if (lastInspectionEl) lastInspectionEl.textContent = lastInspection ? formatDate(lastInspection.inspectionDate) : '—';
  if (totalInspectionsEl) totalInspectionsEl.textContent = inspections.length;
  if (blockchainProofEl) {
    const verified = verifications.some(v => v.status === 'verified' || v.blockchainStatus === 'confirmed');
    blockchainProofEl.textContent = verified ? 'Verified' : 'Pending';
    blockchainProofEl.className = 'v-stat-value ' + (verified ? 'green' : '');
  }

  // Mileage record panel
  const mileageEl = document.getElementById('v-stat-mileage');
  const mileageDateEl = document.getElementById('v-stat-mileage-date');
  if (mileageEl && lastInspection) {
    mileageEl.innerHTML = `${Number(lastInspection.mileage).toLocaleString()} <span style="font-size:0.875rem; color:var(--text-muted); font-weight:400;">km</span>`;
  } else if (mileageEl) {
    mileageEl.textContent = '—';
  }
  if (mileageDateEl && lastInspection) {
    mileageDateEl.textContent = formatDate(lastInspection.inspectionDate);
  } else if (mileageDateEl) {
    mileageDateEl.textContent = '—';
  }
}

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
}
