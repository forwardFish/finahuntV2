function decodeEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html) {
  return decodeEntities(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function compactText(text, length = 500) {
  return stripHtml(text).replace(/\s+/g, ' ').trim().slice(0, length);
}

function parseDateTime(value) {
  const match = String(value || '').match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return null;
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second}+08:00`);
}

function dayWindow({ endDate = new Date(), days = 7 }) {
  const end = new Date(endDate);
  const endYmd = end.toISOString().slice(0, 10);
  const endAt = new Date(`${endYmd}T23:59:59+08:00`);
  const startAt = new Date(`${endYmd}T00:00:00+08:00`);
  startAt.setUTCDate(startAt.getUTCDate() - (Number(days) - 1));
  return { startAt, endAt };
}

function findLastMatch(text, pattern) {
  const matches = [...String(text || '').matchAll(pattern)];
  return matches.length ? matches[matches.length - 1] : null;
}

function parseAuthorArticlesFromHtml(html, authorUrl) {
  const raw = String(html || '');
  const found = [];
  const seen = new Set();
  for (const match of raw.matchAll(/href=["'](\/a\/[a-z0-9]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const path = match[1];
    const url = new URL(path, authorUrl).toString();
    if (seen.has(url)) continue;
    seen.add(url);
    const before = raw.slice(Math.max(0, match.index - 1400), match.index);
    const dateMatch = findLastMatch(before, /(\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/g);
    const titleMatch = findLastMatch(before, /book-title[\s\S]*?<span>([\s\S]*?)<\/span>/g);
    const publishTime = dateMatch ? dateMatch[1] : '';
    const title = compactText(titleMatch ? titleMatch[1] : '', 120) || compactText(match[2], 80);
    const preview = compactText(match[2], 600);
    found.push({
      url,
      path,
      title,
      publishTime,
      preview,
      publishedAt: parseDateTime(publishTime),
    });
  }
  return found
    .filter((item) => item.url && item.publishTime)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .map((item) => ({
      url: item.url,
      title: item.title,
      publishTime: item.publishTime,
      preview: item.preview,
    }));
}

async function fetchJiuyangongsheAuthorArticles(authorUrl, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(authorUrl, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.7',
      },
    });
    const html = await response.text();
    return {
      authorUrl: response.url || authorUrl,
      httpStatus: response.status,
      htmlLength: html.length,
      articles: parseAuthorArticlesFromHtml(html, response.url || authorUrl),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function filterArticlesByDays(articles, { endDate = new Date(), days = 7 } = {}) {
  const { startAt, endAt } = dayWindow({ endDate, days });
  return (articles || []).filter((article) => {
    const publishedAt = parseDateTime(article.publishTime);
    return publishedAt && publishedAt >= startAt && publishedAt <= endAt;
  });
}

module.exports = {
  fetchJiuyangongsheAuthorArticles,
  parseAuthorArticlesFromHtml,
  filterArticlesByDays,
  parseDateTime,
  dayWindow,
};
