document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('verify-btn');
  const input = document.getElementById('meraki-id-input');
  const resultArea = document.getElementById('result-area');
  const recentSearchesEl = document.getElementById('recent-searches');

  // Load recent searches from localStorage
  function loadRecentSearches() {
    try {
      const stored = localStorage.getItem('meraki_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  function saveRecentSearch(id) {
    const recent = loadRecentSearches();
    const filtered = recent.filter(r => r !== id);
    filtered.unshift(id);
    const limited = filtered.slice(0, 5);
    try {
      localStorage.setItem('meraki_recent_searches', JSON.stringify(limited));
    } catch {}
    renderRecentSearches();
  }

  function renderRecentSearches() {
    const recent = loadRecentSearches();
    if (!recent.length) {
      recentSearchesEl.style.display = 'none';
      return;
    }
    recentSearchesEl.style.display = 'block';
    recentSearchesEl.innerHTML = `
      <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:8px;">Recent searches</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${recent.map(id => `
          <button type="button" class="recent-search-btn" data-id="${esc(id)}" style="
            padding:6px 12px; background:var(--bg); border:1px solid var(--border);
            border-radius:var(--radius-sm); font-size:0.8125rem; font-family:var(--font-display);
            color:var(--text-secondary); cursor:pointer; transition:all var(--transition);
          ">${esc(id)}</button>
        `).join('')}
      </div>
    `;

    recentSearchesEl.querySelectorAll('.recent-search-btn').forEach(b => {
      b.addEventListener('click', () => {
        input.value = b.dataset.id;
        input.focus();
        btn.click();
      });
    });
  }

  renderRecentSearches();

  btn.addEventListener('click', async () => {
    const id = input.value.trim().toUpperCase();
    if (!id) return;

    resultArea.style.display = 'block';
    resultArea.innerHTML = '<p>Checking…</p>';

    try {
      const data = await API.verify.check(id);

      resultArea.innerHTML = `
        <div class="verify-result ${data.onChainVerified ? 'verified' : 'unverified'}">
          <h3>${esc(data.make)} ${esc(data.model)} (${data.year})</h3>
          <p>${data.onChainVerified ? '✓ Verified on-chain' : '✗ Not yet verified on-chain'}</p>
          <p>Inspections recorded: ${data.onChain.totalInspections}</p>
          <p>Registered: ${data.onChain.registeredAt ? new Date(data.onChain.registeredAt).toLocaleDateString('en-KE') : '—'}</p>
        </div>
      `;

      saveRecentSearch(id);

    } catch (err) {
      resultArea.innerHTML = `<p>No vehicle found with that Meraki ID.</p>`;
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });

  // Format input as user types (uppercase, auto-format)
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    // Auto-add hyphen after MC
    if (input.value.startsWith('MC') && input.value.length === 2) {
      input.value += '-';
    }
  });
});

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, c =>
    ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[c]));
}