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
