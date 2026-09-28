// Vercel Serverless Function: проверка входящей крипто-транзакции в блокчейне

const OWNED_ADDRESSES = {
  btc:  '1AAYys3UZ5DXbwVxXVSYm2Ata4QKb3tBpY',
  ltc:  'LWwunDJj4orQHcof3p3QRotaYAePy2LxKp',
  usdt: 'TDiqxyUUhwPaAFLCFoF7AuLoUMgHpsTbpp',
  eth:  '0x4da96c26e9c25b02761bd12273c6512df661af02',
  sol:  'G3e5W5PaziGFjnJTSqHpqD19BNa18gizFtGbP9mrnTgj',
};

const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const SOL_LAMPORTS = 1_000_000_000;
const MIN_CONFIRMATIONS = 1;
const AMOUNT_TOLERANCE = 0.01;

function amountMatches(actual, expected) {
  return actual >= expected * (1 - AMOUNT_TOLERANCE);
}

async function fetchJSON(url, opts = {}, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...opts,
      headers: { Accept: 'application/json', ...(opts.headers || {}) },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function checkBTC(address, expected, sinceTs) {
  const txs = await fetchJSON(`https://mempool.space/api/address/${address}/txs`);
  for (const tx of txs) {
    const bt = tx.status?.block_time || 0;
    if (bt && bt < sinceTs) continue;
    const confirmed = !!tx.status?.confirmed;
    let sats = 0;
    for (const vout of (tx.vout || [])) {
      if (vout.scriptpubkey_address === address) sats += (vout.value || 0);
    }
    const btc = sats / 1e8;
    if (btc > 0 && amountMatches(btc, expected)) {
      return { confirmed, txid: tx.txid, amount: btc, confirmations: confirmed ? MIN_CONFIRMATIONS : 0 };
    }
  }
  return { confirmed: false };
}

async function checkLTC(address, expected, sinceTs) {
  const txs = await fetchJSON(`https://litecoinspace.org/api/address/${address}/txs`);
  for (const tx of txs) {
    const bt = tx.status?.block_time || 0;
    if (bt && bt < sinceTs) continue;
    const confirmed = !!tx.status?.confirmed;
    let sats = 0;
    for (const vout of (tx.vout || [])) {
      if (vout.scriptpubkey_address === address) sats += (vout.value || 0);
    }
    const ltc = sats / 1e8;
    if (ltc > 0 && amountMatches(ltc, expected)) {
      return { confirmed, txid: tx.txid, amount: ltc, confirmations: confirmed ? MIN_CONFIRMATIONS : 0 };
    }
  }
  return { confirmed: false };
}

async function checkETH(address, expected, sinceTs) {
  const url = `https://eth.blockscout.com/api?module=account&action=txlist&address=${address}&sort=desc`;
  const data = await fetchJSON(url);
  const txs = Array.isArray(data.result) ? data.result : [];
  for (const tx of txs) {
    const ts = Number(tx.timeStamp || 0);
    if (ts && ts < sinceTs) continue;
    if ((tx.to || '').toLowerCase() !== address.toLowerCase()) continue;
    if (tx.isError && tx.isError !== '0') continue;
    const eth = Number(tx.value) / 1e18;
    const confirmations = Number(tx.confirmations || 0);
    if (eth > 0 && amountMatches(eth, expected)) {
      return { confirmed: confirmations >= MIN_CONFIRMATIONS, txid: tx.hash, amount: eth, confirmations };
    }
  }
  return { confirmed: false };
}

async function checkUSDT(address, expected, sinceTs) {
  const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20`
    + `?limit=30&only_to=true&only_confirmed=true&contract_address=${USDT_TRC20_CONTRACT}`;
  const data = await fetchJSON(url);
  const txs = Array.isArray(data.data) ? data.data : [];
  for (const tx of txs) {
    const tsMs = Number(tx.block_timestamp || 0);
    if (tsMs && tsMs < sinceTs * 1000) continue;
    if ((tx.to || '') !== address) continue;
    if (tx.type && tx.type !== 'Transfer') continue;
    const decimals = tx.token_info?.decimals ?? 6;
    const amount = Number(tx.value) / Math.pow(10, decimals);
    if (amount > 0 && amountMatches(amount, expected)) {
      return { confirmed: true, txid: tx.transaction_id, amount, confirmations: MIN_CONFIRMATIONS };
    }
  }
  return { confirmed: false };
}

async function checkSOL(address, expected, sinceTs) {
  const rpc = 'https://api.mainnet-beta.solana.com';
  const sigResp = await fetchJSON(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'getSignaturesForAddress',
      params: [address, { limit: 20 }],
    }),
  });
  const sigs = Array.isArray(sigResp.result) ? sigResp.result : [];
  for (const s of sigs) {
    const bt = Number(s.blockTime || 0);
    if (bt && bt < sinceTs) continue;
    if (s.err) continue;
    const status = s.confirmationStatus;
    if (status && status !== 'confirmed' && status !== 'finalized') continue;
    const txResp = await fetchJSON(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'getTransaction',
        params: [s.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }],
      }),
    });
    const tx = txResp.result;
    if (!tx || !tx.meta || tx.meta.err) continue;
    const keys = tx.transaction?.message?.accountKeys || [];
    const idx = keys.findIndex(k => (k.pubkey || k) === address);
    if (idx < 0) continue;
    const delta = (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / SOL_LAMPORTS;
    if (delta > 0 && amountMatches(delta, expected)) {
      return { confirmed: true, txid: s.signature, amount: delta, confirmations: MIN_CONFIRMATIONS };
    }
  }
  return { confirmed: false };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const { currency, expectedAmount, since } = body;

    if (!currency || !OWNED_ADDRESSES[currency]) {
      return res.status(400).json({ error: 'Unsupported currency' });
    }
    const amount = Number(expectedAmount);
    if (!isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid expectedAmount' });
    }
    const sinceTs = Number(since) || Math.floor(Date.now() / 1000) - 3600;
    const address = OWNED_ADDRESSES[currency];

    let result;
    try {
      if (currency === 'btc')  result = await checkBTC(address, amount, sinceTs);
      else if (currency === 'ltc')  result = await checkLTC(address, amount, sinceTs);
      else if (currency === 'eth')  result = await checkETH(address, amount, sinceTs);
      else if (currency === 'usdt') result = await checkUSDT(address, amount, sinceTs);
      else if (currency === 'sol')  result = await checkSOL(address, amount, sinceTs);
    } catch (e) {
      console.error('[check-payment] explorer error:', currency, e.message);
      return res.status(200).json({ confirmed: false, error: 'explorer_unavailable' });
    }

    return res.status(200).json(result || { confirmed: false });
  } catch (e) {
    console.error('[check-payment] error:', e);
    return res.status(500).json({ error: 'Internal error', details: e.message });
  }
};
