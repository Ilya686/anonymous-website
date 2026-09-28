import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DECIMALS = { btc: 8, ltc: 8, eth: 6, usdt: 4, sol: 6 };

// Идентификаторы валют у разных провайдеров
const IDS = {
  coingecko:   { btc: 'bitcoin',    ltc: 'litecoin',    eth: 'ethereum',   usdt: 'tether',    sol: 'solana' },
  coinpaprika: { btc: 'btc-bitcoin', ltc: 'ltc-litecoin', eth: 'eth-ethereum', usdt: 'usdt-tether', sol: 'sol-solana' },
  coinbase:    { btc: 'BTC',        ltc: 'LTC',         eth: 'ETH',        usdt: 'USDT',      sol: 'SOL' },
  kraken:      { btc: 'XBTEUR',     ltc: 'LTCEUR',      eth: 'ETHEUR',     usdt: 'USDTEUR',   sol: 'SOLEUR' },
};

async function fetchJson(url, opts = {}, timeoutMs = 4500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      cache: 'no-store',
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'anonymous-services/1.0',
        ...(opts.headers || {}),
      },
      ...opts,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function rateFromCoinGecko(currency) {
  const id = IDS.coingecko[currency];
  const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=eur`);
  const r = data?.[id]?.eur;
  if (!(r > 0)) throw new Error('no price');
  return r;
}

async function rateFromCoinPaprika(currency) {
  const id = IDS.coinpaprika[currency];
  const data = await fetchJson(`https://api.coinpaprika.com/v1/tickers/${id}?quotes=EUR`);
  const r = data?.quotes?.EUR?.price;
  if (!(r > 0)) throw new Error('no price');
  return r;
}

async function rateFromCoinbase(currency) {
  const t = IDS.coinbase[currency];
  // exchange-rates возвращает курсы OT переданной валюты; EUR всегда есть
  const data = await fetchJson(`https://api.coinbase.com/v2/exchange-rates?currency=${t}`);
  const r = Number(data?.data?.rates?.EUR);
  if (!(r > 0)) throw new Error('no price');
  return r;
}

async function rateFromKraken(currency) {
  const pair = IDS.kraken[currency];
  const data = await fetchJson(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
  if (Array.isArray(data?.error) && data.error.length) throw new Error(data.error.join(', '));
  const result = data?.result;
  if (!result || typeof result !== 'object') throw new Error('bad shape');
  const firstKey = Object.keys(result)[0];
  const price = Number(result?.[firstKey]?.c?.[0]);
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
    console.log(`[crypto-quote] ${currency} rate=${winner.rate} via ${winner.name}`);
    return winner.rate;
  } catch (agg) {
    const list = (agg?.errors || []).map(e => `${e.name}:${e.message}`).join(' | ');
    console.error(`[crypto-quote] ${currency} all providers failed: ${list}`);
    throw new Error('all_sources_failed');
  }
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
    if (!IDS.coingecko[currency]) {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400, headers: CORS });
    }

    let rate;
    try {
      rate = await getEurRate(currency);
    } catch (e) {
      return NextResponse.json({ error: 'rate_unavailable', details: e.message }, { status: 502, headers: CORS });
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
    console.error('[crypto-quote] fatal:', e);
    return NextResponse.json({ error: 'Internal error', details: e.message }, { status: 500, headers: CORS });
  }
}
