const { hash, snippet } = require('./common');
const { normalizeText } = require('./extract');

function firstSentence(text, max = 80) {
  const clean = normalizeText(text);
  const sentence = clean.split(/[。！？]/).find((part) => part.trim().length >= 8) || clean;
  return snippet(sentence, max);
}

function visibleMetrics(segment) {
  const read = segment.match(/阅\s*([0-9.]+[万Ww]?)/);
  const comments = segment.match(/评论\s*\(\s*(\d+)\s*\)/);
  const shares = segment.match(/分享\s*\(\s*(\d+)\s*\)/);
  return {
    reads: read ? read[1] : '',
    comments: comments ? Number(comments[1]) : 0,
    shares: shares ? Number(shares[1]) : 0,
  };
}

function extractClsTelegraph(rawItem, maxItems = 60) {
  const text = normalizeText(rawItem.bodyText || '');
  const items = [];
  const pattern = /(\d{2}:\d{2}(?::\d{2})?)\s+([\s\S]*?)(?=\s+\d{2}:\d{2}(?::\d{2})?\s+|加载更多|上证指数|深证成指|$)/g;
  for (const match of text.matchAll(pattern)) {
    const time = match[1];
    const segment = normalizeText(match[2]);
    if (segment.length < 30) continue;
    const bracketTitle = segment.match(/^【([^】]{4,120})】/);
    const title = bracketTitle ? bracketTitle[1] : firstSentence(segment, 90);
    const isPremium = /专享|解锁直达|VIP/.test(segment);
    const isChrome = /关于我们|网站声明|友情链接|举报电话/.test(segment) && segment.length < 160;
    if (!title || isChrome) continue;
    items.push({
      id: `news-${String(items.length + 1).padStart(3, '0')}`,
      rawId: rawItem.id,
      sourceName: rawItem.source.sourceName,
      sourceType: rawItem.source.sourceType,
      sourceUrl: rawItem.sourceUrl,
      originalUrl: rawItem.sourceUrl,
      publishTime: `${rawItem.date || ''} ${time}`.trim(),
      title,
      bodyText: segment,
      bodyPreview: snippet(segment, 260),
      extractionMethod: 'cls_telegraph_time_split',
      status: isPremium ? 'BLOCKED_BY_SOURCE' : 'EXTRACTED',
      blockReason: isPremium ? 'premium_or_locked_item' : '',
      visibleMetrics: visibleMetrics(segment),
      sourceHash: hash(`${rawItem.sourceUrl}\n${time}\n${segment}`),
      dedupeHash: hash(`${title}\n${snippet(segment, 500)}`),
    });
    if (items.length >= maxItems) break;
  }
  return items;
}

function extractGenericItem(rawItem) {
  if (!rawItem.bodyText || rawItem.bodyText.length < 80) return [];
  return [{
    id: 'news-001',
    rawId: rawItem.id,
    sourceName: rawItem.source.sourceName,
    sourceType: rawItem.source.sourceType,
    sourceUrl: rawItem.sourceUrl || rawItem.source.url,
    originalUrl: rawItem.sourceUrl || rawItem.source.url,
    publishTime: rawItem.publishTime || '',
    title: rawItem.title || rawItem.source.note || rawItem.source.url,
    bodyText: rawItem.bodyText,
    bodyPreview: snippet(rawItem.bodyText, 260),
    extractionMethod: 'generic_page_body',
    status: rawItem.status === 'CAPTURED' ? 'EXTRACTED' : rawItem.status,
    blockReason: rawItem.error || '',
    visibleMetrics: {},
    sourceHash: rawItem.sourceHash,
    dedupeHash: rawItem.dedupeHash,
  }];
}

function extractNewsItems(rawResult, options = {}) {
  const maxItems = Number(options.maxItems || 60);
  const seen = new Set();
  const items = [];
  for (const rawItem of rawResult.items || []) {
    if (Array.isArray(rawItem.linkedItems) && rawItem.linkedItems.length) {
      for (const linked of rawItem.linkedItems) {
        const key = linked.dedupeHash || linked.sourceHash;
        if (key && seen.has(key)) continue;
        seen.add(key);
        items.push({
          id: `news-${String(items.length + 1).padStart(3, '0')}`,
          rawId: rawItem.id,
          sourceName: linked.sourceName || rawItem.source.sourceName,
          sourceType: linked.sourceType || rawItem.source.sourceType,
          sourceUrl: linked.sourceUrl,
          originalUrl: linked.originalUrl || linked.sourceUrl,
          publishTime: linked.publishTime || '',
          title: linked.title,
          bodyText: linked.bodyText,
          bodyPreview: linked.bodyPreview,
          extractionMethod: linked.extractionMethod,
          status: linked.status === 'CAPTURED' ? 'EXTRACTED' : linked.status,
          blockReason: linked.error || '',
          visibleMetrics: {},
          discoveryScore: linked.discoveryScore || 0,
          discoveryReasons: linked.discoveryReasons || [],
          discoveryRank: linked.discoveryRank || 0,
          sourceHash: linked.sourceHash,
          dedupeHash: linked.dedupeHash,
        });
        if (items.length >= maxItems) break;
      }
      if (items.length >= maxItems) break;
      continue;
    }
    const sourceUrl = rawItem.sourceUrl || rawItem.source?.url || '';
    let extracted = [];
    if (/cls\.cn\/telegraph/i.test(sourceUrl) || /财联社/.test(rawItem.source?.sourceName || '')) {
      extracted = extractClsTelegraph(rawItem, maxItems);
    } else if (rawItem.status === 'CAPTURED') {
      extracted = extractGenericItem(rawItem);
    }
    for (const item of extracted) {
      const key = item.dedupeHash || item.sourceHash;
      if (key && seen.has(key)) continue;
      seen.add(key);
      items.push({ ...item, id: `news-${String(items.length + 1).padStart(3, '0')}` });
      if (items.length >= maxItems) break;
    }
    if (items.length >= maxItems) break;
  }
  return {
    date: rawResult.date,
    generatedAt: new Date().toISOString(),
    targetMinimum: 20,
    itemCount: items.length,
    extractedCount: items.filter((item) => item.status === 'EXTRACTED').length,
    blockedCount: items.filter((item) => item.status !== 'EXTRACTED').length,
    items,
  };
}

module.exports = { extractNewsItems, extractClsTelegraph, extractGenericItem };
