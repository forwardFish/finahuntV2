const { DISCLAIMER, FORBIDDEN_TERMS, scanObject } = require('../../services/shared/compliance');
const {
  parseArgs,
  datedOutputDir,
  readJson,
  writeJson,
  loadKnowledgeBase,
  hash,
  snippet,
  clampNumber,
  getDeepSeekConfig,
} = require('./common');
const { extractNewsItems } = require('./news-extract');
const { normalizeText, extractKeywords, extractEntities, summarize } = require('./extract');

function normalizeNewsItems(extracted, kb) {
  const seen = new Set();
  return (extracted.items || []).map((item) => {
    const text = normalizeText(`${item.title || ''}。${item.bodyText || ''}`);
    const duplicate = item.dedupeHash && seen.has(item.dedupeHash);
    if (item.dedupeHash) seen.add(item.dedupeHash);
    return {
      id: item.id,
      rawId: item.rawId,
      sourceName: item.sourceName,
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl,
      originalUrl: item.originalUrl || item.sourceUrl,
      publishTime: item.publishTime || '',
      title: item.title,
      status: item.status,
      duplicate,
      extractionMethod: item.extractionMethod,
      visibleMetrics: item.visibleMetrics || {},
      discoveryScore: item.discoveryScore || 0,
      discoveryReasons: item.discoveryReasons || [],
      discoveryRank: item.discoveryRank || 0,
      summaryCandidate: summarize(text),
      keywords: extractKeywords(text, kb.themes),
      entityCandidates: extractEntities(text, kb.companies),
      text,
      textHash: hash(text),
    };
  });
}

const MODEL_SELECTION_SIGNALS = [
  { reason: 'fresh_or_before_open', weight: 18, pattern: /\u4eca\u65e5|\u76d8\u524d|\u5f00\u76d8|\u65e9\u76d8|\u6700\u65b0|\u521a\u521a|\u76d8\u540e|\u665a\u95f4|5\s*\u6708\s*\d+\s*\u65e5/i },
  { reason: 'hard_catalyst', weight: 18, pattern: /IPO|\u8f85\u5bfc|\u653f\u7b56|\u7d27\u6025\u4e8b\u4ef6|\u5927\u4f1a|\u516c\u544a|\u53d1\u5e03|\u8bd5\u70b9|\u843d\u5730|\u91cf\u4ea7|\u6784\u6210\u7d27\u6025\u4e8b\u4ef6/i },
  { reason: 'supply_or_price', weight: 16, pattern: /\u6da8\u4ef7|\u63d0\u4ef7|\u62a5\u4ef7|\u7a3c\u52a8\u7387|\u7f3a\u8d27|\u77ed\u7f3a|\u4ea7\u80fd|\u4ea4\u671f|\u4f9b\u9700|\u5e93\u5b58/i },
  { reason: 'order_or_revenue', weight: 14, pattern: /\u8ba2\u5355|\u4e2d\u6807|\u4f9b\u8d27|\u5ba2\u6237|\u6536\u5165|\u5229\u6da6|\u4e1a\u7ee9|\u5bfc\u5165|\u4efd\u989d/i },
  { reason: 'ai_compute_chain', weight: 12, pattern: /AI|AIDC|\u7b97\u529b|\u6570\u636e\u4e2d\u5fc3|Token|\u670d\u52a1\u5668|\u5149\u6a21\u5757|\u5149\u82af\u7247|\u5b58\u50a8|\u957f\u6c5f\u5b58\u50a8|\u534a\u5bfc\u4f53/i },
  { reason: 'company_or_chain', weight: 10, pattern: /\u6838\u5fc3|\u9f99\u5934|\u4ea7\u4e1a\u94fe|\u4e0a\u6e38|\u4f9b\u5e94\u5546|\u6807\u7684|[0-9]{6}/i },
  { reason: 'has_numbers', weight: 8, pattern: /\d+(\.\d+)?\s*(%|\u4ebf|\u4e07|\u5143|\u5bb6|\u5e74|\u6708|\u5929|GW|MW|T|P)/i },
];

const MODEL_SELECTION_NOISE = [
  { reason: 'generic_digest', weight: -8, pattern: /\u7eaa\u8981|\u7814\u62a5\u7cbe\u9009|\u516c\u544a\u5927\u5168|\u8d44\u8baf|\u6295\u7968|\u770b\u597d\u65b9\u5411/i },
  { reason: 'page_chrome', weight: -20, pattern: /\u767b\u5f55|\u6ce8\u518c|\u901a\u77e5|\u79c1\u4fe1|\u4ea4\u6613\u8ba1\u5212/i },
];

function dateTokens(date) {
  const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return [];
  const month = String(Number(match[2]));
  const day = String(Number(match[3]));
  return [`${month}\u6708${day}\u65e5`, `${month}.${day}`, `${match[2]}${match[3]}`];
}

function scoreNewsItem(item, date = '') {
  const text = `${item.title || ''}\n${item.text || ''}`;
  const reasons = [];
  let score = Number(item.discoveryScore || 0);
  if (score) reasons.push('homepage_link_rank');
  const length = String(item.text || '').length;
  if (length >= 800 && length <= 12000) {
    score += 10;
    reasons.push('enough_detail');
  } else if (length < 240) {
    score -= 14;
    reasons.push('too_short');
  } else if (length > 18000) {
    score -= 4;
    reasons.push('too_long_digest');
  }
  for (const token of dateTokens(date)) {
    if (text.includes(token)) {
      score += 20;
      reasons.push('run_date_match');
      break;
    }
  }
  for (const rule of MODEL_SELECTION_SIGNALS) {
    if (rule.pattern.test(text)) {
      score += rule.weight;
      reasons.push(rule.reason);
    }
  }
  for (const rule of MODEL_SELECTION_NOISE) {
    if (rule.pattern.test(text)) {
      score += rule.weight;
      reasons.push(rule.reason);
    }
  }
  if ((item.entityCandidates || []).length) {
    score += Math.min(18, item.entityCandidates.length * 3);
    reasons.push('known_company_mentions');
  }
  if ((item.keywords || []).length) {
    score += Math.min(12, item.keywords.length * 2);
    reasons.push('known_theme_terms');
  }
  return {
    score,
    reasons: [...new Set(reasons)],
  };
}

function rankNewsItems(items, date = '') {
  return [...(items || [])]
    .map((item) => {
      const selection = scoreNewsItem(item, date);
      return { ...item, selectionScore: selection.score, selectionReasons: selection.reasons };
    })
    .sort((a, b) => b.selectionScore - a.selectionScore || String(b.text || '').length - String(a.text || '').length);
}

function parseJsonObject(text) {
  const raw = String(text || '').trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error('DeepSeek returned non-JSON content');
  }
}

async function callDeepSeekJson({ system, user, temperature = 0.2 }) {
  const config = getDeepSeekConfig();
  if (!config.apiKey) {
    return {
      ok: false,
      status: 'BLOCKED_BY_MODEL',
      reason: 'DEEPSEEK_API_KEY or OPENAI_COMPATIBLE_API_KEY is not configured',
      model: config.model,
    };
  }
  const timeoutMs = Number(process.env.CONTENT_LAB_MODEL_TIMEOUT_MS || 60000);
  const primaryTimeoutMs = Number(process.env.CONTENT_LAB_PRIMARY_MODEL_TIMEOUT_MS || Math.min(timeoutMs, 15000));
  const fallbackModel = process.env.DEEPSEEK_FALLBACK_MODEL || '';
  const models = [...new Set([config.model, fallbackModel].filter(Boolean))];
  let lastError = null;
  for (const model of models) {
    const requestTimeoutMs = model === config.model && models.length > 1 ? primaryTimeoutMs : timeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    let response;
    let payload;
    try {
      response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          temperature,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      payload = await response.json();
      if (!response.ok) {
        lastError = payload.error ? payload.error.message : `HTTP ${response.status}`;
        continue;
      }
      const content = payload.choices && payload.choices[0] && payload.choices[0].message
        ? payload.choices[0].message.content
        : '';
      return {
        ok: true,
        status: 'DEEPSEEK_USED',
        model,
        data: parseJsonObject(content),
        usage: payload.usage || {},
      };
    } catch (error) {
      lastError = error && error.name === 'AbortError' ? `Model request timed out after ${requestTimeoutMs}ms` : (error.message || String(error));
    } finally {
      clearTimeout(timeout);
    }
  }
  return {
    ok: false,
    status: 'MODEL_ERROR',
    reason: lastError || 'Model request failed',
    model: models[models.length - 1] || config.model,
  };
}

function itemPrompt(item, kbCandidates) {
  return JSON.stringify({
    instruction: '先做高保真信息提取，再分析这条公开资讯是否有题材潜力。必须返回 JSON，不要输出投资建议。',
    requiredShape: {
      itemId: item.id,
      extractedInfo: {
        oneLineSummary: '',
        coreClaim: '',
        catalystEvents: [{ event: '', evidenceQuote: '', importance: 'high|medium|low' }],
        keyFacts: [{ fact: '', evidenceQuote: '', factType: 'identity|technology|business|event|market|risk' }],
        technologyPath: [{ node: '', description: '', evidenceQuote: '' }],
        businessMapping: [{ scenario: '', howItMapsToCompany: '', evidenceQuote: '' }],
        unansweredQuestions: [''],
      },
      isPotential: true,
      potentialScore: '0-100',
      marketImpactScore: '0-100',
      expectationGapScore: '0-100',
      freshnessScore: '0-100',
      evidenceStrength: 'strong|medium|weak|insufficient',
      predictionLens: {
        predictionTypes: ['price_move|future_event|supply_constraint|theme_diffusion|event_driven'],
        leadingSignals: [{ signal: '', evidenceQuote: '', whyEarly: '' }],
        inferenceChains: [{
          trigger: '',
          constraint: '',
          forcedBehavior: '',
          transmissionPath: '',
          firstBeneficiaries: [''],
          marketRecognitionGap: '',
          validationSignals: [''],
          falsificationSignals: [''],
        }],
        priceMoveLogic: {
          cause: '',
          sustainability: '',
          marginTransmission: '',
          beneficiaryFilter: '',
          falsePositiveFilter: '',
        },
        futureEventLogic: {
          eventCalendar: [''],
          preEventExpectation: '',
          disclosureWatch: [''],
          postEventDiffusion: '',
        },
      },
      themeCandidates: [{ name: '', reason: '', evidenceQuote: '' }],
      relatedCompanies: [{
        companyName: '',
        stockCode: '',
        companyType: 'A股标的|海外技术方|产业链公司|其他',
        importanceLevel: 'core|important|context',
        importanceScore: '0-100',
        relation: '',
        whyImportant: '',
        catalystPath: '',
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
          revenueFirstTiming: '',
          profitElasticity: '',
          recognitionGap: '',
          nextCatalyst: '',
          falsificationSignal: '',
        },
        evidenceQuote: '',
        evidenceStrength: 'strong|medium|weak|insufficient',
      }],
      whyPotential: '',
      whyNotPotential: '',
      risks: [''],
      observationPoints: [''],
    },
    outputLimits: {
      catalystEventsMax: 5,
      keyFactsMax: 8,
      themeCandidatesMax: 3,
      relatedCompaniesMax: 6,
      evidenceQuoteMaxChars: 120,
      reasoningFieldMaxChars: 160,
    },
    constraints: [
      '不要只复述标题；必须从正文抽取关键事实、催化事件、供需约束、技术/产业链路径、业务映射。',
      '输出必须压缩：relatedCompanies 最多 6 个，themeCandidates 最多 3 个，catalystEvents 最多 5 个；不要把长篇纪要逐条展开。',
      '所有字段只写可审阅短句；单个 evidenceQuote 不超过 120 个中文字符，单个 reasoning 字段不超过 160 个中文字符。',
      '相关公司只能来自原文直接出现的公司名/股票代码，或原文中可明确指向的实体；不能凭行业常识补公司。',
      '重要公司必须覆盖三类：A股核心标的、海外技术方/催化源、产业链/场景公司。即使海外技术方不是A股，也要进入 relatedCompanies。',
      '每个公司必须说明为什么重要、通过什么催化路径影响主题，以及它和A股核心标的之间的关系。',
      '公司理由不能只写“核心标的”“技术方”“受益”“订单增长”。必须拆成：原文证据等级、产业链位置、收入/订单传导机制、时点或拐点、业务含义、市场关注逻辑、预期差、相对同组公司的排序理由、原文证据弱点、仍需验证的信息。',
      '如果原文只是把公司列在推荐名单里，没有订单/财务/客户/份额/产能证据，evidenceTier 必须是 named_recommendation_only，importanceScore 不能高于 70，并说明证据弱点。',
      '如果原文明确给出订单、收入、利润、客户敞口、供货关系、产能或份额，必须把数字和证据写进 revenueTransmission / timingAndInflection。',
      '必须回答“为什么是这家公司，而不是同一产业链其他公司”；如果原文无法回答，就把缺口写在 whyThisCompanyOverPeers 或 weaknessInArticleEvidence。',
      '如果理由不能从原文证据推出，要明确写入 verificationNeeded，不要把推断当事实。',
      '每个公司必须有 evidenceQuote；理由必须能回到原文证据。',
      '不得使用买入、卖出、目标价、必涨、龙头确认、收益空间等投资建议表达。',
    ],
    item: {
      id: item.id,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      publishTime: item.publishTime,
      title: item.title,
      visibleMetrics: item.visibleMetrics,
      text: snippet(item.text, Number(process.env.CONTENT_LAB_ITEM_TEXT_LIMIT || 9000)),
    },
    kbCandidates,
    predictionTask: {
      goal: '不要输出资讯摘要，输出预期差推演。',
      chain: '事件 -> 约束变化 -> 被迫选择 -> 价格/订单/利润传导 -> 最先受益公司 -> 验证信号 -> 反证信号',
      priceMove: '如果是涨价题材，必须回答涨价原因、持续性、利润率传导、真受益筛选、假受益剔除。',
      futureEvent: '如果是未来消息题材，必须回答未来事件日历、事件前预期、事件中可能披露的新信息、事件后扩散路径。',
      companyReasoning: '公司 reasoning 必须补充 revenueFirstTiming、profitElasticity、recognitionGap、nextCatalyst、falsificationSignal；如果证据不足，要明确写不足。',
    },
  });
}

function clusterPrompt(itemAnalyses) {
  const compact = itemAnalyses.map((item) => ({
    itemId: item.itemId,
    title: item.title,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    scores: {
      potentialScore: item.potentialScore,
      marketImpactScore: item.marketImpactScore,
      expectationGapScore: item.expectationGapScore,
      freshnessScore: item.freshnessScore,
    },
    themeCandidates: item.themeCandidates,
    relatedCompanies: item.relatedCompanies,
    whyPotential: item.whyPotential,
    whyNotPotential: item.whyNotPotential,
    predictionLens: item.predictionLens,
    evidenceItems: item.evidenceItems,
    risks: item.risks,
    observationPoints: item.observationPoints,
  }));
  return JSON.stringify({
    instruction: '把候选资讯聚类成题材方向，按潜力排序。必须返回 JSON。',
    requiredShape: {
      themeClusters: [{
        themeName: '',
        priorityScore: '0-100',
        marketImpact: '',
        expectationGap: '',
        chain: [{ nodeName: '', description: '', evidenceItemIds: [] }],
        sourceItemIds: [],
        companyNames: [],
        evidenceItemIds: [],
        publishRecommendation: 'publish|review|skip',
        why: '',
      }],
    },
    constraints: [
      '聚类必须来自输入 itemAnalyses，不得新增来源或公司。',
      'companyNames 只能使用输入 relatedCompanies 中已有公司。',
      '不得输出投资建议表达。',
    ],
    itemAnalyses: compact,
  });
}

function kbCandidatesForItem(item, kb) {
  const text = item.text;
  const directCompanies = kb.companies
    .filter((company) => company.name && text.includes(company.name))
    .slice(0, 12)
    .map((company) => ({ companyId: company.id, companyName: company.name, stockCode: company.code || '' }));
  const themes = kb.themes
    .filter((theme) => text.includes(theme.name) || (theme.tags || []).some((tag) => text.includes(tag)))
    .slice(0, 8)
    .map((theme) => ({ themeId: theme.id, themeName: theme.name, tags: theme.tags || [] }));
  return { directCompanies, themes };
}

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined && item !== '') : [];
}

function firstText(values, fallback = '') {
  return asArray(values).map((value) => String(value || '').trim()).find(Boolean) || fallback;
}

function hasAny(text, patterns) {
  const source = String(text || '');
  return patterns.some((pattern) => pattern.test(source));
}

const COMPLIANCE_REPLACEMENTS = {
  买入: '市场关注',
  卖出: '风险暴露',
  低吸: '低位关注',
  仓位: '暴露程度',
  目标价: '估值观察',
  必涨: '存在催化预期',
  荐股: '标的信息整理',
  龙头确认: '核心地位仍需验证',
  主线确认: '主题持续性仍需验证',
  收益空间: '弹性观察',
  确定性机会: '高确定性线索仍需验证',
  明天看涨: '短期方向需验证',
  翻倍空间: '高弹性假设需验证',
};

function sanitizeComplianceText(text) {
  return FORBIDDEN_TERMS.reduce((current, term) => {
    const replacement = COMPLIANCE_REPLACEMENTS[term] || '中性观察';
    return current.split(term).join(replacement);
  }, String(text || ''));
}

function sanitizeForCompliance(value) {
  if (typeof value === 'string') return sanitizeComplianceText(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeForCompliance(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeForCompliance(item)]));
  }
  return value;
}

function detectPredictionTypes(text) {
  const source = String(text || '');
  const types = [];
  if (hasAny(source, [/涨价|提价|价格上调|价格反转|涨幅|报价|价差|库存|稼动率|产能利用率/])) types.push('price_move');
  if (hasAny(source, [/上市|招股书|IPO|发布会|财报|大会|会议|试验|发射|交付|量产|投产|开幕|预计|计划/])) types.push('future_event');
  if (hasAny(source, [/供需缺口|供应紧张|产能不足|交期|缺货|短缺|瓶颈|海外.*饱和|订单外溢/])) types.push('supply_constraint');
  if (hasAny(source, [/AI|AIDC|算力|数据中心|机器人|商业航天|卫星|低空|国产替代/])) types.push('theme_diffusion');
  return types.length ? types : ['event_driven'];
}

function normalizeSignals(value, fallback) {
  const signals = asArray(value).map((signal) => {
    if (typeof signal === 'string') return { signal, evidenceQuote: '', whyEarly: '' };
    return {
      signal: signal.signal || signal.name || signal.fact || '',
      evidenceQuote: signal.evidenceQuote || signal.quote || '',
      whyEarly: signal.whyEarly || signal.reason || '',
    };
  }).filter((signal) => signal.signal || signal.evidenceQuote);
  return signals.length ? signals : fallback;
}

function normalizeChains(value, fallback) {
  const chains = asArray(value).map((chain) => ({
    trigger: chain.trigger || chain.triggerEvent || '',
    constraint: chain.constraint || chain.constraintChange || chain.changedConstraint || '',
    forcedBehavior: chain.forcedBehavior || chain.forcedChoice || '',
    transmissionPath: chain.transmissionPath || chain.revenueTransmission || '',
    firstBeneficiaries: asArray(chain.firstBeneficiaries || chain.firstCompanies || chain.beneficiaries),
    marketRecognitionGap: chain.marketRecognitionGap || chain.expectationGap || '',
    validationSignals: asArray(chain.validationSignals),
    falsificationSignals: asArray(chain.falsificationSignals || chain.reverseSignals),
  })).filter((chain) => chain.trigger || chain.constraint || chain.transmissionPath);
  return chains.length ? chains : fallback;
}

function buildPredictionLens({ result, item, extractedInfo, companyResults, risks, observationPoints, whyNotPotential }) {
  const rawLens = result.predictionLens || result.anticipation || {};
  const text = `${item.title || ''}\n${item.text || ''}\n${result.whyPotential || ''}`;
  const predictionTypes = asArray(rawLens.predictionTypes).length
    ? asArray(rawLens.predictionTypes)
    : detectPredictionTypes(text);
  const catalystEvents = asArray(extractedInfo.catalystEvents);
  const keyFacts = asArray(extractedInfo.keyFacts);
  const businessMapping = asArray(extractedInfo.businessMapping);
  const leadingSignalFallback = [
    ...catalystEvents.slice(0, 3).map((event) => ({
      signal: event.event || event.fact || '',
      evidenceQuote: event.evidenceQuote || '',
      whyEarly: '来自原文催化事件，需要继续验证是否领先于市场认知。',
    })),
    ...keyFacts.slice(0, 2).map((fact) => ({
      signal: fact.fact || '',
      evidenceQuote: fact.evidenceQuote || '',
      whyEarly: '来自原文关键事实，可作为后续跟踪变量。',
    })),
  ].filter((signal) => signal.signal || signal.evidenceQuote);
  const chainFallback = [{
    trigger: extractedInfo.coreClaim || firstText(catalystEvents.map((event) => event.event), item.title),
    constraint: firstText(keyFacts.map((fact) => fact.fact), firstText(catalystEvents.map((event) => event.evidenceQuote), '约束未被模型明确提取')),
    forcedBehavior: firstText(businessMapping.map((mapping) => mapping.scenario), '产业链参与者可能被迫调整采购、价格、产能或订单节奏'),
    transmissionPath: result.whyPotential || firstText(businessMapping.map((mapping) => mapping.howItMapsToCompany), ''),
    firstBeneficiaries: companyResults.slice(0, 5).map((company) => company.companyName),
    marketRecognitionGap: result.expectationGapReason || result.whyPotential || '',
    validationSignals: observationPoints.length ? observationPoints : ['后续公告、价格、订单、产能利用率、财报毛利率是否验证推演'],
    falsificationSignals: risks.length ? risks : [whyNotPotential || '后续价格、订单或需求数据无法验证推演'],
  }];
  return {
    predictionTypes,
    leadingSignals: normalizeSignals(rawLens.leadingSignals, leadingSignalFallback),
    inferenceChains: normalizeChains(rawLens.inferenceChains, chainFallback),
    priceMoveLogic: {
      cause: rawLens.priceMoveLogic && rawLens.priceMoveLogic.cause || '',
      sustainability: rawLens.priceMoveLogic && rawLens.priceMoveLogic.sustainability || '',
      marginTransmission: rawLens.priceMoveLogic && rawLens.priceMoveLogic.marginTransmission || '',
      beneficiaryFilter: rawLens.priceMoveLogic && rawLens.priceMoveLogic.beneficiaryFilter || '',
      falsePositiveFilter: rawLens.priceMoveLogic && rawLens.priceMoveLogic.falsePositiveFilter || '',
    },
    futureEventLogic: {
      eventCalendar: asArray(rawLens.futureEventLogic && rawLens.futureEventLogic.eventCalendar),
      preEventExpectation: rawLens.futureEventLogic && rawLens.futureEventLogic.preEventExpectation || '',
      disclosureWatch: asArray(rawLens.futureEventLogic && rawLens.futureEventLogic.disclosureWatch),
      postEventDiffusion: rawLens.futureEventLogic && rawLens.futureEventLogic.postEventDiffusion || '',
    },
    companyScreeningRules: {
      core: '优先找最先拿订单、收入占比高、利润弹性大、市场尚未充分认知、未来1-4周有催化的公司。',
      exclude: '剔除收入占比过低、长协无法调价、下游成本承压、只有概念没有订单/客户/产能证据的公司。',
    },
  };
}

function validateItemResult(raw, item) {
  const result = raw && typeof raw === 'object' ? raw : {};
  const extractedInfo = result.extractedInfo && typeof result.extractedInfo === 'object' ? result.extractedInfo : {};
  const relatedCompanies = Array.isArray(result.relatedCompanies) ? result.relatedCompanies : [];
  const themeCandidates = Array.isArray(result.themeCandidates) ? result.themeCandidates : [];
  const risks = Array.isArray(result.risks) ? result.risks : [];
  const observationPoints = Array.isArray(result.observationPoints) ? result.observationPoints : [];
  const whyNotPotential = result.whyNotPotential
    || result.whyMayFail
    || (risks.length ? risks.join('; ') : '')
    || (Array.isArray(extractedInfo.unansweredQuestions) ? extractedInfo.unansweredQuestions.join('; ') : '');
  const evidenceItems = [];
  const companyResults = relatedCompanies
    .filter((company) => {
      if (!company || !company.companyName || !company.evidenceQuote) return false;
      const nameLooksReal = !/未明确|未提及|不详|未知|无具体|暂无|^无$|N\/A/i.test(company.companyName);
      const quoteIsFromSource = !/原文未|未直接提及|行业常识|未提及|无直接证据|推测/i.test(company.evidenceQuote);
      return nameLooksReal && quoteIsFromSource;
    })
    .map((company, index) => {
      const evidenceId = `ev-${item.id}-company-${index + 1}`;
      evidenceItems.push({
        evidenceId,
        sourceItemId: item.id,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        quote: snippet(company.evidenceQuote, 260),
        strength: company.evidenceStrength || 'medium',
        supports: `company:${company.companyName}`,
      });
      return {
        companyName: company.companyName,
        stockCode: company.stockCode || '',
        companyType: company.companyType || '',
        importanceLevel: company.importanceLevel || '',
        importanceScore: clampNumber(company.importanceScore),
        relation: company.relation || '',
        whyImportant: company.whyImportant || '',
        catalystPath: company.catalystPath || '',
        reasoning: company.reasoning && typeof company.reasoning === 'object' ? {
          sourceEvidence: company.reasoning.sourceEvidence || '',
          evidenceTier: company.reasoning.evidenceTier || '',
          chainPosition: company.reasoning.chainPosition || '',
          revenueTransmission: company.reasoning.revenueTransmission || '',
          timingAndInflection: company.reasoning.timingAndInflection || '',
          businessMeaning: company.reasoning.businessMeaning || '',
          marketAttentionLogic: company.reasoning.marketAttentionLogic || '',
          expectationGap: company.reasoning.expectationGap || '',
          whyThisCompanyOverPeers: company.reasoning.whyThisCompanyOverPeers || '',
          weaknessInArticleEvidence: company.reasoning.weaknessInArticleEvidence || '',
          verificationNeeded: company.reasoning.verificationNeeded || '',
          revenueFirstTiming: company.reasoning.revenueFirstTiming || '',
          profitElasticity: company.reasoning.profitElasticity || '',
          recognitionGap: company.reasoning.recognitionGap || '',
          nextCatalyst: company.reasoning.nextCatalyst || '',
          falsificationSignal: company.reasoning.falsificationSignal || '',
        } : {
          sourceEvidence: snippet(company.evidenceQuote, 260),
          evidenceTier: '',
          chainPosition: '',
          revenueTransmission: '',
          timingAndInflection: '',
          businessMeaning: '',
          marketAttentionLogic: '',
          expectationGap: '',
          whyThisCompanyOverPeers: '',
          weaknessInArticleEvidence: '',
          verificationNeeded: '',
          revenueFirstTiming: '',
          profitElasticity: '',
          recognitionGap: '',
          nextCatalyst: '',
          falsificationSignal: '',
        },
        evidenceQuote: snippet(company.evidenceQuote, 260),
        evidenceStrength: company.evidenceStrength || 'medium',
        evidenceItemIds: [evidenceId],
      };
    });
  const baseEvidenceId = `ev-${item.id}-base`;
  const baseQuote = themeCandidates[0] && themeCandidates[0].evidenceQuote
    ? themeCandidates[0].evidenceQuote
    : item.summaryCandidate;
  evidenceItems.unshift({
    evidenceId: baseEvidenceId,
    sourceItemId: item.id,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    quote: snippet(baseQuote, 260),
    strength: result.evidenceStrength || 'medium',
    supports: 'potential',
  });
  const predictionLens = buildPredictionLens({
    result,
    item,
    extractedInfo,
    companyResults,
    risks,
    observationPoints,
    whyNotPotential,
  });
  return {
    itemId: item.id,
    title: item.title,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    publishTime: item.publishTime,
    visibleMetrics: item.visibleMetrics,
    extractedInfo: {
      oneLineSummary: extractedInfo.oneLineSummary || '',
      coreClaim: extractedInfo.coreClaim || '',
      catalystEvents: Array.isArray(extractedInfo.catalystEvents) ? extractedInfo.catalystEvents : [],
      keyFacts: Array.isArray(extractedInfo.keyFacts) ? extractedInfo.keyFacts : [],
      technologyPath: Array.isArray(extractedInfo.technologyPath) ? extractedInfo.technologyPath : [],
      businessMapping: Array.isArray(extractedInfo.businessMapping) ? extractedInfo.businessMapping : [],
      unansweredQuestions: Array.isArray(extractedInfo.unansweredQuestions) ? extractedInfo.unansweredQuestions : [],
    },
    isPotential: Boolean(result.isPotential),
    potentialScore: clampNumber(result.potentialScore),
    marketImpactScore: clampNumber(result.marketImpactScore),
    expectationGapScore: clampNumber(result.expectationGapScore),
    freshnessScore: clampNumber(result.freshnessScore),
    evidenceStrength: result.evidenceStrength || 'insufficient',
    predictionLens,
    themeCandidates,
    relatedCompanies: companyResults,
    whyPotential: result.whyPotential || '',
    whyNotPotential,
    risks,
    observationPoints,
    evidenceItems,
    reviewStatus: companyResults.some((company) => !company.evidenceQuote) || !result.whyPotential || !whyNotPotential
      ? 'needs_review'
      : 'ready_for_editor_review',
  };
}

function fallbackBlockedAnalysis(item) {
  return {
    itemId: item.id,
    title: item.title,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    publishTime: item.publishTime,
    visibleMetrics: item.visibleMetrics,
    isPotential: false,
    potentialScore: 0,
    marketImpactScore: 0,
    expectationGapScore: 0,
    freshnessScore: 0,
    evidenceStrength: 'insufficient',
    predictionLens: {
      predictionTypes: ['blocked'],
      leadingSignals: [],
      inferenceChains: [],
      priceMoveLogic: { cause: '', sustainability: '', marginTransmission: '', beneficiaryFilter: '', falsePositiveFilter: '' },
      futureEventLogic: { eventCalendar: [], preEventExpectation: '', disclosureWatch: [], postEventDiffusion: '' },
      companyScreeningRules: {
        core: '模型未完成，不能生成预期差推演。',
        exclude: '模型未完成，不能筛选公司。',
      },
    },
    themeCandidates: [],
    relatedCompanies: [],
    whyPotential: '',
    whyNotPotential: 'DeepSeek 未配置或调用失败，不能生成潜力判断。',
    risks: ['模型未完成分析，需补跑。'],
    observationPoints: [],
    evidenceItems: [{
      evidenceId: `ev-${item.id}-blocked`,
      sourceItemId: item.id,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      quote: snippet(item.summaryCandidate || item.text, 260),
      strength: 'insufficient',
      supports: 'model_blocked',
    }],
    reviewStatus: 'blocked_by_model',
  };
}

function validateAnalysis(analysis) {
  const required = ['newsItems', 'itemAnalyses', 'themeClusters', 'rankedThemes', 'rankedCompanies', 'evidenceItems', 'xiaohongshuDraft', 'reviewStatus', 'trace'];
  const missing = required.filter((key) => !(key in analysis));
  const scoreOutOfRange = [];
  const completedItems = (analysis.itemAnalyses || []).filter((item) => item.reviewStatus !== 'blocked_by_model');
  for (const item of completedItems) {
    for (const field of ['potentialScore', 'marketImpactScore', 'expectationGapScore', 'freshnessScore']) {
      const value = Number(item[field]);
      if (!Number.isFinite(value) || value < 0 || value > 100) scoreOutOfRange.push(`${item.itemId}.${field}`);
    }
  }
  const companyEvidenceGaps = (analysis.rankedCompanies || []).filter((company) => !(company.evidenceItems || []).length);
  const potentialGaps = completedItems.filter((item) => !item.whyPotential || !item.whyNotPotential || !(item.evidenceItems || []).length);
  const predictionGaps = completedItems.filter((item) => {
    const lens = item.predictionLens || {};
    return !(lens.leadingSignals || []).length || !(lens.inferenceChains || []).length;
  });
  return { missing, scoreOutOfRange, companyEvidenceGaps, potentialGaps, predictionGaps };
}

function rankedCompanies(itemAnalyses) {
  const byName = new Map();
  for (const item of itemAnalyses) {
    for (const company of item.relatedCompanies || []) {
      const key = `${company.companyName}-${company.stockCode || ''}`;
      const current = byName.get(key) || {
        companyName: company.companyName,
        stockCode: company.stockCode || '',
        relation: company.relation || '',
        score: 0,
        evidenceTier: '',
        revenueFirstTiming: '',
        profitElasticity: '',
        recognitionGap: '',
        nextCatalyst: '',
        falsificationSignal: '',
        evidenceItems: [],
        sourceItemIds: [],
      };
      current.score = Math.max(current.score, Math.round(item.potentialScore * 0.4 + (company.importanceScore || 0) * 0.6));
      current.evidenceTier = current.evidenceTier || (company.reasoning ? company.reasoning.evidenceTier : '');
      current.revenueFirstTiming = current.revenueFirstTiming || (company.reasoning ? company.reasoning.revenueFirstTiming : '');
      current.profitElasticity = current.profitElasticity || (company.reasoning ? company.reasoning.profitElasticity : '');
      current.recognitionGap = current.recognitionGap || (company.reasoning ? company.reasoning.recognitionGap : '');
      current.nextCatalyst = current.nextCatalyst || (company.reasoning ? company.reasoning.nextCatalyst : '');
      current.falsificationSignal = current.falsificationSignal || (company.reasoning ? company.reasoning.falsificationSignal : '');
      current.evidenceItems.push(...(company.evidenceItemIds || []).map((id) => item.evidenceItems.find((e) => e.evidenceId === id)).filter(Boolean));
      current.sourceItemIds.push(item.itemId);
      byName.set(key, current);
    }
  }
  return [...byName.values()].sort((a, b) => b.score - a.score);
}

function buildDraft(clusters) {
  return (clusters || [])
    .filter((cluster) => cluster.publishRecommendation === 'publish')
    .slice(0, 3)
    .map((cluster, index) => ({
      rank: index + 1,
      themeName: cluster.themeName,
      title: `今日题材线索：${cluster.themeName}`,
      body: [
        `今天观察到一个公开信息方向：${cluster.themeName}。`,
        `核心逻辑：${cluster.why}`,
        `预期差：${cluster.expectationGap}`,
        `链路拆解：${(cluster.chain || []).map((node) => node.nodeName).join(' -> ') || '待复核'}`,
        `相关公司：${(cluster.companyNames || []).join('、') || '原文暂无足够证据支撑公司结论'}`,
        DISCLAIMER,
      ].join('\n\n'),
    }));
}

async function run(date) {
  const outputDir = datedOutputDir(date);
  const raw = readJson(`${outputDir}/raw-items.json`);
  if (!raw) throw new Error(`Missing raw-items.json. Run content:crawl first for ${date}.`);
  const kb = loadKnowledgeBase();
  const extracted = readJson(`${outputDir}/extracted-news-items.json`) || extractNewsItems(raw);
  writeJson(`${outputDir}/extracted-news-items.json`, extracted);

  const newsItems = normalizeNewsItems(extracted, kb);
  writeJson(`${outputDir}/normalized-items.json`, {
    date,
    generatedAt: new Date().toISOString(),
    duplicateCount: newsItems.filter((item) => item.duplicate).length,
    items: newsItems,
  });

  const analyzable = rankNewsItems(
    newsItems.filter((item) => item.status === 'EXTRACTED' && !item.duplicate && item.text.length >= 80),
    date,
  );
  const startIndex = Number(process.env.CONTENT_LAB_MODEL_START_INDEX || 0);
  const maxItems = Number(process.env.CONTENT_LAB_MAX_MODEL_ITEMS || 30);
  const selectedItems = analyzable.slice(startIndex, startIndex + maxItems);
  const deepseekCalls = [];
  const itemAnalyses = [];
  for (const item of selectedItems) {
    const response = await callDeepSeekJson({
      system: '你是A股公开资讯题材研究助手。只做信息整理和潜力判断，不给投资建议。必须返回 JSON。',
      user: itemPrompt(item, kbCandidatesForItem(item, kb)),
    });
    deepseekCalls.push({ itemId: item.id, status: response.status, model: response.model, reason: response.reason || '' });
    itemAnalyses.push(response.ok ? validateItemResult(response.data, item) : fallbackBlockedAnalysis(item));
  }

  let clusterResponse = { ok: false, status: 'BLOCKED_BY_MODEL', reason: 'No item analyses' };
  if (itemAnalyses.some((item) => item.reviewStatus !== 'blocked_by_model')) {
    clusterResponse = await callDeepSeekJson({
      system: '你是题材聚类与审稿助手。只根据输入资讯聚类，不新增事实，不给投资建议。必须返回 JSON。',
      user: clusterPrompt(itemAnalyses.filter((item) => item.reviewStatus !== 'blocked_by_model')),
    });
  }
  deepseekCalls.push({ itemId: 'theme-cluster', status: clusterResponse.status, model: clusterResponse.model || getDeepSeekConfig().model, reason: clusterResponse.reason || '' });
  const themeClusters = clusterResponse.ok && Array.isArray(clusterResponse.data.themeClusters) ? clusterResponse.data.themeClusters : [];
  const evidenceItems = itemAnalyses.flatMap((item) => item.evidenceItems || []);
  const companyRank = rankedCompanies(itemAnalyses);
  const rankedThemes = themeClusters
    .map((cluster) => ({ ...cluster, priorityScore: clampNumber(cluster.priorityScore) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
  const draft = buildDraft(rankedThemes);
  const safeGenerated = sanitizeForCompliance({
    itemAnalyses,
    themeClusters,
    rankedThemes,
    companyRank,
    evidenceItems,
    draft,
  });
  const blockedTerms = scanObject(safeGenerated);
  const itemModelFailures = deepseekCalls.filter((call) => call.itemId !== 'theme-cluster' && ['BLOCKED_BY_MODEL', 'MODEL_ERROR'].includes(call.status));
  const modelBlocked = itemAnalyses.length > 0 && itemAnalyses.every((item) => item.reviewStatus === 'blocked_by_model');
  const modelPartial = itemModelFailures.length > 0 || ['BLOCKED_BY_MODEL', 'MODEL_ERROR'].includes(clusterResponse.status);
  const analysis = {
    date,
    newsItems: newsItems.map((item) => ({
      id: item.id,
      title: item.title,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      publishTime: item.publishTime,
      status: item.status,
      visibleMetrics: item.visibleMetrics,
      summaryCandidate: item.summaryCandidate,
      discoveryScore: item.discoveryScore,
      discoveryReasons: item.discoveryReasons,
    })),
    itemAnalyses: safeGenerated.itemAnalyses,
    themeClusters: safeGenerated.themeClusters,
    rankedThemes: safeGenerated.rankedThemes,
    rankedCompanies: safeGenerated.companyRank,
    evidenceItems: safeGenerated.evidenceItems,
    xiaohongshuDraft: safeGenerated.draft,
    reviewStatus: modelBlocked
      ? 'BLOCKED_BY_MODEL'
      : modelPartial
        ? 'PASS_WITH_REVIEW_ITEMS'
      : extracted.extractedCount < extracted.targetMinimum
        ? 'PASS_WITH_REVIEW_ITEMS'
        : 'PASS_WITH_EDITOR_REVIEW',
    compliance: {
      status: blockedTerms.length ? 'blocked' : 'passed',
      blockedTerms,
      disclaimer: DISCLAIMER,
    },
    trace: {
      generatedAt: new Date().toISOString(),
      rawSourceCount: raw.sourceCount,
      extractedCount: extracted.extractedCount,
      targetMinimum: extracted.targetMinimum,
      modelProvider: 'deepseek',
      model: getDeepSeekConfig().model,
      itemModelFailureCount: itemModelFailures.length,
      selectionPolicy: 'rank_by_fresh_catalyst_supply_order_company_signal',
      selectedItems: selectedItems.map((item) => ({
        itemId: item.id,
        title: item.title,
        sourceUrl: item.sourceUrl,
        selectionScore: item.selectionScore,
        selectionReasons: item.selectionReasons,
      })),
      deepseekCalls,
    },
  };
  analysis.schemaValidation = validateAnalysis(analysis);
  if (analysis.compliance.status !== 'passed' || analysis.schemaValidation.missing.length || analysis.schemaValidation.scoreOutOfRange.length) {
    analysis.reviewStatus = 'FAIL';
  }
  writeJson(`${outputDir}/deepseek-item-analysis.json`, {
    date,
    generatedAt: new Date().toISOString(),
    itemAnalyses,
    deepseekCalls,
  });
  writeJson(`${outputDir}/theme-analysis.json`, analysis);
  console.log(JSON.stringify({
    status: 'OK',
    extractedCount: extracted.extractedCount,
    itemAnalysisCount: itemAnalyses.length,
    reviewStatus: analysis.reviewStatus,
    file: `${outputDir}/theme-analysis.json`,
  }, null, 2));
  return analysis;
}

if (require.main === module) {
  const args = parseArgs();
  run(args.date).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  run,
  normalizeNewsItems,
  rankNewsItems,
  scoreNewsItem,
  validateAnalysis,
};
