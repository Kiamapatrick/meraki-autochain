/**
 * Meraki AutoChain — Profile Dropdown
 * Populates topbar profile and wires the dropdown.
 */

function initProfile(user) {
  const trigger = document.getElementById('profile-trigger');
  const dropdown = document.getElementById('profile-dropdown');
  const nameEl = document.getElementById('profile-name');
  const avatarEl = document.getElementById('profile-avatar');

  if (!trigger || !dropdown) return;

  const initials = (user.name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = user.name || 'Partner';

  // Dropdown header
  const dName = dropdown.querySelector('.profile-dropdown-name');
  const dEmail = dropdown.querySelector('.profile-dropdown-email');
  if (dName) dName.textContent = user.name || '';
  if (dEmail) dEmail.textContent = user.email || '';

  // Toggle
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });

  // Logout from dropdown
  const logoutBtn = dropdown.querySelector('[data-action="logout"]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => logout());
  }
}
