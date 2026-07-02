const EASTMONEY_TOKEN = 'D43BF722C8E33BDC906FB84D85E326E8';
const REQUEST_TIMEOUT_MS = 6000;
const searchCache = new Map();
const quoteCache = new Map();
let lastRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function requestJsonWithRetry(url, label) {
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < 80) await sleep(80 - elapsed);
    lastRequestAt = Date.now();
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) throw new Error(`${label} HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      await sleep(180 * attempt);
    }
  }
  throw lastError;
}

function round(value, digits = 2) {
  if (!Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function normalizeQuery(value) {
  return String(value || '')
    .replace(/[（(].*?[）)]/g, '')
    .replace(/^(?:再call|继续关注|重点关注|关注|核心标的|相关标的|受益标的|直接供应)/, '')
    .replace(/(?:等|方向|板块|行业|公司|龙头|标的)$/g, '')
    .trim();
}

function isLikelyAStockCode(value) {
  return /^[03468]\d{5}$/.test(String(value || '').trim());
}

function isLikelyStockCandidate({ stockCode, stockName }) {
  if (isLikelyAStockCode(stockCode)) return true;
  const name = normalizeQuery(stockName);
  if (!name || name.length < 2 || name.length > 8) return false;
  if (/[0-9A-Za-z#]/.test(name)) return false;
  if (/[的是在于和及与或、，,。；;]/.test(name)) return false;
  const noisy = [
    '半导体', '芯片', '电子布', '光芯片', '原材料', '上游', '下游', '高端',
    '韩国', '日本', '继续', '关注', '当前', '今年', '客户', '全球', '国内',
    '目前', '以及', '由于', '部分', '相关', '需求', '计划', '市场', '核心',
    '行业', '板块', '设备', '工艺', '集团半导体',
  ];
  if (noisy.some((term) => name.includes(term))) return false;
  const suffixes = [
    '科技', '股份', '电子', '光电', '材料', '通信', '智能', '精密', '电气',
    '集团', '新材', '线缆', '移动', '动力', '航空', '微电', '纳米', '应材',
  ];
  return suffixes.some((suffix) => name.endsWith(suffix));
}

async function searchEastmoneyStock(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;
  if (searchCache.has(normalized)) return searchCache.get(normalized);
  const url = new URL('https://searchapi.eastmoney.com/api/suggest/get');
  url.searchParams.set('input', normalized);
  url.searchParams.set('type', '14');
  url.searchParams.set('token', EASTMONEY_TOKEN);
  const data = await requestJsonWithRetry(url, 'Eastmoney search');
  const rows = data && data.QuotationCodeTable && Array.isArray(data.QuotationCodeTable.Data)
    ? data.QuotationCodeTable.Data
    : [];
  const aStockRows = rows.filter((row) => row && row.Classify === 'AStock' && row.Code && row.QuoteID);
  const exact = aStockRows.find((row) => row.Name === normalized || row.Code === normalized);
  const result = exact || aStockRows[0] || null;
  searchCache.set(normalized, result);
  return result;
}

function secidFromCode(code) {
  const value = String(code || '').trim();
  if (!isLikelyAStockCode(value)) return '';
  return value.startsWith('6') ? `1.${value}` : `0.${value}`;
}

async function fetchEastmoneyQuote(secid) {
  if (!secid) return null;
  if (quoteCache.has(secid)) return quoteCache.get(secid);
  let result = null;
  try {
    const url = new URL('https://push2.eastmoney.com/api/qt/stock/get');
    url.searchParams.set('secid', secid);
    url.searchParams.set('fields', 'f43,f57,f58,f116,f117,f170');
    const data = await requestJsonWithRetry(url, 'Eastmoney quote');
    result = data && data.data ? data.data : null;
  } catch {
    const url = new URL('https://push2.eastmoney.com/api/qt/ulist.np/get');
    url.searchParams.set('secids', secid);
    url.searchParams.set('fields', 'f2,f3,f12,f14,f20,f21');
    const data = await requestJsonWithRetry(url, 'Eastmoney quote fallback');
    const row = data && data.data && Array.isArray(data.data.diff) ? data.data.diff[0] : null;
    result = row ? {
      f43: row.f2,
      f57: row.f12,
      f58: row.f14,
      f116: row.f20,
      f117: row.f21,
      f170: row.f3,
    } : null;
  }
  quoteCache.set(secid, result);
  return result;
}

async function resolveStockMarketCap({ stockCode, stockName }) {
  const normalizedName = normalizeQuery(stockName);
  if (!isLikelyStockCandidate({ stockCode, stockName: normalizedName })) {
    return { status: 'SKIPPED_NOISY_CANDIDATE', query: normalizedName || stockCode || '', marketCapYi: null };
  }

  try {
    let quoteId = stockCode ? secidFromCode(stockCode) : '';
    let resolved = null;
    if (!quoteId) {
      resolved = await searchEastmoneyStock(normalizedName);
      quoteId = resolved ? resolved.QuoteID : '';
    }
    const quote = await fetchEastmoneyQuote(quoteId);
    if (!quote) {
      return { status: 'NOT_FOUND', query: normalizedName || stockCode || '', marketCapYi: null };
    }
    const marketCapYuan = Number(quote.f116);
    return {
      status: Number.isFinite(marketCapYuan) && marketCapYuan > 0 ? 'FOUND' : 'NO_MARKET_CAP',
      source: 'eastmoney',
      quoteId,
      stockCode: String(quote.f57 || (resolved && resolved.Code) || stockCode || ''),
      stockName: String(quote.f58 || (resolved && resolved.Name) || normalizedName || stockName || ''),
      marketCapYi: Number.isFinite(marketCapYuan) && marketCapYuan > 0 ? round(marketCapYuan / 100000000, 2) : null,
      price: Number.isFinite(Number(quote.f43)) ? round(Number(quote.f43) / 100, 2) : null,
      pctChange: Number.isFinite(Number(quote.f170)) ? round(Number(quote.f170) / 100, 2) : null,
    };
  } catch (error) {
    return {
      status: 'ERROR',
      query: normalizedName || stockCode || '',
      marketCapYi: null,
      error: String(error && error.message ? error.message : error).slice(0, 300),
    };
  }
}

module.exports = {
  isLikelyStockCandidate,
  normalizeQuery,
  resolveStockMarketCap,
  searchEastmoneyStock,
  secidFromCode,
};
