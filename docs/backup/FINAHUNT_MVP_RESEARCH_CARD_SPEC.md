# Finahunt MVP 开发说明：消息级潜在题材催化研究卡

文档状态：MVP 开发执行版  
修订日期：2026-05-17  
适用对象：Codex / oh-my-codex / 研发 / 测试 / 产品验收  
核心目标：15-25 天内完成可内测收费版本  

---

## 1. MVP 核心目标

MVP 不做完整 Finahunt 大系统，只做一个核心功能：

```text
系统抓取一条消息
        ↓
系统判断是否有效催化
        ↓
输出结构化研究卡
        ↓
用户查看证据、相关公司、风险、后续观察点
```

MVP 要验证的问题：

> 用户是否愿意为“把公开市场消息自动整理成潜在题材催化研究卡”付费。

---

## 2. MVP 产品形态

### 2.1 用户看到的产品

用户打开 Finahunt 后，只看到一个非常直接的入口：

> 粘贴一条公告、政策、快讯或行业消息，系统自动生成一张研究卡。

研究卡告诉用户：

- 这条消息是否有效催化。
- 催化类型是什么。
- 催化等级是什么。
- 可能对应什么题材。
- 相关公司是谁。
- 公司为什么相关。
- 证据在哪里。
- 风险是什么。
- 后续观察什么。

### 2.2 用户不应该看到的东西

MVP 不展示复杂工作台，不展示全市场资讯流，不做买卖点，不做推荐股票，不做订阅自动扣费。

---

## 3. MVP 功能范围

### 3.1 P0 必做功能

#### F01 用户登录

目标：支持内测用户进入系统。

要求：

- 支持手机号或邮箱登录，具体按当前项目已有能力选择最简单方案。
- 如果当前项目没有登录系统，可以先做极简登录：手机号 + 验证码 mock / 邮箱 + magic link mock / 管理员创建用户。
- 用户必须有唯一 user_id。

验收：

- 用户能登录。
- 用户登录后能看到自己的权益、剩余次数和历史研究卡。

---

#### F02 激活码与内测权益

目标：不做订阅，不做自动续费，用激活码开通 30 天内测资格。

要求：

- 后台可生成激活码。
- 激活码包含有效天数、每日研究卡次数、总次数限制。
- 用户输入激活码后，开通 30 天权益。
- 默认权益：99 元 / 30 天，每天 20 张研究卡。
- 到期后不可继续生成研究卡，但可以查看历史记录。
- 后台可手动延长权益和调整次数。

验收：

- 激活码只能兑换一次。
- 兑换后用户权益生效。
- 到期时间正确。
- 每日次数限制正确。
- 超过次数后提示用户已达今日上限。

---

#### F03 消息输入

目标：用户可以手动粘贴一条公开市场消息。

字段：

- 消息标题。
- 消息正文。
- 来源名称。
- 来源链接。
- 发布时间。

要求：

- 标题和正文必填。
- 来源链接可选，但有来源链接时必须保存。
- 提交后生成 raw_content 记录。
- 自动进入研究卡生成流程。

验收：

- 用户粘贴消息后可以生成研究卡。
- 空内容不能提交。
- 所有输入保存到数据库。

---

#### F04 系统抓取 / 后台录入消息

目标：支持后台抓取或录入消息，模拟后续自动化数据源。

MVP 最低要求：

- 后台可以手动录入消息。
- 后台可以点击“抓取最新消息”按钮。
- 如果真实抓取暂时不稳定，可先用 seed 数据或合规公开测试数据跑通流程。

推荐实现：

- 建立 sources 表。
- 支持 1-3 个合规公开源。
- 每条抓取消息保存 source_id、source_url、publish_time、crawled_at、source_hash。
- 重复消息通过 source_hash 或 dedupe_hash 去重。

验收：

- 后台能看到消息列表。
- 每条消息有处理状态。
- 能从后台触发生成研究卡。

---

#### F05 消息清洗与标准化

目标：把原始消息转成可分析的标准化内容。

处理内容：

- 去除多余空格、HTML、乱码字符。
- 标准化标题。
- 生成 dedupe_hash。
- 抽取关键词。
- 抽取实体：公司、行业、政策、产品、地区、机构等。
- 抽取证据片段。

验收：

- raw_content 能生成 normalized_content。
- 空内容、乱码内容、明显无效内容能标记异常。
- 重复内容不重复生成多张研究卡。

---

#### F06 有效催化判断

目标：判断一条消息是不是值得生成研究卡。

输出：

- is_valid_catalyst: true / false。
- invalid_reason。
- catalyst_sentence。
- catalyst_type。
- catalyst_level。
- timeliness_score。
- confidence_score。

催化等级：

- L1 重大催化。
- L2 重要催化。
- L3 一般催化。
- L4 噪声信息。

催化类型：

- 政策催化。
- 产业催化。
- 技术催化。
- 公司经营催化。
- 供需催化。
- 价格催化。
- 事件驱动催化。
- 监管 / 风险催化。
- 舆论热度催化。
- 噪声 / 无效消息。

验收：

- 明显政策、公告、产业消息可以识别为有效催化。
- 纯行情播报、重复旧闻、无来源传言可以识别为 L4。
- 结果必须解释为什么这样判断。

---

#### F07 题材归纳

目标：从有效消息中归纳可能关联的题材。

输出：

- theme_name。
- core_logic。
- related_industry_chain。
- lifecycle_hint。
- evidence_summary。

MVP 简化：

- lifecycle_hint 可以只输出：萌芽期 / 发酵期 / 暂不判断。
- 不做复杂题材生命周期状态机。
- 不做历史相似案例。

验收：

- 每张有效研究卡至少输出 1 个题材方向。
- 题材逻辑必须能从消息原文或证据推导出来。
- 不能随意创造无法解释的题材。

---

#### F08 相关公司映射

目标：输出与题材存在客观关联的公司列表。

MVP 要求：

- 支持从内置公司知识库 / 简化映射表 / 公开材料摘要中匹配公司。
- 每家公司必须有理由。
- 每家公司必须有证据或证据不足提示。
- 公司数量建议控制在 3-10 个，避免变成无差别列表。

输出字段：

- stock_code。
- stock_name。
- company_name。
- industry_chain_role。
- match_score。
- purity_score。
- reason_summary。
- evidence_text。
- evidence_source。
- risk_flags。

验收：

- 不能只列公司名称。
- 不能输出“最受益”“龙头”“必涨”。
- 证据不足时必须明确提示“证据不足，需进一步核验”。

---

#### F09 证据链展示

目标：让用户知道每个判断从哪里来。

要求：

- 原始消息来源必须展示。
- 催化句必须展示。
- 公司理由必须绑定证据。
- 证据可来自原始消息、公告摘要、公司公开材料、政策文件等。
- 每条证据记录 source_name 和 source_url。

验收：

- 研究卡不能只有结论，必须有证据。
- 用户能看到证据片段。
- 证据不足时不能装作确定。

---

#### F10 风险提示与后续观察点

目标：避免用户误解为投资建议，同时让研究卡可复盘。

风险提示包括：

- 消息真实性风险。
- 政策落地不确定性。
- 公司关联证据不足。
- 概念蹭边风险。
- 业绩兑现不确定性。
- 市场情绪过热风险。
- 监管或财务风险。

后续观察点必须是客观信号，例如：

- 是否有后续政策细则。
- 是否有公司公告确认。
- 是否有订单、产品、产能、收入占比等公开证据。
- 是否有更多权威来源报道。
- 是否有产业链上下游同步变化。

验收：

- 每张卡必须有风险提示。
- 每张卡必须有 2-5 个后续观察点。
- 后续观察点不得变成买卖建议。

---

#### F11 合规拦截

目标：所有用户可见内容必须先过合规检查。

禁止词 / 风险表达：

- 荐股。
- 买入。
- 卖出。
- 低吸。
- 仓位。
- 目标价。
- 必涨。
- 龙头确认。
- 主线确认。
- 收益空间。
- 确定性机会。
- 明天看涨。

替代表达：

- 研究价值。
- 观察价值。
- 客观关联。
- 证据强度。
- 后续观察节点。
- 公开信息整理。

标准声明：

> 本内容仅为公开市场信息的客观汇总与整理，不构成任何投资建议，不代表对任何个股、题材或市场走势的价值判断。股市有风险，投资需谨慎。

验收：

- 研究卡生成前执行合规检测。
- 检测失败的卡不能发布给用户。
- 后台可以看到 blocked_terms。

---

#### F12 研究卡详情页

目标：让用户清晰消费研究卡。

页面结构：

1. 顶部：消息标题、来源、发布时间、生成时间。
2. 摘要：一句话说明这条消息是什么。
3. 催化判断：是否有效催化、催化类型、等级、时效。
4. 题材逻辑：题材名称、核心逻辑。
5. 相关公司：公司列表、理由、证据、风险。
6. 证据链：原文片段和来源链接。
7. 风险提示。
8. 后续观察点。
9. 合规声明。
10. 用户反馈：有用 / 一般 / 没用 + 文本反馈。

验收：

- 用户 1 分钟内能看懂研究卡。
- 信息层级清楚。
- 移动端可读。
- 无乱码。

---

#### F13 历史研究卡

目标：用户能回看自己生成过的卡。

要求：

- 列表展示标题、题材、催化等级、生成时间、反馈状态。
- 支持进入详情。
- 支持按时间排序。
- 可选支持按题材 / 催化等级筛选。

验收：

- 用户能看到自己的历史卡。
- 不显示其他用户的卡。

---

#### F14 用户反馈

目标：内测期通过用户反馈修正系统。

反馈项：

- 有用。
- 一般。
- 没用。
- 文本反馈：哪里判断错了？哪里有价值？

后台字段：

- card_id。
- user_id。
- rating。
- comment。
- admin_status。
- created_at。

验收：

- 用户能提交反馈。
- 后台能查看反馈。
- 反馈能按有用 / 没用筛选。

---

#### F15 后台管理

后台必须足够简单。

页面：

1. 消息列表。
2. 研究卡列表。
3. 用户列表。
4. 激活码列表。
5. 反馈列表。

后台能力：

- 手动录入消息。
- 手动抓取消息。
- 手动触发生成研究卡。
- 查看生成失败原因。
- 创建激活码。
- 延长用户权益。
- 调整用户次数。
- 查看反馈。

验收：

- 管理员可以完成内测运营所需操作。
- 不追求漂亮，只要稳定、清楚、可用。

---

## 4. MVP 暂不做功能

明确不做：

- 订阅。
- 自动续费。
- 微信/支付宝复杂支付闭环。
- 实盘交易。
- 买卖点。
- 仓位建议。
- 收益预测。
- 目标价。
- 主线发酵完整页。
- 复杂工作台。
- 历史相似案例。
- 旧消息再发酵。
- 社区。
- 分享裂变。
- 团队版。
- 小程序。
- App。
- 完整观察池。
- 完整题材生命周期图谱。

---

## 5. MVP 页面清单

### 5.1 用户端页面

| 页面 | 路由建议 | 说明 |
|---|---|---|
| 登录页 | `/login` | 内测用户登录 |
| 激活页 | `/activate` | 输入激活码开通权益 |
| 研究卡生成页 | `/` 或 `/research-card` | 粘贴消息 / 生成研究卡 |
| 研究卡详情页 | `/research-cards/[id]` | 查看完整研究卡 |
| 历史研究卡页 | `/history` | 查看历史研究卡 |
| 权益页 | `/account` | 查看到期时间和剩余次数 |

### 5.2 后台页面

| 页面 | 路由建议 | 说明 |
|---|---|---|
| 后台首页 | `/admin` | 简单数据概览 |
| 消息列表 | `/admin/messages` | 原始消息和处理状态 |
| 研究卡列表 | `/admin/cards` | 所有研究卡 |
| 用户列表 | `/admin/users` | 内测用户和权益 |
| 激活码列表 | `/admin/activation-codes` | 创建和查看激活码 |
| 反馈列表 | `/admin/feedbacks` | 用户反馈 |

---

## 6. 数据库设计

以下为建议字段，开发时可按当前项目 ORM 调整，但语义不能丢。

### 6.1 sources

```sql
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  authority_level TEXT,
  access_method TEXT,
  license_or_usage_basis TEXT,
  rate_limit TEXT,
  robots_or_terms_constraint TEXT,
  enabled_status TEXT NOT NULL DEFAULT 'enabled',
  risk_level TEXT NOT NULL DEFAULT 'low',
  last_reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 raw_contents

```sql
CREATE TABLE raw_contents (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  source_name TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  publish_time TIMESTAMP,
  crawled_at TIMESTAMP,
  source_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.3 normalized_contents

```sql
CREATE TABLE normalized_contents (
  id TEXT PRIMARY KEY,
  raw_content_id TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  cleaned_text TEXT NOT NULL,
  dedupe_hash TEXT,
  entities_json JSON,
  keywords_json JSON,
  evidence_spans_json JSON,
  compliance_flags_json JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.4 research_cards

```sql
CREATE TABLE research_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  raw_content_id TEXT,
  normalized_content_id TEXT,
  event_title TEXT NOT NULL,
  event_summary TEXT,
  is_valid_catalyst BOOLEAN NOT NULL DEFAULT FALSE,
  invalid_reason TEXT,
  catalyst_sentence TEXT,
  catalyst_type TEXT,
  catalyst_level TEXT,
  timeliness_score INTEGER,
  confidence_score INTEGER,
  theme_name TEXT,
  theme_logic TEXT,
  risk_summary TEXT,
  observation_points_json JSON,
  card_json JSON NOT NULL,
  compliance_status TEXT NOT NULL DEFAULT 'pending',
  compliance_disclaimer TEXT,
  trace_id TEXT,
  run_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.5 research_card_evidences

```sql
CREATE TABLE research_card_evidences (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  evidence_type TEXT,
  evidence_text TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  source_publish_time TIMESTAMP,
  related_field TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.6 stock_theme_matches

```sql
CREATE TABLE stock_theme_matches (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  theme_name TEXT,
  stock_code TEXT,
  stock_name TEXT,
  company_name TEXT,
  industry_chain_role TEXT,
  match_score INTEGER,
  purity_score INTEGER,
  match_basis TEXT,
  evidence_text TEXT,
  evidence_source TEXT,
  risk_flags_json JSON,
  reason_summary TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.7 users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT,
  email TEXT,
  nickname TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

### 6.8 activation_codes

```sql
CREATE TABLE activation_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  batch_name TEXT,
  valid_days INTEGER NOT NULL DEFAULT 30,
  daily_card_limit INTEGER NOT NULL DEFAULT 20,
  total_card_limit INTEGER,
  status TEXT NOT NULL DEFAULT 'unused',
  assigned_user_id TEXT,
  redeemed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.9 user_entitlements

```sql
CREATE TABLE user_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entitlement_type TEXT NOT NULL DEFAULT 'beta_30d',
  started_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  daily_card_limit INTEGER NOT NULL DEFAULT 20,
  total_card_limit INTEGER,
  used_total_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.10 usage_records

```sql
CREATE TABLE usage_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  card_id TEXT,
  action_type TEXT NOT NULL,
  usage_date DATE NOT NULL,
  cost_units INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.11 card_feedbacks

```sql
CREATE TABLE card_feedbacks (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating TEXT NOT NULL,
  comment TEXT,
  admin_status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. API 设计

### 7.1 用户端 API

#### POST `/api/research-cards/generate`

根据用户输入消息生成研究卡。

Request:

```json
{
  "input_type": "manual_text",
  "title": "消息标题",
  "content": "消息正文",
  "source_name": "来源名称",
  "source_url": "来源链接",
  "publish_time": "2026-05-17T09:00:00+08:00"
}
```

Response:

```json
{
  "success": true,
  "card_id": "card_001",
  "trace_id": "trace_001",
  "status": "completed"
}
```

失败 Response:

```json
{
  "success": false,
  "error_code": "LIMIT_EXCEEDED",
  "message": "今日研究卡次数已用完"
}
```

---

#### GET `/api/research-cards/:id`

获取研究卡详情。

---

#### GET `/api/research-cards`

获取当前用户历史研究卡。

Query:

- page。
- page_size。
- catalyst_level。
- theme_name。

---

#### POST `/api/research-cards/:id/feedback`

提交反馈。

Request:

```json
{
  "rating": "useful",
  "comment": "公司证据部分有帮助"
}
```

---

#### GET `/api/me/entitlement`

查看权益。

Response:

```json
{
  "status": "active",
  "expires_at": "2026-06-17T23:59:59+08:00",
  "daily_card_limit": 20,
  "today_used": 3,
  "today_remaining": 17
}
```

---

#### POST `/api/activation-codes/redeem`

兑换激活码。

Request:

```json
{
  "code": "FH-202605-XXXX"
}
```

---

### 7.2 后台 API

#### POST `/api/admin/crawl-latest`

手动触发抓取。

#### GET `/api/admin/raw-contents`

查看原始消息。

#### POST `/api/admin/raw-contents`

后台手动录入消息。

#### POST `/api/admin/raw-contents/:id/generate-card`

后台为某条消息生成研究卡。

#### GET `/api/admin/cards`

查看全部研究卡。

#### GET `/api/admin/users`

查看用户。

#### POST `/api/admin/activation-codes`

生成激活码。

Request:

```json
{
  "batch_name": "beta_batch_01",
  "count": 30,
  "valid_days": 30,
  "daily_card_limit": 20
}
```

#### PATCH `/api/admin/user-entitlements/:id`

调整用户权益。

#### GET `/api/admin/feedbacks`

查看反馈。

---

## 8. 研究卡 JSON Contract

所有研究卡必须保存完整 JSON。

```json
{
  "version": "mvp.v1",
  "source": {
    "title": "",
    "content_summary": "",
    "source_name": "",
    "source_url": "",
    "publish_time": "",
    "crawled_at": ""
  },
  "event": {
    "title": "",
    "summary": "",
    "is_valid_catalyst": true,
    "invalid_reason": "",
    "confidence_score": 0
  },
  "catalyst": {
    "sentence": "",
    "type": "政策催化",
    "level": "L2",
    "timeliness_score": 80,
    "reason": ""
  },
  "theme": {
    "name": "",
    "core_logic": "",
    "industry_chain": [],
    "lifecycle_hint": "萌芽期"
  },
  "companies": [
    {
      "stock_code": "",
      "stock_name": "",
      "company_name": "",
      "industry_chain_role": "",
      "match_score": 0,
      "purity_score": 0,
      "reason_summary": "",
      "evidence_text": "",
      "evidence_source": "",
      "risk_flags": []
    }
  ],
  "evidences": [
    {
      "evidence_type": "source_text",
      "evidence_text": "",
      "source_name": "",
      "source_url": "",
      "related_field": "catalyst_sentence"
    }
  ],
  "risks": [
    ""
  ],
  "observation_points": [
    ""
  ],
  "compliance": {
    "status": "passed",
    "blocked_terms": [],
    "replaced_terms": [],
    "disclaimer": "本内容仅为公开市场信息的客观汇总与整理，不构成任何投资建议，不代表对任何个股、题材或市场走势的价值判断。股市有风险，投资需谨慎。"
  },
  "trace": {
    "trace_id": "",
    "run_id": "",
    "generated_at": ""
  }
}
```

---

## 9. 模型 / 规则处理流程

### 9.1 Pipeline

```text
输入原始消息
  ↓
validateInput
  ↓
createRawContent
  ↓
normalizeContent
  ↓
extractEvent
  ↓
analyzeCatalyst
  ↓
mapTheme
  ↓
mapCompanies
  ↓
bindEvidence
  ↓
generateRisks
  ↓
generateObservationPoints
  ↓
runComplianceGuard
  ↓
saveResearchCard
  ↓
renderCardDetail
```

### 9.2 规则优先

以下部分优先用规则：

- 空内容校验。
- 重复消息校验。
- 禁止词拦截。
- 催化等级基本规则。
- 用户次数限制。
- 激活码有效期。
- 合规声明。

### 9.3 模型辅助

以下部分可以使用大模型：

- 事件摘要。
- 催化句抽取。
- 催化类型解释。
- 题材核心逻辑。
- 公司理由整理。
- 风险提示。
- 后续观察点。

模型必须输出 JSON，并经过 schema validation。

---

## 10. 内测付费模式

### 10.1 当前付费方式

MVP 不做订阅。

采用：

> 99 元 / 30 天内测席位，一次性购买，不自动续费。

### 10.2 用户权益

内测用户权益：

- 30 天使用资格。
- 每天 20 张研究卡。
- 可查看历史研究卡。
- 可提交反馈。
- 可查看每日精选卡。
- 到期后可手动续期。

### 10.3 开通流程

```text
用户申请内测
  ↓
人工确认是否适合
  ↓
用户付款 99 元
  ↓
管理员后台生成激活码
  ↓
用户登录并兑换激活码
  ↓
系统开通 30 天权益
```

### 10.4 免费体验

MVP 可以选择不开免费体验。

如果要做免费体验，建议：

- 免费用户每天 1 张简版研究卡。
- 简版只显示催化类型、题材方向、简要风险。
- 完整公司理由、证据链和历史记录需要内测席位。

但第一批内测更建议直接收费，验证真实付费意愿。

---

## 11. 内测运营流程

### 11.1 内测招募

目标：第一批 30 人。

招募对象：

- 每天复盘的短线用户。
- 关注题材轮动的人。
- 经常看公告和政策的人。
- 做财经自媒体复盘的人。
- 小型投研社群中的核心用户。

### 11.2 申请表

申请字段：

1. 做 A 股多久。
2. 每天花多少时间看资讯 / 复盘。
3. 关注方向。
4. 当前使用工具。
5. 最大痛点。
6. 是否愿意支付 99 元。
7. 是否愿意每天反馈。
8. 微信号 / 手机号。

### 11.3 每日运营

- 早上：发 3-5 条潜在催化样例。
- 盘后：发 5-10 张高质量研究卡。
- 晚上：收集反馈并优化规则。

### 11.4 禁止话术

禁止：

- 明天买什么。
- 哪个会涨。
- 低吸机会。
- 龙头确认。
- 主线确认。
- 确定性机会。
- 收益空间。

推荐：

- 公开消息整理。
- 潜在催化研究卡。
- 盘后复盘素材。
- 相关公司证据链。
- 后续客观观察点。

---

## 12. 验收标准

### 12.1 功能验收

必须通过：

- 用户能登录。
- 用户能兑换激活码。
- 用户能看到剩余次数。
- 用户能输入消息。
- 系统能生成研究卡。
- 用户能查看详情。
- 用户能查看历史。
- 用户能提交反馈。
- 后台能录入消息。
- 后台能生成激活码。
- 后台能查看用户和反馈。

### 12.2 研究卡验收

每张有效研究卡必须有：

- 原始消息。
- 来源。
- 是否有效催化。
- 催化句。
- 催化类型。
- 催化等级。
- 题材逻辑。
- 相关公司。
- 公司理由。
- 证据。
- 风险。
- 后续观察点。
- 合规声明。

### 12.3 质量验收

测试 10 条真实消息：

- 至少 8 条能正确判断是否有效催化。
- 明显噪声不能输出为强催化。
- 公司关联不能没有理由。
- 证据不足必须提示。
- 输出不能出现买卖建议。

### 12.4 合规验收

用户可见输出 100% 不得出现：

- 荐股。
- 买入。
- 卖出。
- 低吸。
- 仓位。
- 目标价。
- 必涨。
- 收益空间。
- 龙头确认。
- 主线确认。

### 12.5 商业化验收

- 激活码可用。
- 权益有效期正确。
- 每日次数限制正确。
- 到期后无法继续生成。
- 后台可延长权限。
- 没有自动续费入口。
- 页面明确写明“一次性购买，不自动续费”。

---

## 13. 开发排期建议

### 第 1-3 天：底座

- 数据库表。
- 用户登录简化版。
- 激活码。
- 权益检查。
- 原始消息录入。

### 第 4-7 天：研究卡链路

- 消息清洗。
- 催化判断。
- 题材归纳。
- 公司映射。
- 证据绑定。
- 合规拦截。
- 研究卡保存。

### 第 8-10 天：页面

- 研究卡生成页。
- 研究卡详情页。
- 历史页。
- 后台消息页。
- 后台用户页。

### 第 11-15 天：内测必需增强

- 用户反馈。
- 后台反馈管理。
- 后台激活码批量生成。
- 每日次数限制。
- 错误处理。
- seed 数据。
- 基础测试。

### 第 16-25 天：质量打磨

- 研究卡质量优化。
- 合规词库完善。
- 公司映射规则优化。
- 页面可读性优化。
- 10-30 条真实消息回归测试。
- 内测交付报告。

---

## 14. Codex 执行提示词

下面这段可以直接给 Codex / oh-my-codex：

```text
请在当前 Finahunt 仓库中开发 MVP：消息级潜在题材催化研究卡。

本阶段只做一个核心链路：
系统抓取或用户输入一条公开市场消息 -> 判断是否有效催化 -> 输出结构化研究卡 -> 用户查看证据、相关公司、风险、后续观察点。

必须实现：
1. 用户登录或最小用户系统。
2. 激活码开通 30 天内测权益。
3. 每日研究卡生成次数限制，默认每天 20 张。
4. 用户输入消息生成研究卡。
5. 后台录入或抓取消息。
6. 消息清洗与标准化。
7. 有效催化判断。
8. 催化类型、等级、时效判断。
9. 题材归纳。
10. 相关公司映射。
11. 公司理由、证据、风险、后续观察点。
12. 合规拦截，禁止荐股、买卖点、收益承诺、涨跌预测。
13. 研究卡详情页。
14. 历史研究卡页。
15. 用户反馈：有用 / 一般 / 没用。
16. 后台用户、激活码、消息、研究卡、反馈管理。
17. 基础测试和 build 验证。

不做：
1. 订阅。
2. 自动续费。
3. 微信/支付宝复杂支付闭环。
4. 推荐股票。
5. 买卖点。
6. 仓位建议。
7. 收益预测。
8. 完整工作台。
9. 主线发酵页。
10. 历史相似案例。
11. 社区。
12. 小程序或 App。

所有用户可见输出必须附带合规声明：
本内容仅为公开市场信息的客观汇总与整理，不构成任何投资建议，不代表对任何个股、题材或市场走势的价值判断。股市有风险，投资需谨慎。

完成后请运行：
- 后端/通用测试
- 前端 build
- API smoke 测试
- 核心流程测试：登录 -> 激活 -> 输入消息 -> 生成研究卡 -> 查看详情 -> 提交反馈 -> 后台查看。

最后输出开发报告，说明完成了哪些功能、如何测试、已知风险、如何启动。
```

---

## 15. MVP 最终判断

这个 MVP 成功的标准不是功能多，而是用户看到研究卡后觉得：

> 这张卡确实帮我节省了复盘时间，帮我把消息、题材、公司、证据、风险都整理好了。

如果“一条消息 -> 一张研究卡”做不准，任何复杂功能都没有意义。

所以当前所有开发都围绕一句话：

> 把消息级潜在题材催化研究卡做到极致。
