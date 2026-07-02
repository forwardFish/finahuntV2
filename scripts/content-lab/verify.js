const fs = require('node:fs');
const { FORBIDDEN_TERMS } = require('../../services/shared/compliance');
const { parseArgs, datedOutputDir, readJson, writeJson, hash } = require('./common');
const { extractBodyText } = require('./extract');
const { validateAnalysis } = require('./analyze');

function testParserFixtures() {
  const plain = '<html><head><title>测试标题</title></head><body><article>政策发布，机器人产业链进入新的公开信息观察阶段。</article></body></html>';
  const nuxt = '<script>window.__NUXT__={data:[{title:"题材纪要",content:"财联社题材纪要显示，低空经济订单和政策试点值得持续观察。"}]};</script>';
  return [
    { name: 'plain html extraction', pass: extractBodyText(plain).includes('机器人产业链') },
    { name: 'script payload extraction', pass: extractBodyText(nuxt).includes('低空经济') },
  ];
}

function validateOutputs(date) {
  const outputDir = datedOutputDir(date);
  const raw = readJson(`${outputDir}/raw-items.json`);
  const extracted = readJson(`${outputDir}/extracted-news-items.json`);
  const normalized = readJson(`${outputDir}/normalized-items.json`);
  const itemAnalysis = readJson(`${outputDir}/deepseek-item-analysis.json`);
  const analysis = readJson(`${outputDir}/theme-analysis.json`);
  const ledger = fs.existsSync(`${outputDir}/review-ledger.md`);
  const draft = fs.existsSync(`${outputDir}/xiaohongshu-draft.md`);
  const manualReviewDir = `${outputDir}/manual-review`;
  const manualManifest = readJson(`${manualReviewDir}/manual-review-manifest.json`);
  const manualRequiredFiles = [
    'README.md',
    '00-source-pages.md',
    '01-extracted-items.md',
    '02-potential-selection.md',
    '03-analysis-results.md',
    'manual-review-manifest.json',
  ];
  const cases = [
    { name: 'raw-items exists', pass: !!raw && Array.isArray(raw.items) },
    { name: 'extracted-news-items exists', pass: !!extracted && Array.isArray(extracted.items) },
    { name: 'extracted news count >= 20', pass: !!extracted && extracted.extractedCount >= 20, details: extracted ? extracted.extractedCount : 0 },
    { name: 'normalized-items exists', pass: !!normalized && Array.isArray(normalized.items) },
    { name: 'deepseek-item-analysis exists', pass: !!itemAnalysis && Array.isArray(itemAnalysis.itemAnalyses) },
    { name: 'theme-analysis exists', pass: !!analysis },
    { name: 'review-ledger exists', pass: ledger },
    { name: 'xiaohongshu-draft exists', pass: draft },
    {
      name: 'manual review docs exist',
      pass: manualRequiredFiles.every((file) => fs.existsSync(`${manualReviewDir}/${file}`)),
      details: manualRequiredFiles.filter((file) => !fs.existsSync(`${manualReviewDir}/${file}`)),
    },
  ];
  if (!analysis) return { cases, status: 'FAIL', reviewItems: ['theme-analysis.json missing'] };

  const validation = validateAnalysis(analysis);
  const modelBlocked = analysis.reviewStatus === 'BLOCKED_BY_MODEL';
  cases.push({ name: 'schema required fields', pass: validation.missing.length === 0, details: validation.missing });
  cases.push({ name: 'scores in range', pass: validation.scoreOutOfRange.length === 0, details: validation.scoreOutOfRange });
  cases.push({
    name: 'potential has reasons and evidence',
    pass: modelBlocked || validation.potentialGaps.length === 0,
    details: modelBlocked ? 'skipped because model is blocked' : validation.potentialGaps.map((item) => item.itemId),
  });
  cases.push({
    name: 'prediction lens has leading signals and inference chains',
    pass: modelBlocked || validation.predictionGaps.length === 0,
    details: modelBlocked ? 'skipped because model is blocked' : validation.predictionGaps.map((item) => item.itemId),
  });
  cases.push({ name: 'companies have evidence', pass: validation.companyEvidenceGaps.length === 0, details: validation.companyEvidenceGaps.map((company) => company.companyName) });
  cases.push({ name: 'compliance passed', pass: analysis.compliance && analysis.compliance.status === 'passed', details: analysis.compliance });
  const selectedItems = analysis.trace && Array.isArray(analysis.trace.selectedItems) ? analysis.trace.selectedItems : [];
  const manualItemFiles = manualManifest && Array.isArray(manualManifest.files)
    ? manualManifest.files.filter((file) => /[\\/]items[\\/].+\.md$/.test(file))
    : [];
  cases.push({
    name: 'manual review covers selected model inputs',
    pass: !!manualManifest && manualItemFiles.length >= selectedItems.length,
    details: { selected: selectedItems.length, itemDocs: manualItemFiles.length },
  });
  const generatedSurface = {
    itemAnalyses: analysis.itemAnalyses,
    themeClusters: analysis.themeClusters,
    rankedThemes: analysis.rankedThemes,
    rankedCompanies: analysis.rankedCompanies,
    xiaohongshuDraft: analysis.xiaohongshuDraft,
  };
  const combined = JSON.stringify(generatedSurface);
  const forbiddenHits = FORBIDDEN_TERMS.filter((term) => combined.includes(term));
  cases.push({ name: 'forbidden terms absent', pass: forbiddenHits.length === 0, details: forbiddenHits });

  const reviewItems = [];
  if (analysis.reviewStatus !== 'PASS_WITH_EDITOR_REVIEW') reviewItems.push(`reviewStatus=${analysis.reviewStatus}`);
  if (extracted && extracted.extractedCount < extracted.targetMinimum) reviewItems.push(`extracted=${extracted.extractedCount}/${extracted.targetMinimum}`);
  for (const call of analysis.trace ? analysis.trace.deepseekCalls || [] : []) {
    if (call.status !== 'DEEPSEEK_USED') reviewItems.push(`${call.itemId}:${call.status}`);
  }
  for (const item of raw ? raw.items || [] : []) {
    if (item.status !== 'CAPTURED') reviewItems.push(`${item.id}:${item.status}`);
  }
  const hardFailures = cases.filter((item) => !item.pass && !['extracted news count >= 20'].includes(item.name));
  const status = hardFailures.length
    ? 'FAIL'
    : analysis.reviewStatus === 'BLOCKED_BY_MODEL'
      ? 'BLOCKED_BY_MODEL'
      : reviewItems.length
        ? 'PASS_WITH_REVIEW_ITEMS'
        : 'PASS_WITH_EDITOR_REVIEW';
  return { cases, status, reviewItems };
}

function run(date) {
  const fixtureCases = testParserFixtures();
  const output = validateOutputs(date);
  const result = {
    date,
    status: [...fixtureCases, ...output.cases].every((item) => item.pass || item.name === 'extracted news count >= 20') ? output.status : 'FAIL',
    generatedAt: new Date().toISOString(),
    traceId: `verify-${hash(`${date}-${Date.now()}`).slice(0, 10)}`,
    cases: [...fixtureCases, ...output.cases],
    reviewItems: output.reviewItems,
  };
  writeJson(`${datedOutputDir(date)}/verification.json`, result);
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'FAIL') process.exit(1);
}

if (require.main === module) {
  const args = parseArgs();
  run(args.date);
}

module.exports = { run, testParserFixtures, validateOutputs };
