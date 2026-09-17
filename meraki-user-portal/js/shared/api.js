/* ============================================================
   MERAKI AUTOCHAIN — API CLIENT
   Centralised fetch wrapper for all backend calls.
   ============================================================ */

const BASE_URL = 'http://localhost:5000/api';

const API = {

  /* Internal: build headers with optional auth token */
  _headers(auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = localStorage.getItem('meraki_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /* Internal: handle response */
  async _handle(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, message: data.message || 'Request failed', data };
    return data;
  },

  /* GET request */
  async get(path, auth = true) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: this._headers(auth)
    });
    return this._handle(res);
  },

  /* POST request */
  async post(path, body = {}, auth = true) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this._headers(auth),
      body: JSON.stringify(body)
    });
    return this._handle(res);
  },

  /* PUT request */
  async put(path, body = {}, auth = true) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: this._headers(auth),
      body: JSON.stringify(body)
    });
    return this._handle(res);
  },

  /* DELETE request */
  async delete(path, body = {}, auth = true) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this._headers(auth),
      body: JSON.stringify(body)
    });
    return this._handle(res);
  },

  /* ── Auth endpoints ── */
  auth: {
    login:   (email, password) => API.post('/auth/login', { email, password }, false),
    profile: ()                => API.get('/auth/me')
  },

  /* ── Vehicle endpoints (user-facing) ── */
  vehicles: {
    list:       ()       => API.get('/vehicles/my'),
    get:        (id)     => API.get(`/vehicles/${id}`),
    passport:   (id)     => API.get(`/vehicles/${id}/passport`),
    history:    (id)     => API.get(`/vehicles/${id}/history`),
    create:     (data)   => API.post('/vehicles', data)
  },

  /* ── Sharing endpoints ── */
  sharing: {
    generate: (vehicleId) => API.post(`/vehicles/${vehicleId}/share`),
    revoke:   (code)      => API.post(`/sharing/revoke`, { code }),
    list:     (vehicleId) => API.get(`/vehicles/${vehicleId}/shares`),
    listAll:  ()          => API.get(`/sharing/all`)
  },

  /* ── User profile ── */
  user: {
    profile:        ()       => API.get('/user/profile'),
    updateProfile:  (data)   => API.put('/user/profile', data),
    changePassword: (data)   => API.put('/user/password', data),
    revokeAll:      ()       => API.post('/auth/revoke-all'),
    deleteAccount:  (data)   => API.delete('/user/account', data)
  },

  /* ── Public sharing view (no auth) ── */
  publicSharing: {
    view: (code) => API.get(`/sharing/${code}`, false)
  },

  /* ── Public verification (no auth) ── */
  verify: {
    check: (merakiId) => API.get(`/verify/${merakiId}`, false)
  }
};
