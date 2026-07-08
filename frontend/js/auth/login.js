/**
 * Meraki AutoChain — Partner Login
 * Authenticates against real backend. Routes by role.
 */

const API_BASE = "http://localhost:5000/api";

const form       = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const submitBtn  = document.getElementById('submit-btn');
const errorBox   = document.getElementById('error-msg');
const errorText  = document.getElementById('error-text');


// If already authenticated, redirect immediately
(function checkExistingSession() {
  const session = getSession();
  if (session && ROLE_REDIRECT[session.role]) {
    window.location.href = ROLE_REDIRECT[session.role];
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  setLoading(true);

  const email    = emailInput.value.trim();
  const password = passInput.value;

  if (!email || !password) {
    showError('Enter your email and password to continue.');
    setLoading(false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Unexpected response from server.');
    }

    if (!res.ok) {
      showError(data.message || data.error || 'Login failed. Check your credentials.');
      setLoading(false);
      return;
    }

    const { token, user } = data;
    const { name, email: userEmail, role } = user || {};

    if (!role || !ROLE_REDIRECT[role]) {
      showError('Your account role is not recognised. Contact your administrator.');
      setLoading(false);
      return;
    }

    // Store session
    saveSession({ name, email: userEmail, role, token });

    // Route
    window.location.href = ROLE_REDIRECT[role];

  } catch (err) {
    showError(err.message || 'Could not reach the server. Try again shortly.');
    setLoading(false);
  }
});

/* ─── Helpers ─── */

function setLoading(state) {
  submitBtn.disabled = state;
  const label   = submitBtn.querySelector('.btn-label');
  const spinner = submitBtn.querySelector('.btn-spinner');
  if (state) {
    label.classList.add('hidden');
    spinner.classList.remove('hidden');
  } else {
    label.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

function showError(msg) {
  errorText.textContent = msg;
  errorBox.classList.remove('hidden');
}

function clearError() {
  errorBox.classList.add('hidden');
  errorText.textContent = '';
}

function saveSession(data) {
  try {
    sessionStorage.setItem('meraki_session', JSON.stringify(data));
    // Also keep in localStorage for persistence across tabs
    localStorage.setItem('meraki_session', JSON.stringify(data));
  } catch (e) {
    console.warn('Could not write to storage:', e);
  }
}

