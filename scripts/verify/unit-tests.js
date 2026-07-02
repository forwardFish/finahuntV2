const repo = require('../../services/data/repository');
const { scanObject } = require('../../services/shared/compliance');
const { extractBodyText } = require('../../services/crawler/public-fetcher');
const { analyzeLiveCrawl, validateExpectationGapData } = require('../../services/ai-worker/expectation-gap-analyzer');
const { analyzeJiuyangongsheArticle } = require('../../services/ai-worker/stock-analysis-analyzer');
const { estimateFutureValuation, scoreValuationMultiple } = require('../../services/ai-worker/dynamic-expectation-gap');
const { splitSections, extractStockCandidates } = require('../../services/crawler/jiuyangongshe-fetcher');
const { parseFeishuUrl, toFeishuRow } = require('../jiuyangongshe-to-feishu');
const { scoreDiscoveryLink } = require('../content-lab/crawl');
const { rankNewsItems } = require('../content-lab/analyze');
const { writeResult, fail } = require('./lib');

const db = repo.loadData();
const egDetail = repo.expectationGapCardById('eg-mlcc-001').data;
const nuxtFixture = '<script>window.__NUXT__={data:[{title:"MLCC",content:"AI\\u670d\\u52a1\\u5668\\u9700\\u6c42\\u62c9\\u52a8MLCC\\u4ef7\\u683c\\u548c\\u7a3c\\u52a8\\u7387\\u53d8\\u5316"}]};</script>';
const validation = validateExpectationGapData(db);
const boilerplateLiveAnalysis = analyzeLiveCrawl({
  items: [{
    id: 'fixture-boilerplate',
    status: 'CAPTURED',
    title: '\u516c\u793e\u6bcf\u65e5\u5185\u5bb9\u7cbe\u9009',
    bodyText: '\u4ea4\u6613\u8ba1\u5212\u680f\u76ee\u7b80\u4ecb\uff0c\u6c47\u603b\u5e02\u573a\u70ed\u70b9\u4e2a\u80a1\u548c\u672a\u6765\u770b\u70b9\uff0c\u65b9\u4fbf\u8bb0\u5f55\u6295\u8d44\u8ba1\u5212\u548c\u903b\u8f91\u3002',
    sourceName: 'fixture',
    sourceUrl: 'https://example.test/boilerplate',
    publishTime: '2026-05-19 19:23:47',
  }],
});
const concreteLiveAnalysis = analyzeLiveCrawl({
  items: [{
    id: 'fixture-concrete',
    status: 'CAPTURED',
    title: 'MLCC price signal',
    bodyText: 'AI\u670d\u52a1\u5668\u9700\u6c42\u62c9\u52a8\u9ad8\u7aefMLCC\u6d88\u8017\uff0c\u6d77\u5916\u9f99\u5934\u62a5\u4ef7\u4e0a\u884c\uff0c\u6e20\u9053\u53cd\u9988\u4ea4\u671f\u5ef6\u957f\uff0c\u90e8\u5206\u5382\u5546\u7a3c\u52a8\u7387\u56de\u5347\u3002',
    sourceName: 'fixture',
    sourceUrl: 'https://example.test/concrete',
    publishTime: '2026-05-19 19:23:47',
  }],
});
const companies = egDetail.company_transmissions;
const evidenceMatrix = egDetail.evidence_matrix;
const scoreEvidence = egDetail.score_evidence;
const rankedContentLabItems = rankNewsItems([
  {
    id: 'weak-digest',
    title: '\u76d8\u524d\u7eaa\u8981',
    text: '\u767b\u5f55 \u6ce8\u518c \u4ea4\u6613\u8ba1\u5212 \u901a\u77e5 \u79c1\u4fe1',
    discoveryScore: 0,
    entityCandidates: [],
    keywords: [],
  },
  {
    id: 'strong-catalyst',
    title: '5\u670820\u65e5 \u957f\u6c5f\u5b58\u50a8IPO\u8f85\u5bfc \u534a\u5bfc\u4f53\u4ea7\u4e1a\u94fe\u6838\u5fc3\u516c\u53f8',
    text: '\u653f\u7b56\u50ac\u5316\u548cIPO\u8f85\u5bfc\u5e26\u6765\u4ea7\u4e1a\u94fe\u6620\u5c04\uff0c\u6d89\u53ca\u8ba2\u5355\u3001\u4ea7\u80fd\u3001\u4f9b\u5e94\u5546\u548c688000\u7b49\u516c\u53f8\u7ebf\u7d22\u3002'.repeat(12),
    discoveryScore: 8,
    entityCandidates: [{ companyName: '\u6837\u4f8b\u516c\u53f8' }],
    keywords: ['\u534a\u5bfc\u4f53', 'IPO'],
  },
], '2026-05-20');
const strongDiscoveryScore = scoreDiscoveryLink({
  url: 'https://www.jiuyangongshe.com/a/abc123456',
  text: '5\u670820\u65e5 \u957f\u6c5f\u5b58\u50a8IPO\u8f85\u5bfc \u6838\u5fc3\u4ea7\u4e1a\u94fe',
}).score;
const weakDiscoveryScore = scoreDiscoveryLink({
  url: 'https://www.jiuyangongshe.com/a/def123456',
  text: '\u767b\u5f55 \u6ce8\u518c \u4ea4\u6613\u8ba1\u5212',
}).score;
const jiuyangFixtureSections = splitSections('【先进封装】核心标的：长电科技、通富微电、甬矽电子。AI需求拉动，产能缺口与涨价形成共振，但原文可能出现翻倍空间等高风险措辞。');
const jiuyangFixtureAnalysis = analyzeJiuyangongsheArticle({
  status: 'CAPTURED',
  httpStatus: 200,
  sourceUrl: 'https://www.jiuyangongshe.com/a/fixture',
  originalUrl: 'https://www.jiuyangongshe.com/a/fixture',
  title: 'fixture',
  publishTime: '2026-07-02 08:04:52',
  bodyText: 'fixture',
  articleSummary: 'fixture',
  sections: jiuyangFixtureSections.map((section) => ({
    ...section,
    stockCandidates: extractStockCandidates(`${section.title} ${section.body}`),
    evidencePreview: section.body,
  })),
});
const valuationLowSpaceScore = scoreValuationMultiple(1.2);
const valuationHighSpaceScore = scoreValuationMultiple(3);
const valuationFixture = estimateFutureValuation({
  currentCap: 100,
  baseScore: 80,
  evidenceCount: 2,
  sourceCount: 1,
  changePct: 0,
  groupRows: [{
    theme: '\u6838\u5fc3\u6750\u6599',
    currentSituation: '\u516c\u53f8\u5df2\u8fdb\u5165\u6838\u5fc3\u5ba2\u6237\u4f9b\u5e94\u5546\u4f53\u7cfb',
    futureExpectation: '\u660e\u5e74\u8ba2\u5355\u548c\u91cf\u4ea7\u6709\u671b\u5e26\u6765\u6536\u5165\u653e\u5927\uff0c\u76ee\u6807\u4f30\u503c300\u4ebf',
    catalyst: '\u660e\u5e74\u91cf\u4ea7\u4ea4\u4ed8',
    evidence: '\u5ba2\u6237\u5bfc\u5165\u3001\u8ba2\u5355\u3001\u91cf\u4ea7\u3001\u6536\u5165\u4f20\u5bfc',
  }],
});
const feishuTarget = parseFeishuUrl('https://my.feishu.cn/base/CEo9byodzaH5TOsWMMxco1C5nWf?table=tblGxLd1TUJl5269&view=vewpApMVFy');
let blockedForeignFeishuTarget = false;
try {
  parseFeishuUrl('https://my.feishu.cn/base/KhbEbksLbauw0fssL6EcKAnlnOe?table=tblpXxZ6kHoCbObl&view=vewRH8reta');
} catch {
  blockedForeignFeishuTarget = true;
}
const cases = [];

cases.push({ name: 'home minimum', pass: repo.home().data.today_news.length >= 4 && repo.home().data.hot_themes.length >= 5 });
cases.push({ name: 'theme detail minimum', pass: repo.themeById('theme-001').data.industry_chain_nodes.length >= 5 && repo.themeById('theme-001').data.evidences.length >= 3 && repo.themeById('theme-001').data.related_companies.length >= 2 });
cases.push({ name: 'nuxt script payload extraction', pass: extractBodyText(nuxtFixture).includes('MLCC') && extractBodyText(nuxtFixture).includes('AI') });
cases.push({ name: 'expectation gap schema', pass: validation.status === 'PASS', details: validation.issues });
cases.push({ name: 'mlcc price and supply types', pass: egDetail.card.predictionTypes.includes('price_move') && egDetail.card.predictionTypes.includes('supply_constraint') });
cases.push({ name: 'mlcc inference chain', pass: egDetail.card.inferenceChain.length >= 5 && egDetail.card.inferenceChain.join('->').includes('MLCC') && egDetail.card.inferenceChain.join('->').includes('AI') });
cases.push({ name: 'company reasoning fields', pass: companies.every((company) => company.evidenceTier && company.revenueTransmission && company.falsificationSignal) });
cases.push({ name: 'company ranking acceptance', pass: companies[0].stockCode === '000636' && companies[1].stockCode === '300408' && companies.some((company) => company.stockCode === '002859' && company.includeStatus === 'indirect') && companies.some((company) => company.includeStatus === 'excluded') });
cases.push({ name: 'real public source coverage', pass: egDetail.source_items.length >= 7 && egDetail.source_items.every((item) => /^https?:\/\//.test(item.url)) });
cases.push({ name: 'internal evidence matrix detail', pass: evidenceMatrix.length >= 7 && evidenceMatrix.every((row) => row.claim && row.rawEvidence && row.evidenceLevel && row.inference && row.inferenceRisk && row.missingEvidence) });
cases.push({ name: 'score evidence drives six dimensions', pass: scoreEvidence.length === 6 && scoreEvidence.every((row) => row.dimension && Number.isFinite(Number(row.score)) && row.reason && Array.isArray(row.evidenceIds)) });
cases.push({ name: 'recognition gap is penalized without market data', pass: scoreEvidence.some((row) => row.dimension === 'recognitionGap' && row.missingDataPenalty >= 15) && egDetail.card.scoreBreakdown.recognitionGap < egDetail.card.scoreBreakdown.changeReality });
cases.push({ name: 'model audit is explicit', pass: egDetail.model_audit && egDetail.model_audit.status === 'NOT_CALLED_IN_MAIN_CHAIN' && egDetail.model_audit.whereUsed.includes('没有调用大模型') });
cases.push({ name: 'live analyzer ignores generic content-planning boilerplate', pass: boilerplateLiveAnalysis.leadingSignals.length === 0 && boilerplateLiveAnalysis.cards.length === 0 });
cases.push({ name: 'live analyzer quotes concrete matched evidence', pass: concreteLiveAnalysis.leadingSignals.length >= 3 && concreteLiveAnalysis.leadingSignals.every((signal) => signal.matchedTerm && signal.evidenceQuote && signal.evidenceQuote.length < 360) && concreteLiveAnalysis.evidenceMatrix.every((row) => !row.rawEvidence.includes('\u4ea4\u6613\u8ba1\u5212\u680f\u76ee\u7b80\u4ecb')) });
cases.push({ name: 'content lab ranks catalyst items before weak digest', pass: rankedContentLabItems[0].id === 'strong-catalyst' && rankedContentLabItems[0].selectionReasons.includes('run_date_match') });
cases.push({ name: 'content lab discovery prioritizes catalyst links', pass: strongDiscoveryScore > weakDiscoveryScore });
cases.push({ name: 'jiuyang section split and stock extraction', pass: jiuyangFixtureSections.length === 1 && extractStockCandidates(jiuyangFixtureSections[0].body).includes('\u957f\u7535\u79d1\u6280') });
cases.push({ name: 'jiuyang analysis sanitizes forbidden source terms', pass: jiuyangFixtureAnalysis.rows.length >= 3 && scanObject(jiuyangFixtureAnalysis.rows).length === 0 && jiuyangFixtureAnalysis.rows[0].risk.includes('\u9ad8\u98ce\u9669\u63aa\u8f9e') });
cases.push({ name: 'feishu target url parsing', pass: feishuTarget.appToken === 'CEo9byodzaH5TOsWMMxco1C5nWf' && feishuTarget.tableId === 'tblGxLd1TUJl5269' && feishuTarget.viewId === 'vewpApMVFy' });
cases.push({ name: 'foreign ShopOps feishu target is blocked', pass: blockedForeignFeishuTarget });
cases.push({ name: 'feishu row mapping keeps required fields', pass: Boolean(toFeishuRow(jiuyangFixtureAnalysis.rows[0])['\u552f\u4e00\u952e']) && Number.isFinite(toFeishuRow(jiuyangFixtureAnalysis.rows[0])['\u9884\u671f\u5dee\u8bc4\u5206']) });
cases.push({ name: 'valuation multiple spreads score', pass: valuationHighSpaceScore - valuationLowSpaceScore >= 45 });
cases.push({ name: 'valuation estimator captures future market cap gap', pass: valuationFixture.futureValuationYi >= 300 && valuationFixture.valuationUpsideMultiple >= 3 && valuationFixture.compositeScore > 70 });
cases.push({ name: 'compliance data', pass: scanObject(db).length === 0, details: scanObject(db) });
cases.push({ name: 'admin counts', pass: repo.counts().rawNews >= 12 && repo.counts().publishItems >= 10 && repo.counts().expectationGapCards >= 1 && repo.counts().evidenceMatrix >= 7 && repo.counts().scoreEvidence >= 6 });

writeResult('unit-tests', { status: cases.every((c) => c.pass) ? 'PASS' : 'HARD_FAIL', cases });
if (!cases.every((c) => c.pass)) fail(JSON.stringify(cases, null, 2));
console.log('unit tests PASS');
