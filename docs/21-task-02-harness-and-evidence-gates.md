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

