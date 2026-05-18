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

