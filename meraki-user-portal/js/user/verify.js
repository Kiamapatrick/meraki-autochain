document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('verify-btn');
  const input = document.getElementById('meraki-id-input');
  const resultArea = document.getElementById('result-area');

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
    } catch (err) {
      resultArea.innerHTML = `<p>No vehicle found with that Meraki ID.</p>`;
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });
});

function esc(str) {
  return String(str || '').replace(/[&<>\"]/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"'&#39;'"}[c]));
}