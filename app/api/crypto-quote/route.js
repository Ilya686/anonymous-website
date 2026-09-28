import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const IDS = {
  btc:  'bitcoin',
  ltc:  'litecoin',
  eth:  'ethereum',
  usdt: 'tether',
  sol:  'solana',
};

const DECIMALS = { btc: 8, ltc: 8, eth: 6, usdt: 4, sol: 6 };

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
    if (!IDS[currency]) {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400, headers: CORS });
    }

    const id = IDS[currency];
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=eur`;
    const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return NextResponse.json({ error: 'rate_unavailable' }, { status: 502, headers: CORS });
    }
    const data = await res.json();
    const rate = data?.[id]?.eur;
    if (!rate) {
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
