const crypto = require('node:crypto');
const { DISCLAIMER } = require('../shared/compliance');

function round(value, digits = 2) {
  if (!Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value)));
}

function compactText(value, length = 900) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, length);
}

function stockKey(row) {
  const code = String(row.stockCode || '').trim();
  const name = String(row.stockName || '').trim();
  return code || name || crypto.createHash('sha1').update(String(row.sourceUrl || row.theme || '')).digest('hex').slice(0, 12);
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function countMatchedGroups(text, groups) {
  return groups.reduce((sum, group) => sum + (includesAny(text, group.terms) ? 1 : 0), 0);
}

function marketCapFactor(marketCapYi) {
  const cap = Number(marketCapYi);
  if (!Number.isFinite(cap) || cap <= 0) return -8;
  if (cap <= 80) return 14;
  if (cap <= 150) return 10;
  if (cap <= 300) return 6;
  if (cap <= 600) return 2;
  if (cap <= 1200) return -3;
  return -8;
}

function marketCapChangeFactor(changePct) {
  const pct = Number(changePct);
  if (!Number.isFinite(pct)) return 0;
  return clamp(-pct * 40, -18, 18);
}

function previousSnapshotFor(stockId, analysisDate, historicalRows = []) {
  const candidates = historicalRows
    .filter((row) => row.stockId === stockId && row.analysisDate && row.analysisDate < analysisDate && Number.isFinite(Number(row.marketCapYi)))
    .sort((a, b) => String(b.analysisDate).localeCompare(String(a.analysisDate)));
  return candidates[0] || null;
}

const SIGNAL_GROUPS = [
  { name: 'order', label: '\u8ba2\u5355/\u5408\u540c', terms: ['\u8ba2\u5355', '\u5408\u540c', '\u4e2d\u6807', '\u91c7\u8d2d', '\u4ea4\u4ed8'] },
  { name: 'price', label: '\u6da8\u4ef7/\u4f9b\u9700', terms: ['\u6da8\u4ef7', '\u63d0\u4ef7', '\u4f9b\u4e0d\u5e94\u6c42', '\u7f3a\u8d27', '\u7f3a\u53e3', '\u666f\u6c14'] },
  { name: 'capacity', label: '\u4ea7\u80fd/\u91cf\u4ea7', terms: ['\u4ea7\u80fd', '\u91cf\u4ea7', '\u6269\u4ea7', '\u7a3c\u52a8\u7387', '\u4ea7\u7ebf'] },
  { name: 'customer', label: '\u5ba2\u6237/\u4f9b\u5e94\u5546', terms: ['\u5ba2\u6237', '\u4f9b\u5e94\u5546', '\u5bfc\u5165', '\u8ba4\u8bc1', '\u6838\u5fc3\u4f9b\u5e94'] },
  { name: 'earnings', label: '\u6536\u5165/\u5229\u6da6', terms: ['\u6536\u5165', '\u8425\u6536', '\u5229\u6da6', '\u4e1a\u7ee9', '\u51c0\u5229'] },
  { name: 'theme', label: '\u4ea7\u4e1a\u8d8b\u52bf', terms: ['AI', '\u670d\u52a1\u5668', '\u534a\u5bfc\u4f53', '\u5149\u6a21\u5757', '\u56fd\u4ea7\u66ff\u4ee3', '\u5148\u8fdb\u5c01\u88c5'] },
];

const CATALYST_TERMS = [
  '\u516c\u544a', '\u5408\u540c', '\u4e2d\u6807', '\u91cf\u4ea7', '\u6da8\u4ef7', '\u653f\u7b56', 'IPO',
  '\u8fd1\u671f', '\u672c\u6708', '\u4e0b\u534a\u5e74', '\u660e\u5e74', '\u5e74\u5e95', '\u4ea4\u4ed8',
];

const RISK_TERMS = [
  '\u9ad8\u98ce\u9669', '\u4e0d\u786e\u5b9a', '\u7ade\u4e89', '\u8dcc\u4ef7', '\u4f30\u503c\u9ad8',
  '\u5df2\u7ecf\u53cd\u6620', '\u5df2\u5151\u73b0', '\u6da8\u5e45\u8f83\u5927', '\u77ed\u7ebf', '\u98ce\u9669',
];

function extractMoneyMatchesYi(text) {
  const amounts = [];
  const source = String(text || '');
  const pattern = /(\d+(?:\.\d+)?)\s*(\u4e07\u4ebf|\u4ebf|\u4e07\u5143|\u4e07)/g;
  let match;
  while ((match = pattern.exec(source))) {
    const value = Number(match[1]);
    const unit = match[2];
    if (!Number.isFinite(value)) continue;
    let amount = null;
    if (unit === '\u4e07\u4ebf') amount = value * 10000;
    else if (unit === '\u4ebf') amount = value;
    else if (unit === '\u4e07\u5143' || unit === '\u4e07') amount = value / 10000;
    if (amount == null || amount <= 0) continue;
    amounts.push({
      amount,
      context: source.slice(Math.max(0, match.index - 24), Math.min(source.length, pattern.lastIndex + 24)),
    });
  }
  return amounts;
}

function extractMoneyAmountsYi(text, terms) {
  return extractMoneyMatchesYi(text)
    .filter((item) => includesAny(item.context, terms))
    .map((item) => item.amount);
}

function extractExplicitValuationTargetsYi(text, currentCap) {
  const source = String(text || '');
  const targets = [];
  const valuationTerms = /(\u5e02\u503c|\u4f30\u503c|\u76ee\u6807|\u7a7a\u95f4|\u5bf9\u6807)/;
  const amountPattern = /(.{0,12})(\d+(?:\.\d+)?)\s*(\u4e07\u4ebf|\u4ebf)(.{0,12})/g;
  let match;
  while ((match = amountPattern.exec(source))) {
    const context = `${match[1]}${match[4]}`;
    if (!valuationTerms.test(context)) continue;
    const value = Number(match[2]);
    const unit = match[3];
    const amount = unit === '\u4e07\u4ebf' ? value * 10000 : value;
    if (Number.isFinite(amount) && amount > Number(currentCap || 0) * 1.05) targets.push(amount);
  }
  return targets;
}

function scoreValuationMultiple(multiple) {
  const ratio = Number(multiple);
  if (!Number.isFinite(ratio) || ratio <= 1) return 20;
  if (ratio < 1.2) return 25 + ((ratio - 1) / 0.2) * 10;
  if (ratio < 1.5) return 35 + ((ratio - 1.2) / 0.3) * 15;
  if (ratio < 2) return 50 + ((ratio - 1.5) / 0.5) * 18;
  if (ratio < 3) return 68 + ((ratio - 2) / 1) * 17;
  if (ratio < 4) return 85 + ((ratio - 3) / 1) * 8;
  return clamp(93 + Math.min((ratio - 4) * 2, 6), 0, 99);
}

function evidenceStrengthScore({ evidenceCount, sourceCount, baseScore }) {
  return round(clamp(30 + Number(evidenceCount || 0) * 9 + Number(sourceCount || 0) * 12 + clamp(Number(baseScore || 0) - 50, 0, 50) * 0.35), 2);
}

function transmissionScore(text) {
  const matched = countMatchedGroups(text, SIGNAL_GROUPS);
  let score = 25 + matched * 10;
  if (includesAny(text, ['\u6536\u5165', '\u8425\u6536', '\u5229\u6da6', '\u4e1a\u7ee9', '\u51c0\u5229'])) score += 15;
  if (includesAny(text, ['\u8ba2\u5355', '\u5408\u540c', '\u91c7\u8d2d', '\u4e2d\u6807'])) score += 12;
  if (includesAny(text, ['\u6da8\u4ef7', '\u4f9b\u4e0d\u5e94\u6c42', '\u7f3a\u8d27', '\u7f3a\u53e3'])) score += 10;
  return round(clamp(score, 15, 100), 2);
}

function catalystTimingScore(text) {
  const hits = CATALYST_TERMS.filter((term) => text.includes(term)).length;
  let score = 35 + hits * 8;
  if (includesAny(text, ['\u516c\u544a', '\u5408\u540c', '\u4e2d\u6807', '\u91cf\u4ea7'])) score += 12;
  if (includesAny(text, ['\u8fd1\u671f', '\u672c\u6708', '\u4e0b\u534a\u5e74', '\u660e\u5e74'])) score += 8;
  return round(clamp(score, 20, 100), 2);
}

function marketTrendScore(changePct) {
  const pct = Number(changePct);
  if (!Number.isFinite(pct)) return 50;
  if (pct <= -15) return 78;
  if (pct <= -8) return 70;
  if (pct <= -3) return 62;
  if (pct <= 3) return 55;
  if (pct <= 8) return 48;
  if (pct <= 15) return 40;
  return 30;
}

function riskDiscountScore(text, confidence) {
  const hits = RISK_TERMS.filter((term) => text.includes(term)).length;
  const confidencePenalty = Number(confidence) < 55 ? 8 : Number(confidence) < 70 ? 4 : 0;
  return round(clamp(hits * 4 + confidencePenalty, 0, 28), 2);
}

function estimateFutureValuation({ groupRows, currentCap, baseScore, evidenceCount, sourceCount, changePct }) {
  const text = compactText(groupRows.map((row) => [
    row.theme,
    row.currentSituation,
    row.futureExpectation,
    row.scenarioSpace,
    row.catalyst,
    row.risk,
    row.evidence,
  ].join('\n')).join('\n'), 6000);
  const cap = Number(currentCap);
  const matchedSignals = SIGNAL_GROUPS.filter((group) => includesAny(text, group.terms));
  const moneyAmounts = extractMoneyAmountsYi(text, [
    '\u8ba2\u5355', '\u5408\u540c', '\u4e2d\u6807', '\u91c7\u8d2d', '\u6536\u5165', '\u8425\u6536',
    '\u5229\u6da6', '\u51c0\u5229', '\u4ea4\u6613\u989d', '\u91d1\u989d',
  ]);
  const explicitTargets = extractExplicitValuationTargetsYi(text, cap);
  const maxMoney = moneyAmounts.length ? Math.max(...moneyAmounts) : 0;
  const directTarget = explicitTargets.length ? Math.max(...explicitTargets) : null;

  let multiple = 1.05 + clamp((Number(baseScore || 0) - 45) / 55, 0, 1) * 0.75;
  multiple += matchedSignals.length * 0.12;
  multiple += Math.min(Number(evidenceCount || 0) - 1, 4) * 0.08;
  multiple += Math.min(Number(sourceCount || 0) - 1, 3) * 0.08;

  if (cap <= 80) multiple += 0.55;
  else if (cap <= 150) multiple += 0.38;
  else if (cap <= 300) multiple += 0.24;
  else if (cap <= 600) multiple += 0.1;
  else if (cap >= 1500) multiple -= 0.18;
  else if (cap >= 900) multiple -= 0.1;

  if (maxMoney > 0 && cap > 0) {
    const amountToCap = maxMoney / cap;
    if (amountToCap >= 1) multiple = Math.max(multiple, 2.6 + Math.min(amountToCap - 1, 1.4) * 0.4);
    else if (amountToCap >= 0.5) multiple = Math.max(multiple, 2.25);
    else if (amountToCap >= 0.2) multiple = Math.max(multiple, 1.85);
    else if (amountToCap >= 0.08) multiple = Math.max(multiple, 1.55);
  }

  const pct = Number(changePct);
  if (Number.isFinite(pct) && pct > 0.15) multiple -= 0.12;
  if (Number.isFinite(pct) && pct < -0.08) multiple += 0.12;
  multiple = clamp(multiple, 1.02, 5.2);

  let futureValuationYi = directTarget && directTarget > cap ? directTarget : cap * multiple;
  const method = directTarget
    ? '\u6587\u672c\u660e\u793a\u76ee\u6807\u4f30\u503c'
    : maxMoney
      ? '\u4e8b\u4ef6\u91d1\u989d+\u4ea7\u4e1a\u4fe1\u53f7\u500d\u7387\u6cd5'
      : '\u4ea7\u4e1a\u4fe1\u53f7+\u5e02\u503c\u5206\u5c42\u500d\u7387\u6cd5';
  futureValuationYi = round(Math.max(futureValuationYi, cap * 1.02), 2);
  multiple = round(futureValuationYi / cap, 2);

  const confidence = round(clamp(
    42
      + Number(evidenceCount || 0) * 6
      + Number(sourceCount || 0) * 8
      + matchedSignals.length * 4
      + (directTarget ? 16 : 0)
      + (maxMoney ? 8 : 0),
    35,
    92,
  ), 2);
  const valuationScore = round(scoreValuationMultiple(multiple), 2);
  const evidenceScore = evidenceStrengthScore({ evidenceCount, sourceCount, baseScore });
  const transScore = transmissionScore(text);
  const catalystScore = catalystTimingScore(text);
  const trendScore = marketTrendScore(Number.isFinite(pct) ? pct * 100 : null);
  const riskDiscount = riskDiscountScore(text, confidence);
  const compositeScore = round(clamp(
    valuationScore * 0.42
      + evidenceScore * 0.18
      + transScore * 0.15
      + catalystScore * 0.1
      + trendScore * 0.08
      + confidence * 0.07
      - riskDiscount,
    5,
    99,
  ), 2);
  const matchedLabels = matchedSignals.map((group) => group.label).join('/');
  const derivation = [
    `\u5f53\u524d\u5e02\u503c${round(cap, 2)}\u4ebf`,
    `\u63a8\u6f14\u4f30\u503c${futureValuationYi}\u4ebf`,
    `\u7a7a\u95f4${multiple}\u500d`,
    matchedLabels ? `\u5339\u914d\u7ebf\u7d22:${matchedLabels}` : '\u5339\u914d\u7ebf\u7d22:\u5f31',
    maxMoney ? `\u6700\u5927\u6587\u672c\u91d1\u989d${round(maxMoney, 2)}\u4ebf` : '\u672a\u62bd\u53d6\u5230\u660e\u786e\u91d1\u989d',
  ].join('\uff1b');

  return {
    futureValuationYi,
    valuationUpsideMultiple: multiple,
    valuationGapYi: round(futureValuationYi - cap, 2),
    valuationMethod: method,
    valuationConfidence: confidence,
    valuationDerivation: derivation,
    valuationSpaceScore: valuationScore,
    evidenceStrengthScore: evidenceScore,
    transmissionScore: transScore,
    catalystTimingScore: catalystScore,
    marketTrendScore: trendScore,
    riskDiscountScore: riskDiscount,
    compositeScore,
  };
}

async function buildDynamicExpectationSnapshots({ rows, analysisDate, historicalRows = [], resolveMarketCap }) {
  const groups = new Map();
  for (const row of rows || []) {
    const key = stockKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const snapshots = [];
  for (const [key, groupRows] of groups.entries()) {
    const best = [...groupRows].sort((a, b) => Number(b.expectationGapScore || 0) - Number(a.expectationGapScore || 0))[0] || {};
    const market = resolveMarketCap
      ? await resolveMarketCap({ stockCode: best.stockCode, stockName: best.stockName || key })
      : { status: 'SKIPPED', marketCapYi: null };
    if (!market || market.status !== 'FOUND') continue;
    const resolvedCode = market && market.stockCode ? market.stockCode : best.stockCode || '';
    const resolvedName = market && market.stockName ? market.stockName : best.stockName || key;
    const resolvedStockId = resolvedCode || resolvedName || key;
    const previous = previousSnapshotFor(resolvedStockId, analysisDate, historicalRows)
      || previousSnapshotFor(key, analysisDate, historicalRows);
    const currentCap = market ? market.marketCapYi : null;
    const previousCap = previous ? Number(previous.marketCapYi) : null;
    const changePct = Number.isFinite(currentCap) && Number.isFinite(previousCap) && previousCap > 0
      ? round((currentCap - previousCap) / previousCap, 4)
      : null;
    const baseScore = round(
      groupRows.reduce((sum, row) => sum + Number(row.expectationGapScore || 0), 0) / Math.max(groupRows.length, 1),
      2,
    );
    const sourceUrls = unique(groupRows.map((row) => row.sourceUrl));
    const valuation = estimateFutureValuation({
      groupRows,
      currentCap,
      baseScore,
      evidenceCount: groupRows.length,
      sourceCount: sourceUrls.length,
      changePct,
    });
    const dynamicScore = valuation.compositeScore;
    const marketImpact = changePct == null
      ? '\u65e0\u5386\u53f2\u5e02\u503c\uff0c\u5e02\u503c\u8d8b\u52bf\u6309\u4e2d\u6027\u5904\u7406'
      : changePct > 0
        ? `\u5e02\u503c\u8f83\u4e0a\u4e00\u5feb\u7167\u4e0a\u5347${round(changePct * 100, 2)}%\uff0c\u5df2\u6709\u9884\u671f\u53cd\u6620`
        : `\u5e02\u503c\u8f83\u4e0a\u4e00\u5feb\u7167\u4e0b\u964d${Math.abs(round(changePct * 100, 2))}%\uff0c\u9884\u671f\u5dee\u53ef\u80fd\u6269\u5927`;

    const themes = unique(groupRows.map((row) => row.theme));
    const evidenceItems = groupRows.map((row, index) => ({
      index: index + 1,
      sourceUrl: row.sourceUrl,
      title: row.title,
      publishTime: row.publishTime,
      theme: row.theme,
      score: row.expectationGapScore,
      catalyst: row.catalyst,
      evidence: compactText(row.evidence, 500),
    }));
    const uniqueKey = `${resolvedStockId}|${analysisDate}`;

    snapshots.push({
      ...best,
      uniqueKey,
      sourceUrl: sourceUrls.join('\n'),
      theme: themes.join(' / '),
      stockCode: resolvedCode,
      stockName: resolvedName,
      relatedStocks: unique(groupRows.flatMap((row) => String(row.relatedStocks || '').split(/[\u3001\n]/))).join('\u3001'),
      currentSituation: compactText(groupRows.map((row) => row.currentSituation).join('\n'), 1200),
      futureExpectation: compactText(groupRows.map((row) => row.futureExpectation).join('\n'), 1200),
      scenarioSpace: valuation.valuationDerivation,
      catalyst: unique(groupRows.flatMap((row) => String(row.catalyst || '').split(/[\uff1b\n]/))).join('\uff1b'),
      risk: compactText(groupRows.map((row) => row.risk).join('\n'), 1000),
      evidence: compactText(evidenceItems.map((item) => `${item.theme}: ${item.evidence}`).join('\n'), 1800),
      expectationGapScore: dynamicScore,
      baseExpectationGapScore: baseScore,
      dynamicExpectationGapScore: dynamicScore,
      analysisDate,
      stockId: resolvedStockId,
      evidenceCount: groupRows.length,
      sourceCount: sourceUrls.length,
      evidenceJson: JSON.stringify(evidenceItems),
      currentMarketCapYi: currentCap,
      previousMarketCapYi: Number.isFinite(previousCap) ? previousCap : currentCap,
      marketCapChangePct: changePct == null ? 0 : round(changePct * 100, 2),
      marketCapImpact: marketImpact,
      futureValuationYi: valuation.futureValuationYi,
      valuationUpsideMultiple: valuation.valuationUpsideMultiple,
      valuationGapYi: valuation.valuationGapYi,
      valuationDerivation: valuation.valuationDerivation,
      valuationMethod: valuation.valuationMethod,
      valuationConfidence: valuation.valuationConfidence,
      valuationSpaceScore: valuation.valuationSpaceScore,
      evidenceStrengthScore: valuation.evidenceStrengthScore,
      catalystTimingScore: valuation.catalystTimingScore,
      transmissionScore: valuation.transmissionScore,
      riskDiscountScore: valuation.riskDiscountScore,
      compositeScore: valuation.compositeScore,
      scoreExplanation: [
        `\u4f30\u503c\u7a7a\u95f4\u8bc4\u5206${valuation.valuationSpaceScore}`,
        `\u8bc1\u636e\u5f3a\u5ea6${valuation.evidenceStrengthScore}`,
        `\u4e1a\u7ee9\u4f20\u5bfc${valuation.transmissionScore}`,
        `\u50ac\u5316\u65f6\u6548${valuation.catalystTimingScore}`,
        `\u5e02\u503c\u8d8b\u52bf${valuation.marketTrendScore}`,
        `\u98ce\u9669\u6298\u6263${valuation.riskDiscountScore}`,
        `\u7efc\u5408\u8bc4\u5206${valuation.compositeScore}`,
      ].join('\uff1b'),
      marketDataStatus: market ? market.status : 'SKIPPED',
      marketDataSource: market ? market.source || '' : '',
      crawledAt: new Date().toISOString(),
      status: market && market.status === 'FOUND' ? 'VALUATION_GAP_READY' : 'VALUATION_GAP_MARKET_CAP_REVIEW',
      disclaimer: DISCLAIMER,
    });
  }
  return mergeSnapshots(snapshots).sort((a, b) => Number(b.dynamicExpectationGapScore || 0) - Number(a.dynamicExpectationGapScore || 0));
}

const SCORE_FIELDS = [
  'futureValuationYi',
  'valuationUpsideMultiple',
  'valuationGapYi',
  'valuationDerivation',
  'valuationMethod',
  'valuationConfidence',
  'valuationSpaceScore',
  'evidenceStrengthScore',
  'catalystTimingScore',
  'transmissionScore',
  'riskDiscountScore',
  'compositeScore',
  'scoreExplanation',
  'scenarioSpace',
];

function mergeSnapshots(snapshots) {
  const byKey = new Map();
  for (const snapshot of snapshots) {
    const previous = byKey.get(snapshot.uniqueKey);
    if (!previous) {
      byKey.set(snapshot.uniqueKey, snapshot);
      continue;
    }
    const previousEvidence = safeEvidence(previous.evidenceJson);
    const nextEvidence = safeEvidence(snapshot.evidenceJson);
    const mergedEvidence = [...previousEvidence, ...nextEvidence];
    previous.evidenceCount = Number(previous.evidenceCount || 0) + Number(snapshot.evidenceCount || 0);
    previous.sourceUrl = unique([previous.sourceUrl, snapshot.sourceUrl].join('\n').split('\n')).join('\n');
    previous.theme = unique([previous.theme, snapshot.theme].join(' / ').split(' / ')).join(' / ');
    previous.currentSituation = compactText([previous.currentSituation, snapshot.currentSituation].join('\n'), 1200);
    previous.futureExpectation = compactText([previous.futureExpectation, snapshot.futureExpectation].join('\n'), 1200);
    previous.catalyst = unique([previous.catalyst, snapshot.catalyst].join('\uff1b').split(/[\uff1b\n]/)).join('\uff1b');
    previous.risk = compactText([previous.risk, snapshot.risk].join('\n'), 1000);
    previous.evidence = compactText([previous.evidence, snapshot.evidence].join('\n'), 1800);
    previous.evidenceJson = JSON.stringify(mergedEvidence);
    previous.sourceCount = unique(previous.sourceUrl.split('\n')).length;
    previous.baseExpectationGapScore = round(Math.max(Number(previous.baseExpectationGapScore || 0), Number(snapshot.baseExpectationGapScore || 0)), 2);
    if (Number(snapshot.dynamicExpectationGapScore || 0) > Number(previous.dynamicExpectationGapScore || 0)) {
      for (const field of SCORE_FIELDS) previous[field] = snapshot[field];
      previous.dynamicExpectationGapScore = snapshot.dynamicExpectationGapScore;
      previous.expectationGapScore = previous.dynamicExpectationGapScore;
    }
    previous.scoreExplanation = `${previous.scoreExplanation}\uff1b\u5408\u5e76\u540c\u65e5\u91cd\u590d\u8bc1\u636e+${snapshot.evidenceCount || 0}`;
  }
  return [...byKey.values()];
}

function safeEvidence(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

module.exports = {
  buildDynamicExpectationSnapshots,
  marketCapFactor,
  marketCapChangeFactor,
  estimateFutureValuation,
  scoreValuationMultiple,
};
