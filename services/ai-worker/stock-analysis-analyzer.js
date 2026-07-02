const crypto = require('node:crypto');
const { DISCLAIMER, FORBIDDEN_TERMS, scanObject } = require('../shared/compliance');

const SIGNALS = [
  { key: 'price', label: '价格变化', weight: 18, pattern: /涨价|提价|报价上行|价格上调|价格反转|涨幅|猛涨|调涨/i },
  { key: 'supply', label: '供给约束', weight: 16, pattern: /缺口|短缺|产能|扩产|交期|供需|库存低|挤爆|稼动率/i },
  { key: 'demand', label: '需求拉动', weight: 16, pattern: /AI|算力|服务器|数据中心|国产|订单|客户|导入|出货|需求/i },
  { key: 'catalyst', label: '催化事件', weight: 14, pattern: /公告|发布|大会|财报|业绩|指引|更新|政策|中标|合同/i },
  { key: 'transmission', label: '公司传导', weight: 14, pattern: /核心标的|相关标的|厂商|供应商|头部|龙头|产业链|受益/i },
  { key: 'recognition', label: '预期差', weight: 10, pattern: /没跑了|提前定价|没反应|低估|忽视|预期差|刚开始|还没充分/i },
];

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function compactText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function snippet(text, length = 500) {
  return compactText(text).slice(0, length);
}

function sanitizeComplianceText(text) {
  let clean = String(text || '');
  for (const term of FORBIDDEN_TERMS) {
    clean = clean.split(term).join(`[合规过滤:${term.length}字]`);
  }
  return clean;
}

function detectSignals(text) {
  return SIGNALS
    .map((rule) => {
      const match = rule.pattern.exec(text);
      return match ? { ...rule, matchedTerm: match[0] } : null;
    })
    .filter(Boolean);
}

function scoreSection(section) {
  const signals = detectSignals(`${section.title} ${section.body}`);
  const base = 35;
  const score = Math.max(0, Math.min(100, base + signals.reduce((sum, signal) => sum + signal.weight, 0)));
  const confidence = signals.length >= 5 ? 'medium' : signals.length >= 3 ? 'medium_low' : 'low';
  return { score, confidence, signals };
}

function extractCurrentSituation(section, signals) {
  const labels = signals.map((signal) => signal.label).join('、') || '公开文本线索';
  return sanitizeComplianceText(snippet(`${section.title}：当前文本显示${labels}正在形成候选线索。${section.body}`, 520));
}

function extractFutureExpectation(section, signals) {
  const names = signals.map((signal) => signal.label);
  if (names.includes('供给约束') && names.includes('需求拉动')) {
    return '未来预期主要来自需求延续、供给瓶颈、扩产兑现和公司业绩传导，需要继续用公告、订单、价格和财报交叉验证。';
  }
  if (names.includes('催化事件')) {
    return '未来预期主要来自事件催化后的产业链映射，当前仍需验证事件持续性和公司收入弹性。';
  }
  return '未来预期仍处于线索阶段，需要补充产业数据、公司公告、市场价格和成交反馈后再提高置信度。';
}

function inferScenarioSpace(score, confidence) {
  if (confidence === 'medium' && score >= 85) return '高弹性情景：若价格/订单/产能三类证据继续共振，可能形成强主题扩散；反向证据出现则快速降级。';
  if (score >= 70) return '中高弹性情景：若后续公告、报价或订单验证，相关公司可能获得主题和业绩预期的双重重估。';
  if (score >= 55) return '观察情景：已有催化线索，但公司传导或市场认知证据不足，适合先进入跟踪池。';
  return '低置信情景：当前只有单点文本线索，暂不支持强空间判断。';
}

function riskText(signals) {
  const labels = new Set(signals.map((signal) => signal.key));
  const risks = ['单一文章来源可能存在滞后、转述或情绪化表达'];
  if (!labels.has('transmission')) risks.push('公司收入传导链条不足');
  if (!labels.has('catalyst')) risks.push('缺少明确时间催化');
  if (!labels.has('recognition')) risks.push('市场是否充分定价尚未验证');
  return risks.join('；');
}

function stockRowsForSection(article, section) {
  const { score, confidence, signals } = scoreSection(section);
  const rawForbiddenTerms = scanObject(section.body);
  const stocks = section.stockCandidates.length ? section.stockCandidates : [''];
  return stocks.map((stock, index) => {
    const stockCode = /^\d{6}$/.test(stock) ? stock : '';
    const stockName = stockCode ? '' : stock;
    const uniqueKey = hash(`${article.sourceUrl || article.originalUrl}|${section.title}|${stock || 'section'}|${index}`).slice(0, 24);
    const row = {
      uniqueKey,
      sourceUrl: article.sourceUrl || article.originalUrl,
      title: article.title,
      publishTime: article.publishTime || '',
      crawledAt: new Date().toISOString(),
      theme: section.title,
      stockCode,
      stockName,
      relatedStocks: section.stockCandidates.join('、'),
      currentSituation: extractCurrentSituation(section, signals),
      futureExpectation: extractFutureExpectation(section, signals),
      scenarioSpace: inferScenarioSpace(score, confidence),
      catalyst: signals.map((signal) => `${signal.label}:${signal.matchedTerm}`).join('；'),
      expectationGapScore: score,
      confidence,
      risk: rawForbiddenTerms.length
        ? `${riskText(signals)}；原文含${rawForbiddenTerms.length}类高风险措辞，已在落表摘录中做合规过滤`
        : riskText(signals),
      evidence: sanitizeComplianceText(section.evidencePreview || snippet(section.body, 520)),
      status: article.status === 'CAPTURED' ? 'NEEDS_REVIEW' : article.status,
      disclaimer: DISCLAIMER,
    };
    return row;
  });
}

function analyzeJiuyangongsheArticle(article) {
  const usefulSections = (article.sections || []).filter((section) => {
    const signals = detectSignals(`${section.title} ${section.body}`);
    return signals.length >= 2 || section.stockCandidates.length;
  });
  const rowMap = new Map();
  for (const row of usefulSections.flatMap((section) => stockRowsForSection(article, section))) {
    if (!rowMap.has(row.uniqueKey)) rowMap.set(row.uniqueKey, row);
  }
  const rows = [...rowMap.values()];
  const blockedTerms = scanObject(rows);
  return {
    generatedAt: new Date().toISOString(),
    status: blockedTerms.length ? 'FAIL_COMPLIANCE' : rows.length ? 'PASS_WITH_REVIEW_ITEMS' : 'NO_STOCK_ROWS',
    source: {
      title: article.title,
      sourceUrl: article.sourceUrl,
      publishTime: article.publishTime,
      httpStatus: article.httpStatus,
      crawlStatus: article.status,
      bodyLength: String(article.bodyText || '').length,
    },
    summary: article.articleSummary,
    rowCount: rows.length,
    sectionCount: usefulSections.length,
    rows,
    compliance: {
      status: blockedTerms.length ? 'blocked' : 'passed',
      blockedTerms,
      disclaimer: DISCLAIMER,
    },
  };
}

module.exports = {
  analyzeJiuyangongsheArticle,
  detectSignals,
  scoreSection,
};
