const fs = require('node:fs');
const path = require('node:path');
const { fetchJiuyangongsheArticle } = require('../services/crawler/jiuyangongshe-fetcher');
const { analyzeJiuyangongsheArticle } = require('../services/ai-worker/stock-analysis-analyzer');
const { buildDynamicExpectationSnapshots } = require('../services/ai-worker/dynamic-expectation-gap');
const { resolveStockMarketCap } = require('../services/data/market-cap-client');
const { FeishuBitableClient, stockAnalysisFieldSpecs, scalar } = require('../services/feishu/bitable-client');

const DEFAULT_SOURCE_URL = 'https://www.jiuyangongshe.com/a/2z5c5p2z2vp';
const DEFAULT_FEISHU_URL = 'https://my.feishu.cn/base/CEo9byodzaH5TOsWMMxco1C5nWf?table=tblGxLd1TUJl5269&view=vewpApMVFy';
const BLOCKED_FEISHU_APP_TOKENS = new Set(['KhbEbksLbauw0fssL6EcKAnlnOe']);

const FIELDS = {
  uniqueKey: '\u552f\u4e00\u952e',
  sourceUrl: '\u6765\u6e90\u94fe\u63a5',
  title: '\u6587\u7ae0\u6807\u9898',
  publishTime: '\u53d1\u5e03\u65f6\u95f4',
  crawledAt: '\u6293\u53d6\u65f6\u95f4',
  theme: '\u677f\u5757\u4e3b\u9898',
  stockCode: '\u80a1\u7968\u4ee3\u7801',
  stockName: '\u80a1\u7968\u540d\u79f0',
  relatedStocks: '\u76f8\u5173\u80a1\u7968',
  currentSituation: '\u5f53\u524d\u60c5\u51b5',
  futureExpectation: '\u672a\u6765\u9884\u671f',
  scenarioSpace: '\u672a\u6765\u6da8\u5e45\u63a8\u6f14',
  catalyst: '\u53ef\u80fd\u50ac\u5316',
  expectationGapScore: '\u9884\u671f\u5dee\u8bc4\u5206',
  confidence: '\u7f6e\u4fe1\u5ea6',
  risk: '\u98ce\u9669\u70b9',
  evidence: '\u8bc1\u636e\u6458\u5f55',
  status: '\u5206\u6790\u72b6\u6001',
  disclaimer: '\u5408\u89c4\u63d0\u793a',
  analysisDate: '\u5206\u6790\u65e5\u671f',
  stockId: '\u80a1\u7968\u6807\u8bc6',
  evidenceCount: '\u8bc1\u636e\u6b21\u6570',
  sourceCount: '\u8bc1\u636e\u6765\u6e90\u6570',
  evidenceJson: '\u8bc1\u636eJSON',
  currentMarketCapYi: '\u5f53\u524d\u5e02\u503c(\u4ebf)',
  previousMarketCapYi: '\u4e0a\u6b21\u5e02\u503c(\u4ebf)',
  marketCapChangePct: '\u5e02\u503c\u53d8\u5316%',
  marketCapImpact: '\u5e02\u503c\u53d8\u5316\u5f71\u54cd',
  futureValuationYi: '\u672a\u6765\u4f30\u503c(\u4ebf)',
  valuationUpsideMultiple: '\u4f30\u503c\u7a7a\u95f4\u500d\u6570',
  valuationGapYi: '\u4f30\u503c\u5dee\u989d(\u4ebf)',
  valuationDerivation: '\u672a\u6765\u4f30\u503c\u63a8\u5bfc',
  valuationMethod: '\u4f30\u503c\u65b9\u6cd5',
  valuationConfidence: '\u4f30\u503c\u7f6e\u4fe1\u5ea6',
  valuationSpaceScore: '\u4f30\u503c\u7a7a\u95f4\u8bc4\u5206',
  evidenceStrengthScore: '\u8bc1\u636e\u5f3a\u5ea6\u8bc4\u5206',
  catalystTimingScore: '\u50ac\u5316\u65f6\u6548\u8bc4\u5206',
  transmissionScore: '\u4e1a\u7ee9\u4f20\u5bfc\u8bc4\u5206',
  riskDiscountScore: '\u98ce\u9669\u6298\u6263\u8bc4\u5206',
  compositeScore: '\u7efc\u5408\u8bc4\u5206',
  baseExpectationGapScore: '\u57fa\u7840\u9884\u671f\u5dee\u8bc4\u5206',
  dynamicExpectationGapScore: '\u52a8\u6001\u9884\u671f\u5dee\u8bc4\u5206',
  scoreExplanation: '\u8bc4\u5206\u8bf4\u660e',
  marketDataStatus: '\u5e02\u503c\u6570\u636e\u72b6\u6001',
  marketDataSource: '\u5e02\u503c\u6570\u636e\u6765\u6e90',
};

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function parseFeishuUrl(url) {
  const parsed = new URL(url);
  const appToken = parsed.pathname.split('/').filter(Boolean).pop();
  const tableId = parsed.searchParams.get('table') || '';
  const viewId = parsed.searchParams.get('view') || '';
  if (!appToken || !tableId) throw new Error(`Invalid Feishu Bitable URL: ${url}`);
  if (BLOCKED_FEISHU_APP_TOKENS.has(appToken)) {
    throw new Error(`Blocked Feishu target for finahuntV2: appToken ${appToken} belongs to another project`);
  }
  return { appToken, tableId, viewId, url };
}

function sourceUrlsFromArgs(args) {
  const raw = args.urls || args.url || DEFAULT_SOURCE_URL;
  return String(raw)
    .split(/\r?\n|,|\uFF0C/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(file, rows) {
  ensureDir(path.dirname(file));
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ];
  fs.writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
}

function sameStringSet(a, b) {
  const left = [...new Set((a || []).map(String))].sort();
  const right = [...new Set((b || []).map(String))].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function compactFields(row) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && value !== null));
}

function toFeishuRow(row) {
  return compactFields({
    [FIELDS.uniqueKey]: row.uniqueKey,
    [FIELDS.sourceUrl]: row.sourceUrl,
    [FIELDS.title]: row.title,
    [FIELDS.publishTime]: row.publishTime,
    [FIELDS.crawledAt]: row.crawledAt,
    [FIELDS.theme]: row.theme,
    [FIELDS.stockCode]: row.stockCode,
    [FIELDS.stockName]: row.stockName,
    [FIELDS.relatedStocks]: row.relatedStocks,
    [FIELDS.currentSituation]: row.currentSituation,
    [FIELDS.futureExpectation]: row.futureExpectation,
    [FIELDS.scenarioSpace]: row.scenarioSpace,
    [FIELDS.catalyst]: row.catalyst,
    [FIELDS.expectationGapScore]: row.expectationGapScore,
    [FIELDS.confidence]: row.confidence,
    [FIELDS.risk]: row.risk,
    [FIELDS.evidence]: row.evidence,
    [FIELDS.status]: row.status,
    [FIELDS.disclaimer]: row.disclaimer,
    [FIELDS.analysisDate]: row.analysisDate,
    [FIELDS.stockId]: row.stockId,
    [FIELDS.evidenceCount]: row.evidenceCount,
    [FIELDS.sourceCount]: row.sourceCount,
    [FIELDS.evidenceJson]: row.evidenceJson,
    [FIELDS.currentMarketCapYi]: row.currentMarketCapYi,
    [FIELDS.previousMarketCapYi]: row.previousMarketCapYi,
    [FIELDS.marketCapChangePct]: row.marketCapChangePct,
    [FIELDS.marketCapImpact]: row.marketCapImpact,
    [FIELDS.futureValuationYi]: row.futureValuationYi,
    [FIELDS.valuationUpsideMultiple]: row.valuationUpsideMultiple,
    [FIELDS.valuationGapYi]: row.valuationGapYi,
    [FIELDS.valuationDerivation]: row.valuationDerivation,
    [FIELDS.valuationMethod]: row.valuationMethod,
    [FIELDS.valuationConfidence]: row.valuationConfidence,
    [FIELDS.valuationSpaceScore]: row.valuationSpaceScore,
    [FIELDS.evidenceStrengthScore]: row.evidenceStrengthScore,
    [FIELDS.catalystTimingScore]: row.catalystTimingScore,
    [FIELDS.transmissionScore]: row.transmissionScore,
    [FIELDS.riskDiscountScore]: row.riskDiscountScore,
    [FIELDS.compositeScore]: row.compositeScore,
    [FIELDS.baseExpectationGapScore]: row.baseExpectationGapScore,
    [FIELDS.dynamicExpectationGapScore]: row.dynamicExpectationGapScore,
    [FIELDS.scoreExplanation]: row.scoreExplanation,
    [FIELDS.marketDataStatus]: row.marketDataStatus,
    [FIELDS.marketDataSource]: row.marketDataSource,
  });
}

function cachedAnalysisRowsFromFeishuRows(rows) {
  return (rows || []).map((row) => ({
    uniqueKey: scalar(row[FIELDS.uniqueKey]),
    stockId: scalar(row[FIELDS.stockId]),
    stockCode: scalar(row[FIELDS.stockCode]),
    stockName: scalar(row[FIELDS.stockName]),
    analysisDate: scalar(row[FIELDS.analysisDate]),
    dynamicExpectationGapScore: Number(scalar(row[FIELDS.dynamicExpectationGapScore])),
    currentMarketCapYi: Number(scalar(row[FIELDS.currentMarketCapYi])),
    futureValuationYi: Number(scalar(row[FIELDS.futureValuationYi])),
    valuationUpsideMultiple: Number(scalar(row[FIELDS.valuationUpsideMultiple])),
    valuationGapYi: Number(scalar(row[FIELDS.valuationGapYi])),
    evidenceCount: Number(scalar(row[FIELDS.evidenceCount])),
    sourceUrl: scalar(row[FIELDS.sourceUrl]),
    status: scalar(row[FIELDS.status]) || 'CACHE_FALLBACK',
  }));
}

function findLatestRowsExport({ sourceUrls, analysisDate, exportDir }) {
  if (!fs.existsSync(exportDir)) return null;
  const files = fs.readdirSync(exportDir)
    .filter((name) => /^jiuyangongshe-dynamic-stock-analysis-.*\.rows\.json$/.test(name))
    .map((name) => path.join(exportDir, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const file of files) {
    try {
      const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (payload.analysisDate !== analysisDate) continue;
      if (!sameStringSet(payload.sourceUrls, sourceUrls)) continue;
      if (!payload.rowCount || !Array.isArray(payload.rows) || !payload.rows.length) continue;
      return {
        file,
        generatedAt: payload.generatedAt,
        rawRowCount: payload.rawRowCount || 0,
        rowCount: payload.rowCount,
        rows: payload.rows,
      };
    } catch {
      // Ignore corrupt local evidence artifacts.
    }
  }
  return null;
}

function snapshotFromFeishuFields(fields) {
  return {
    stockId: scalar(fields[FIELDS.stockId] || fields[FIELDS.stockCode] || fields[FIELDS.stockName]),
    analysisDate: scalar(fields[FIELDS.analysisDate]),
    marketCapYi: Number(scalar(fields[FIELDS.currentMarketCapYi])),
  };
}

async function readHistoricalSnapshots(client) {
  try {
    const records = await client.listRecords([
      FIELDS.stockId,
      FIELDS.stockCode,
      FIELDS.stockName,
      FIELDS.analysisDate,
      FIELDS.currentMarketCapYi,
    ]);
    return records
      .map((record) => snapshotFromFeishuFields(record.fields || {}))
      .filter((row) => row.stockId && row.analysisDate);
  } catch {
    return [];
  }
}

function buildEvidence({ articles, analysis, feishu, writeResult, readback, mode, exports, historicalCount, cacheFallback }) {
  const expectedKeys = analysis.rows.map((row) => row.uniqueKey);
  const readbackKeys = Object.keys(readback || {});
  const missingReadbackKeys = expectedKeys.filter((key) => !readbackKeys.includes(key));
  return {
    status: analysis.rowCount === 0
      ? 'NO_STOCK_ROWS'
      : writeResult && writeResult.status === 'WRITE_BLOCKED'
        ? 'WRITE_BLOCKED'
        : mode === 'dry-run'
          ? 'DRY_RUN_PASS'
          : missingReadbackKeys.length
            ? 'WRITE_NEEDS_REVIEW'
            : 'WRITE_PASS',
    mode,
    generatedAt: new Date().toISOString(),
    sources: articles.map((item) => ({
      url: item.sourceUrl || item.originalUrl,
      title: item.title,
      publishTime: item.publishTime,
      httpStatus: item.httpStatus,
      crawlStatus: item.status,
      bodyLength: String(item.bodyText || '').length,
    })),
    feishu,
    analysis: {
      status: analysis.status,
      rowCount: analysis.rowCount,
      rawRowCount: analysis.rawRowCount,
      sectionCount: analysis.sectionCount,
      compliance: analysis.compliance,
      historicalCount: historicalCount || 0,
      cacheFallback: cacheFallback || null,
    },
    writeResult,
    readback: {
      expectedCount: expectedKeys.length,
      actualCount: readbackKeys.length,
      missingReadbackKeys,
    },
    exports: exports || null,
    rows: analysis.rows,
  };
}

async function buildAnalysis({ sourceUrls, analysisDate, historicalRows }) {
  const articles = [];
  const articleAnalyses = [];
  for (const url of sourceUrls) {
    const article = await fetchJiuyangongsheArticle(url);
    const articleAnalysis = analyzeJiuyangongsheArticle(article);
    articles.push(article);
    articleAnalyses.push(articleAnalysis);
  }

  const blockedTerms = articleAnalyses.flatMap((item) => item.compliance && item.compliance.blockedTerms ? item.compliance.blockedTerms : []);
  const rawRows = articleAnalyses.flatMap((item) => item.rows || []);
  const sectionCount = articleAnalyses.reduce((sum, item) => sum + Number(item.sectionCount || 0), 0);
  const snapshotRows = await buildDynamicExpectationSnapshots({
    rows: rawRows,
    analysisDate,
    historicalRows,
    resolveMarketCap: resolveStockMarketCap,
  });

  return {
    articles,
    analysis: {
      generatedAt: new Date().toISOString(),
      status: blockedTerms.length ? 'FAIL_COMPLIANCE' : snapshotRows.length ? 'PASS_DYNAMIC_SNAPSHOTS' : 'NO_STOCK_ROWS',
      rowCount: snapshotRows.length,
      rawRowCount: rawRows.length,
      sectionCount,
      rows: snapshotRows,
      compliance: {
        status: blockedTerms.length ? 'blocked' : 'passed',
        blockedTerms,
      },
    },
  };
}

async function run(overrides = {}) {
  const args = { ...parseArgs(), ...overrides };
  const sourceUrls = overrides.sourceUrls || sourceUrlsFromArgs(args);
  const analysisDate = args['analysis-date'] || todayDate();
  const feishu = parseFeishuUrl(args.feishu || DEFAULT_FEISHU_URL);
  const dryRun = Boolean(args['dry-run']);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const evidencePath = args.evidence || path.join('docs', 'live-evidence', `jiuyangongshe-dynamic-stock-analysis-${timestamp}.json`);
  const exportDir = args['export-dir'] || path.join('docs', 'live-evidence', 'jiuyangongshe-exports');

  let client = null;
  let historicalRows = [];
  let fieldResult = { created: [] };
  if (!dryRun) {
    client = new FeishuBitableClient({ appToken: feishu.appToken, tableId: feishu.tableId, envPath: args['env-path'] });
    fieldResult = await client.ensureFields(stockAnalysisFieldSpecs());
    historicalRows = await readHistoricalSnapshots(client);
  }

  const { articles, analysis } = await buildAnalysis({ sourceUrls, analysisDate, historicalRows });
  let cacheFallback = null;
  let feishuRows = [];
  if (analysis.rowCount === 0 && !args['no-cache-fallback']) {
    cacheFallback = findLatestRowsExport({ sourceUrls, analysisDate, exportDir });
    if (cacheFallback) {
      analysis.status = 'PASS_CACHE_FALLBACK';
      analysis.rawRowCount = cacheFallback.rawRowCount;
      analysis.rowCount = cacheFallback.rowCount;
      analysis.rows = cachedAnalysisRowsFromFeishuRows(cacheFallback.rows);
      feishuRows = cacheFallback.rows;
    }
  }
  if (analysis.status === 'FAIL_COMPLIANCE') {
    const evidence = buildEvidence({ articles, analysis, feishu, writeResult: null, readback: {}, mode: 'blocked', historicalCount: historicalRows.length, cacheFallback });
    writeJson(evidencePath, evidence);
    throw new Error(`Compliance blocked write: ${analysis.compliance.blockedTerms.join(', ')}`);
  }

  if (!feishuRows.length) feishuRows = analysis.rows.map(toFeishuRow);
  const exports = {
    rowsJson: path.join(exportDir, `jiuyangongshe-dynamic-stock-analysis-${timestamp}.rows.json`),
    rowsCsv: path.join(exportDir, `jiuyangongshe-dynamic-stock-analysis-${timestamp}.rows.csv`),
  };
  writeJson(exports.rowsJson, {
    generatedAt: new Date().toISOString(),
    sourceUrls,
    analysisDate,
    rawRowCount: analysis.rawRowCount,
    rowCount: feishuRows.length,
    rows: feishuRows,
  });
  writeCsv(exports.rowsCsv, feishuRows);

  let writeResult = null;
  let readback = {};
  if (!dryRun) {
    try {
      writeResult = await client.upsertRows(feishuRows, FIELDS.uniqueKey);
      readback = await client.readbackByKeys(FIELDS.uniqueKey, analysis.rows.map((row) => row.uniqueKey));
      writeResult.createdFields = fieldResult.created;
      writeResult.mode = 'dynamic_snapshot_fields';
    } catch (error) {
      writeResult = {
        status: 'WRITE_BLOCKED',
        mode: 'blocked_by_feishu_permission',
        error: String(error && error.message ? error.message : error).slice(0, 1000),
      };
    }
  }

  const evidence = buildEvidence({
    articles,
    analysis,
    feishu,
    writeResult,
    readback,
    mode: dryRun ? 'dry-run' : 'live-write',
    exports,
    historicalCount: historicalRows.length,
    cacheFallback,
  });
  writeJson(evidencePath, evidence);
  console.log(JSON.stringify({
    status: evidence.status,
    mode: evidence.mode,
    sourceUrls,
    analysisDate,
    rawRows: analysis.rawRowCount,
    snapshots: analysis.rowCount,
    historicalRows: historicalRows.length,
    topSnapshots: analysis.rows.slice(0, 10).map((row) => ({
      key: row.uniqueKey,
      stock: row.stockName || row.stockCode || row.stockId,
      score: row.dynamicExpectationGapScore,
      marketCapYi: row.currentMarketCapYi,
      marketStatus: row.marketDataStatus,
      evidenceCount: row.evidenceCount,
    })),
    evidence: evidencePath,
    exports,
    writeResult,
    readback: evidence.readback,
  }, null, 2));
  return evidence;
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = {
  FIELDS,
  run,
  buildAnalysis,
  parseFeishuUrl,
  toFeishuRow,
};
