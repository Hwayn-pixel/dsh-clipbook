# dsh-clipbook · 小夹子

> **给 DSH 对话用的"小夹子"。** 任意一条助手回复上点一下，就把它收进你的夹子；会话头部一个 🦊 按钮打开收藏——翻、搜、复制、删、导出。

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件 · MIT · 桌面端 / 网页版通用

[English](README.md) | [简体中文](README.zh-CN.md)

---

## 它做什么

- **🔖 夹一下** —— 每条助手回复上多一个"夹一下"按钮。点一下，就把这段话（正文 + 模型 + 时间 + 消息 id）收进你的夹子。
- **🦊 小夹子 (N)** —— 会话头部一个按钮，显示你夹了多少条；点开是一个面板：翻、**搜**、**复制**、**删**、**导出成 Markdown**。
- **设置页** —— 同一个架子，另一种摆法。
- **一个架子，两边共享** —— 收藏存在一个文件里，网页版和桌面端看到的是同一份。

## 为什么

DSH 里对话很长，好答案往往一滚就没。小夹子就是留那几句"值得留的话"的地方——一句结论、一段代码、一种说法——不用再复制到别的 App。

## 安装

```shell
dsh plugin --profile desktop add dsh-clipbook     # 桌面版
dsh plugin --profile web add dsh-clipbook         # 网页版
```

装完重启 DSH。之后任意一条助手回复的动作行里就有 **🔖 夹一下**，会话头部会出现 **🦊 小夹子**。

## 怎么用

| 你想 | 这么做 |
|---|---|
| 留一条回复 | 在那条回复下点 **🔖 夹一下**（变成 **📌 已夹**） |
| 看收藏 | 点会话头部的 **🦊 小夹子 (N)** |
| 搜索 | 面板顶部的搜索框里打字 |
| 复制一条 | **复制** |
| 拿掉一条 | **拿掉** |
| 全部导出 | **导出**（把整个夹子导成 Markdown 打开） |

## 数据存在哪

`$DSH_HOME/clipbook/items.json`（`DSH_HOME` 默认 `~/.dsh`）。纯 JSON——删掉即可清空（会自动重建）。

## 边界

- 夹的是助手回复的**正文**（思维链与工具输出不夹）。
- 一副架子对应一个 `DSH_HOME`。

## 开发

```shell
npm install
npm run build      # src/index.ts -> lib/index.js ; src/client/index.ts -> lib/client.js
npm run typecheck
npm test           # 纯逻辑单测（对构建产物跑，不需要 DSH）
```

## 作者与许可

- **作者：Hwayn（幻弈）**
- **协作者：Yucheng Xiao（肖宇成）** —— 方向、需求、测试
- License：MIT

## 谁用都顺手

- **第一次用**：在任意助手回复**下方**点「🔖 夹一下」，那段话就进小夹子了。
- **找东西**：面板里直接搜，副标题会告诉你命中几条。
- **带走**：「导出 Markdown」把整个夹子导成一篇 Markdown。

一句话：第一次用，点一下就能跑起来；天天用，常用的都在手边。
