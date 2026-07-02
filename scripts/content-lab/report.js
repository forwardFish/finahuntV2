const { DISCLAIMER } = require('../../services/shared/compliance');
const { parseArgs, datedOutputDir, readJson, writeText } = require('./common');

function renderLedger(analysis) {
  const lines = [
    `# Content Lab Review Ledger - ${analysis.date}`,
    '',
    `- Review status: ${analysis.reviewStatus}`,
    `- Extracted news: ${analysis.trace ? analysis.trace.extractedCount : 0}/${analysis.trace ? analysis.trace.targetMinimum : 20}`,
    `- Model: ${analysis.trace ? `${analysis.trace.modelProvider}/${analysis.trace.model}` : 'unknown'}`,
    `- Compliance: ${analysis.compliance ? analysis.compliance.status : 'UNKNOWN'}`,
    '',
    '## Potential Ranking',
    '',
  ];
  const itemAnalyses = [...(analysis.itemAnalyses || [])].sort((a, b) => b.potentialScore - a.potentialScore);
  for (const item of itemAnalyses) {
    lines.push(`### ${item.potentialScore} | ${item.title}`);
    lines.push(`- Source: [${item.sourceName}](${item.sourceUrl})`);
    lines.push(`- Scores: impact ${item.marketImpactScore}, expectation gap ${item.expectationGapScore}, freshness ${item.freshnessScore}`);
    lines.push(`- Why potential: ${item.whyPotential || 'needs model rerun'}`);
    lines.push(`- Why not: ${item.whyNotPotential || 'needs model rerun'}`);
    if (item.predictionLens) {
      lines.push(`- Prediction types: ${(item.predictionLens.predictionTypes || []).join(', ') || 'none'}`);
      lines.push('- Leading signals:');
      for (const signal of item.predictionLens.leadingSignals || []) {
        lines.push(`  - ${signal.signal || signal.evidenceQuote}${signal.whyEarly ? ` | why early: ${signal.whyEarly}` : ''}`);
      }
      lines.push('- Inference chains:');
      for (const chain of item.predictionLens.inferenceChains || []) {
        lines.push(`  - ${chain.trigger || 'event'} -> ${chain.constraint || 'constraint'} -> ${chain.forcedBehavior || 'forced behavior'} -> ${chain.transmissionPath || 'transmission pending'}`);
        if ((chain.validationSignals || []).length) lines.push(`    - validation: ${(chain.validationSignals || []).join(' / ')}`);
        if ((chain.falsificationSignals || []).length) lines.push(`    - falsification: ${(chain.falsificationSignals || []).join(' / ')}`);
      }
    }
    lines.push(`- Companies: ${(item.relatedCompanies || []).map((company) => `${company.companyName}${company.stockCode ? `(${company.stockCode})` : ''}`).join('、') || 'none with evidence'}`);
    for (const evidence of item.evidenceItems || []) {
      lines.push(`- Evidence: ${evidence.quote} | [source](${evidence.sourceUrl})`);
    }
    lines.push('');
  }
  lines.push('## Theme Clusters', '');
  for (const theme of analysis.rankedThemes || []) {
    lines.push(`- ${theme.priorityScore} | ${theme.themeName} | ${theme.publishRecommendation || 'review'} | ${theme.why || ''}`);
  }
  lines.push('', '## Company Evidence', '');
  for (const company of analysis.rankedCompanies || []) {
    lines.push(`- ${company.companyName}${company.stockCode ? `(${company.stockCode})` : ''} | score ${company.score} | evidence ${(company.evidenceItems || []).length}`);
  }
  lines.push('', '## Model Calls', '');
  for (const call of analysis.trace ? analysis.trace.deepseekCalls || [] : []) {
    lines.push(`- ${call.itemId}: ${call.status}${call.reason ? ` | ${call.reason}` : ''}`);
  }
  if (analysis.trace && (analysis.trace.selectedItems || []).length) {
    lines.push('', '## Selected Model Inputs', '');
    for (const item of analysis.trace.selectedItems || []) {
      lines.push(`- ${item.selectionScore} | ${item.itemId} | ${item.title} | ${(item.selectionReasons || []).join(', ')}`);
    }
  }
  lines.push('', `> ${DISCLAIMER}`);
  return lines.join('\n');
}

function renderDraft(analysis) {
  const lines = [`# Xiaohongshu Draft - ${analysis.date}`, ''];
  if (!(analysis.xiaohongshuDraft || []).length) {
    lines.push('本轮未生成可直接发布草稿。请先完成 DeepSeek 潜力判断和人工审稿。');
    lines.push('');
    lines.push(`> ${DISCLAIMER}`);
    return lines.join('\n');
  }
  for (const draft of analysis.xiaohongshuDraft || []) {
    lines.push(`## ${draft.rank}. ${draft.title}`);
    lines.push('');
    lines.push(draft.body);
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

function run(date) {
  const outputDir = datedOutputDir(date);
  const analysis = readJson(`${outputDir}/theme-analysis.json`);
  if (!analysis) throw new Error(`Missing theme-analysis.json. Run content:analyze first for ${date}.`);
  writeText(`${outputDir}/review-ledger.md`, renderLedger(analysis));
  writeText(`${outputDir}/xiaohongshu-draft.md`, renderDraft(analysis));
  console.log(JSON.stringify({ status: 'OK', files: [`${outputDir}/review-ledger.md`, `${outputDir}/xiaohongshu-draft.md`] }, null, 2));
}

if (require.main === module) {
  const args = parseArgs();
  try {
    run(args.date);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

module.exports = { run, renderLedger, renderDraft };
