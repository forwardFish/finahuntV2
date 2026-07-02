const path = require('node:path');
const {
  parseArgs,
  datedOutputDir,
  ensureDir,
  readJson,
  writeJson,
  writeText,
  snippet,
} = require('./common');

function mdEscape(value) {
  return String(value || '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function safeFence(value) {
  return String(value || '').replace(/```/g, "'''").trim();
}

function mdLink(label, url) {
  if (!url) return '';
  return `[${mdEscape(label || url)}](${url})`;
}

function slug(value) {
  const clean = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return clean || 'item';
}

function rel(fromDir, file) {
  return path.relative(fromDir, file).replace(/\\/g, '/');
}

function rowsToTable(headers, rows) {
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ];
  for (const row of rows) {
    lines.push(`| ${row.map(mdEscape).join(' | ')} |`);
  }
  return lines.join('\n');
}

function loadArtifacts(outputDir) {
  const raw = readJson(path.join(outputDir, 'raw-items.json'));
  const extracted = readJson(path.join(outputDir, 'extracted-news-items.json'));
  const normalized = readJson(path.join(outputDir, 'normalized-items.json'));
  const analysis = readJson(path.join(outputDir, 'theme-analysis.json'));
  const verification = readJson(path.join(outputDir, 'verification.json'));
  const missing = [
    ['raw-items.json', raw],
    ['extracted-news-items.json', extracted],
    ['normalized-items.json', normalized],
    ['theme-analysis.json', analysis],
  ].filter(([, value]) => !value).map(([file]) => file);
  if (missing.length) {
    throw new Error(`Missing content-lab artifacts: ${missing.join(', ')}`);
  }
  return { raw, extracted, normalized, analysis, verification };
}

function buildMaps({ raw, extracted, normalized, analysis }) {
  return {
    rawById: new Map((raw.items || []).map((item) => [item.id, item])),
    extractedById: new Map((extracted.items || []).map((item) => [item.id, item])),
    normalizedById: new Map((normalized.items || []).map((item) => [item.id, item])),
    analysisById: new Map((analysis.itemAnalyses || []).map((item) => [item.itemId, item])),
    selectionById: new Map(((analysis.trace && analysis.trace.selectedItems) || []).map((item) => [item.itemId, item])),
    modelCallById: new Map(((analysis.trace && analysis.trace.deepseekCalls) || []).map((item) => [item.itemId, item])),
  };
}

function renderReadme({ date, reviewDir, raw, extracted, analysis, verification, itemFiles }) {
  const lines = [
    `# Content Lab Manual Review - ${date}`,
    '',
    '这组文档用于人工逐链路检查：先看原网页，再看抓取文本，再看候选筛选理由，最后看模型分析是否被证据支撑。',
    '',
    '## Review Order',
    '',
    '1. [00-source-pages.md](00-source-pages.md) - 原始入口页、抓取状态、从入口页发现的文章链接。',
    '2. [01-extracted-items.md](01-extracted-items.md) - 每条抽取资讯的原网页、正文长度、抓取方法和正文预览。',
    '3. [02-potential-selection.md](02-potential-selection.md) - 哪些资讯被判为高潜力、为什么进入模型。',
    '4. [03-analysis-results.md](03-analysis-results.md) - 分析结果、分数、公司、证据、模型调用状态。',
    '5. `items/` - 每条进入模型的资讯都有一份端到端链路详情。',
    '',
    '## Run Summary',
    '',
    rowsToTable(
      ['Field', 'Value'],
      [
        ['raw source count', raw.sourceCount],
        ['raw captured/review/blocked/failed', `${raw.capturedCount}/${raw.reviewCount}/${raw.blockedCount}/${raw.failedCount}`],
        ['extracted count', `${extracted.extractedCount}/${extracted.targetMinimum}`],
        ['selected model inputs', ((analysis.trace && analysis.trace.selectedItems) || []).length],
        ['analysis review status', analysis.reviewStatus],
        ['verification status', verification ? verification.status : 'not run'],
        ['verification review items', verification ? (verification.reviewItems || []).join('; ') || 'none' : 'not run'],
      ],
    ),
    '',
    '## Per-Item Chain Docs',
    '',
  ];
  for (const file of itemFiles) {
    lines.push(`- [${path.basename(file)}](${rel(reviewDir, file)})`);
  }
  lines.push('', '## Manual Checklist', '');
  lines.push('- [ ] 原网页能打开，且标题/正文和文档中的抓取内容一致。');
  lines.push('- [ ] 抓取正文没有只剩登录壳、导航噪声或错页。');
  lines.push('- [ ] 高潜力筛选理由能解释为什么这条优先进入模型。');
  lines.push('- [ ] 分析结论里的公司、链路、预期差、反证信号都能回到原文证据。');
  lines.push('- [ ] 弱证据、模型失败、来源被挡等限制没有被说成 PASS。');
  return lines.join('\n');
}

function renderSourcePages({ raw }) {
  const lines = [
    '# 00 Source Pages',
    '',
    '人工先从这里检查入口网页和源站状态。`Original Page` 是你要打开的原网页，`Crawled Text Preview` 是程序实际抽出的页面文本。',
    '',
  ];
  lines.push(rowsToTable(
    ['Raw ID', 'Source', 'Original Page', 'Fetched Page', 'Status', 'HTTP', 'Body Len', 'Linked Items', 'Crawled Text Preview'],
    (raw.items || []).map((item) => [
      item.id,
      item.source && item.source.sourceName,
      mdLink('open', item.source && item.source.url),
      mdLink('open', item.sourceUrl),
      item.status,
      item.httpStatus || '',
      String((item.bodyText || '').length),
      String((item.linkedItems || []).length),
      snippet(item.bodyText || item.error, 180),
    ]),
  ));
  for (const item of raw.items || []) {
    if (!Array.isArray(item.linkedItems) || !item.linkedItems.length) continue;
    lines.push('', `## ${item.id} Discovered Article Pages`, '');
    lines.push(rowsToTable(
      ['Rank', 'Score', 'Article Page', 'Title', 'Status', 'Body Len', 'Reasons', 'Preview'],
      item.linkedItems
        .slice()
        .sort((a, b) => (b.discoveryScore || 0) - (a.discoveryScore || 0))
        .slice(0, 60)
        .map((linked, index) => [
          String(index + 1),
          String(linked.discoveryScore || 0),
          mdLink('open', linked.sourceUrl),
          linked.title,
          linked.status,
          String((linked.bodyText || '').length),
          (linked.discoveryReasons || []).join(', '),
          snippet(linked.bodyText || linked.error, 180),
        ]),
    ));
  }
  return lines.join('\n');
}

function renderExtractedItems({ extracted, maps }) {
  const lines = [
    '# 01 Extracted Items',
    '',
    '这里列出本轮所有抽取出的资讯。先检查 `Original Page` 和 `Extracted Preview` 是否对得上。',
    '',
  ];
  const selectedIds = new Set([...maps.selectionById.keys()]);
  lines.push(rowsToTable(
    ['Item ID', 'Selected', 'Original Page', 'Title', 'Status', 'Method', 'Body Len', 'Discovery Score', 'Reasons', 'Extracted Preview'],
    (extracted.items || []).map((item) => [
      item.id,
      selectedIds.has(item.id) ? 'YES' : '',
      mdLink('open', item.originalUrl || item.sourceUrl),
      item.title,
      item.status,
      item.extractionMethod,
      String((item.bodyText || '').length),
      String(item.discoveryScore || 0),
      (item.discoveryReasons || []).join(', '),
      snippet(item.bodyText, 220),
    ]),
  ));
  return lines.join('\n');
}

function renderPotentialSelection({ analysis, maps }) {
  const lines = [
    '# 02 Potential Selection',
    '',
    '这里解释“为什么这条进入模型”。分数来自抓取后的候选排序，不是最终投资判断。',
    '',
  ];
  const selected = (analysis.trace && analysis.trace.selectedItems) || [];
  lines.push(rowsToTable(
    ['Rank', 'Item ID', 'Selection Score', 'Original Page', 'Title', 'Reasons', 'Extracted Preview'],
    selected.map((item, index) => {
      const extracted = maps.extractedById.get(item.itemId) || {};
      return [
        String(index + 1),
        item.itemId,
        String(item.selectionScore),
        mdLink('open', item.sourceUrl || extracted.sourceUrl),
        item.title,
        (item.selectionReasons || []).join(', '),
        snippet(extracted.bodyText, 240),
      ];
    }),
  ));
  lines.push('', '## Selection Policy', '');
  lines.push(`- Policy: ${analysis.trace && analysis.trace.selectionPolicy ? analysis.trace.selectionPolicy : 'unknown'}`);
  lines.push('- 人工检查重点：如果一条看起来普通的纪要排在前面，要看正文里是否有真实事件、公司、订单、价格、供需或近期催化，而不是只看标题。');
  return lines.join('\n');
}

function renderAnalysisResults({ analysis, maps }) {
  const lines = [
    '# 03 Analysis Results',
    '',
    '这里看模型分析是否有证据、有反证、有公司链路，而不是只给空泛总结。',
    '',
  ];
  lines.push(rowsToTable(
    ['Item ID', 'Original Page', 'Model Call', 'Review Status', 'Potential', 'Impact', 'Expectation Gap', 'Companies', 'Why Potential'],
    (analysis.itemAnalyses || []).map((item) => {
      const call = maps.modelCallById.get(item.itemId) || {};
      return [
        item.itemId,
        mdLink('open', item.sourceUrl),
        `${call.status || ''}${call.model ? ` / ${call.model}` : ''}${call.reason ? ` / ${call.reason}` : ''}`,
        item.reviewStatus,
        String(item.potentialScore),
        String(item.marketImpactScore),
        String(item.expectationGapScore),
        (item.relatedCompanies || []).map((company) => `${company.companyName}${company.stockCode ? `(${company.stockCode})` : ''}`).join(', '),
        snippet(item.whyPotential || item.whyNotPotential, 220),
      ];
    }),
  ));
  lines.push('', '## Theme Clusters', '');
  lines.push(rowsToTable(
    ['Score', 'Theme', 'Recommendation', 'Source Items', 'Companies', 'Why'],
    (analysis.rankedThemes || []).map((theme) => [
      String(theme.priorityScore),
      theme.themeName,
      theme.publishRecommendation || '',
      (theme.sourceItemIds || []).join(', '),
      (theme.companyNames || []).join(', '),
      snippet(theme.why, 220),
    ]),
  ));
  return lines.join('\n');
}

function renderItemChain({ itemId, maps }) {
  const extracted = maps.extractedById.get(itemId) || {};
  const normalized = maps.normalizedById.get(itemId) || {};
  const raw = maps.rawById.get(extracted.rawId) || {};
  const selection = maps.selectionById.get(itemId) || {};
  const analysis = maps.analysisById.get(itemId) || {};
  const modelCall = maps.modelCallById.get(itemId) || {};
  const lines = [
    `# Item Chain - ${itemId}`,
    '',
    `- Title: ${extracted.title || analysis.title || ''}`,
    `- Original article page: ${mdLink(extracted.originalUrl || extracted.sourceUrl || analysis.sourceUrl, extracted.originalUrl || extracted.sourceUrl || analysis.sourceUrl)}`,
    `- Source entry page: ${mdLink(raw.sourceUrl || (raw.source && raw.source.url), raw.sourceUrl || (raw.source && raw.source.url))}`,
    `- Review status: ${analysis.reviewStatus || extracted.status}`,
    '',
    '## 1. Original Webpage',
    '',
    rowsToTable(
      ['Field', 'Value'],
      [
        ['article url', extracted.originalUrl || extracted.sourceUrl || analysis.sourceUrl],
        ['source url', raw.sourceUrl || (raw.source && raw.source.url) || ''],
        ['source name', extracted.sourceName || (raw.source && raw.source.sourceName) || analysis.sourceName || ''],
        ['publish time', extracted.publishTime || analysis.publishTime || ''],
      ],
    ),
    '',
    '## 2. Crawled Source Page',
    '',
    rowsToTable(
      ['Field', 'Value'],
      [
        ['raw id', raw.id || extracted.rawId || ''],
        ['raw status', raw.status || ''],
        ['http status', raw.httpStatus || ''],
        ['crawled at', raw.crawledAt || ''],
        ['source body length', String((raw.bodyText || '').length)],
        ['linked item count', String((raw.linkedItems || []).length)],
        ['raw error', raw.error || ''],
      ],
    ),
    '',
    '### Crawled Source Preview',
    '',
    '```text',
    safeFence(snippet(raw.bodyText || raw.error, 1200)),
    '```',
    '',
    '## 3. Extracted Information',
    '',
    rowsToTable(
      ['Field', 'Value'],
      [
        ['extraction method', extracted.extractionMethod || ''],
        ['extracted status', extracted.status || ''],
        ['body length', String((extracted.bodyText || '').length)],
        ['discovery score', String(extracted.discoveryScore || 0)],
        ['discovery reasons', (extracted.discoveryReasons || []).join(', ')],
        ['dedupe hash', extracted.dedupeHash || ''],
      ],
    ),
    '',
    '### Full Extracted Text',
    '',
    '```text',
    safeFence(extracted.bodyText || ''),
    '```',
    '',
    '## 4. Potential Candidate Selection',
    '',
    rowsToTable(
      ['Field', 'Value'],
      [
        ['selected for model', selection.itemId ? 'YES' : 'NO'],
        ['selection score', selection.selectionScore || ''],
        ['selection reasons', (selection.selectionReasons || []).join(', ')],
        ['normalized keywords', (normalized.keywords || []).join(', ')],
        ['known company candidates', (normalized.entityCandidates || []).map((company) => `${company.companyName}${company.stockCode ? `(${company.stockCode})` : ''}`).join(', ')],
        ['summary candidate', normalized.summaryCandidate || ''],
      ],
    ),
    '',
    '## 5. Model Analysis Result',
    '',
    rowsToTable(
      ['Field', 'Value'],
      [
        ['model call', `${modelCall.status || ''}${modelCall.model ? ` / ${modelCall.model}` : ''}${modelCall.reason ? ` / ${modelCall.reason}` : ''}`],
        ['review status', analysis.reviewStatus || 'not analyzed'],
        ['is potential', String(Boolean(analysis.isPotential))],
        ['potential score', analysis.potentialScore || ''],
        ['market impact score', analysis.marketImpactScore || ''],
        ['expectation gap score', analysis.expectationGapScore || ''],
        ['freshness score', analysis.freshnessScore || ''],
        ['evidence strength', analysis.evidenceStrength || ''],
        ['why potential', analysis.whyPotential || ''],
        ['why not potential', analysis.whyNotPotential || ''],
      ],
    ),
    '',
    '### Extracted Facts From Model',
    '',
    '```json',
    safeFence(JSON.stringify(analysis.extractedInfo || {}, null, 2)),
    '```',
    '',
    '### Prediction Lens',
    '',
    '```json',
    safeFence(JSON.stringify(analysis.predictionLens || {}, null, 2)),
    '```',
    '',
    '### Related Companies',
    '',
  ];
  lines.push(rowsToTable(
    ['Company', 'Score', 'Evidence Tier', 'Chain Position', 'Transmission', 'Weakness / Need Verify', 'Evidence Quote'],
    (analysis.relatedCompanies || []).map((company) => [
      `${company.companyName}${company.stockCode ? `(${company.stockCode})` : ''}`,
      String(company.importanceScore || ''),
      company.reasoning && company.reasoning.evidenceTier || '',
      company.reasoning && company.reasoning.chainPosition || '',
      company.reasoning && company.reasoning.revenueTransmission || company.relation || '',
      company.reasoning && (company.reasoning.weaknessInArticleEvidence || company.reasoning.verificationNeeded) || '',
      company.evidenceQuote || '',
    ]),
  ));
  lines.push('', '### Evidence Items', '');
  lines.push(rowsToTable(
    ['Evidence ID', 'Source', 'Strength', 'Supports', 'Quote'],
    (analysis.evidenceItems || []).map((evidence) => [
      evidence.evidenceId,
      mdLink(evidence.sourceName || 'source', evidence.sourceUrl),
      evidence.strength || '',
      evidence.supports || '',
      evidence.quote || '',
    ]),
  ));
  lines.push('', '## Manual Acceptance Questions', '');
  lines.push('- [ ] 原网页标题、正文和 `Full Extracted Text` 对得上。');
  lines.push('- [ ] 高潜力筛选分数不是被标题党或页面噪声骗出来。');
  lines.push('- [ ] 每个相关公司都有原文证据，且证据等级没有夸大。');
  lines.push('- [ ] `whyPotential` 和 `predictionLens` 里的推演能从原文事实推出。');
  lines.push('- [ ] `whyNotPotential`、风险、反证信号说清楚了不确定性。');
  return lines.join('\n');
}

function run(date) {
  const outputDir = datedOutputDir(date);
  const reviewDir = path.join(outputDir, 'manual-review');
  const itemDir = path.join(reviewDir, 'items');
  ensureDir(itemDir);
  const artifacts = loadArtifacts(outputDir);
  const maps = buildMaps(artifacts);
  const itemIds = ((artifacts.analysis.trace && artifacts.analysis.trace.selectedItems) || [])
    .map((item) => item.itemId)
    .filter((id) => maps.extractedById.has(id) || maps.analysisById.has(id));
  const itemFiles = [];
  for (const itemId of itemIds) {
    const extracted = maps.extractedById.get(itemId) || {};
    const file = path.join(itemDir, `${itemId}-${slug(extracted.title || itemId)}.md`);
    writeText(file, renderItemChain({ itemId, maps }));
    itemFiles.push(file);
  }
  writeText(path.join(reviewDir, '00-source-pages.md'), renderSourcePages(artifacts));
  writeText(path.join(reviewDir, '01-extracted-items.md'), renderExtractedItems({ ...artifacts, maps }));
  writeText(path.join(reviewDir, '02-potential-selection.md'), renderPotentialSelection({ ...artifacts, maps }));
  writeText(path.join(reviewDir, '03-analysis-results.md'), renderAnalysisResults({ ...artifacts, maps }));
  writeText(path.join(reviewDir, 'README.md'), renderReadme({ date, reviewDir, ...artifacts, itemFiles }));
  const manifest = {
    date,
    generatedAt: new Date().toISOString(),
    reviewDir,
    files: [
      path.join(reviewDir, 'README.md'),
      path.join(reviewDir, '00-source-pages.md'),
      path.join(reviewDir, '01-extracted-items.md'),
      path.join(reviewDir, '02-potential-selection.md'),
      path.join(reviewDir, '03-analysis-results.md'),
      ...itemFiles,
    ],
    selectedItemIds: itemIds,
    sourceCount: artifacts.raw.sourceCount,
    extractedCount: artifacts.extracted.extractedCount,
    analysisStatus: artifacts.analysis.reviewStatus,
    verificationStatus: artifacts.verification ? artifacts.verification.status : 'not_run',
  };
  writeJson(path.join(reviewDir, 'manual-review-manifest.json'), manifest);
  console.log(JSON.stringify({ status: 'OK', reviewDir, files: manifest.files.length }, null, 2));
  return manifest;
}

if (require.main === module) {
  const args = parseArgs();
  run(args.date);
}

module.exports = {
  run,
  renderReadme,
  renderSourcePages,
  renderExtractedItems,
  renderPotentialSelection,
  renderAnalysisResults,
  renderItemChain,
};
