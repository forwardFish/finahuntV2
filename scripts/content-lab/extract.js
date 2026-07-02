const { snippet } = require('./common');

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
    const m = String(html || '').match(pattern);
    if (m) return m[1].replace(/\//g, '-');
  }
  return '';
}

function findJsonStrings(html) {
  const blocks = [];
  const nuxt = String(html || '').match(/window\.__NUXT__\s*=\s*({[\s\S]*?});?\s*<\/script>/i);
  if (nuxt) blocks.push(nuxt[1]);
  const next = String(html || '').match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (next) blocks.push(next[1]);
  for (const m of String(html || '').matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    blocks.push(m[1]);
  }
  return blocks;
}

function collectTextFields(value, out = []) {
  if (!value) return out;
  if (typeof value === 'string') {
    const clean = stripHtml(value);
    if (/[\u4e00-\u9fa5]/.test(clean) && clean.length >= 20) out.push(clean);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectTextFields(item, out));
    return out;
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (/content|article|body|summary|description|text|title|data/i.test(key)) {
        collectTextFields(item, out);
      } else if (typeof item === 'object') {
        collectTextFields(item, out);
      }
    }
  }
  return out;
}

function extractScriptText(html) {
  const texts = [];
  for (const block of findJsonStrings(html)) {
    try {
      collectTextFields(JSON.parse(block), texts);
    } catch {
      const unescaped = block
        .replace(/\\"/g, '"')
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
      collectTextFields(unescaped, texts);
    }
  }
  const nuxtRaw = String(html || '').match(/window\.__NUXT__\s*=\s*([\s\S]*?)<\/script>/i);
  if (nuxtRaw) {
    const payload = nuxtRaw[1];
    const fields = ['content', 'title', 'summary', 'description'];
    for (const field of fields) {
      const pattern = new RegExp(`${field}:\\s*"((?:\\\\.|[^"\\\\]){20,})"`, 'g');
      for (const match of payload.matchAll(pattern)) {
        texts.push(stripHtml(decodeJsString(match[1])));
      }
    }
  }
  return [...new Set(texts)].sort((a, b) => b.length - a.length);
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

function extractBodyText(html) {
  const scriptTexts = extractScriptText(html);
  const article = String(html || '').match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const articleText = article ? stripHtml(article[1]) : '';
  const plainText = stripHtml(html);
  const candidates = [articleText, ...scriptTexts, plainText]
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length >= 20);
  return candidates.sort((a, b) => b.length - a.length)[0] || '';
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[ \t]+([，。；：、！？])/g, '$1')
    .trim();
}

function extractKeywords(text, themes = []) {
  const clean = normalizeText(text);
  const keywordSet = new Set();
  for (const theme of themes) {
    if (theme.name && clean.includes(theme.name)) keywordSet.add(theme.name);
    for (const tag of theme.tags || []) {
      if (tag && clean.includes(tag)) keywordSet.add(tag);
    }
  }
  const financeWords = ['政策', '公告', '订单', '产能', '价格', '出口', '算力', '机器人', '低空', '储能', '光伏', '半导体', 'AI'];
  financeWords.forEach((word) => {
    if (clean.includes(word)) keywordSet.add(word);
  });
  return [...keywordSet].slice(0, 16);
}

function extractEntities(text, companies = []) {
  const clean = normalizeText(text);
  return companies
    .filter((company) => company.name && clean.includes(company.name))
    .map((company) => ({
      companyId: company.id,
      companyName: company.name,
      stockCode: company.code || '',
      industry: company.industry || '',
    }));
}

function summarize(text) {
  const clean = normalizeText(text);
  const sentence = clean.split(/[。！？]/).find((part) => part.length >= 18) || clean;
  return snippet(sentence, 220);
}

module.exports = {
  stripHtml,
  decodeJsString,
  extractTitle,
  extractPublishTime,
  extractBodyText,
  normalizeText,
  extractKeywords,
  extractEntities,
  summarize,
};
