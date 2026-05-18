# Task 06 - 微信小程序 UI 一比一复刻验收标准

## 1. 目标

实现微信小程序 4 个 P0 页面，并按 `docs/UI` 一比一复刻。


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

| 页面 | 路径 |
|---|---|
| 首页 | `/pages/home/index` |
| 资讯页 | `/pages/news/index` |
| 题材页 | `/pages/themes/index` |
| 题材详情 | `/pages/theme-detail/index` |

## 3. tabBar

只允许：

```text
首页
资讯
题材
```

出现“样例”“我的”“登录”“付费”“生成”等即 FAIL。

## 4. 各页模块

| 页面 | 必须模块 |
|---|---|
| 首页 | 品牌、搜索、顶部 Tab、今日资讯、热门榜、标签、重点观察、底部 Tab |
| 资讯 | 实时资讯流、分类筛选、热门榜、标签、重点观察、底部 Tab |
| 题材 | 热门榜、标签、趋势、重点题材卡、链路示例、底部 Tab |
| 详情 | 返回、题材头部、事件、逻辑、产业链、公司、证据、风险、观察点、相关题材 |

## 5. API

| 页面 | API |
|---|---|
| 首页 | `/api/public/home` |
| 资讯 | `/api/public/news`、`/api/public/themes/rank` |
| 题材 | `/api/public/themes/rank`、`/api/public/theme-tags`、`/api/public/themes` |
| 详情 | `/api/public/themes/:id` |

## 6. 截图

```text
docs/auto-execute/screenshots/mp-home.png
docs/auto-execute/screenshots/mp-news.png
docs/auto-execute/screenshots/mp-themes.png
docs/auto-execute/screenshots/mp-theme-detail.png
```

如无法用微信开发者工具自动截图，写 `BLOCKED_BY_WECHAT_DEVTOOLS`，但源码、app.json、WXML/WXSS/TS 静态检查必须通过。

## 7. PASS 判定

1. 4 个页面存在。
2. tabBar 正确。
3. API service 统一配置，不散落硬编码。
4. 无禁止项。
5. 截图/复核或明确 blocker。
6. 构建/静态检查通过。
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

