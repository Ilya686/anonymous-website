import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const COINGECKO_IDS = {
  btc: 'bitcoin', ltc: 'litecoin', eth: 'ethereum', usdt: 'tether', sol: 'solana',
};
const COINBASE_TICKER = {
  btc: 'BTC', ltc: 'LTC', eth: 'ETH', usdt: 'USDT', sol: 'SOL',
};
const BINANCE_SYMBOL = {
  btc: 'BTCEUR', ltc: 'LTCEUR', eth: 'ETHEUR', usdt: 'EURUSDT', sol: 'SOLEUR',
};

const DECIMALS = { btc: 8, ltc: 8, eth: 6, usdt: 4, sol: 6 };

async function fetchJson(url, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      cache: 'no-store',
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) throw new Error(`${url} → ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function rateFromCoinGecko(currency) {
  const id = COINGECKO_IDS[currency];
  const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=eur`);
  const r = data?.[id]?.eur;
  if (!r || !isFinite(r)) throw new Error('coingecko: no rate');
  return r;
}

async function rateFromCoinbase(currency) {
  const t = COINBASE_TICKER[currency];
  const data = await fetchJson(`https://api.coinbase.com/v2/prices/${t}-EUR/spot`);
  const r = Number(data?.data?.amount);
  if (!r || !isFinite(r)) throw new Error('coinbase: no rate');
  return r;
}

async function rateFromBinance(currency) {
  const sym = BINANCE_SYMBOL[currency];
  const data = await fetchJson(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`);
  const price = Number(data?.price);
  if (!price || !isFinite(price)) throw new Error('binance: no rate');
  // Для USDT у Binance пара EURUSDT (сколько USDT за 1 EUR)
  if (currency === 'usdt') return price;
  return price;
}

async function getEurRate(currency) {
  const sources = [
    () => rateFromCoinGecko(currency),
    () => rateFromCoinbase(currency),
    () => rateFromBinance(currency),
  ];
  const errors = [];
  for (const src of sources) {
    try {
      const rate = await src();
      if (rate > 0) return rate;
    } catch (e) {
      errors.push(e.message);
    }
  }
  throw new Error(`all sources failed: ${errors.join('; ')}`);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eur = Number(searchParams.get('eur'));
    const currency = (searchParams.get('currency') || '').toLowerCase();

    if (!isFinite(eur) || eur <= 0) {
      return NextResponse.json({ error: 'Invalid eur amount' }, { status: 400, headers: CORS });
    }
    if (!COINGECKO_IDS[currency]) {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400, headers: CORS });
    }

    let rate;
    try {
      rate = await getEurRate(currency);
    } catch (e) {
      console.error('[crypto-quote] rate failure:', currency, e.message);
      return NextResponse.json({ error: 'rate_unavailable' }, { status: 502, headers: CORS });
    }

    const base = eur / rate;
    const decimals = DECIMALS[currency];
    const factor = Math.pow(10, decimals);
    const jitter = (Math.floor(Math.random() * 900) + 100) / Math.pow(10, decimals + 2);
    const amount = Math.round((base + jitter) * factor) / factor;

    return NextResponse.json({
      currency,
      eur,
      rate,
      amount,
      decimals,
      createdAt: Math.floor(Date.now() / 1000),
    }, { status: 200, headers: CORS });
  } catch (e) {
    console.error('[crypto-quote] error:', e);
    return NextResponse.json({ error: 'Internal error', details: e.message }, { status: 500, headers: CORS });
  }
}
