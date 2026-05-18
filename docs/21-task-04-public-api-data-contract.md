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

