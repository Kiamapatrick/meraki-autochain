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
    if (p.blockchainStatus === 'verified') {
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
