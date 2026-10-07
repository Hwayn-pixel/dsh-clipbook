# Changelog

## 0.3.0

给两种人都顺一点的一次打磨（0.2.0 → 0.3.0）：

- 空状态重写：说清"小夹子 = 对话收藏夹"、从哪存（助手回复下方「夹一下」）、存在哪（本机）。
- 修掉一个真 bug：搜索没命中时，原本会说"架子空着"，让人以为收藏丢了 —— 现在分开报"没找到"和"一共几条"。
- 删除改成两步确认；导出按钮统一叫「导出 Markdown」；搜索时显示「找到 X / N 条」。


## 0.2.0 — 2026-10-03

- **Localized UI**: the clip button, header button and panel follow the browser language — Chinese UI in Chinese, everyone else in English.
- **Source comments translated to English** (host and browser halves).
- Settings schema descriptions and server messages are now English.

## 0.1.0 — 2026-10-03

First release. 《小夹子》：把对话里值得留的话夹起来。

- **🔖 夹一下**：每条助手回复上的收藏按钮；正文 + 模型 + 时间 + messageId 一并记下。
- **🦊 小夹子 (N)**：会话头部按钮 + 面板（翻 / 搜 / 复制 / 删 / 导出成 Markdown）。
- **设置页**：同一个架子的另一种视图。
- 宿主落盘 `$DSH_HOME/clipbook/items.json`；同一份收藏，网页版与桌面端共享。
- 12 项纯逻辑单测（`npm test`）。

> 更名说明：本项目原定名 `dsh-keep`（仓库/目录已同步改为 `dsh-clipbook`），因 npm 上 `dsh-keep` 已被他人占用而改名。包的"四处身份"（package.json / cordis.patch.yml / build.mjs CLIENT_ID / src/index.ts 的 `export const name`）已一并同步。
