const fs = require('node:fs');
const path = require('node:path');
const { FeishuBitableClient, scalar } = require('../services/feishu/bitable-client');
const { FIELDS, parseFeishuUrl } = require('./jiuyangongshe-to-feishu');
const { resolveStockMarketCap } = require('../services/data/market-cap-client');

const DEFAULT_FEISHU_URL = 'https://my.feishu.cn/base/CEo9byodzaH5TOsWMMxco1C5nWf?table=tblGxLd1TUJl5269&view=vewpApMVFy';
const INVALID_STATUS = '\u975e\u80a1\u7968\u5019\u9009-\u5df2\u8fc7\u6ee4';

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function isSixDigitCode(value) {
  return /^[03468]\d{5}$/.test(String(value || '').trim());
}

function isDynamicSnapshotKey(value) {
  return /^[03468]\d{5}\|\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function codeFromKey(value) {
  const match = String(value || '').match(/^([03468]\d{5})\|/);
  return match ? match[1] : '';
}

function shouldInspect(fields) {
  const name = scalar(fields[FIELDS.stockName]);
  const code = scalar(fields[FIELDS.stockCode]);
  const key = scalar(fields[FIELDS.uniqueKey]);
  if (!name && !code) return false;
  if (isDynamicSnapshotKey(key) && isSixDigitCode(code)) return false;
  return !isSixDigitCode(code) || !isDynamicSnapshotKey(key);
}

async function buildPatch(fields, analysisDate) {
  const key = scalar(fields[FIELDS.uniqueKey]);
  const currentName = scalar(fields[FIELDS.stockName]);
  const currentCode = scalar(fields[FIELDS.stockCode]) || codeFromKey(key);
  const resolved = await resolveStockMarketCap({ stockCode: currentCode, stockName: currentName });
  if (resolved.status === 'FOUND' && isSixDigitCode(resolved.stockCode)) {
    const date = scalar(fields[FIELDS.analysisDate]) || analysisDate;
    return {
      action: 'repair_resolved_stock',
      resolved,
      fields: {
        [FIELDS.uniqueKey]: `${resolved.stockCode}|${date}`,
        [FIELDS.stockId]: resolved.stockCode,
        [FIELDS.stockCode]: resolved.stockCode,
        [FIELDS.stockName]: resolved.stockName,
        [FIELDS.analysisDate]: date,
        [FIELDS.currentMarketCapYi]: resolved.marketCapYi,
        [FIELDS.marketDataStatus]: resolved.status,
        [FIELDS.marketDataSource]: resolved.source || 'eastmoney',
      },
    };
  }
  return {
    action: 'blank_invalid_candidate',
    resolved,
    fields: {
      [FIELDS.stockId]: '',
      [FIELDS.stockCode]: '',
      [FIELDS.stockName]: '',
      [FIELDS.marketDataStatus]: resolved.status || 'NOT_FOUND',
      [FIELDS.status]: INVALID_STATUS,
    },
  };
}

async function run() {
  const args = parseArgs();
  const feishu = parseFeishuUrl(args.feishu || DEFAULT_FEISHU_URL);
  const analysisDate = args['analysis-date'] || new Date().toISOString().slice(0, 10);
  const dryRun = Boolean(args['dry-run']);
  const evidencePath = args.evidence || path.join(
    'docs',
    'live-evidence',
    `feishu-invalid-stock-cleanup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`,
  );
  const client = new FeishuBitableClient({ appToken: feishu.appToken, tableId: feishu.tableId, envPath: args['env-path'] });
  const records = await client.listRecords([
    FIELDS.uniqueKey,
    FIELDS.stockId,
    FIELDS.stockCode,
    FIELDS.stockName,
    FIELDS.analysisDate,
    FIELDS.currentMarketCapYi,
    FIELDS.marketDataStatus,
    FIELDS.status,
  ]);
  const candidates = records.filter((record) => shouldInspect(record.fields || {}));
  const updates = [];
  for (const record of candidates) {
    const patch = await buildPatch(record.fields || {}, analysisDate);
    updates.push({
      record_id: record.record_id,
      before: {
        uniqueKey: scalar((record.fields || {})[FIELDS.uniqueKey]),
        stockCode: scalar((record.fields || {})[FIELDS.stockCode]),
        stockName: scalar((record.fields || {})[FIELDS.stockName]),
      },
      ...patch,
    });
  }

  if (!dryRun && updates.length) {
    for (const item of updates) {
      await client.request('PUT', `/bitable/v1/apps/${client.appToken}/tables/${client.tableId}/records/${item.record_id}`, { fields: item.fields });
    }
  }

  const evidence = {
    status: dryRun ? 'DRY_RUN_PASS' : 'CLEANUP_PASS',
    generatedAt: new Date().toISOString(),
    target: feishu,
    dryRun,
    inspected: candidates.length,
    repairResolvedCount: updates.filter((item) => item.action === 'repair_resolved_stock').length,
    blankInvalidCount: updates.filter((item) => item.action === 'blank_invalid_candidate').length,
    updates,
  };
  writeJson(evidencePath, evidence);
  console.log(JSON.stringify({
    status: evidence.status,
    evidence: evidencePath,
    inspected: evidence.inspected,
    repairResolvedCount: evidence.repairResolvedCount,
    blankInvalidCount: evidence.blankInvalidCount,
    sample: updates.slice(0, 10).map((item) => ({
      action: item.action,
      before: item.before,
      after: {
        stockCode: item.fields[FIELDS.stockCode],
        stockName: item.fields[FIELDS.stockName],
        uniqueKey: item.fields[FIELDS.uniqueKey],
      },
      marketStatus: item.resolved && item.resolved.status,
    })),
  }, null, 2));
  return evidence;
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { run };
