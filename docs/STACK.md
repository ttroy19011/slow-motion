# 技术框架与前后端分离

## 一句话

前端是 **微信原生小程序（TypeScript）**，后端是 **微信云开发**，不自建服务器。页面不直接改数据库，一律经过云函数。

## 技术栈

| 层 | 选用 | 不选用（本期） | 原因 |
|---|---|---|---|
| 小程序运行时 | 微信官方 App / Page / Component | React、Vue、uni-app、Taro | 分享、登录、云开发都是微信原生能力，少一层抽象 |
| 结构 / 样式 / 逻辑 | WXML + WXSS + TypeScript | 纯 JavaScript | 有类型，接口字段不容易写错 |
| 后端 | 微信云开发 | 自建 Node / Java 服务器 | 个人小程序先把主路径跑通 |
| 数据 | 云数据库（文档型） | MySQL | 和云函数同一账号，免运维 |
| 文件 | 云存储 | 自建 OSS | 头像上传用 `wx.cloud.uploadFile` |
| 定时 | 云函数触发器 | 自己的 cron 机器 | 督促超时每 5 分钟扫一次 |
| 版本 | Git（仓库在 `慢系统` 这一层） | 把开发者工具也提交进 Git | 工具有 773MB，不是源码 |

基础库版本：`3.17.2`（见 `project.config.json` 的 `libVersion`）。

## 云原生用了哪些能力

这里的「云原生」指 **微信云开发（CloudBase）**，不是 Kubernetes。

| 云能力 | 本项目用途 | 代码位置 |
|---|---|---|
| 云函数 Cloud Function | 全部业务规则：登录、计划、打卡、关注、督促 | `cloudfunctions/api` |
| 云函数定时触发器 | 把超过 30 分钟未回应的督促标为过期 | `cloudfunctions/nudgeExpire` |
| 云数据库 | 用户、计划、成员、打卡、督促 | 集合名见 ARCHITECTURE.md |
| 云存储 | 用户头像 | `pages/profile/profile.ts` 里 `wx.cloud.uploadFile` |
| 免登录身份 | 云函数里用 `cloud.getWXContext().OPENID` | `cloudfunctions/api/index.js` |

前端初始化云环境：`miniprogram/app.ts` → `wx.cloud.init`。  
环境 ID 填在：`miniprogram/config.ts` 的 `CLOUD_ENV_ID`。

## 前后端如何分开

```text
┌────────────── 前端（miniprogram）──────────────┐
│  pages / components     只负责展示和点击        │
│  services/api.ts        唯一出口：callFunction  │
└──────────────────────┬─────────────────────────┘
                       │ wx.cloud.callFunction({ name: 'api', data: { action, ... } })
                       ▼
┌────────────── 后端（cloudfunctions）───────────┐
│  api/index.js           按 action 分发          │
│  handlers/*.js          校验身份、写数据库      │
│  云数据库 / 云存储      数据落盘                │
└────────────────────────────────────────────────┘
```

约定：

1. **页面禁止** `wx.cloud.database()` 直接读写。以后要换后端，只改 `services/api.ts`。
2. **连续天数、超时** 以云函数时间为准（东八区日期），不信手机时钟。
3. 云函数返回统一形状：`{ ok: true, data }` 或 `{ ok: false, error }`。
4. 数据库权限建议「所有用户不可读写」，只允许云函数读写。这就是权限上的前后端分离。

## 前端内部分层

| 目录 | 职责 |
|---|---|
| `pages/` | 一个页面一个文件夹，四个文件：`ts / wxml / wxss / json` |
| `components/` | 可复用卡片，例如计划卡片 |
| `services/` | 调用云函数 |
| `types/` | TypeScript 类型，前后端字段以这里为准 |
| `utils/` | 日期、文案，不含网络请求 |
| `config.ts` | 云环境 ID |
| `app.ts / app.json / app.wxss` | 启动、路由、全局样式、TabBar |

## 后端内部分层

| 文件 | 职责 |
|---|---|
| `api/index.js` | 网关：校验 OPENID、调用 handler、统一报错 |
| `api/handlers/user.js` | 登录与资料 |
| `api/handlers/plan.js` | 创建 / 查询计划、首页、关注页数据 |
| `api/handlers/checkin.js` | 打卡、连续天数、阶段完成 |
| `api/handlers/follow.js` | 关注 |
| `api/handlers/nudge.js` | 发出督促、回应、延迟、超时 |
| `api/handlers/_util.js` | 日期与共用查询 |
| `nudgeExpire/index.js` | 定时调用 `expireNudges` |

## 和常见 Web 项目的对应关系

| 你若做过网站 | 在本项目里 |
|---|---|
| 浏览器 HTML/CSS/JS | WXML / WXSS / TS |
| Vue/React 页面 | `pages/` |
| axios / fetch | `services/api.ts` + `wx.cloud.callFunction` |
| Express 路由 | `cloudfunctions/api/index.js` 的 `action` |
| 业务 Service | `handlers/*.js` |
| MySQL | 云数据库集合 |
| Nginx 服务器 | 没有，由微信云托管 |
