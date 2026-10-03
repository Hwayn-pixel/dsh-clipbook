# dsh-clipbook · 小夹子

> **A clipbook for your DSH conversations.** One click on any assistant reply to keep it; a 🦊 button in the session header opens your clips — browse, search, copy, delete, export.

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin · MIT · works on desktop **and** web

[English](README.md) | [简体中文](README.zh-CN.md)

---

## What it does

- **🔖 夹一下 (Clip)** — every finalized assistant message gets a clip button. One click saves that reply (text + model + time + message id) into your clipbook.
- **🦊 小夹子 (N)** — a button in the session header shows how many clips you have and opens a panel: browse, **search**, **copy**, **delete**, **export to Markdown**.
- **Settings page** — the same shelf, another view.
- **One shelf, shared** — clips live in one file, so the web UI and the desktop app see the same collection.

## Why

DSH is all about long agent runs, and the good answers scroll away. 小夹子 is a place to keep the few lines worth keeping — a conclusion, a snippet, a phrasing — without copying them into another app.

## Install

```shell
dsh plugin --profile desktop add dsh-clipbook     # desktop app
dsh plugin --profile web add dsh-clipbook         # web UI
```

Restart DSH. Then, in any assistant message's action row you will see **🔖 夹一下**, and **🦊 小夹子** appears in the session header.

## Use

| You want | Do this |
|---|---|
| keep a reply | click **🔖 夹一下** under that reply (it turns into **📌 已夹**) |
| see your clips | click **🦊 小夹子 (N)** in the session header |
| search | type in the box at the top of the panel |
| copy one | **复制** |
| remove one | **拿掉** |
| export all | **导出** (opens the whole clipbook as Markdown) |

## Where data lives

`$DSH_HOME/clipbook/items.json` (`DSH_HOME` defaults to `~/.dsh`). Plain JSON — delete it to clear the shelf (it is recreated).

## Limits

- Clips the **text** of assistant replies (reasoning and tool output are not clipped).
- One shelf per `DSH_HOME` — that is a feature, not a clone-per-profile bug.

## Development

```shell
npm install
npm run build      # src/index.ts -> lib/index.js ; src/client/index.ts -> lib/client.js
npm run typecheck
npm test           # pure-logic unit tests (against the built bundles; no DSH needed)
```

## Authors & license

- **Author: Hwayn (幻弈)**
- **Collaborator: Yucheng Xiao (肖宇成)** — direction, requirements, testing
- License: MIT
