// Vercel Serverless Function: EUR → crypto quote с fallback между провайдерами

const DECIMALS = { btc: 8, ltc: 8, eth: 6, usdt: 4, sol: 6 };

const IDS = {
  coingecko:   { btc: 'bitcoin',    ltc: 'litecoin',    eth: 'ethereum',   usdt: 'tether',    sol: 'solana' },
  coinpaprika: { btc: 'btc-bitcoin', ltc: 'ltc-litecoin', eth: 'eth-ethereum', usdt: 'usdt-tether', sol: 'sol-solana' },
  coinbase:    { btc: 'BTC',        ltc: 'LTC',         eth: 'ETH',        usdt: 'USDT',      sol: 'SOL' },
  kraken:      { btc: 'XBTEUR',     ltc: 'LTCEUR',      eth: 'ETHEUR',     usdt: 'USDTEUR',   sol: 'SOLEUR' },
};

async function fetchJson(url, timeoutMs = 4500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      cache: 'no-store',
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'anonymous-services/1.0' },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function rateFromCoinGecko(c) {
  const id = IDS.coingecko[c];
  const d = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=eur`);
  const r = d?.[id]?.eur;
  if (!(r > 0)) throw new Error('no price');
  return r;
}
async function rateFromCoinPaprika(c) {
  const id = IDS.coinpaprika[c];
  const d = await fetchJson(`https://api.coinpaprika.com/v1/tickers/${id}?quotes=EUR`);
  const r = d?.quotes?.EUR?.price;
  if (!(r > 0)) throw new Error('no price');
  return r;
}
async function rateFromCoinbase(c) {
  const t = IDS.coinbase[c];
  const d = await fetchJson(`https://api.coinbase.com/v2/exchange-rates?currency=${t}`);
  const r = Number(d?.data?.rates?.EUR);
  if (!(r > 0)) throw new Error('no price');
  return r;
}
async function rateFromKraken(c) {
  const p = IDS.kraken[c];
  const d = await fetchJson(`https://api.kraken.com/0/public/Ticker?pair=${p}`);
  if (Array.isArray(d?.error) && d.error.length) throw new Error(d.error.join(', '));
  const first = Object.keys(d?.result || {})[0];
  const price = Number(d?.result?.[first]?.c?.[0]);
  if (!(price > 0)) throw new Error('no price');
  return price;
}

async function getEurRate(currency) {
  const attempts = [
    ['coinpaprika', () => rateFromCoinPaprika(currency)],
    ['kraken',      () => rateFromKraken(currency)],
    ['coinbase',    () => rateFromCoinbase(currency)],
    ['coingecko',   () => rateFromCoinGecko(currency)],
  ];
  const wrapped = attempts.map(([name, fn]) =>
    fn().then(rate => ({ name, rate }))
        .catch(e => Promise.reject({ name, message: e?.message || String(e) }))
  );
  try {
    const winner = await Promise.any(wrapped);
    console.log(`[crypto-quote] ${currency}=${winner.rate} via ${winner.name}`);
    return winner.rate;
  } catch (agg) {
    const list = (agg?.errors || []).map(e => `${e.name}:${e.message}`).join(' | ');
    console.error(`[crypto-quote] ${currency} all providers failed: ${list}`);
    throw new Error('all_sources_failed');
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

  try {
    const eur = Number(req.query?.eur);
    const currency = String(req.query?.currency || '').toLowerCase();
    if (!isFinite(eur) || eur <= 0) return res.status(400).json({ error: 'Invalid eur amount' });
    if (!IDS.coingecko[currency])   return res.status(400).json({ error: 'Unsupported currency' });

    let rate;
    try {
      rate = await getEurRate(currency);
    } catch (e) {
      return res.status(502).json({ error: 'rate_unavailable', details: e.message });
    }

    const base = eur / rate;
    const decimals = DECIMALS[currency];
    const factor = Math.pow(10, decimals);
    const jitter = (Math.floor(Math.random() * 900) + 100) / Math.pow(10, decimals + 2);
    const amount = Math.round((base + jitter) * factor) / factor;

    return res.status(200).json({
      currency, eur, rate, amount, decimals,
      createdAt: Math.floor(Date.now() / 1000),
    });
  } catch (e) {
    console.error('[crypto-quote] fatal:', e);
    return res.status(500).json({ error: 'Internal error', details: e.message });
  }
};
