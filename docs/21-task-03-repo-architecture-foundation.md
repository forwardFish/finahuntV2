# Task 03 - 项目结构、数据库、Seed、共享类型底座验收标准

## 1. 目标

搭建 FinahuntV2 工程底座，让 API、Web、小程序、Admin、Crawler、AI Worker 都有明确位置和可运行骨架。


## 全局硬规则

- 项目根目录：`D:\lyh\agent\agent-frame\finahuntV2`
- 需求文档：`D:\lyh\agent\agent-frame\finahuntV2\docs\FINAHUNT_MVP_DOMESTIC_MINIPROGRAM_ARCH_SPEC.md`
- UI 真源：`D:\lyh\agent\agent-frame\finahuntV2\docs\UI`
- P0 用户端只允许：首页、资讯、题材、题材详情。
- 小程序底部 Tab 只允许：首页、资讯、题材。
- 用户端禁止出现：登录、注册、付费、订阅、会员、激活码、我的、权益、输入公开信息、生成研究卡、样例页。
- 所有用户可见内容必须有免责声明：`本产品基于公开信息整理，仅供参考，不构成任何投资建议。市场有风险，决策需谨慎。`
- 禁止词：荐股、买入、卖出、低吸、仓位、目标价、必涨、龙头确认、主线确认、收益空间、确定性机会、明天看涨、翻倍空间。
- UI 一比一不得口头宣称：必须有 reference、actual screenshot、diff 或人工复核记录；否则只能写 `PASS_NEEDS_MANUAL_UI_REVIEW`。
- 每个 Task 结束必须生成：`docs/auto-execute/latest/TASK-XX-HANDOFF.md`。
- 所有失败必须进入修复循环：定位原因 → 当前 Task 内修复 → 重跑最低验收命令 → 写入 handoff。


## 2. 推荐结构

```text
apps/web
apps/admin
apps/miniprogram
services/api
services/crawler
services/ai-worker
packages/shared
prisma/schema.prisma
prisma/seed.ts
scripts/acceptance
```

如现有结构不同，允许兼容，但必须在 `project-state.md` 说明映射。

### 2.1 旧资产消费门禁

Task 03 必须先读取 `docs/auto-execute/07-legacy-reuse-audit.md`。

- 只能使用 Task 01 中标记为 `ALLOW_ADAPT` 的旧资产。
- `COPY_AS_IS` 默认禁止，除非 handoff 明确记录人工批准。
- `REFERENCE_ONLY` 只能参考设计思想，不得搬入代码。
- `BLOCKED` 不得进入 V2。
- 旧 Web 页面整体结构、`/workbench`、`/unlock`、登录、付费、解锁、会员、激活码、用户输入生成研究卡、样例页不得进入 V2。
- 旧 seed 中出现乱码、投研承诺、荐股倾向、低吸、仓位、目标价等内容不得进入 V2。

## 3. 数据库模型最低项

`sources, crawl_runs, raw_news, normalized_news, themes, theme_tags, theme_tag_relations, theme_rankings, research_cards, theme_chain_nodes, theme_chain_edges, companies, theme_company_matches, evidences, risk_notes, observations, publish_items, ai_analysis_runs, compliance_logs`

## 4. Seed 最低数量

| 数据 | 数量 |
|---|---:|
| sources | >=3 |
| raw_news | >=12 |
| normalized_news | >=12 |
| themes | >=10 |
| theme_tags | >=20 |
| theme_rankings | >=10 |
| research_cards | >=6 |
| theme_chain_nodes | >=20 |
| companies | >=20 |
| theme_company_matches | >=20 |
| evidences | >=20 |
| risk_notes | >=10 |
| observations | >=10 |
| publish_items | >=10 |

## 5. 推荐 seed 题材

人形机器人、低空经济、算力租赁、光伏设备、固态电池、AI应用、半导体设备、消费电子、储能、机器人零部件。

## 6. 共享 Schema

必须建立 public API 和 research card 的共享类型 / JSON Schema，至少覆盖：

```text
HomeResponse
NewsItem
ThemeRankItem
ThemeDetail
ThemeTag
Observation
ResearchCard
ComplianceResult
```

## 7. 环境变量

必须提供 `.env.example`，不得提交真实密钥。至少包含：

```text
DATABASE_URL
REDIS_URL
API_BASE_URL
NEXT_PUBLIC_API_BASE_URL
MINIPROGRAM_API_BASE_URL
MODEL_PROVIDER
MODEL_API_BASE_URL
MODEL_API_KEY
MODEL_NAME
CRAWLER_USER_AGENT
```

## 8. PASS 判定

1. 项目结构清楚。
2. Prisma/schema 或等价 DB schema 完成。
3. seed 可运行。
4. Web/API/Admin/小程序骨架存在。
5. 小程序 tabBar 仅首页、资讯、题材。
6. `.env.example` 存在。
7. 已按 `docs/auto-execute/07-legacy-reuse-audit.md` 执行旧资产消费门禁。
8. 生成 handoff。


## Handoff 必填模板

```md
# Task XX Handoff

## 本轮目标
## 已读取文件
## 已修改文件
## 已新增文件
## 已运行命令
## 通过项
## 失败项
## 未完成项
## blocker
## 证据路径
## 下一 Task 必须读取的文件
## 是否允许进入下一 Task
```
