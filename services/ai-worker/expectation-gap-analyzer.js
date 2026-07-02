const { scanObject, DISCLAIMER } = require('../shared/compliance');

const SIGNAL_RULES = [
  { type: 'price_move', pattern: /\u6da8\u4ef7|\u63d0\u4ef7|\u8c03\u6da8|\u4ef7\u683c\u4e0a\u8c03|\u4ef7\u683c\u53cd\u8f6c|\u62a5\u4ef7\u4e0a\u884c|\u4ef7\u683c\u4e0a\u6da8|\u4ef7\u683c\u4e0a\u884c|price hike|price increase/i },
  { type: 'supply_constraint', pattern: /\u7f3a\u8d27|\u77ed\u7f3a|\u4f9b\u9700\u7f3a\u53e3|\u4f9b\u5e94\u7d27\u5f20|\u4ea4\u671f|\u5e93\u5b58\u4f4e|\u4ea7\u80fd\u4e0d\u8db3|shortage|lead time/i },
  { type: 'utilization', pattern: /\u7a3c\u52a8\u7387|\u4ea7\u80fd\u5229\u7528\u7387|\u5f00\u5de5\u7387|utilization/i },
  { type: 'order', pattern: /\u8ba2\u5355|\u5728\u624b\u8ba2\u5355|\u65b0\u589e\u8ba2\u5355|\u4f9b\u8d27|\u8ba4\u8bc1|\u5bfc\u5165|\u51fa\u8d27|order|shipment/i },
  { type: 'future_event', pattern: /\u8d22\u62a5|\u5b9a\u671f\u62a5\u544a|\u4e1a\u7ee9\u9884\u544a|\u516c\u544a|\u53d1\u5e03\u4f1a|\u884c\u4e1a\u4f1a\u8bae|\u5927\u4f1a|\u62db\u80a1\u4e66|\u5c06\u4e8e|\u5b9a\u4e8e|report|conference|filing/i },
  { type: 'demand', pattern: /AI\u670d\u52a1\u5668|AI\u7b97\u529b|\u7b97\u529b\u9700\u6c42|\u670d\u52a1\u5668\u9700\u6c42|\u6570\u636e\u4e2d\u5fc3\u9700\u6c42|AIDC|\u8f66\u89c4\u9700\u6c42|\u9ad8\u7aef\u9700\u6c42|server demand|AI server/i },
];

function compactText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function contextSnippet(text, index, length) {
  const compact = compactText(text);
  const safeIndex = Math.max(0, Math.min(index, compact.length));
  const start = Math.max(0, safeIndex - Math.floor(length / 2));
  return compact.slice(start, start + length);
}

function findSignalEvidence(rule, item) {
  const title = item.title || '';
  const bodyText = item.bodyText || '';
  const text = compactText(`${title}\n${bodyText}`);
  const match = rule.pattern.exec(text);
  if (!match) return null;
  const evidenceQuote = contextSnippet(text, match.index, 320);
  return {
    matchedTerm: match[0],
    evidenceQuote,
  };
}

function scoreFromSignals(types) {
  const unique = new Set(types);
  return {
    changeReality: unique.has('price_move') || unique.has('utilization') ? 78 : 55,
    changeDirection: unique.has('price_move') || unique.has('demand') ? 76 : 50,
    sustainability: unique.has('supply_constraint') && unique.has('demand') ? 72 : 48,
    transmissionPath: unique.has('order') || unique.has('demand') ? 70 : 45,
    recognitionGap: 55,
    catalystTimeline: unique.has('future_event') ? 72 : 46,
  };
}

function detectSignals(item) {
  return SIGNAL_RULES
    .map((rule) => ({ rule, evidence: findSignalEvidence(rule, item) }))
    .filter((result) => result.evidence)
    .map((result, index) => ({
      id: `live-signal-${item.id}-${index + 1}`,
      sourceItemId: item.id,
      type: result.rule.type,
      signal: `${item.title} contains ${result.rule.type} signal near "${result.evidence.matchedTerm}"`,
      matchedTerm: result.evidence.matchedTerm,
      evidenceQuote: result.evidence.evidenceQuote,
      whyEarly: 'Captured from a public page. It must be cross-checked with announcements, financials, prices, or industry data before becoming a publishable conclusion.',
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      publishTime: item.publishTime,
      status: item.status === 'CAPTURED' ? 'NEEDS_REVIEW' : item.status,
    }));
}

function buildEvidenceMatrix(signals, captured) {
  const sourceMap = new Map(captured.map((item) => [item.id, item]));
  return signals.map((signal, index) => {
    const source = sourceMap.get(signal.sourceItemId) || {};
    return {
      id: `live-evidence-${index + 1}`,
      cardId: 'live-eg-001',
      claim: `Public crawl detected ${signal.type} signal; keep as candidate until cross-checked.`,
      rawEvidence: signal.evidenceQuote || source.bodyPreview || source.title || '',
      sourceName: signal.sourceName || source.sourceName || '',
      sourceUrl: signal.sourceUrl || source.sourceUrl || '',
      evidenceType: signal.type,
      evidenceLevel: signal.status === 'NEEDS_REVIEW' ? 'weak_to_medium' : 'weak',
      inference: 'The signal may indicate an industry variable change, but company transmission and market-recognition gap are not proven by this page alone.',
      inferenceRisk: 'Single-source public text can be stale, duplicated, promotional, or disconnected from A-share company earnings.',
      missingEvidence: 'Need original announcement or report, date confirmation, company revenue exposure, order/pricing proof, market reaction data, and a near-term catalyst.',
      confidenceImpact: 'review_required',
    };
  });
}

function analyzeLiveCrawl(crawlResult) {
  const captured = (crawlResult.items || []).filter((item) => item.status === 'CAPTURED');
  const signals = captured.flatMap(detectSignals);
  const types = [...new Set(signals.map((signal) => signal.type))];
  if (!signals.length) {
    return {
      status: captured.length ? 'PASS_WITH_REVIEW_ITEMS' : 'BLOCKED_BY_SOURCE',
      cards: [],
      leadingSignals: [],
      evidenceMatrix: [],
      reviewItems: captured.length ? ['captured pages did not contain expectation-gap signal keywords'] : ['no public pages captured'],
      compliance: { status: 'passed', blockedTerms: [], disclaimer: DISCLAIMER },
    };
  }
  const scoreBreakdown = scoreFromSignals(types);
  const expectationGapScore = Math.round(Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0) / 6);
  const card = {
    id: 'live-eg-001',
    themeName: 'Public crawl expectation-gap candidate',
    title: 'Public crawl expectation-gap candidate card',
    summary: 'The public page contains price, supply, order, demand, or event signals. It remains a review candidate and is not promoted to a firm conclusion.',
    status: 'NEEDS_REVIEW',
    predictionTypes: types,
    expectationGapScore,
    confidence: 'low',
    scoreBreakdown,
    inferenceChain: ['public signal appears', 'industry variable may be changing', 'company transmission still needs mapping', 'announcement/price/financial evidence must verify'],
    conclusion: 'Candidate signal found in public crawl. More evidence is required for A-share company mapping and market-recognition gap.',
    marketNotFullyPricedEvidence: ['Realtime quote, broker-report density, exchange Q&A, and media-diffusion data are not connected in v1, so confidence is reduced.'],
    sourceItemIds: captured.map((item) => item.id),
  };
  const evidenceMatrix = buildEvidenceMatrix(signals, captured);
  const blockedTerms = scanObject({ card, signals, evidenceMatrix });
  return {
    status: blockedTerms.length ? 'FAIL' : 'PASS_WITH_REVIEW_ITEMS',
    cards: [card],
    leadingSignals: signals,
    evidenceMatrix,
    reviewItems: ['live crawl card requires editor review before publish'],
    compliance: { status: blockedTerms.length ? 'blocked' : 'passed', blockedTerms, disclaimer: DISCLAIMER },
  };
}

function validateExpectationGapData(db) {
  const issues = [];
  for (const card of db.expectationGapCards || []) {
    const scoreFields = ['changeReality', 'changeDirection', 'sustainability', 'transmissionPath', 'recognitionGap', 'catalystTimeline'];
    for (const field of scoreFields) {
      const value = Number(card.scoreBreakdown && card.scoreBreakdown[field]);
      if (!Number.isFinite(value) || value < 0 || value > 100) issues.push(`${card.id}.${field}`);
    }
    const companies = (db.companyTransmissions || []).filter((company) => company.cardId === card.id);
    const evidenceRows = (db.evidenceMatrix || []).filter((row) => row.cardId === card.id);
    if (!companies.length) issues.push(`${card.id}.companyTransmissions`);
    if (!evidenceRows.length) issues.push(`${card.id}.evidenceMatrix`);
    for (const row of evidenceRows) {
      if (!row.claim || !row.rawEvidence || !row.evidenceLevel || !row.inference || !row.inferenceRisk || !row.missingEvidence) {
        issues.push(`${row.id}.requiredEvidenceMatrix`);
      }
    }
    for (const company of companies) {
      if (!company.evidenceTier || !company.revenueTransmission || !company.falsificationSignal) {
        issues.push(`${company.id}.requiredReasoning`);
      }
    }
    const types = card.predictionTypes || [];
    if (card.id === 'eg-mlcc-001' && (!types.includes('price_move') || !types.includes('supply_constraint'))) {
      issues.push('eg-mlcc-001.predictionTypes');
    }
  }
  return { status: issues.length ? 'HARD_FAIL' : 'PASS', issues };
}

module.exports = { analyzeLiveCrawl, validateExpectationGapData };
