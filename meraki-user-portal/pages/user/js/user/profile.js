/* ============================================================
   MERAKI AUTOCHAIN — PROFILE
   Connects to the live backend API
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Router.requireUser()) return;
  Auth.populateSidebar();

  await loadProfile();

  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }
});

async function loadProfile() {
  try {
    const data = await API.user.profile();
    const user = data.user;
    if (!user) return;

    // Update stored session with fresh data from server
    Auth.setSession(Auth.getToken(), user);
    Auth.populateSidebar();

    const names  = (user.name || '').split(' ');
    const first  = names[0] || '';
    const last   = names.slice(1).join(' ') || '';

    setVal('profile-name',       user.name);
    setVal('profile-email',      user.email);
    setVal('profile-avatar-initial', (user.name || 'U').charAt(0).toUpperCase());

    setField('first-name',  first);
    setField('last-name',   last);
    setField('email-field', user.email);
    setField('phone-field', user.phone);

    // Member since
    const sinceEl = document.getElementById('member-since');
    if (sinceEl && user.createdAt) {
      sinceEl.textContent = new Date(user.createdAt).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
    }

  } catch (err) {
    console.warn('Could not load profile:', err);
    // Fall back to stored session data
    const user = Auth.getUser();
    if (user) {
      const names = (user.name || '').split(' ');
      setField('first-name',  names[0] || '');
      setField('last-name',   names.slice(1).join(' ') || '');
      setField('email-field', user.email);
      setVal('profile-name',  user.name);
      setVal('profile-email', user.email);
      setVal('profile-avatar-initial', (user.name || 'U').charAt(0).toUpperCase());
    }
  }
}

async function handleSave() {
  const saveBtn = document.getElementById('save-profile-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const firstName = (document.getElementById('first-name')?.value || '').trim();
    const lastName  = (document.getElementById('last-name')?.value  || '').trim();
    const phone     = (document.getElementById('phone-field')?.value || '').trim();
    const name = `${firstName} ${lastName}`.trim();

    const data = await API.user.updateProfile({ name, phone });
    const updated = data.user;

    // Update stored session
    Auth.setSession(Auth.getToken(), updated);
    Auth.populateSidebar();

    setVal('profile-name', updated.name);
    setVal('profile-avatar-initial', (updated.name || 'U').charAt(0).toUpperCase());

    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => {
      saveBtn.textContent = 'Save changes';
      saveBtn.disabled = false;
    }, 2000);

  } catch (err) {
    console.error('Profile update failed:', err);
    saveBtn.textContent = 'Save changes';
    saveBtn.disabled = false;
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '';
}

function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
