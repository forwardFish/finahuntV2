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

