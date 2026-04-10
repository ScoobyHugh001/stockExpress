document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('api-status');

  if (statusEl) {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        statusEl.textContent = `API Status: ${data.status} | Uptime: ${Math.round(data.uptime)}s`;
      })
      .catch(() => {
        statusEl.textContent = 'Unable to reach API.';
      });
  }
});
