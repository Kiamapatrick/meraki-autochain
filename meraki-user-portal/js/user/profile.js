/* ============================================================
   MERAKI AUTOCHAIN — PROFILE
   Connects to the live backend API
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Router.requireUser()) return;
  Auth.populateSidebar();

  await loadProfile();

  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleSave);

  const changePwdBtn = document.getElementById('change-password-btn');
  if (changePwdBtn) changePwdBtn.addEventListener('click', handleChangePassword);

  const revokeAllBtn = document.getElementById('revoke-all-btn');
  if (revokeAllBtn) revokeAllBtn.addEventListener('click', handleRevokeAll);

  const deleteAccountBtn = document.getElementById('delete-account-btn');
  if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', handleDeleteAccount);
});

async function loadProfile() {
  try {
    const [profileData, vehicleData] = await Promise.all([
      API.user.profile(),
      API.vehicles.list()
    ]);

    const user = profileData.user;
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

    // Vehicles count
    const vehiclesCount = vehicleData.vehicles?.length || 0;
    setVal('vehicles-count', vehiclesCount);

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

/* ── Change Password ── */
async function handleChangePassword() {
  const currentPwd = document.getElementById('current-password');
  const newPwd = document.getElementById('new-password');
  const confirmPwd = document.getElementById('confirm-password');

  // Clear previous errors
  [currentPwd, newPwd, confirmPwd].forEach(el => {
    if (el) el.classList.remove('error');
  });

  if (!currentPwd.value) {
    showError(currentPwd, 'Current password is required');
    return;
  }
  if (!newPwd.value) {
    showError(newPwd, 'New password is required');
    return;
  }
  if (newPwd.value.length < 8) {
    showError(newPwd, 'New password must be at least 8 characters');
    return;
  }
  if (newPwd.value !== confirmPwd.value) {
    showError(confirmPwd, 'Passwords do not match');
    return;
  }

  const btn = document.getElementById('change-password-btn');
  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    const res = await API.user.changePassword({
      currentPassword: currentPwd.value,
      newPassword: newPwd.value
    });

    // Update stored token
    if (res.token) {
      localStorage.setItem('meraki_token', res.token);
    }

    Toast.success('Password changed. Other sessions logged out.');

    // Clear form
    currentPwd.value = '';
    newPwd.value = '';
    confirmPwd.value = '';

    btn.textContent = 'Updated ✓';
    setTimeout(() => {
      btn.textContent = 'Update password';
      btn.disabled = false;
    }, 2000);

  } catch (err) {
    Toast.error(err.message || 'Could not change password');
    btn.textContent = 'Update password';
    btn.disabled = false;
  }
}

/* ── Revoke All Sessions ── */
async function handleRevokeAll() {
  Modal.confirm({
    title: 'Sign Out Everywhere',
    message: 'This will end all active sessions across all your devices. You will need to log in again on other devices.',
    confirmText: 'Sign Out Everywhere',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: async () => {
      const btn = document.getElementById('revoke-all-btn');
      btn.disabled = true;
      btn.textContent = 'Signing out...';

      try {
        const res = await API.user.revokeAll();
        if (res.token) localStorage.setItem('meraki_token', res.token);
        Toast.success('All sessions revoked');
        btn.textContent = 'Signed Out ✓';
        setTimeout(() => {
          btn.textContent = 'Sign out everywhere';
          btn.disabled = false;
        }, 2000);
      } catch (err) {
        Toast.error(err.message || 'Could not revoke sessions');
        btn.textContent = 'Sign out everywhere';
        btn.disabled = false;
      }
    }
  });
}

/* ── Delete Account ── */
async function handleDeleteAccount() {
  Modal.danger({
    title: 'Delete Account',
    message: 'This action cannot be undone. Your account and all associated data (vehicles, share codes, inspection history) will be permanently deleted.',
    confirmText: 'Delete My Account',
    cancelText: 'Cancel',
    onConfirm: async () => {
      // Second confirmation
      Modal.confirm({
        title: 'Confirm Account Deletion',
        message: 'Please type "DELETE" to confirm you want to permanently delete your account.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
        onConfirm: async () => {
          const btn = document.getElementById('delete-account-btn');
          btn.disabled = true;
          btn.textContent = 'Deleting...';

          try {
            await API.user.deleteAccount({ password: '', confirm: 'DELETE' });
            // Note: The API expects password, but we handle it via modal
            // We'll need to show a password prompt
            Toast.error('Please implement password prompt for deletion');
            btn.textContent = 'Delete Account';
            btn.disabled = false;
          } catch (err) {
            Toast.error(err.message || 'Could not delete account');
            btn.textContent = 'Delete Account';
            btn.disabled = false;
          }
        }
      });
    }
  });
}

/* ── Helper for form errors ── */
function showError(input, message) {
  input.classList.add('error');
  const errorEl = input.parentNode.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  input.focus();
}
