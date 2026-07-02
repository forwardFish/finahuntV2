const { crawlSource } = require('./crawl');
const { getDeepSeekConfig, parseArgs } = require('./common');

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function parseJsonFromText(text) {
  const raw = String(text || '').trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch (error) {
        return { parseError: error.message, rawText: raw };
      }
    }
    return { parseError: 'No JSON object found', rawText: raw };
  }
}

async function callModel(article) {
  const config = getDeepSeekConfig();
  const timeoutMs = Number(process.env.CONTENT_LAB_MODEL_TIMEOUT_MS || 600000);
  const primaryTimeoutMs = Number(process.env.CONTENT_LAB_PRIMARY_MODEL_TIMEOUT_MS || Math.min(timeoutMs, 15000));
  const maxTokens = Number(process.env.CONTENT_LAB_MODEL_MAX_TOKENS || 8192);
  const outputFormat = process.env.CONTENT_LAB_OUTPUT_FORMAT || 'json';
  const basePrompt = {
    instruction: [
      '你是A股题材研究员。请对给定单篇公开文章做深度投研拆解。',
      outputFormat === 'text' ? '请输出中文分析文本，结构清晰，不要输出 JSON。' : '必须输出合法 JSON，不要输出投资建议，不要使用买入、卖出、目标价、必涨等表达。',
      '只能使用原文事实。不得补充原文没有直接出现的公司。',
      '公司理由不能只写“核心标的/受益/订单增长”。必须解释产业链位置、收入或订单传导、时点拐点、市场为什么会关注、预期差、相对同组公司的排序理由、证据弱点、仍需验证项。',
    ].join('\n'),
    article,
  };
  const prompt = outputFormat === 'text' ? {
    ...basePrompt,
    outputSections: [
      '1. 原文关键信息提取',
      '2. 题材成立的产业逻辑',
      '3. 重要公司逐一深度拆解：证据等级、产业链位置、收入/订单传导、时点拐点、市场关注逻辑、预期差、相对同组排序、证据弱点、仍需验证项',
      '4. 公司排序和剔除逻辑',
      '5. 风险与后续验证清单',
    ],
  } : {
    ...basePrompt,
    requiredOutput: {
      extractedInfo: {
        coreClaim: '',
        keyCatalysts: [{ catalyst: '', evidenceQuote: '', importance: 'high|medium|low' }],
        supplyDemandFacts: [{ fact: '', evidenceQuote: '', implication: '' }],
        industryChainNodes: [{ node: '', whyRelevant: '', evidenceQuote: '' }],
        keyNumbers: [{ metric: '', value: '', meaning: '' }],
        geographyAndSegments: [{ segment: '', logic: '', evidenceQuote: '' }],
        unresolvedChecks: [''],
      },
      themeJudgement: {
        isPotential: true,
        potentialScore: '0-100',
        marketImpactScore: '0-100',
        expectationGapScore: '0-100',
        whyPotential: '',
        whyMayFail: '',
      },
      importantCompanies: [{
        companyName: '',
        stockCode: '',
        roleInChain: '',
        importanceScore: '0-100',
        whyImportant: '',
        reasoning: {
          sourceEvidence: '',
          evidenceTier: 'direct_order_or_financial|direct_business_position|named_recommendation_only|context_only',
          chainPosition: '',
          revenueTransmission: '',
          timingAndInflection: '',
          businessMeaning: '',
          marketAttentionLogic: '',
          expectationGap: '',
          whyThisCompanyOverPeers: '',
          weaknessInArticleEvidence: '',
          verificationNeeded: '',
        },
        evidenceQuote: '',
        confidence: 'strong|medium|weak',
      }],
      rankingLogic: '',
      riskAndVerification: [''],
    },
    rules: [
      '如果原文只是把公司列在推荐名单里，没有订单、财务、客户、份额、产能证据，evidenceTier 必须为 named_recommendation_only，importanceScore 不能高于 70。',
      '如果原文给了数字，必须把数字写入 keyNumbers，并在相关公司的 revenueTransmission / timingAndInflection 中解释它怎么传导。',
      '如果无法证明某公司强于同组公司，必须在 whyThisCompanyOverPeers 或 weaknessInArticleEvidence 写明缺口。',
      '如果原文没有明确公司名单，importantCompanies 返回空数组，并在 rankingLogic 说明需要补充哪些产业链公司映射。',
    ],
  };

  const fallbackModel = process.env.DEEPSEEK_FALLBACK_MODEL || '';
  const models = [...new Set([config.model, fallbackModel].filter(Boolean))];
  let lastError = null;
  for (const model of models) {
    const requestTimeoutMs = model === config.model && models.length > 1 ? primaryTimeoutMs : timeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: outputFormat === 'text' ? '输出中文分析文本。' : '只输出合法 JSON。' },
          { role: 'user', content: JSON.stringify(prompt) },
        ],
      }),
    });
    const payloadText = await response.text();
    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      payload = { raw: payloadText.slice(0, 1000) };
    }
    if (!response.ok) {
      lastError = payload.error ? payload.error.message : payload.raw;
      continue;
    }
    const content = payload.choices && payload.choices[0] && payload.choices[0].message
      ? payload.choices[0].message.content
      : '';
    return {
      ok: true,
      model,
      usage: payload.usage || {},
      finishReason: payload.choices && payload.choices[0] ? payload.choices[0].finish_reason : '',
      data: outputFormat === 'text' ? { rawText: content } : parseJsonFromText(content),
      rawContentPreview: content.slice(0, 500),
    };
    } catch (error) {
      lastError = error && error.name === 'AbortError' ? `timeout after ${requestTimeoutMs}ms` : (error.message || String(error));
    } finally {
      clearTimeout(timeout);
    }
  }
  return {
    ok: false,
    model: models[models.length - 1] || config.model,
    error: lastError || 'model request failed',
  };
}

async function run() {
  const args = parseArgs();
  if (!args.url) throw new Error('Missing --url');
  const raw = await crawlSource({
    url: args.url,
    sourceName: '九阳公社',
    sourceType: 'public_web',
    note: 'single article',
    priority: 1,
  }, 0);
  const article = {
    title: raw.title,
    url: raw.sourceUrl,
    publishTime: raw.publishTime,
    bodyText: cleanText(raw.bodyText),
  };
  const analysis = await callModel(article);
  const result = {
    crawl: {
      status: raw.status,
      httpStatus: raw.httpStatus,
      title: raw.title,
      url: raw.sourceUrl,
      publishTime: raw.publishTime,
      bodyLen: article.bodyText.length,
      bodyPreview: raw.bodyPreview,
      error: raw.error,
    },
    analysis,
  };
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { run, callModel };
