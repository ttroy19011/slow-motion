# 模块对照表

「模块」按业务切，不按框架名切。改某一功能时，只动表里这一行的文件，并同步改文档。

## 页面模块（你能看见的）

| 模块 | 用户感知 | 页面路径 | 调哪些 action | 说明 |
|---|---|---|---|---|
| 今日 | Tab「今日」 | `pages/home` | `getHome` | 我的计划 + 待回应督促 |
| 制定计划 | 按钮「制定计划」 | `pages/plan-create` | `createPlan` | 名称、每日分钟、第一阶段 |
| 计划详情 | 点进一张计划卡片 | `pages/plan-detail` | `getPlan` `checkin` `followPlan` `sendNudge` | 进度、分享、关注、督促 |
| 回应督促 | 点首页督促卡片 | `pages/nudge` | `getNudge` `respondNudge` | 30 分钟完成或延迟 |
| 关注 | Tab「关注」 | `pages/social` | `getSocial` | 我关注的 / 关注我的 |
| 我的 | Tab「我的」 | `pages/profile` | `getHome` `updateProfile` | 头像称呼、累计统计 |

底部三个 Tab 在 `miniprogram/app.json` 的 `tabBar`。图标在 `miniprogram/assets/`。

## 组件模块

| 组件 | 文件 | 出现在哪些页 | 作用 |
|---|---|---|---|
| 计划卡片 | `components/plan-card` | 今日、关注、详情顶部 | 连续天数 / 累计天数 / 累计时长 / 当前阶段 |

## 前端支撑模块

| 模块 | 文件 | 作用 |
|---|---|---|
| 云初始化 | `app.ts` + `config.ts` | 启动时 `wx.cloud.init` |
| API 网关（前端） | `services/api.ts` | 所有 `callFunction` 只写这里 |
| 类型 | `types/index.ts` | Plan、Nudge、角色等 |
| 日期 | `utils/date.ts` | 倒计时、延迟选项 |
| 文案 | `utils/format.ts` | 时长、阶段名、督促状态文案 |
| 全局样式 | `app.wxss` | 纸色背景、按钮、卡片 |

## 后端业务模块

| 业务 | handler | 数据库 |
|---|---|---|
| 用户 | `handlers/user.js` | `users` |
| 计划首页/详情 | `handlers/plan.js` | `plans` `plan_members` |
| 打卡与连续天数 | `handlers/checkin.js` | `plans` `checkins` |
| 关注 | `handlers/follow.js` | `plan_members` |
| 督促闭环 | `handlers/nudge.js` | `nudges`（完成时可能触发打卡） |
| 超时扫描 | `nudgeExpire` + `expireNudges` | 把 `pending` 且过 `deadlineAt` 改为 `expired` |

## 产品能力 → 代码（第一期）

| 产品能力 | 前端 | 后端 |
|---|---|---|
| 制定自己的计划 | `plan-create` | `createPlan`（同时写入 owner + doer） |
| 每日最小动作 | `plan-detail` 打卡按钮 | `checkin` |
| 连续 / 累计 / 时长 / 阶段 | `plan-card` 展示 | `checkin` 计算并写回 `plans` |
| 分享给亲友 | `plan-detail` 的 `open-type="share"` | 好友打开同一 `planId` |
| 亲友关注 | 详情页「关注这份计划」 | `followPlan` 写入 watcher |
| 远程督促 | 详情页「轻轻督促一下」 | `sendNudge`，30 分钟 deadline |
| 30 分钟内满足 | `nudge` 页主按钮 | `respondNudge` + 必要时 `checkin` |
| 延迟 | `nudge` 页三个时间选项 | `respondNudge` 记 `delayed` |
| 超时 | 首页加载时顺带处理 | `expireNudges` / 定时函数 |

## 第二期预留（现在不要做）

| 能力 | 以后主要改哪里 |
|---|---|
| 给亲友制定计划 | `createPlan` 增加 doer ≠ owner |
| 共同计划 | `plan_members` 多个 doer |
| 订阅消息推送 | 新云函数 + 公众平台模板，不改打卡算法 |
