# Changelog

## 0.1.0 — 2026-10-03

First release. 《小夹子》：把对话里值得留的话夹起来。

- **🔖 夹一下**：每条助手回复上的收藏按钮；正文 + 模型 + 时间 + messageId 一并记下。
- **🦊 小夹子 (N)**：会话头部按钮 + 面板（翻 / 搜 / 复制 / 删 / 导出成 Markdown）。
- **设置页**：同一个架子的另一种视图。
- 宿主落盘 `$DSH_HOME/clipbook/items.json`；同一份收藏，网页版与桌面端共享。
- 12 项纯逻辑单测（`npm test`）。

> 更名说明：本项目原定名 `dsh-keep`（仓库/目录已同步改为 `dsh-clipbook`），因 npm 上 `dsh-keep` 已被他人占用而改名。包的"四处身份"（package.json / cordis.patch.yml / build.mjs CLIENT_ID / src/index.ts 的 `export const name`）已一并同步。
