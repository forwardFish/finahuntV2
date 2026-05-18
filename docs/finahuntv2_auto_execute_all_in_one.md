

<!-- FILE: 21-finahuntv2-auto-execute-master-plan.md -->


# FinahuntV2 Auto-Execute 详版验收总控文档

> 生成日期：2026-05-18  
> 项目根目录：`D:\lyh\agent\agent-frame\finahuntV2`  
> 总控目标：把 FinahuntV2 / 资讯题材线索工具拆成 10 个可执行、可验收、可交接的 Task；每个 Task 都有输入、输出、页面、接口、测试命令、截图证据和 PASS/FAIL 判定。

## 0. 项目目标

当前 MVP 是国内展示型资讯题材线索工具，不是用户生成工具。

主链：

```text
公开数据源 / 后台录入
  → 爬虫 / 定时任务
  → raw_news
  → normalized_news
  → AI + 规则分析
  → research_card draft
  → 后台人工审核
  → publish_items
  → Web 展示 / 微信小程序展示
```

用户打开后直接看到：今日资讯、热门题材、题材分类、今日重点观察、题材详情、产业链环节、相关公司、证据来源、风险提示、后续观察点。


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


## 旧 finahunt 资产复用审计

旧仓库路径：
`D:\lyh\agent\agent-frame\finahunt`

本项目是重新开发，旧仓库只能作为参考和白名单复用来源，不允许整仓复制。

### 允许优先复用/改造

- PostgreSQL / SQLAlchemy / repository 设计思路。
- raw content 去重、source_hash、crawl_runs、admin review log 等数据处理逻辑。
- crawler/fetch adapter 的抽象方式。
- event/theme/candidate/risk/evidence 等规则分析函数。
- pytest 单元测试思路。
- acceptance harness 的报告和证据目录思想。

### 禁止直接复制

- 旧 Web 页面整体结构。
- `/workbench`、`/unlock`、用户输入生成研究卡、登录、付费、会员、激活码、样例页。
- 不得把旧 `docs/FINAL_PRODUCT_SPEC.md` 作为需求源。
- 旧 seed 中出现乱码、投研承诺、荐股倾向、低吸/仓位/目标价等内容。
- 旧 `.omx/`、`.next/`、`node_modules/`、runtime artifacts。

### 迁移门禁

Task 01 必须输出：
`docs/auto-execute/07-legacy-reuse-audit.md`

该文件必须列出：

| 旧资产 | 旧路径 | 复用方式 | 风险 | 是否进入 V2 |
|---|---|---|---|---|

`是否进入 V2` 只能使用以下状态：

| 状态 | 含义 |
|---|---|
| `ALLOW_ADAPT` | 允许参考并改造进入 V2 |
| `REFERENCE_ONLY` | 只能参考设计思想，不搬代码 |
| `BLOCKED` | 不允许进入 V2 |
| `COPY_AS_IS` | 默认禁止，除非另有人工批准 |

只有标记为 `ALLOW_ADAPT` 的资产可以进入后续开发；`COPY_AS_IS` 默认禁止。


## 1. 文档集

| 文档 | 用途 | 必须产物 |
|---|---|---|
| `docs/21-finahuntv2-auto-execute-master-plan.md` | 总控入口 | 给 Auto-Execute / Codex 作为入口 |
| `docs/21-task-01-requirements-ui-api-inventory.md` | 需求/UI/API/数据盘点 | requirement matrix、UI inventory、surface map |
| `docs/21-task-02-harness-and-evidence-gates.md` | harness 与证据门禁 | harness.yml、证据目录、final gate |
| `docs/21-task-03-repo-architecture-foundation.md` | 项目结构与 DB 底座 | monorepo/service/db/shared types/seed |
| `docs/21-task-04-public-api-data-contract.md` | 公开 API 合同 | `/api/public/**` 正反例与 schema |
| `docs/21-task-05-web-display-ui-acceptance.md` | Web UI 一比一 | 4 个 Web 页面截图与 diff |
| `docs/21-task-06-miniprogram-ui-acceptance.md` | 小程序 UI 一比一 | 4 个小程序页面截图与 Tab 校验 |
| `docs/21-task-07-admin-review-publish-acceptance.md` | 后台审核发布 | 数据源、资讯、研究卡、发布位 |
| `docs/21-task-08-crawler-normalize-ai-pipeline.md` | 爬虫/清洗/AI/合规 | raw_news 到 research_card draft |
| `docs/21-task-09-full-integration-verification.md` | 全量联调 | 数据到展示全链路证据 |
| `docs/21-task-10-final-acceptance-reporting.md` | 最终验收报告 | final acceptance report |

## 2. 串行执行顺序

1. Task 01：冻结需求、UI、API、数据面。
2. Task 02：建立 harness、证据目录、命令门禁。
3. Task 03：搭建项目结构、数据库、seed、共享类型。
4. Task 04：实现公开 API 和数据合同。
5. Task 05：实现 Web 展示端并按 UI 图一比一验收。
6. Task 06：实现微信小程序端并按 UI 图一比一验收。
7. Task 07：实现后台审核发布闭环。
8. Task 08：实现爬虫、清洗、AI 分析、合规流水线。
9. Task 09：跑全量集成流和回归验证。
10. Task 10：输出最终验收报告和交付说明。

## 3. 状态语义

| 状态 | 含义 | 能否最终 PASS |
|---|---|---|
| PASS | 代码、测试、截图/日志、报告全部满足 | 可以 |
| PASS_WITH_LIMITATION | 主流程可用但有明确环境/人工限制 | 不等于纯 PASS |
| PASS_NEEDS_MANUAL_UI_REVIEW | 功能可用，但视觉需人工确认 | 不等于纯 PASS |
| REPAIR_REQUIRED | 已发现可修复差距 | 不可以 |
| BLOCKED | 环境、凭据、外部依赖阻断 | 不可以 |
| HARD_FAIL | 需求、合规、安全、测试或报告硬失败 | 不可以 |

## 4. 最终 P0 验收

| ID | 验收项 | PASS 标准 |
|---|---|---|
| P0-01 | Web | `/`、`/news`、`/themes`、`/themes/[id]` 可访问，数据来自 API |
| P0-02 | 小程序 | 首页、资讯、题材、题材详情可预览/构建，底部仅 3 Tab |
| P0-03 | API | 8 个公开 API 有正例、反例、schema、合规测试 |
| P0-04 | DB | seed 后核心表有数据，页面不空白 |
| P0-05 | 后台 | 录入/审核/发布闭环可操作 |
| P0-06 | 爬虫/AI | mock 或公开源可生成待审核研究卡 |
| P0-07 | UI | reference/actual/diff 或人工复核齐全 |
| P0-08 | 合规 | 无禁词，有免责声明 |
| P0-09 | 安全 | 无真实 secret 泄露，不访问生产 DB，不部署 |
| P0-10 | 报告 | final report 引用真实证据，不高估状态 |

## 5. Auto-Execute 总提示词

```text
请从 D:\lyh\agent\agent-frame\finahuntV2 开始，先读 AGENTS.md、docs/FINAHUNT_MVP_DOMESTIC_MINIPROGRAM_ARCH_SPEC.md、docs/UI/**、docs/21-finahuntv2-auto-execute-master-plan.md 和 21-task-01 到 21-task-10。

不要把计划当完成结果。按 Task 01-10 串行执行。每个 Task 必须生成日志、结果 JSON、截图/证据和 TASK-XX-HANDOFF.md。缺 handoff 不允许进入下一 Task。

当前 P0 不做登录、付费、用户输入、生成按钮、样例页、我的页。Web 和小程序 UI 必须以 docs/UI 为准一比一复刻。主链必须跑通：后台录入/爬虫 -> raw_news -> normalized_news -> research_card -> 审核发布 -> publish_items -> public API -> Web -> 小程序。
```



<!-- FILE: 21-task-01-requirements-ui-api-inventory.md -->


# Task 01 - 需求、UI、接口、数据面盘点验收标准

## 1. 目标

只做盘点，不改业务代码。把需求、UI、页面、接口、数据库、爬虫、AI、后台全部变成后续可执行矩阵。


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


## 2. 必须读取

| 输入 | 路径 |
|---|---|
| 需求文档 | `D:\lyh\agent\agent-frame\finahuntV2\docs\FINAHUNT_MVP_DOMESTIC_MINIPROGRAM_ARCH_SPEC.md` |
| UI 目录 | `D:\lyh\agent\agent-frame\finahuntV2\docs\UI` |
| 项目治理 | `AGENTS.md`，如存在 |
| Web / 小程序 / Admin / API / Crawler / AI 现有代码 | 实际目录扫描 |
| package / lock / prisma / docker | 实际文件扫描 |
| 旧 finahunt 复用候选 | `D:\lyh\agent\agent-frame\finahunt\packages\storage`、`skills\fetch`、`skills\event`、`tests`、`scripts\acceptance` |

## 3. 必须输出

| 文件 | 内容 |
|---|---|
| `docs/auto-execute/01-requirement-matrix.md` | P0/P1/P2 需求、来源、验收标准 |
| `docs/auto-execute/02-ui-inventory.md` | 每张 UI 图映射到页面、route、截图路径 |
| `docs/auto-execute/03-api-surface-map.md` | public/admin API、输入、输出、测试状态 |
| `docs/auto-execute/04-data-flow-matrix.md` | sources -> publish_items -> 前端展示 |
| `docs/auto-execute/05-page-flow-matrix.md` | Web/小程序/Admin 页面与交互 |
| `docs/auto-execute/06-db-inventory.md` | 表、字段、seed、缺口 |
| `docs/auto-execute/07-legacy-reuse-audit.md` | 旧 finahunt 资产白名单复用审计 |
| `docs/auto-execute/00-p0-forbidden-surface.md` | 禁止项扫描清单 |
| `docs/auto-execute/latest/TASK-01-HANDOFF.md` | 交接 |

### 旧资产复用审计要求

`docs/auto-execute/07-legacy-reuse-audit.md` 必须列出：

| 旧资产 | 旧路径 | 复用方式 | 风险 | 是否进入 V2 |
|---|---|---|---|---|

`是否进入 V2` 只能使用以下状态：

| 状态 | 含义 |
|---|---|
| `ALLOW_ADAPT` | 允许参考并改造进入 V2 |
| `REFERENCE_ONLY` | 只能参考设计思想，不搬代码 |
| `BLOCKED` | 不允许进入 V2 |
| `COPY_AS_IS` | 默认禁止，除非另有人工批准 |

默认可标记为 `ALLOW_ADAPT` 的旧资产类别：

- PostgreSQL / SQLAlchemy / repository 设计思路。
- raw content 去重、source_hash、crawl_runs、admin review log。
- crawler/fetch adapter 抽象。
- event/theme/candidate/risk/evidence 规则分析函数。
- pytest 单元测试思路。
- acceptance harness 的报告和证据目录思想。

默认必须标记为 `BLOCKED` 的旧资产类别：

- 旧 Web 页面整体结构。
- `/workbench`、`/unlock`。
- 登录、付费、会员、激活码、用户输入生成研究卡、样例页。
- 不得把旧 `docs/FINAL_PRODUCT_SPEC.md` 作为需求源。
- 乱码 seed、荐股倾向、低吸/仓位/目标价等内容。
- `.omx/`、`.next/`、`node_modules/`、runtime artifacts。

## 4. P0 需求矩阵最低项

| ID | 需求 | 验收 |
|---|---|---|
| REQ-P0-01 | Web 首页 | 今日资讯、热门题材、题材标签、重点观察 |
| REQ-P0-02 | Web 资讯页 | 实时资讯流、分类筛选、更多资讯 |
| REQ-P0-03 | Web 题材页 | 题材榜、热度趋势、链路示例 |
| REQ-P0-04 | Web 题材详情 | 事件、逻辑、产业链、公司、证据、风险、观察点 |
| REQ-P0-05 | 小程序首页 | 同 Web 首页核心内容，移动适配 |
| REQ-P0-06 | 小程序资讯页 | 实时资讯流与分类筛选 |
| REQ-P0-07 | 小程序题材页 | 热榜、标签、趋势、链路示例 |
| REQ-P0-08 | 小程序题材详情 | 完整详情模块 |
| REQ-P0-09 | 公开 API | 8 个 API 正反例和 schema |
| REQ-P0-10 | 后台 | 录入、分析、审核、发布 |
| REQ-P0-11 | 数据库 | seed 足够支撑页面展示 |
| REQ-P0-12 | 爬虫/AI | raw_news 到 research_card draft |
| REQ-P0-13 | 合规 | 无禁词，有免责声明 |
| REQ-P0-14 | UI 一比一 | reference/actual/diff 或人工复核 |
| REQ-P0-15 | 最终报告 | 证据真实，不高估 |

## 5. UI Inventory 字段

| 字段 | 必填 |
|---|---|
| referenceId | 是 |
| referenceFile | 是 |
| surface | web / miniprogram / admin |
| targetRoute | 是 |
| targetPageName | 是 |
| requiredModules | 是 |
| requiredInteractions | 是 |
| screenshotPath | 是 |
| visualVerdict | 是 |
| knownDifference | 是 |

## 6. 页面交互盘点最低标准

| 页面 | 最低交互 |
|---|---|
| Web 首页 | 搜索、导航、更多资讯、题材项、标签 |
| Web 资讯页 | 分类、分页/更多、资讯项、标签 |
| Web 题材页 | 榜单项、标签、趋势卡、链路示例 |
| Web 详情页 | 返回、证据、更多公司、相关题材 |
| 小程序首页 | 顶部 Tab、底部 Tab、更多、标签、题材项 |
| 小程序资讯页 | 分类、更多、资讯项、底部 Tab |
| 小程序题材页 | 榜单、标签、趋势、链路示例 |
| 小程序详情页 | 返回、公司、证据、风险、相关题材 |
| Admin | 登录、录入、清洗、分析、审核、发布 |

## 7. PASS 判定

1. P0/P1 需求均有来源和验收方式。
2. `docs/UI` 所有 reference 均进入 inventory。
3. public/admin API 均进入 surface map。
4. 数据流进入 matrix。
5. 禁止项清单生成。
6. 旧 finahunt 资产复用审计生成，且没有 `COPY_AS_IS` 资产默认进入 V2。
7. 生成 handoff。


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




<!-- FILE: 21-task-02-harness-and-evidence-gates.md -->


# Task 02 - Harness 和证据门禁验收标准

## 1. 目标

建立可执行验收系统：命令可跑、结果可查、证据可追踪。


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


## 2. 必须建立目录

```text
docs/auto-execute/latest
docs/auto-execute/logs
docs/auto-execute/results
docs/auto-execute/screenshots
docs/auto-execute/diffs
docs/auto-execute/fixtures
```

## 3. 必须建立或更新 `harness.yml`

必须包含：

| 字段 | 值 |
|---|---|
| project.root | `D:\lyh\agent\agent-frame\finahuntV2` |
| docs.requirement | `docs/FINAHUNT_MVP_DOMESTIC_MINIPROGRAM_ARCH_SPEC.md` |
| docs.ui | `docs/UI` |
| safety.allowCommit | false |
| safety.allowPush | false |
| safety.allowProductionDb | false |
| safety.allowPayment | false |
| safety.allowDeploy | false |

## 4. 必须配置 Lane

| Lane | PASS |
|---|---|
| inventory | 生成 requirement/ui/api/data matrix |
| apiBuild | API 可构建 |
| apiTest | API 测试或 BLOCKED |
| webBuild | Web 可构建 |
| webUiCapture | 4 个 Web 页面截图 |
| miniprogramCheck | 小程序构建/静态检查 |
| miniprogramCapture | 4 个小程序页面截图或 DevTools blocker |
| adminBuild | 后台可构建 |
| crawlerSmoke | mock crawler 可运行 |
| aiWorkerSmoke | ModelRouter/schema 可运行 |
| publicApiSmoke | 8 个公开 API 可测 |
| adminApiSmoke | 后台 P0 API 可测 |
| secretGuard | 无未解释 secret |
| complianceGuard | 无禁词 |
| finalGate | 汇总不高估 |

## 5. 必须新增脚本

```text
scripts/acceptance/run-inventory.ps1
scripts/acceptance/run-api-smoke.ps1
scripts/acceptance/run-ui-capture.ps1
scripts/acceptance/run-secret-guard.ps1
scripts/acceptance/run-compliance-guard.ps1
scripts/acceptance/run-report-integrity.ps1
scripts/acceptance/run-final-gate.ps1
```

可用 `.sh` 或 Node 脚本替代，但必须在报告写清。

## 6. 结果 JSON Schema

```json
{
  "schemaVersion": "2.0",
  "project": "finahuntV2",
  "lane": "web-build",
  "status": "PASS",
  "commands": ["npm run build"],
  "cwd": "apps/web",
  "evidence": ["docs/auto-execute/logs/web-build.log"],
  "blockers": [],
  "updatedAt": "2026-05-18T00:00:00+08:00"
}
```

## 7. PASS 判定

1. harness.yml 不为空。
2. 每个 P0 lane 有命令或明确 BLOCKED。
3. 证据目录存在。
4. final gate 不把 limitation 当 PASS。
5. 生成 handoff。


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




<!-- FILE: 21-task-03-repo-architecture-foundation.md -->


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




<!-- FILE: 21-task-04-public-api-data-contract.md -->


# Task 04 - 公开展示 API 与数据合同验收标准

## 1. 目标

实现 Web / 小程序依赖的公开只读 API，保证用户端数据来自数据库和 seed。


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


## 2. 必须实现 API

| ID | Method Path | 用途 |
|---|---|---|
| PUBLIC-HOME-001 | GET `/api/public/home` | 首页聚合 |
| PUBLIC-NEWS-001 | GET `/api/public/news` | 资讯流 |
| PUBLIC-NEWS-002 | GET `/api/public/news/:id` | 资讯详情，P0.5 |
| PUBLIC-THEME-001 | GET `/api/public/themes/rank` | 热门题材榜 |
| PUBLIC-THEME-002 | GET `/api/public/themes` | 题材列表 |
| PUBLIC-THEME-003 | GET `/api/public/themes/:id` | 题材详情 |
| PUBLIC-TAG-001 | GET `/api/public/theme-tags` | 标签 |
| PUBLIC-OBS-001 | GET `/api/public/observations/today` | 今日观察 |
| PUBLIC-SEARCH-001 | GET `/api/public/search` | 搜索，P0.5 |

## 3. 统一响应格式

成功：

```json
{"success":true,"data":{},"message":"ok","timestamp":"","pagination":{"page":1,"pageSize":10,"total":100,"totalPages":10}}
```

失败：

```json
{"success":false,"errorCode":"BAD_REQUEST","message":"参数错误","timestamp":""}
```

## 4. 首页 API 最低数据

`GET /api/public/home` 返回：

| 字段 | 最低数量 |
|---|---:|
| today_news | 4 |
| hot_themes | 5 |
| theme_tags | 8 |
| today_observations | 4 |
| opportunity_widgets | 4 |

## 5. 题材详情 API 最低数据

`GET /api/public/themes/:id` 返回：

| 字段 | 最低数量 |
|---|---:|
| tags | 4 |
| heat_trend | 7 |
| industry_chain_nodes | 5 |
| related_companies | 4 |
| evidences | 4 |
| risks | 3 |
| observations | 3 |
| related_themes | 3 |

## 6. 必测维度

| API | 正例 | 反例 | Schema | 合规 | DB 来源 |
|---|---|---|---|---|---|
| home | 必测 | DB 空态 | 必测 | 必测 | 必测 |
| news | category/page | bad category | 必测 | 必测 | 必测 |
| themes/rank | limit/date | bad limit | 必测 | 必测 | 必测 |
| themes | tag/page | bad tag | 必测 | 必测 | 必测 |
| themes/:id | existing id | missing id | 必测 | 必测 | 必测 |
| theme-tags | 默认 | disabled tags | 必测 | 必测 | 必测 |
| observations/today | 默认 | no data | 必测 | 必测 | 必测 |

## 7. 证据文件

```text
docs/auto-execute/results/public-api-smoke.json
docs/auto-execute/results/public-api-schema.json
docs/auto-execute/results/public-api-negative.json
docs/auto-execute/results/public-api-compliance.json
docs/auto-execute/05-public-api-contract.md
```

## 8. PASS 判定

1. P0 API 全部实现。
2. 正例/反例/schema/合规测试存在。
3. 数据来自 DB/seed。
4. 错误输出为 JSON。
5. 生成 handoff。


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




<!-- FILE: 21-task-05-web-display-ui-acceptance.md -->


# Task 05 - Web 展示端 UI 一比一复刻验收标准

## 1. 目标

实现 Web 用户端 4 个 P0 页面，并按 `docs/UI` 一比一复刻。


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


## 2. 页面

| 页面 | 路由 | 必须模块 |
|---|---|---|
| 首页 | `/` | 今日资讯、热门题材榜、题材标签、重点观察/题材机会 |
| 资讯页 | `/news` | 实时资讯流、分类筛选、热门榜、标签、观察 |
| 题材页 | `/themes` | 热门题材榜、标签、趋势、重点题材、链路示例 |
| 题材详情 | `/themes/[id]` | 事件、逻辑、产业链、公司、证据、风险、观察点、相关题材 |

## 3. UI 要求

顶部只允许：Logo、产品名、副标题、搜索框、首页/资讯/题材导航。

不得出现：登录、注册、我的、会员、付费、样例、输入公开信息、生成按钮。

## 4. 截图

```text
docs/auto-execute/screenshots/web-home.png
docs/auto-execute/screenshots/web-news.png
docs/auto-execute/screenshots/web-themes.png
docs/auto-execute/screenshots/web-theme-detail.png
```

每个截图必须对应 reference 和 diff/人工复核。

## 5. 交互

| 页面 | 必测 |
|---|---|
| 首页 | 导航、搜索、更多资讯、题材项、标签 |
| 资讯 | 分类筛选、分页/更多、资讯项、标签 |
| 题材 | 榜单项、标签、趋势卡、链路示例 |
| 详情 | 返回、更多公司、证据来源、相关题材 |

## 6. 状态

每页必须有 loading、empty、error、success，不白屏。

## 7. 命令

Web typecheck、lint、build、Playwright screenshot、API smoke、compliance scan。

## 8. PASS 判定

1. 4 页可访问。
2. 数据来自 API。
3. 截图和 UI 对照存在。
4. 无禁止项。
5. build/typecheck 通过。
6. 生成 handoff。


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




<!-- FILE: 21-task-06-miniprogram-ui-acceptance.md -->


# Task 06 - 微信小程序 UI 一比一复刻验收标准

## 1. 目标

实现微信小程序 4 个 P0 页面，并按 `docs/UI` 一比一复刻。


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


## 2. 页面

| 页面 | 路径 |
|---|---|
| 首页 | `/pages/home/index` |
| 资讯页 | `/pages/news/index` |
| 题材页 | `/pages/themes/index` |
| 题材详情 | `/pages/theme-detail/index` |

## 3. tabBar

只允许：

```text
首页
资讯
题材
```

出现“样例”“我的”“登录”“付费”“生成”等即 FAIL。

## 4. 各页模块

| 页面 | 必须模块 |
|---|---|
| 首页 | 品牌、搜索、顶部 Tab、今日资讯、热门榜、标签、重点观察、底部 Tab |
| 资讯 | 实时资讯流、分类筛选、热门榜、标签、重点观察、底部 Tab |
| 题材 | 热门榜、标签、趋势、重点题材卡、链路示例、底部 Tab |
| 详情 | 返回、题材头部、事件、逻辑、产业链、公司、证据、风险、观察点、相关题材 |

## 5. API

| 页面 | API |
|---|---|
| 首页 | `/api/public/home` |
| 资讯 | `/api/public/news`、`/api/public/themes/rank` |
| 题材 | `/api/public/themes/rank`、`/api/public/theme-tags`、`/api/public/themes` |
| 详情 | `/api/public/themes/:id` |

## 6. 截图

```text
docs/auto-execute/screenshots/mp-home.png
docs/auto-execute/screenshots/mp-news.png
docs/auto-execute/screenshots/mp-themes.png
docs/auto-execute/screenshots/mp-theme-detail.png
```

如无法用微信开发者工具自动截图，写 `BLOCKED_BY_WECHAT_DEVTOOLS`，但源码、app.json、WXML/WXSS/TS 静态检查必须通过。

## 7. PASS 判定

1. 4 个页面存在。
2. tabBar 正确。
3. API service 统一配置，不散落硬编码。
4. 无禁止项。
5. 截图/复核或明确 blocker。
6. 构建/静态检查通过。
7. 生成 handoff。


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




<!-- FILE: 21-task-07-admin-review-publish-acceptance.md -->


# Task 07 - 后台审核发布闭环验收标准

## 1. 目标

实现后台最小可用闭环：录入/抓取资讯 → 清洗 → AI 分析 → 研究卡审核 → 发布。


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


## 2. 后台页面

| 页面 | 路由 |
|---|---|
| 后台登录 | `/admin/login` |
| 后台首页 | `/admin` |
| 数据源 | `/admin/sources` |
| 爬虫任务 | `/admin/crawl-runs` |
| 原始资讯 | `/admin/raw-news` |
| 标准化资讯 | `/admin/normalized-news` |
| AI 分析 | `/admin/ai-runs` |
| 研究卡审核 | `/admin/research-cards` |
| 题材管理 | `/admin/themes` |
| 标签管理 | `/admin/theme-tags` |
| 公司映射 | `/admin/theme-companies` |
| 发布管理 | `/admin/publish-items` |
| 合规词库 | `/admin/compliance` |

## 3. 后台主流程

| Step | 操作 | 预期 |
|---|---|---|
| 1 | 登录后台 | 进入后台首页 |
| 2 | 新增 source | sources 有记录 |
| 3 | 手动录入资讯 | raw_news 有记录 |
| 4 | 清洗 | normalized_news 有记录 |
| 5 | AI 分析 | research_card draft |
| 6 | 审核编辑 | 字段可改并回读 |
| 7 | 合规检查 | passed/blocked_terms |
| 8 | 发布 | publish_items 更新 |
| 9 | 前端查询 | public API 返回发布内容 |

## 4. 后台 API

必须覆盖 sources、crawl-runs、raw-news、normalize、analyze、research-cards、publish、themes、theme-companies、publish-items、compliance。

## 5. 截图

```text
admin-dashboard.png
admin-sources.png
admin-raw-news.png
admin-research-card-review.png
admin-publish-items.png
```

## 6. PASS 判定

1. 后台有鉴权。
2. 主流程跑通。
3. 发布后 public API 可见。
4. 后台不泄漏密钥。
5. 截图和 API 证据存在。
6. 生成 handoff。


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




<!-- FILE: 21-task-08-crawler-normalize-ai-pipeline.md -->


# Task 08 - 爬虫、清洗、AI、合规流水线验收标准

## 1. 目标

跑通内部数据加工核心：source → crawler → raw_news → normalized_news → AI/规则分析 → research_card draft → compliance guard。


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


## 2. 爬虫原则

只抓公开可访问数据；不抓付费内容；不绕过登录/反爬；不抓隐私；保存 source_url、publish_time、crawled_at、source_hash、dedupe_hash；失败有日志。

## 3. 最低 source

| 类型 | 要求 |
|---|---|
| mock source | 稳定返回 10-20 条测试资讯 |
| public source | 至少 1 个公开源抓取器；若受网络/robots 限制可 BLOCKED |

## 4. 清洗能力

HTML 去除、空格清理、标题标准化、dedupe_hash、关键词、实体、证据片段。

## 5. ModelRouter

必须有 mock provider、openai-compatible placeholder、fallback。无真实 Key 时不能假装真实模型成功。

## 6. AI 输出

必须 schema 校验：event、catalyst、theme、theme_chain、companies、evidences、risks、observation_points、compliance。

## 7. 公司映射

公司必须来自 companies / theme_company_matches / 公开证据 / 人工映射，不得由模型凭空生成。

## 8. 证据强度

strong、medium、weak、insufficient 四档。

## 9. Pipeline 测试

| Step | 预期 |
|---|---|
| trigger crawl | crawl_runs success |
| save raw_news | inserted_count > 0 |
| duplicate crawl | duplicate_count > 0 |
| normalize | normalized_news generated |
| AI analyze | ai_analysis_runs + research_card draft |
| compliance | passed/blocked clear |
| admin visible | 后台可查看草稿 |

## 10. 证据

```text
crawler-smoke.json
normalize-smoke.json
ai-worker-schema.json
compliance-guard.json
pipeline-flow.json
crawler.log
ai-worker.log
```

## 11. PASS 判定

1. mock crawler 可运行。
2. 去重可验证。
3. normalized_news 生成。
4. AI mock/fallback 生成合法 JSON。
5. research_card draft 生成。
6. 合规守卫有效。
7. 生成 handoff。


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




<!-- FILE: 21-task-09-full-integration-verification.md -->


# Task 09 - 全量集成联调与回归验收标准

## 1. 目标

跑完整个系统的全量集成流，并为最终报告准备证据。


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


## 2. 主链

```text
后台新增数据源或手动录入资讯
→ raw_news
→ normalized_news
→ research_card draft
→ 后台审核发布
→ publish_items
→ public API
→ Web 展示
→ 小程序展示
```

## 3. 必跑 Lane

repo status、typecheck、lint、api build/test、db validate/seed、public API smoke、admin API smoke、crawler smoke、AI smoke、web build/screenshot、小程序构建/截图、compliance guard、secret guard、final gate precheck。

## 4. DB 数量验收

| 表 | 最低 |
|---|---:|
| sources | 1 |
| raw_news | 10 |
| normalized_news | 10 |
| themes | 10 |
| theme_tags | 15 |
| theme_rankings | 5 |
| research_cards | 3 |
| companies | 10 |
| theme_company_matches | 10 |
| evidences | 10 |
| risk_notes | 5 |
| observations | 5 |
| publish_items | 8 |

## 5. UI 截图

Web 4 张、小程序 4 张、Admin 至少 4 张。

## 6. Guard

secret guard、production DB guard、deploy guard、payment guard、git guard、compliance guard。

## 7. 输出证据

```text
task-09-full-verification.json
db-data-check.json
e2e-data-to-display-flow.json
secret-guard.json
compliance-guard.json
final-gate-precheck.json
09-ui-regression-summary.md
TASK-09-HANDOFF.md
```

## 8. PASS 判定

1. 所有 P0 命令有日志。
2. 主链跑通或 blocker 清楚。
3. UI 截图存在或小程序 blocker 清楚。
4. 合规扫描通过。
5. 失败项进入 gap-list。
6. 生成 handoff。


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




<!-- FILE: 21-task-10-final-acceptance-reporting.md -->


# Task 10 - 最终验收和交付报告标准

## 1. 目标

完成最终用户场景验收、UI 对照、接口结果汇总、未完成项归档，并写出 final acceptance report。


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


## 2. 最终必测流程

| ID | 流程 | PASS |
|---|---|---|
| FLOW-01 | Web 首页 | 今日资讯、热门题材、标签、观察可见 |
| FLOW-02 | Web 资讯 | 分类筛选和资讯流可见 |
| FLOW-03 | Web 题材 | 榜单、趋势、链路示例可见 |
| FLOW-04 | Web 题材详情 | 事件、逻辑、产业链、公司、证据、风险、观察点可见 |
| FLOW-05 | 小程序首页 | UI 与参考一致，Tab 正确 |
| FLOW-06 | 小程序资讯 | 实时资讯流可见 |
| FLOW-07 | 小程序题材 | 题材模块完整 |
| FLOW-08 | 小程序题材详情 | 详情模块完整 |
| FLOW-09 | 后台发布闭环 | 录入/审核/发布后用户端显示 |
| FLOW-10 | 爬虫/AI 流水线 | raw_news 到 research_card draft 可跑 |

## 3. 最终报告

生成：

```text
docs/auto-execute/final-acceptance-report.md
```

必须包含：总 verdict、git 状态、启动命令、后端/API/Web/小程序/Admin/DB/Crawler/AI 命令结果、公开 API 摘要、后台 API 摘要、E2E 主链、UI 截图对照、合规、secret guard、完成项、未完成项、风险、下一步。

## 4. 最终 PASS 硬条件

1. Web 4 页可访问。
2. 小程序 4 页存在且可预览/构建或 blocker 清楚。
3. P0 API 有正反例和 schema。
4. 后台录入/审核/发布闭环跑通。
5. 数据链 raw_news → publish_items 有证据。
6. UI 有截图和差异说明。
7. 用户端无禁止项。
8. 合规无禁词。
9. secret guard 无未解释 HARD_FAIL。
10. 报告证据文件真实存在。

## 5. 降级判定

| 情况 | verdict |
|---|---|
| UI 需人工复核 | PASS_NEEDS_MANUAL_UI_REVIEW |
| 小程序 DevTools 不可用 | PASS_WITH_LIMITATION 或 BLOCKED |
| 真实爬虫源不可用但 mock 跑通 | PASS_WITH_LIMITATION |
| 真实模型 Key 缺失但 mock 跑通 | PASS_WITH_LIMITATION |
| P0 页面白屏 | REPAIR_REQUIRED |
| 用户端出现禁止项 | HARD_FAIL |
| 合规禁词出现 | HARD_FAIL |
| secret 未解释 | HARD_FAIL |

## 6. 交付清单

必须存在 final report、project-state、矩阵文件、results JSON、logs、screenshots、TASK-01 到 TASK-10 handoff。

## 7. Task 10 Handoff

```md
# Task 10 Handoff

## 最终 verdict
## 最终报告路径
## 已完成项
## 未完成项
## blocker
## 证据路径
## 不能宣称 PASS 的原因（如有）
## 下一轮应从哪个 Task 修复
## 是否允许对外演示
```



<!-- FILE: 21-finahuntv2-auto-execute-run-prompt.md -->


# FinahuntV2 Auto-Execute 一次性执行提示词

```text
请在 D:\lyh\agent\agent-frame\finahuntV2 中执行 FinahuntV2 国内版展示型 MVP。

先读取：
- AGENTS.md（如存在）
- docs/FINAHUNT_MVP_DOMESTIC_MINIPROGRAM_ARCH_SPEC.md
- docs/UI/**
- docs/21-finahuntv2-auto-execute-master-plan.md
- docs/21-task-01-requirements-ui-api-inventory.md
- docs/21-task-02-harness-and-evidence-gates.md
- docs/21-task-03-repo-architecture-foundation.md
- docs/21-task-04-public-api-data-contract.md
- docs/21-task-05-web-display-ui-acceptance.md
- docs/21-task-06-miniprogram-ui-acceptance.md
- docs/21-task-07-admin-review-publish-acceptance.md
- docs/21-task-08-crawler-normalize-ai-pipeline.md
- docs/21-task-09-full-integration-verification.md
- docs/21-task-10-final-acceptance-reporting.md

按 Task 01-10 串行执行。每个 Task 必须生成日志、结果 JSON、截图/证据和 docs/auto-execute/latest/TASK-XX-HANDOFF.md。缺 handoff 不允许进入下一 Task。

当前 P0 只做展示型 MVP：Web 首页/资讯/题材/题材详情；微信小程序首页/资讯/题材/题材详情；后台录入/审核/发布；爬虫/清洗/AI/合规；公开 API。

禁止用户端出现登录、注册、付费、会员、激活码、我的、权益、输入公开信息、生成研究卡、样例页。

UI 必须以 docs/UI 为准一比一复刻。没有 reference、actual、diff 或人工复核记录，不得写 UI PASS。

主链必须跑通：后台录入/爬虫 -> raw_news -> normalized_news -> research_card draft -> 后台审核发布 -> publish_items -> public API -> Web 展示 -> 小程序展示。

所有失败必须进入修复循环，不能把 BLOCKED/LIMITATION/MANUAL_REVIEW_REQUIRED 写成 PASS。
```
