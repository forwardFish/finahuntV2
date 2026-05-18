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
