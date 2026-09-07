# Git 分支约定

## 分支角色

| 分支 | 用途 |
|---|---|
| `main` | **正式版**：实际使用、预览、上传体验版 / 正式版都基于此分支 |
| `slow-motion-x.y.z.w` | **开发版**：平时改代码、试功能都在对应版本分支上 |

当前开发分支：`slow-motion-1.0.0.1`（第一期前端优化这一代）。

## 日常怎么做

1. 开发前切到版本分支：

```bash
git checkout slow-motion-1.0.0.1
```

2. 改代码 → 提交：

```bash
git add .
git commit -m "说明为什么改"
```

3. 功能稳定、准备给真机 / 上传体验版时，合并进 `main`：

```bash
git checkout main
git merge --no-ff slow-motion-1.0.0.1 -m "合并 slow-motion-1.0.0.1 到正式版"
git push origin main
git push origin slow-motion-1.0.0.1
```

4. 开下一小版本时，从最新 `main` 拉新分支，例如：

```bash
git checkout main
git pull
git checkout -b slow-motion-1.0.0.2
```

## 不要做的事

- 不要在 `main` 上直接堆日常试验改动
- 不要把 `tools/微信web开发者工具` 或云环境密钥提交进仓库
- 微信开发者工具始终打开 `慢系统` 工程目录；Git 分支用命令行或 Cursor 切换即可，源码目录不变

## 远程

https://github.com/ttroy19011/slow-motion
