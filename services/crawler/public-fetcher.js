const crypto = require('node:crypto');

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function snippet(text, length = 260) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, length);
}

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
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function decodeJsString(value) {
  return String(value || '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, ' ');
}

function extractTitle(html) {
  const og = String(html || '').match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og) return decodeEntities(og[1]).trim();
  const title = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return title ? stripHtml(title[1]).trim() : '';
}

function extractPublishTime(html) {
  const patterns = [
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']pubdate["'][^>]+content=["']([^"']+)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i,
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)/,
  ];
  for (const pattern of patterns) {
    const match = String(html || '').match(pattern);
    if (match) return match[1].replace(/\//g, '-');
  }
  return '';
}

function extractScriptText(html) {
  const texts = [];
  const raw = String(html || '');
  const nuxt = raw.match(/window\.__NUXT__\s*=\s*([\s\S]*?)<\/script>/i);
  if (nuxt) {
    for (const field of ['content', 'summary', 'description', 'title']) {
      const pattern = new RegExp(`${field}:\\s*"((?:\\\\.|[^"\\\\]){20,})"`, 'g');
      for (const match of nuxt[1].matchAll(pattern)) {
        const text = stripHtml(decodeJsString(match[1]));
        if (/[\u4e00-\u9fa5]/.test(text) && text.length >= 20) texts.push(text);
      }
    }
  }
  const next = raw.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (next) {
    const text = stripHtml(next[1]);
    if (text.length >= 20) texts.push(text);
  }
  return [...new Set(texts)].sort((a, b) => b.length - a.length);
}

function extractBodyText(html) {
  const article = String(html || '').match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const articleText = article ? stripHtml(article[1]) : '';
  const plainText = stripHtml(html);
  const candidates = [articleText, ...extractScriptText(html), plainText]
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length >= 20);
  return candidates.sort((a, b) => b.length - a.length)[0] || '';
}

async function fetchPublicPage(source, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.7',
      },
    });
    const html = await response.text();
    const title = extractTitle(html) || source.note || source.url;
    const publishTime = extractPublishTime(html);
    const bodyText = extractBodyText(html);
    const restricted = /登录|验证|captcha|forbidden|访问过于频繁|403/i.test(bodyText) && bodyText.length < 800;
    const status = !response.ok || restricted
      ? 'BLOCKED_BY_SOURCE'
      : bodyText.length >= 120
        ? 'CAPTURED'
        : 'NEEDS_REVIEW';
    return {
      id: source.id,
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      sourceUrl: response.url || source.url,
      originalUrl: source.url,
      title: title.trim(),
      publishTime,
      bodyText,
      bodyPreview: snippet(bodyText),
      extractionMethod: /jiuyangongshe\.com/i.test(source.url)
        ? 'jiuyangongshe_nuxt_payload_or_html'
        : 'public_html_or_script_payload',
      status,
      httpStatus: response.status,
      error: status === 'BLOCKED_BY_SOURCE' ? `Source returned ${response.status} or restricted content` : '',
      sourceHash: hash(`${source.url}\n${response.status}\n${title}\n${bodyText}`),
    };
  } catch (error) {
    return {
      id: source.id,
      sourceName: source.sourceName,
      sourceType: source.sourceType,
      sourceUrl: source.url,
      originalUrl: source.url,
      title: source.note || source.url,
      publishTime: '',
      bodyText: '',
      bodyPreview: '',
      extractionMethod: 'public_html_or_script_payload',
      status: error && error.name === 'AbortError' ? 'BLOCKED_BY_SOURCE' : 'FETCH_FAILED',
      httpStatus: 0,
      error: error && error.message ? error.message : String(error),
      sourceHash: hash(`${source.url}\nFETCH_FAILED`),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function crawlExpectationGapSources(sources) {
  const enabled = (sources || []).filter((source) => source.enabled !== false && source.url).sort((a, b) => (a.priority || 100) - (b.priority || 100));
  const items = [];
  for (const source of enabled) {
    items.push(await fetchPublicPage(source));
  }
  return {
    generatedAt: new Date().toISOString(),
    sourceCount: enabled.length,
    capturedCount: items.filter((item) => item.status === 'CAPTURED').length,
    reviewCount: items.filter((item) => item.status === 'NEEDS_REVIEW').length,
    blockedCount: items.filter((item) => item.status === 'BLOCKED_BY_SOURCE').length,
    failedCount: items.filter((item) => item.status === 'FETCH_FAILED').length,
    items,
  };
}

module.exports = { fetchPublicPage, crawlExpectationGapSources, extractBodyText };
