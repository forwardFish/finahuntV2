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
