# Finahunt MVP 开发说明：带证据链的题材链路研究卡

文档状态：MVP 开发执行版  
修订日期：2026-05-18  
适用对象：Codex / oh-my-codex / 研发 / 测试 / 产品验收  
核心目标：15-25 天内完成可内测收费版本  
本次修订重点：从“消息级研究卡”升级为“带证据链的题材链路研究卡”，但 MVP 仍然只围绕“一条消息 → 一张高质量研究卡”实现。

---

## 0. 本次产品决策结论

### 0.1 结论一句话

Finahunt MVP 不是做一个热闹的题材榜单工具，而是先把一条公开消息加工成一张高质量、可追溯、可复盘的题材链路研究卡。

最终定位表达：

> Finahunt MVP = 一条消息 → 一张带证据链的题材链路研究卡。

### 0.2 为什么不是单纯“消息级研究卡”

原来的“消息级研究卡”方向是对的，但用户实际想看的不是一篇报告，而是：

```text
这条消息是什么？
        ↓
它是不是有效催化？
        ↓
它对应什么题材？
        ↓
题材背后有哪些产业链环节？
        ↓
哪些公司与哪些环节存在客观关联？
        ↓
每个判断的证据在哪里？
        ↓
风险和后续观察点是什么？
```

所以研究卡的表达方式必须升级。

不是只输出一段文字，而是输出一个清晰的题材链路：

```text
事件 / 消息
  → 催化判断
  → 题材方向
  → 产业链环节
  → 相关公司
  → 证据强度
  → 风险提示
  → 后续观察点
```

### 0.3 MVP 阶段是否要实现“题材链路研究卡”

要实现，但要控制边界。

MVP 要实现的是：

- 每张研究卡内部必须有“事件 → 题材 → 产业链环节 → 相关公司 → 证据 → 风险 → 观察点”的结构。
- 详情页必须用卡片 / 简化链路图方式展示，不要只做长文本。
- 每家公司必须绑定证据强度和风险提示。
- 用户 1 分钟内能看懂这张卡为什么有研究价值。

MVP 不实现的是：

- 不做全市场完整题材图谱。
- 不做复杂产业链数据库。
- 不做涨幅排行、涨停排行、主线确认、龙头确认。
- 不做大规模自动化全市场扫描。
- 不做交易建议、买卖点、仓位、收益预测。
- 不做复杂工作台。

### 0.4 本阶段产品优势

Finahunt 的优势不能是“更热闹”，而应该是：

1. **更早发现消息**  
   MVP 阶段通过后台录入、种子数据、少量合规公开源抓取来验证，不做全市场实时情报系统。

2. **更快判断催化**  
   对消息进行有效催化判断，输出催化类型、催化等级、时效分、置信度。

3. **更清楚拆题材**  
   把单条消息拆成题材方向和产业链环节，而不是只给一个概念名称。

4. **更严格绑定证据**  
   每个公司、每个环节都要有证据来源或证据不足提示。

5. **更克制地提示风险**  
   不使用荐股、买入、卖出、必涨、龙头确认、主线确认等表达。

6. **更方便用户复盘**  
   输出后续观察点，让用户知道下一步该核验什么公开信号。

---

## 1. MVP 核心目标

MVP 不做完整 Finahunt 大系统，只做一个核心功能：

```text
系统抓取或用户输入一条公开市场消息
        ↓
系统清洗与标准化消息
        ↓
系统判断是否有效催化
        ↓
系统拆解题材链路
        ↓
系统映射相关公司并绑定证据
        ↓
系统提示风险与后续观察点
        ↓
输出一张带证据链的题材链路研究卡
```

MVP 要验证的问题：

> 用户是否愿意为“把公开市场消息自动整理成可复盘、可追溯、带证据链的题材链路研究卡”付费。

### 1.1 MVP 成功标准

用户看到研究卡后，应该觉得：

> 这张卡确实帮我节省了复盘时间，帮我把消息、题材、产业链、公司、证据、风险和后续观察点都整理好了。

如果“一条消息 → 一张高质量研究卡”做不准，任何复杂功能都没有意义。

所以当前所有开发都围绕一句话：

> 把一条消息加工成一张高质量、可追溯、可复盘的题材链路研究卡。

---

## 2. MVP 产品形态

### 2.1 用户看到的产品

用户打开 Finahunt 后，主要看到两个区域：

#### 区域一：消息输入入口

用户可以粘贴一条公告、政策、快讯、行业消息或公司公开信息，系统自动生成研究卡。

#### 区域二：今日潜在催化线索

MVP 阶段可以展示系统已生成 / 后台精选的研究卡，不做复杂自动排行。

展示目的：

- 让用户一打开页面就知道产品价值。
- 让用户看到“别人正在研究什么类型的消息”。
- 用精选卡验证用户是否愿意点开、阅读、反馈。

注意：

- 不叫“涨幅榜”。
- 不叫“涨停榜”。
- 不叫“主线榜”。
- 不叫“龙头榜”。
- 建议叫“今日潜在催化线索”或“今日题材研究线索”。

### 2.2 一张研究卡必须回答的问题

每张研究卡必须回答：

1. 这条消息是什么？
2. 它是否构成有效催化？
3. 催化类型是什么？
4. 催化等级是什么？
5. 它可能对应什么题材？
6. 这个题材可以拆成哪些产业链环节？
7. 哪些公司与这些环节存在客观关联？
8. 公司为什么相关？
9. 证据来自哪里？
10. 证据强度如何？
11. 有哪些风险？
12. 后续应该观察什么公开信号？
13. 为什么这不是投资建议？

### 2.3 用户不应该看到的东西

MVP 不展示：

- 复杂工作台。
- 全市场资讯流。
- 买卖点。
- 推荐股票。
- 仓位建议。
- 收益预测。
- 自动续费订阅。
- 实盘交易入口。
- 涨幅排名。
- 涨停排名。
- 主线确认。
- 龙头确认。

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
- 后台可以把某张研究卡标记为“今日潜在催化线索”。

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
- catalyst_reason。

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
- 不得因为消息热门就自动判定为 L1 / L2。

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

#### F07.5 题材链路拆解

目标：把“题材”进一步拆成用户看得懂的链路结构。

链路结构：

```text
事件 / 消息
  → 催化点
  → 题材方向
  → 产业链环节
  → 相关公司
  → 证据
  → 风险
  → 后续观察点
```

MVP 输出字段：

- chain_summary：一句话说明这条链路。
- theme_name：题材名称。
- theme_core_logic：题材核心逻辑。
- industry_chain_nodes：产业链环节列表。
- company_nodes：公司节点列表。
- chain_edges：节点关系。
- chain_view_type：tree / timeline / card_stack。
- evidence_refs：证据引用 ID 列表。
- risk_refs：风险引用 ID 列表。

产业链环节字段：

- node_id。
- node_name。
- node_type：event / catalyst / theme / industry_segment / company / evidence / risk / observation。
- parent_node_id。
- logic_summary。
- evidence_ref_ids。
- confidence_score。
- sort_order。

MVP 约束：

- 不要求构建完整产业链数据库。
- 不要求多层复杂图谱。
- 不要求交互式大图。
- 详情页只需要能用树状图 / 卡片链路表达清楚。
- 如果证据不足，不强行拆链路，必须提示“当前证据不足，暂不展开该环节”。

验收：

- 每张有效研究卡必须至少形成一个主链路。
- 主链路必须包含：事件、催化点、题材、至少 1 个产业链环节、相关公司或证据不足提示。
- 链路中的每个公司节点必须能回溯到证据或证据不足提示。
- 用户能在详情页看到“事件 → 题材 → 环节 → 公司”的结构。

---

#### F08 相关公司映射

目标：输出与题材存在客观关联的公司列表。

MVP 要求：

- 支持从内置公司知识库 / 简化映射表 / 公开材料摘要中匹配公司。
- 每家公司必须有理由。
- 每家公司必须有证据或证据不足提示。
- 公司数量建议控制在 3-10 个，避免变成无差别列表。
- 每家公司必须绑定产业链环节。

输出字段：

- stock_code。
- stock_name。
- company_name。
- industry_chain_role。
- matched_chain_node_id。
- match_score。
- purity_score。
- evidence_strength：strong / medium / weak / insufficient。
- verification_status：confirmed / needs_verification / insufficient_evidence。
- reason_summary。
- evidence_text。
- evidence_source。
- risk_flags。

验收：

- 不能只列公司名称。
- 不能输出“最受益”“龙头”“必涨”。
- 证据不足时必须明确提示“证据不足，需进一步核验”。
- 每家公司必须说明它处在题材链路的哪个环节。
- 不能把所有沾边公司都列出来。

---

#### F09 证据链展示

目标：让用户知道每个判断从哪里来。

要求：

- 原始消息来源必须展示。
- 催化句必须展示。
- 题材逻辑必须绑定证据。
- 产业链环节必须绑定证据或证据不足提示。
- 公司理由必须绑定证据。
- 证据可来自原始消息、公告摘要、公司公开材料、政策文件等。
- 每条证据记录 source_name 和 source_url。
- 每条证据需要有 evidence_strength。

证据强度定义：

- strong：来自原始消息、官方公告、公司公告、监管文件、政策原文、权威公开资料。
- medium：来自主流媒体、行业资料、公开研报摘要、公司官网公开信息。
- weak：来自间接推导、非权威报道、历史业务线索。
- insufficient：暂未找到足够证据，只能作为待核验线索。

验收：

- 研究卡不能只有结论，必须有证据。
- 用户能看到证据片段。
- 证据不足时不能装作确定。
- 每个公司匹配结果必须能看到 evidence_strength。

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
- 产业链环节推导过长风险。
- 题材与公司主营业务相关度偏低风险。

后续观察点必须是客观信号，例如：

- 是否有后续政策细则。
- 是否有公司公告确认。
- 是否有订单、产品、产能、收入占比等公开证据。
- 是否有更多权威来源报道。
- 是否有产业链上下游同步变化。
- 是否有公司在互动平台、公告、年报中披露相关业务占比。
- 是否有官方名单、招标、采购、价格、产能等可核验证据。

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
- 重点埋伏。
- 无脑上车。
- 翻倍空间。
- 妖股。
- 大肉。

替代表达：

- 研究价值。
- 观察价值。
- 客观关联。
- 证据强度。
- 后续观察节点。
- 公开信息整理。
- 需要进一步核验。
- 相关性暂不确定。
- 当前仅作为线索。

标准声明：

> 本内容仅为公开市场信息的客观汇总与整理，不构成任何投资建议，不代表对任何个股、题材或市场走势的价值判断。股市有风险，投资需谨慎。

验收：

- 研究卡生成前执行合规检测。
- 检测失败的卡不能发布给用户。
- 后台可以看到 blocked_terms。
- 今日线索榜、详情页、分享图、历史页都必须带合规声明或合规入口。

---

#### F12 研究卡详情页

目标：让用户清晰消费研究卡。

页面结构：

1. 顶部：消息标题、来源、发布时间、生成时间。
2. 一分钟摘要：一句话说明这条消息是什么。
3. 催化判断：是否有效催化、催化类型、等级、时效、置信度。
4. 题材链路图：事件 → 催化点 → 题材 → 产业链环节 → 公司。
5. 题材逻辑：题材名称、核心逻辑、生命周期提示。
6. 相关公司：公司列表、产业链角色、理由、证据强度、风险。
7. 证据链：原文片段和来源链接。
8. 风险提示。
9. 后续观察点。
10. 合规声明。
11. 用户反馈：有用 / 一般 / 没用 + 文本反馈。

详情页视觉要求：

- 不做长篇报告堆文字。
- 采用卡片模块。
- 题材链路必须可视化。
- 移动端优先可读。
- 重要信息优先展示：催化等级、题材、链路、公司、证据强度、风险。
- 低证据强度的公司必须明显标注“需核验”。

验收：

- 用户 1 分钟内能看懂研究卡。
- 信息层级清楚。
- 移动端可读。
- 无乱码。
- 用户能从任何公司节点跳到对应证据片段。

---

#### F13 历史研究卡

目标：用户能回看自己生成过的卡。

要求：

- 列表展示标题、题材、催化等级、证据强度、生成时间、反馈状态。
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
- 可选快速标签：
  - 题材判断有帮助。
  - 公司证据有帮助。
  - 公司关联不准确。
  - 风险提示有帮助。
  - 需要更多后续观察点。
  - 内容太长。
  - 内容太浅。

后台字段：

- card_id。
- user_id。
- rating。
- comment。
- feedback_tags_json。
- admin_status。
- created_at。

验收：

- 用户能提交反馈。
- 后台能查看反馈。
- 反馈能按有用 / 没用筛选。
- 后台能看到用户认为哪一部分有问题。

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
- 设置某张研究卡为“今日潜在催化线索”。
- 调整精选卡排序。
- 查看卡片的合规状态和 blocked_terms。

验收：

- 管理员可以完成内测运营所需操作。
- 不追求漂亮，只要稳定、清楚、可用。
- 后台精选不改变研究卡结论，只改变展示位置。

---

#### F16 今日潜在催化线索榜

目标：让首页不是空白工具页，而是有“打开就有价值”的内容入口。

MVP 实现方式：

- 不做复杂自动榜单算法。
- 从已生成研究卡中取以下内容展示：
  - 后台精选卡。
  - 最近生成的有效催化卡。
  - seed 数据卡。
- 只展示公开信息整理，不展示买卖建议。

展示字段：

- 题材名称。
- 消息标题。
- 催化等级。
- 催化类型。
- 证据强度。
- 相关公司数量。
- 主要风险。
- 生成时间 / 更新时间。
- 查看研究卡按钮。

命名建议：

- 今日潜在催化线索。
- 今日题材研究线索。
- 今日公开消息研究卡。

禁止命名：

- 涨幅榜。
- 涨停榜。
- 主线榜。
- 龙头榜。
- 明日机会。
- 必看机会。

验收：

- 首页能展示 3-10 张精选 / 最近研究卡。
- 点击能进入研究卡详情。
- 每张卡必须有合规声明入口。
- 无付费权益用户可以看到简版，完整证据链可按内测权益限制展示。

---

## 4. MVP 暂不做功能

明确不做：

- 订阅。
- 自动续费。
- 微信 / 支付宝复杂支付闭环。
- 实盘交易。
- 买卖点。
- 仓位建议。
- 收益预测。
- 目标价。
- 涨幅排名。
- 涨停排名。
- 主线确认。
- 龙头确认。
- 完整主线发酵页。
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
- 完整产业链知识图谱。
- 全市场实时监控系统。
- 自动识别所有 A 股相关公司。
- 自动给出交易决策。

---

## 5. MVP 页面清单

### 5.1 用户端页面

| 页面 | 路由建议 | 说明 |
|---|---|---|
| 登录页 | `/login` | 内测用户登录 |
| 激活页 | `/activate` | 输入激活码开通权益 |
| 首页 / 研究卡生成页 | `/` 或 `/research-card` | 左侧 / 顶部为消息输入，下面展示今日潜在催化线索 |
| 研究卡详情页 | `/research-cards/[id]` | 查看完整题材链路研究卡 |
| 历史研究卡页 | `/history` | 查看历史研究卡 |
| 权益页 | `/account` | 查看到期时间和剩余次数 |

### 5.2 用户首页结构

首页不做复杂工作台，只做两个核心区域：

```text
顶部：
Finahunt 今日题材线索
公开消息 → 催化判断 → 题材链路 → 公司证据 → 风险观察

区域 A：生成研究卡
- 消息标题
- 消息正文
- 来源名称
- 来源链接
- 发布时间
- 生成按钮
- 今日剩余次数

区域 B：今日潜在催化线索
- 精选研究卡列表
- 催化等级
- 题材名称
- 证据强度
- 主要风险
- 查看详情
```

### 5.3 研究卡详情页结构

```text
1. 消息来源区
2. 一分钟摘要
3. 催化判断卡
4. 题材链路图
5. 产业链环节卡
6. 相关公司证据卡
7. 证据链列表
8. 风险提示
9. 后续观察点
10. 用户反馈
11. 合规声明
```

### 5.4 后台页面

| 页面 | 路由建议 | 说明 |
|---|---|---|
| 后台首页 | `/admin` | 简单数据概览 |
| 消息列表 | `/admin/messages` | 原始消息和处理状态 |
| 研究卡列表 | `/admin/cards` | 所有研究卡，支持设为今日线索 |
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
  theme_chain_summary TEXT,
  evidence_strength_summary TEXT,
  risk_summary TEXT,
  observation_points_json JSON,
  card_json JSON NOT NULL,
  compliance_status TEXT NOT NULL DEFAULT 'pending',
  compliance_disclaimer TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  featured_rank INTEGER,
  featured_reason TEXT,
  featured_date DATE,
  trace_id TEXT,
  run_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.5 research_card_chain_nodes

MVP 可以选择只存在 card_json 中。若要方便前端渲染和后台查看，建议建表。

```sql
CREATE TABLE research_card_chain_nodes (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  node_name TEXT NOT NULL,
  parent_node_id TEXT,
  logic_summary TEXT,
  confidence_score INTEGER,
  evidence_ref_ids_json JSON,
  risk_flags_json JSON,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.6 research_card_chain_edges

MVP 可选表。

```sql
CREATE TABLE research_card_chain_edges (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  relation_type TEXT,
  relation_summary TEXT,
  evidence_ref_ids_json JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.7 research_card_evidences

```sql
CREATE TABLE research_card_evidences (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  evidence_type TEXT,
  evidence_text TEXT NOT NULL,
  evidence_strength TEXT,
  source_name TEXT,
  source_url TEXT,
  source_publish_time TIMESTAMP,
  related_field TEXT,
  related_node_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.8 stock_theme_matches

```sql
CREATE TABLE stock_theme_matches (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  theme_name TEXT,
  stock_code TEXT,
  stock_name TEXT,
  company_name TEXT,
  industry_chain_role TEXT,
  matched_chain_node_id TEXT,
  match_score INTEGER,
  purity_score INTEGER,
  evidence_strength TEXT,
  verification_status TEXT,
  match_basis TEXT,
  evidence_text TEXT,
  evidence_source TEXT,
  risk_flags_json JSON,
  reason_summary TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.9 users

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

### 6.10 activation_codes

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

### 6.11 user_entitlements

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

### 6.12 usage_records

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

### 6.13 card_feedbacks

```sql
CREATE TABLE card_feedbacks (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating TEXT NOT NULL,
  comment TEXT,
  feedback_tags_json JSON,
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

返回必须包含：

- source。
- event。
- catalyst。
- theme。
- theme_chain。
- companies。
- evidences。
- risks。
- observation_points。
- compliance。
- feedback_status。

---

#### GET `/api/research-cards`

获取当前用户历史研究卡。

Query:

- page。
- page_size。
- catalyst_level。
- theme_name。
- evidence_strength。
- only_valid_catalyst。

---

#### GET `/api/research-cards/featured`

获取今日潜在催化线索。

Query:

- date。
- page。
- page_size。

Response:

```json
{
  "success": true,
  "items": [
    {
      "card_id": "card_001",
      "event_title": "消息标题",
      "theme_name": "题材名称",
      "catalyst_level": "L2",
      "catalyst_type": "产业催化",
      "evidence_strength_summary": "medium",
      "company_count": 5,
      "risk_summary": "部分公司关联证据需进一步核验",
      "generated_at": "2026-05-18T09:30:00+08:00"
    }
  ]
}
```

---

#### POST `/api/research-cards/:id/feedback`

提交反馈。

Request:

```json
{
  "rating": "useful",
  "comment": "公司证据部分有帮助",
  "feedback_tags": ["公司证据有帮助", "需要更多后续观察点"]
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

#### PATCH `/api/admin/cards/:id/featured`

设置或取消今日潜在催化线索。

Request:

```json
{
  "is_featured": true,
  "featured_rank": 1,
  "featured_reason": "消息催化较清晰，证据链较完整",
  "featured_date": "2026-05-18"
}
```

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
  "version": "mvp.v2.theme_chain_card",
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
    "lifecycle_hint": "萌芽期",
    "evidence_summary": ""
  },
  "theme_chain": {
    "chain_summary": "",
    "view_type": "tree",
    "nodes": [
      {
        "node_id": "node_event_001",
        "node_type": "event",
        "node_name": "",
        "parent_node_id": null,
        "logic_summary": "",
        "confidence_score": 0,
        "evidence_ref_ids": [],
        "risk_flags": [],
        "sort_order": 1
      }
    ],
    "edges": [
      {
        "from_node_id": "node_event_001",
        "to_node_id": "node_theme_001",
        "relation_type": "drives",
        "relation_summary": "",
        "evidence_ref_ids": []
      }
    ]
  },
  "companies": [
    {
      "stock_code": "",
      "stock_name": "",
      "company_name": "",
      "matched_chain_node_id": "",
      "industry_chain_role": "",
      "match_score": 0,
      "purity_score": 0,
      "evidence_strength": "medium",
      "verification_status": "needs_verification",
      "reason_summary": "",
      "evidence_text": "",
      "evidence_source": "",
      "risk_flags": []
    }
  ],
  "evidences": [
    {
      "evidence_id": "ev_001",
      "evidence_type": "source_text",
      "evidence_text": "",
      "evidence_strength": "strong",
      "source_name": "",
      "source_url": "",
      "related_field": "catalyst_sentence",
      "related_node_id": ""
    }
  ],
  "risks": [
    {
      "risk_type": "company_evidence_insufficient",
      "risk_level": "medium",
      "risk_text": ""
    }
  ],
  "observation_points": [
    {
      "point_type": "policy_followup",
      "point_text": "",
      "why_it_matters": ""
    }
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
buildThemeChain
  ↓
mapIndustryChainNodes
  ↓
mapCompanies
  ↓
bindEvidence
  ↓
scoreEvidenceStrength
  ↓
generateRisks
  ↓
generateObservationPoints
  ↓
runComplianceGuard
  ↓
saveResearchCard
  ↓
buildCardViewModel
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
- evidence_strength 基础判定。
- 今日线索榜展示排序的后台精选优先逻辑。

### 9.3 模型辅助

以下部分可以使用大模型：

- 事件摘要。
- 催化句抽取。
- 催化类型解释。
- 题材核心逻辑。
- 产业链环节拆解。
- 公司理由整理。
- 风险提示。
- 后续观察点。

模型必须输出 JSON，并经过 schema validation。

### 9.4 模型输出约束

模型不得输出：

- 买入。
- 卖出。
- 低吸。
- 仓位。
- 目标价。
- 必涨。
- 主线确认。
- 龙头确认。
- 收益空间。
- 明天看涨。
- 确定性机会。

模型必须输出：

- 证据来源。
- 不确定性。
- 风险。
- 待核验点。
- 合规声明。

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
- 完整公司理由、证据链、题材链路和历史记录需要内测席位。

第一批内测更建议直接收费，验证真实付费意愿。

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

### 11.4 内容传播方向

每天可以从研究卡自动提炼：

```text
今日潜在题材线索
主题：XXXX
催化类型：政策 / 产业 / 技术 / 事件
核心逻辑：XXXX
证据强度：强 / 中 / 弱
风险：XXXX
后续观察：XXXX
声明：仅为公开信息整理，不构成投资建议
```

用途：

- 内测群每日样例。
- 小红书图文。
- 朋友圈图文。
- 视频号口播脚本。
- 用户私域转发素材。

MVP 阶段不一定开发自动海报功能，但研究卡结构要支持后续生成海报。

### 11.5 禁止话术

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
- 题材链路拆解。
- 证据强度核验。

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
- 用户能查看题材链路。
- 用户能查看公司证据强度。
- 用户能查看历史。
- 用户能提交反馈。
- 后台能录入消息。
- 后台能生成激活码。
- 后台能查看用户和反馈。
- 后台能设置今日潜在催化线索。

### 12.2 研究卡验收

每张有效研究卡必须有：

- 原始消息。
- 来源。
- 是否有效催化。
- 催化句。
- 催化类型。
- 催化等级。
- 题材逻辑。
- 题材链路。
- 产业链环节。
- 相关公司。
- 公司理由。
- 公司所属产业链环节。
- 证据。
- 证据强度。
- 风险。
- 后续观察点。
- 合规声明。

### 12.3 题材链路验收

测试每张有效研究卡：

- 必须能看到“事件 → 题材 → 环节 → 公司”的结构。
- 至少有 1 个产业链环节。
- 每个公司必须挂在某个产业链环节下。
- 每个公司必须有证据强度。
- 证据不足的公司必须标记为“需核验”。
- 链路不能为了好看而强行扩展。
- 如果只能拆出题材，不能拆出公司，必须明确提示“当前证据不足，暂不映射公司”。

### 12.4 质量验收

测试 10 条真实消息：

- 至少 8 条能正确判断是否有效催化。
- 明显噪声不能输出为强催化。
- 公司关联不能没有理由。
- 证据不足必须提示。
- 输出不能出现买卖建议。
- 至少 7 张有效卡能形成可读的题材链路。
- 至少 7 张有效卡能给出 2-5 个可执行的后续观察点。

### 12.5 合规验收

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
- 明天看涨。
- 翻倍空间。
- 确定性机会。

### 12.6 商业化验收

- 激活码可用。
- 权益有效期正确。
- 每日次数限制正确。
- 到期后无法继续生成。
- 后台可延长权限。
- 没有自动续费入口。
- 页面明确写明“一次性购买，不自动续费”。

### 12.7 首页线索验收

- 首页能看到 3-10 条今日潜在催化线索。
- 每条线索能进入研究卡详情。
- 线索卡只展示研究信息，不展示交易建议。
- 没有权益的用户能看到简版，有权益用户能看到完整证据链。

---

## 13. 开发排期建议

### 第 1-3 天：底座

- 数据库表。
- 用户登录简化版。
- 激活码。
- 权益检查。
- 原始消息录入。
- research_cards 增加主题链路相关字段。
- stock_theme_matches 增加 evidence_strength / verification_status。

### 第 4-7 天：研究卡链路

- 消息清洗。
- 催化判断。
- 题材归纳。
- 题材链路拆解。
- 产业链环节生成。
- 公司映射。
- 证据绑定。
- 证据强度评分。
- 合规拦截。
- 研究卡保存。

### 第 8-10 天：页面

- 首页 / 研究卡生成页。
- 今日潜在催化线索区域。
- 研究卡详情页。
- 题材链路图 / 卡片链路。
- 历史页。
- 后台消息页。
- 后台用户页。

### 第 11-15 天：内测必需增强

- 用户反馈。
- 后台反馈管理。
- 后台激活码批量生成。
- 后台设置今日精选卡。
- 每日次数限制。
- 错误处理。
- seed 数据。
- 基础测试。

### 第 16-25 天：质量打磨

- 研究卡质量优化。
- 题材链路可读性优化。
- 合规词库完善。
- 公司映射规则优化。
- 证据强度规则优化。
- 页面可读性优化。
- 10-30 条真实消息回归测试。
- 内测交付报告。

---

## 14. Codex / oh-my-codex 执行提示词

下面这段可以直接给 Codex / oh-my-codex：

```text
请在当前 Finahunt 仓库中开发 MVP：带证据链的题材链路研究卡。

本阶段仍然只做一个核心链路：
系统抓取或用户输入一条公开市场消息 -> 判断是否有效催化 -> 拆解题材链路 -> 映射相关公司 -> 绑定证据和证据强度 -> 输出风险和后续观察点 -> 用户查看一张高质量研究卡。

重要产品边界：
1. 不是做全市场题材图谱。
2. 不是做涨幅榜、涨停榜、主线榜、龙头榜。
3. 不是做交易建议。
4. 不是做买卖点、仓位、目标价、收益预测。
5. MVP 核心仍是“一条消息 -> 一张高质量研究卡”。

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
10. 题材链路拆解：事件 -> 催化点 -> 题材 -> 产业链环节 -> 相关公司。
11. 相关公司映射。
12. 每家公司必须绑定产业链环节、关联理由、证据、证据强度、风险。
13. 证据强度：strong / medium / weak / insufficient。
14. 风险提示和后续观察点。
15. 合规拦截，禁止荐股、买卖点、收益承诺、涨跌预测。
16. 研究卡详情页必须展示题材链路图或卡片链路。
17. 首页必须展示“今日潜在催化线索”，数据可来自后台精选或最近生成研究卡，不做复杂自动排行。
18. 历史研究卡页。
19. 用户反馈：有用 / 一般 / 没用 + 文本反馈 + 可选标签。
20. 后台用户、激活码、消息、研究卡、反馈管理。
21. 后台可以把研究卡设为今日潜在催化线索。
22. 基础测试和 build 验证。

不做：
1. 订阅。
2. 自动续费。
3. 微信/支付宝复杂支付闭环。
4. 推荐股票。
5. 买卖点。
6. 仓位建议。
7. 收益预测。
8. 目标价。
9. 完整工作台。
10. 主线发酵页。
11. 全市场题材图谱。
12. 历史相似案例。
13. 社区。
14. 小程序或 App。

所有用户可见输出必须附带合规声明：
本内容仅为公开市场信息的客观汇总与整理，不构成任何投资建议，不代表对任何个股、题材或市场走势的价值判断。股市有风险，投资需谨慎。

完成后请运行：
- 后端/通用测试
- 前端 build
- API smoke 测试
- 核心流程测试：登录 -> 激活 -> 输入消息 -> 生成研究卡 -> 查看详情 -> 查看题材链路 -> 查看证据强度 -> 提交反馈 -> 后台查看 -> 后台设为今日线索 -> 首页展示。

最后输出开发报告，说明完成了哪些功能、如何测试、已知风险、如何启动。
```

---

## 15. MVP 最终判断

这个 MVP 成功的标准不是功能多，而是用户看到研究卡后觉得：

> 这张卡确实帮我节省了复盘时间，帮我把消息、题材、产业链、公司、证据、风险和后续观察点都整理好了。

本阶段不应该偏离“一条消息 → 一张高质量研究卡”。

但是，这张卡不能只是普通文字报告，而必须升级成：

> 一张带证据链的题材链路研究卡。

最终判断：

```text
MVP 核心不变：
一条消息 -> 一张高质量研究卡

MVP 表达升级：
普通研究卡 -> 带证据链的题材链路研究卡

MVP 不扩张：
不做完整题材榜单，不做全市场图谱，不做交易建议
```

所以当前开发优先级是：

1. 先把一条消息分析准。
2. 再把题材链路拆清楚。
3. 再把公司证据绑定牢。
4. 再把风险和观察点讲克制。
5. 最后用首页精选线索承载展示和内测运营。
