const { fetchPublicPage } = require('./public-fetcher');

function compactText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function snippet(text, length = 360) {
  return compactText(text).slice(0, length);
}

function splitSections(text) {
  const clean = compactText(text);
  const marker = /【([^】]{2,40})】/g;
  const matches = [...clean.matchAll(marker)];
  if (!matches.length) return [{ title: '全文', body: clean, order: 1 }];
  const sections = [];
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : clean.length;
    const title = matches[i][1].trim();
    const body = clean.slice(start, end).replace(matches[i][0], '').trim();
    if (body.length >= 40) sections.push({ title, body, order: sections.length + 1 });
  }
  return sections;
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function extractStockCandidates(text) {
  const candidates = [];
  const clean = compactText(text);
  for (const match of clean.matchAll(/(?:核心标的|相关标的|受益标的|重点关注|关注)[:：]([^。；;]+)/g)) {
    const names = match[1]
      .split(/[、,，\s]+/)
      .map((name) => name.replace(/[等。；;]+$/g, '').trim())
      .filter((name) => /^[\u4e00-\u9fa5A-Za-z0-9（）()]{2,12}$/.test(name));
    candidates.push(...names);
  }
  for (const match of clean.matchAll(/\b(?:SH|SZ)?([0368]\d{5})\b/g)) {
    candidates.push(match[1]);
  }
  const companySuffixPattern = /([\u4e00-\u9fa5A-Za-z]{2,10}(?:科技|电子|股份|集团|微电|光电|通信|材料|电气|智能|精密|半导体|芯片|生物|药业|能源|电源|控股))/g;
  for (const match of clean.matchAll(companySuffixPattern)) {
    const name = match[1]
      .replace(/^(?:全球|国内|海外|相关|核心|头部|产业|公司|这个|其中|包括)/, '')
      .replace(/(?:等|相关|方向|板块|行业)$/g, '')
      .trim();
    if (name.length >= 3 && name.length <= 12) candidates.push(name);
  }
  return unique(candidates).slice(0, 30);
}

function articleSummary(bodyText) {
  const sentences = compactText(bodyText).split(/[。！？!?]/).filter((part) => part.length >= 18);
  return snippet(sentences.slice(0, 3).join('。'), 600);
}

async function fetchJiuyangongsheArticle(url) {
  const item = await fetchPublicPage({
    id: 'jiuyangongshe-target',
    sourceName: '韭研公社',
    sourceType: 'public_article',
    url,
  });
  const sections = splitSections(item.bodyText).map((section) => ({
    ...section,
    stockCandidates: extractStockCandidates(`${section.title} ${section.body}`),
    evidencePreview: snippet(section.body, 520),
  }));
  return {
    ...item,
    articleSummary: articleSummary(item.bodyText),
    sections,
    stockCandidates: unique(sections.flatMap((section) => section.stockCandidates)),
  };
}

module.exports = {
  fetchJiuyangongsheArticle,
  splitSections,
  extractStockCandidates,
};
