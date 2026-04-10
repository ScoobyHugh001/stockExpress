document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('stock-form');
  const input = document.getElementById('ticker-input');
  const errorEl = document.getElementById('stock-error');
  const loadingEl = document.getElementById('stock-loading');
  const quoteCard = document.getElementById('quote-card');
  const candlesSection = document.getElementById('candles-section');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  function hideError() {
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
  }

  function fmt(n) {
    return n == null ? '—' : n.toFixed(2);
  }

  function fmtVolume(n) {
    if (n == null) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  }

  function renderQuote(data) {
    document.getElementById('quote-symbol').textContent = data.symbol;
    document.getElementById('quote-price').textContent = '$' + fmt(data.currentPrice);

    const changeEl = document.getElementById('quote-change');
    const pctEl = document.getElementById('quote-pct');
    const sign = data.change >= 0 ? '+' : '';
    changeEl.textContent = sign + fmt(data.change);
    pctEl.textContent = '(' + sign + fmt(data.percentChange) + '%)';

    const colorClass = data.change >= 0 ? 'positive' : 'negative';
    changeEl.className = colorClass;
    pctEl.className = colorClass;

    document.getElementById('quote-open').textContent = '$' + fmt(data.open);
    document.getElementById('quote-high').textContent = '$' + fmt(data.high);
    document.getElementById('quote-low').textContent = '$' + fmt(data.low);
    document.getElementById('quote-pc').textContent = '$' + fmt(data.previousClose);

    quoteCard.classList.remove('hidden');
  }

  function renderCandles(data) {
    const tbody = document.getElementById('candles-body');
    tbody.innerHTML = '';

    // Show most recent first
    const candles = [...data.candles].reverse();

    candles.forEach((c) => {
      const row = document.createElement('tr');
      row.innerHTML =
        `<td>${c.date}</td>` +
        `<td>$${fmt(c.open)}</td>` +
        `<td>$${fmt(c.high)}</td>` +
        `<td>$${fmt(c.low)}</td>` +
        `<td>$${fmt(c.close)}</td>` +
        `<td>${fmtVolume(c.volume)}</td>`;
      tbody.appendChild(row);
    });

    candlesSection.classList.remove('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    quoteCard.classList.add('hidden');
    candlesSection.classList.add('hidden');
    loadingEl.classList.remove('hidden');

    const symbol = input.value.trim().toUpperCase();
    if (!symbol) return;

    try {
      const [quoteRes, candleRes] = await Promise.all([
        fetch(`/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`),
        fetch(`/api/stocks/candles?symbol=${encodeURIComponent(symbol)}`),
      ]);

      const quoteData = await quoteRes.json();
      if (!quoteRes.ok) {
        showError(quoteData.error || 'Failed to fetch quote');
        loadingEl.classList.add('hidden');
        return;
      }
      renderQuote(quoteData);

      const candleData = await candleRes.json();
      if (candleRes.ok && candleData.candles) {
        renderCandles(candleData);
      }
    } catch {
      showError('Network error. Please try again.');
    } finally {
      loadingEl.classList.add('hidden');
    }
  });
});
