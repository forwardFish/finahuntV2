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

