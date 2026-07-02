const fs = require('node:fs');
const path = require('node:path');
const { fetchJiuyangongsheAuthorArticles, filterArticlesByDays } = require('../services/crawler/jiuyangongshe-author');
const { run: runArticlePipeline } = require('./jiuyangongshe-to-feishu');

const DEFAULT_AUTHOR_URL = 'https://www.jiuyangongshe.com/u/85d8efb979e6484ea0e374ded1b4bddb';

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

async function run() {
  const args = parseArgs();
  const authorUrl = args['author-url'] || args.author || DEFAULT_AUTHOR_URL;
  const days = Number(args.days || 7);
  const monthDays = Number(args['month-days'] || 31);
  const analysisDate = args['analysis-date'] || args['end-date'] || todayDate();
  const dryRun = Boolean(args['dry-run']);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const discoveryEvidence = args['discovery-evidence']
    || path.join('docs', 'live-evidence', 'jiuyangongshe-author', `author-discovery-${timestamp}.json`);
  const analysisEvidence = args.evidence
    || path.join('docs', 'live-evidence', 'jiuyangongshe-author', `author-7day-analysis-${timestamp}.json`);

  const discovery = await fetchJiuyangongsheAuthorArticles(authorUrl);
  const monthArticles = filterArticlesByDays(discovery.articles, { endDate: analysisDate, days: monthDays });
  const selectedArticles = filterArticlesByDays(discovery.articles, { endDate: analysisDate, days });
  const sourceUrls = selectedArticles.map((article) => article.url);
  const discoveryPayload = {
    status: sourceUrls.length ? 'DISCOVERY_PASS' : 'NO_7DAY_ARTICLES',
    generatedAt: new Date().toISOString(),
    authorUrl,
    analysisDate,
    days,
    monthDays,
    httpStatus: discovery.httpStatus,
    htmlLength: discovery.htmlLength,
    discoveredCount: discovery.articles.length,
    monthArticleCount: monthArticles.length,
    selectedArticleCount: selectedArticles.length,
    monthArticles,
    selectedArticles,
  };
  writeJson(discoveryEvidence, discoveryPayload);
  if (!sourceUrls.length) {
    console.log(JSON.stringify({ ...discoveryPayload, discoveryEvidence }, null, 2));
    throw new Error(`No Jiuyangongshe author articles found for the last ${days} days`);
  }

  const analysis = await runArticlePipeline({
    sourceUrls,
    'analysis-date': analysisDate,
    'dry-run': dryRun,
    feishu: args.feishu,
    'env-path': args['env-path'],
    evidence: analysisEvidence,
    'export-dir': args['export-dir'],
    'no-cache-fallback': args['no-cache-fallback'],
  });

  console.log(JSON.stringify({
    status: analysis.status,
    mode: analysis.mode,
    authorUrl,
    analysisDate,
    selectedArticleCount: selectedArticles.length,
    selectedUrls: sourceUrls,
    discoveryEvidence,
    analysisEvidence,
    rowCount: analysis.analysis.rowCount,
    rawRowCount: analysis.analysis.rawRowCount,
    writeResult: analysis.writeResult,
    readback: analysis.readback,
  }, null, 2));
  return { discovery: discoveryPayload, analysis };
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { run };
