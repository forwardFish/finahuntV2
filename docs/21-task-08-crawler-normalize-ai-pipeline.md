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

