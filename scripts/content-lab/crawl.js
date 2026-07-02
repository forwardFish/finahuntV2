const { parseArgs, loadSourceList, datedOutputDir, ensureDir, writeJson, hash, isValidUrl, snippet } = require('./common');
const { stripHtml, extractTitle, extractPublishTime, extractBodyText } = require('./extract');
const { extractNewsItems } = require('./news-extract');

async function fetchUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.7',
      },
    });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body, finalUrl: response.url };
  } finally {
    clearTimeout(timeout);
  }
}

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return '';
  }
}

function discoverLinks(html, baseUrl, limit = 30) {
  const links = [];
  const seen = new Set();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of String(html || '').matchAll(anchorPattern)) {
    const href = match[1].replace(/&amp;/g, '&');
    const text = stripHtml(match[2]);
    const url = absoluteUrl(baseUrl, href);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    links.push({ url, href, text: snippet(text, 220) });
    if (links.length >= limit) break;
  }
  return links;
}

const DISCOVERY_SIGNALS = [
  { reason: 'fresh_or_before_open', weight: 18, pattern: /\u4eca\u65e5|\u76d8\u524d|\u5f00\u76d8|\u65e9\u76d8|\u6700\u65b0|\u521a\u521a|\u76d8\u540e|\u665a\u95f4|5\s*\u6708\s*\d+\s*\u65e5/i },
  { reason: 'hard_catalyst', weight: 16, pattern: /IPO|\u8f85\u5bfc|\u653f\u7b56|\u7d27\u6025\u4e8b\u4ef6|\u5927\u4f1a|\u516c\u544a|\u53d1\u5e03|\u8bd5\u70b9|\u843d\u5730|\u91cf\u4ea7/i },
  { reason: 'supply_or_price', weight: 14, pattern: /\u6da8\u4ef7|\u63d0\u4ef7|\u62a5\u4ef7|\u7a3c\u52a8\u7387|\u7f3a\u8d27|\u77ed\u7f3a|\u4ea7\u80fd|\u4ea4\u671f|\u4f9b\u9700/i },
  { reason: 'order_or_revenue', weight: 12, pattern: /\u8ba2\u5355|\u4e2d\u6807|\u4f9b\u8d27|\u5ba2\u6237|\u6536\u5165|\u5229\u6da6|\u4e1a\u7ee9|\u5bfc\u5165/i },
  { reason: 'ai_compute_chain', weight: 10, pattern: /AI|AIDC|\u7b97\u529b|\u6570\u636e\u4e2d\u5fc3|Token|\u670d\u52a1\u5668|\u5149\u6a21\u5757|\u5b58\u50a8|\u534a\u5bfc\u4f53/i },
  { reason: 'company_or_chain', weight: 8, pattern: /\u6838\u5fc3|\u9f99\u5934|\u4ea7\u4e1a\u94fe|\u4e0a\u6e38|\u4f9b\u5e94\u5546|\u6807\u7684|[0-9]{6}/i },
];

const DISCOVERY_NOISE = [
  { reason: 'generic_digest', weight: -8, pattern: /\u7eaa\u8981|\u7814\u62a5\u7cbe\u9009|\u516c\u544a\u5927\u5168|\u8d44\u8baf|\u6295\u7968|\u770b\u597d\u65b9\u5411/i },
  { reason: 'page_chrome', weight: -20, pattern: /\u767b\u5f55|\u6ce8\u518c|\u901a\u77e5|\u79c1\u4fe1|\u4ea4\u6613\u8ba1\u5212/i },
];

function scoreDiscoveryLink(link, index = 0) {
  const text = `${link.text || ''} ${link.url || ''}`;
  const reasons = [];
  let score = Math.max(0, 12 - Math.floor(index / 8));
  for (const rule of DISCOVERY_SIGNALS) {
    if (rule.pattern.test(text)) {
      score += rule.weight;
      reasons.push(rule.reason);
    }
  }
  for (const rule of DISCOVERY_NOISE) {
    if (rule.pattern.test(text)) {
      score += rule.weight;
      reasons.push(rule.reason);
    }
  }
  if (/jiuyangongshe\.com\/a\/[a-z0-9]{8,}/i.test(link.url)) score += 5;
  return { score, reasons };
}

async function fetchJiuyangLinkedItems(html, baseUrl, source, maxDetails = Number(process.env.CONTENT_LAB_JIUYANG_MAX_DETAILS || 48)) {
  const links = discoverLinks(html, baseUrl, 200)
    .filter((link) => /jiuyangongshe\.com\/a\/[a-z0-9]+/i.test(link.url))
    .map((link, index) => ({ ...link, discovery: scoreDiscoveryLink(link, index), discoveryRank: index + 1 }))
    .sort((a, b) => b.discovery.score - a.discovery.score || a.discoveryRank - b.discoveryRank);
  const items = [];
  const seen = new Set();
  for (const link of links) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    try {
      const fetched = await fetchUrl(link.url);
      const title = extractTitle(fetched.body) || link.text || link.url;
      const publishTime = extractPublishTime(fetched.body);
      const bodyText = extractBodyText(fetched.body);
      items.push({
        id: `linked-${String(items.length + 1).padStart(3, '0')}`,
        sourceName: source.sourceName,
        sourceType: source.sourceType,
        sourceUrl: fetched.finalUrl || link.url,
        originalUrl: fetched.finalUrl || link.url,
        title,
        publishTime,
        bodyText,
        bodyPreview: snippet(bodyText, 260),
        status: fetched.ok && bodyText.length >= 120 ? 'CAPTURED' : 'NEEDS_REVIEW',
        httpStatus: fetched.status,
        extractionMethod: 'jiuyangongshe_public_article_detail',
        discoveryScore: link.discovery.score,
        discoveryReasons: link.discovery.reasons,
        discoveryRank: link.discoveryRank,
        sourceHash: hash(`${link.url}\n${title}\n${bodyText}`),
        dedupeHash: hash(`${title}\n${snippet(bodyText, 500)}`),
      });
    } catch (error) {
      items.push({
        id: `linked-${String(items.length + 1).padStart(3, '0')}`,
        sourceName: source.sourceName,
        sourceType: source.sourceType,
        sourceUrl: link.url,
        originalUrl: link.url,
        title: link.text || link.url,
        publishTime: '',
        bodyText: '',
        bodyPreview: '',
        status: 'FETCH_FAILED',
        httpStatus: 0,
        extractionMethod: 'jiuyangongshe_public_article_detail',
        discoveryScore: link.discovery.score,
        discoveryReasons: link.discovery.reasons,
        discoveryRank: link.discoveryRank,
        error: error && error.message ? error.message : String(error),
        sourceHash: hash(`${link.url}\nFETCH_FAILED`),
        dedupeHash: '',
      });
    }
    if (items.length >= maxDetails) break;
  }
  return items;
}

async function fetchBestJiuyangEntry(sourceUrl) {
  const candidates = [];
  try {
    const parsed = new URL(sourceUrl);
    candidates.push(parsed.toString());
    candidates.push(`${parsed.origin}/`);
  } catch {
    candidates.push(sourceUrl);
    candidates.push('https://www.jiuyangongshe.com/');
  }
  const unique = [...new Set(candidates.filter(Boolean))];
  const fetchedPages = [];
  for (const url of unique) {
    try {
      const fetched = await fetchUrl(url);
      const articleLinkCount = discoverLinks(fetched.body, fetched.finalUrl || url, 200)
        .filter((link) => /jiuyangongshe\.com\/a\/[a-z0-9]+/i.test(link.url))
        .length;
      fetchedPages.push({ ...fetched, articleLinkCount });
    } catch (error) {
      fetchedPages.push({
        ok: false,
        status: 0,
        body: '',
        finalUrl: url,
        articleLinkCount: 0,
        error: error && error.message ? error.message : String(error),
      });
    }
  }
  return fetchedPages.sort((a, b) => b.articleLinkCount - a.articleLinkCount || String(b.body || '').length - String(a.body || '').length)[0];
}

async function crawlSource(source, index) {
  const now = new Date().toISOString();
  if (!source.url || !isValidUrl(source.url)) {
    return {
      id: `raw-${String(index + 1).padStart(3, '0')}`,
      source,
      status: 'INVALID_URL',
      error: `Invalid URL: ${source.url}`,
      crawledAt: now,
      bodyText: '',
      title: '',
      sourceHash: '',
      dedupeHash: '',
    };
  }

  try {
    const isJiuyangSource = /jiuyangongshe\.com/i.test(source.url);
    const isJiuyangArticle = /jiuyangongshe\.com\/a\/[a-z0-9]+/i.test(source.url);
    const fetched = isJiuyangSource && !isJiuyangArticle ? await fetchBestJiuyangEntry(source.url) : await fetchUrl(source.url);
    const title = extractTitle(fetched.body) || source.note || source.url;
    const publishTime = extractPublishTime(fetched.body);
    const bodyText = extractBodyText(fetched.body);
    const discoveredLinks = discoverLinks(fetched.body, fetched.finalUrl || source.url, 80);
    const isJiuyang = /jiuyangongshe\.com/i.test(fetched.finalUrl || source.url);
    const linkedItems = isJiuyang ? await fetchJiuyangLinkedItems(fetched.body, fetched.finalUrl || source.url, source) : [];
    const articleBodyCaptured = isJiuyangArticle && bodyText.length >= 300;
    const blocked = !fetched.ok || (!articleBodyCaptured && /登录|验证|captcha|访问过于频繁|forbidden/i.test(bodyText) && !linkedItems.length);
    const status = blocked ? 'BLOCKED_BY_SOURCE' : bodyText.length >= 80 || linkedItems.length ? 'CAPTURED' : 'NEEDS_REVIEW';
    return {
      id: `raw-${String(index + 1).padStart(3, '0')}`,
      source,
      status,
      httpStatus: fetched.status,
      title: title.trim(),
      sourceUrl: fetched.finalUrl || source.url,
      publishTime,
      crawledAt: now,
      bodyText,
      bodyPreview: snippet(bodyText, 260),
      discoveredLinks,
      linkedItems,
      sourceHash: hash(`${source.url}\n${fetched.status}\n${title}\n${bodyText}`),
      dedupeHash: hash(`${title}\n${snippet(bodyText, 500)}`),
      error: blocked ? `Source returned status ${fetched.status} or restricted content` : '',
    };
  } catch (error) {
    return {
      id: `raw-${String(index + 1).padStart(3, '0')}`,
      source,
      status: 'FETCH_FAILED',
      error: error && error.message ? error.message : String(error),
      crawledAt: now,
      bodyText: '',
      title: '',
      sourceHash: hash(`${source.url}\nFETCH_FAILED`),
      dedupeHash: '',
    };
  }
}

async function run(date) {
  const sources = loadSourceList(date).sort((a, b) => a.priority - b.priority);
  const outputDir = datedOutputDir(date);
  ensureDir(outputDir);
  const rawItems = [];
  for (let i = 0; i < sources.length; i += 1) {
    rawItems.push(await crawlSource(sources[i], i));
  }
  const result = {
    date,
    generatedAt: new Date().toISOString(),
    sourceCount: sources.length,
    capturedCount: rawItems.filter((item) => item.status === 'CAPTURED').length,
    reviewCount: rawItems.filter((item) => item.status === 'NEEDS_REVIEW').length,
    blockedCount: rawItems.filter((item) => item.status === 'BLOCKED_BY_SOURCE').length,
    failedCount: rawItems.filter((item) => item.status === 'FETCH_FAILED' || item.status === 'INVALID_URL').length,
    items: rawItems,
  };
  writeJson(`${outputDir}/raw-items.json`, result);
  writeJson(`${outputDir}/extracted-news-items.json`, extractNewsItems(result));
  console.log(JSON.stringify({ status: 'OK', file: `${outputDir}/raw-items.json`, ...result, items: undefined }, null, 2));
  return result;
}

if (require.main === module) {
  const args = parseArgs();
  run(args.date).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { run, crawlSource, discoverLinks, scoreDiscoveryLink, fetchJiuyangLinkedItems, fetchBestJiuyangEntry };
