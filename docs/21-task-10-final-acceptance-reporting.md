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
