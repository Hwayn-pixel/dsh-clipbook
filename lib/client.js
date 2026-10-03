window.__ModuleLoader__.load({
	id: "dsh-clipbook",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__test = exports.inject = void 0;
exports.pickMessage = pickMessage;
exports.filterItems = filterItems;
exports.apply = apply;
/**
 * dsh-clipbook — Browser half.
 *
 * 小夹子 lives where the words are:
 *   · **每条助手回复上的「夹一下」** — `conversation.chat.assistant-actions`。
 *     取正文靠 `useChat` 快照（按 messageId 找那条 assistant 节点），不猜、不爬 DOM。
 *   · **会话头部的「🦊 小夹子 (N)」** — `conversation.session.header.utilities`。点开一个面板，
 *     翻、搜、复制、删、导出。
 *   · **设置页那一栏** — `settings.section`，同一个架子，另一种摆法。
 *
 * `React.createElement` rather than JSX: this file is transpiled straight to CommonJS for the
 * client-module loader, which has no JSX pass.
 */
const React = require("react");
const h = React.createElement;
const NS = "ui-clipbook";
const ROUTE = "/dsh-clipbook";
const STYLE_ID = "dsh-clipbook-style";
// `remote` is the typert RPC namespace present in both 0.1.x and the 0.2 desktop app;
// `slots` is the slot registry. Declaring what always existed — never `settingsScope` (dropped in 0.2).
exports.inject = ["slots", "remote"];
// ── a tiny shared shelf the whole UI reads ──────────────────────────────────
let state = { items: [], status: "cold", enabled: true };
const listeners = new Set();
function emit() {
    for (const fn of listeners)
        fn();
}
function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}
function getState() {
    return state;
}
let inflight = null;
function refresh() {
    if (inflight)
        return inflight;
    inflight = (async () => {
        try {
            const res = await fetch(`${ROUTE}/items`, { cache: "no-store" });
            const json = await res.json();
            if (json?.ok)
                state = { items: Array.isArray(json.items) ? json.items : [], status: "ready", enabled: json.enabled !== false };
            else
                state = { ...state, status: "error" };
        }
        catch {
            state = { ...state, status: "error" };
        }
        finally {
            inflight = null;
            emit();
        }
    })();
    return inflight;
}
async function clip(payload) {
    try {
        const res = await fetch(`${ROUTE}/items`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
        });
        const json = await res.json();
        await refresh();
        return json ?? { ok: false };
    }
    catch (error) {
        return { ok: false, error: String(error?.message ?? error) };
    }
}
async function drop(id) {
    try {
        await fetch(`${ROUTE}/items?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    }
    finally {
        await refresh();
    }
}
function useKeep() {
    return React.useSyncExternalStore(subscribe, getState, getState);
}
// ── pure helpers (also exercised by the test suite) ─────────────────────────
/** Pull the text and model of one assistant message out of a Chat snapshot. */
function pickMessage(snapshot, messageId) {
    const nodes = Array.isArray(snapshot?.legacy?.nodes) ? snapshot.legacy.nodes : [];
    const node = nodes.find((row) => row && row.kind === "assistant" && row.messageId === messageId);
    if (!node)
        return { text: "" };
    const blocks = Array.isArray(node.blocks) ? node.blocks : [];
    const text = blocks
        .filter((block) => block && block.kind === "text" && typeof block.text === "string")
        .map((block) => block.text)
        .join("\n\n")
        .trim();
    return { text, model: node?.provenance?.model };
}
/** Case-insensitive search across a clip's title and body. */
function filterItems(items, query) {
    const q = String(query ?? "").trim().toLowerCase();
    if (!q)
        return items;
    return items.filter((item) => `${item.title ?? ""}\n${item.text ?? ""}`.toLowerCase().includes(q));
}
function clock(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const CSS = `
/* 幻弈的设计语言：柔和有呼吸；层次靠「光」和「间距」，不靠「线」。 */
.dshKeep{--k-r-xs:6px;--k-r-sm:10px;--k-r-md:14px;--k-r-lg:20px;--k-pill:999px;
  --k-tone:rgba(128,128,128,.055);--k-tone-2:rgba(128,128,128,.10);--k-tone-3:rgba(128,128,128,.16);
  --k-line:1px solid rgba(128,128,128,.18);--k-accent:rgba(48,126,222,.9);
  --k-sh:0 1px 2px rgba(0,0,0,.05);--k-t:.18s ease;font-size:13.5px;line-height:1.65}
.dshKeep-btn{border:var(--k-line);border-radius:var(--k-r-sm);padding:3px 10px;font:inherit;font-size:12.5px;
  background:transparent;color:inherit;cursor:pointer;transition:background var(--k-t),border-color var(--k-t),color var(--k-t);white-space:nowrap}
.dshKeep-btn:hover{background:var(--k-tone-2);border-color:rgba(128,128,128,.28)}
.dshKeep-btn:focus-visible{outline:2px solid var(--k-accent);outline-offset:1px}
.dshKeep-btn[disabled]{opacity:.45;cursor:default}
.dshKeep-btn--on{border-color:transparent;background:var(--k-accent);color:#fff}
.dshKeep-btn--on:hover{filter:brightness(1.06);background:var(--k-accent)}
.dshKeep-head{position:relative;display:inline-flex}
.dshKeep-back{position:fixed;inset:0;background:rgba(10,12,20,.28);z-index:60}
.dshKeep-panel{position:fixed;top:64px;right:18px;width:420px;max-width:92vw;max-height:78vh;z-index:61;
  display:flex;flex-direction:column;background:var(--dsh-surface,#fff);color:inherit;
  border:var(--k-line);border-radius:var(--k-r-lg);box-shadow:0 24px 60px rgba(0,0,0,.28);overflow:hidden}
@media (prefers-color-scheme:dark){.dshKeep-panel{background:#1b1d22}}
.dshKeep-panelTop{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:var(--k-line)}
.dshKeep-title{font-size:15px;font-weight:600}
.dshKeep-sub{font-size:12px;opacity:.62}
.dshKeep-grow{flex:1}
.dshKeep-search{margin:12px 16px 6px;font:inherit;font-size:12.5px;padding:7px 11px;border-radius:var(--k-r-sm);border:var(--k-line);background:var(--k-tone);color:inherit}
.dshKeep-search:hover,.dshKeep-search:focus{background:var(--k-tone-2)}
.dshKeep-list{overflow:auto;padding:4px 10px 12px}
.dshKeep-item{border-radius:var(--k-r-md);padding:11px 12px;transition:background var(--k-t)}
.dshKeep-item:hover{background:var(--k-tone)}
.dshKeep-itemTop{display:flex;align-items:baseline;gap:8px}
.dshKeep-iTitle{font-weight:600;font-size:13px}
.dshKeep-meta{margin-left:auto;font-size:11px;opacity:.55;font-family:ui-monospace,Consolas,monospace;white-space:nowrap}
.dshKeep-body{font-size:12.5px;opacity:.85;white-space:pre-wrap;word-break:break-word;max-height:150px;overflow:auto;margin-top:5px;border-left:2px solid var(--k-tone-3);padding-left:9px}
.dshKeep-actions{display:flex;gap:6px;margin-top:7px}
.dshKeep-empty{padding:26px 18px;text-align:center;opacity:.55;font-size:12.5px}
.dshKeep-dot{color:#4f9d6a}
`;
function ensureStyle() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID))
        return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.append(style);
}
function useColdRefresh() {
    React.useEffect(() => {
        if (state.status === "cold")
            void refresh();
    }, []);
}
// ── one clip button, per assistant message ──────────────────────────────────
function KeepAction(props) {
    const { messageId, sessionId, useChat } = props;
    const snapshot = typeof useChat === "function" ? useChat((s) => s) : undefined;
    const current = useKeep();
    const saved = current.items.find((item) => item.messageId === messageId);
    const [busy, setBusy] = React.useState(false);
    const [note, setNote] = React.useState("");
    useColdRefresh();
    const onClick = async () => {
        if (busy)
            return;
        setBusy(true);
        setNote("");
        try {
            if (saved) {
                await drop(saved.id);
                setNote("拿出来了");
            }
            else {
                const { text, model } = pickMessage(snapshot, messageId);
                if (!text) {
                    setNote("取不到正文");
                }
                else {
                    const result = await clip({ text, model, sessionId, messageId });
                    setNote(result?.duplicate ? "早就夹过啦" : result?.ok ? "夹好了" : result?.error ?? "没夹住");
                }
            }
        }
        finally {
            setBusy(false);
            setTimeout(() => setNote(""), 1800);
        }
    };
    return h("button", {
        className: `dshKeep-btn${saved ? " dshKeep-btn--on" : ""}`,
        title: saved ? `已夹住（${clock(saved.createdAt)}）· 再点一下拿出来` : "夹进小夹子",
        onClick,
        disabled: busy,
    }, h("span", { "aria-hidden": "true" }, saved ? "📌 " : "🔖 "), saved ? "已夹" : "夹一下", note ? h("span", { className: "dshKeep-sub", style: { marginLeft: 6 } }, note) : null);
}
// ── the shelf list (shared by the panel and the settings page) ──────────────
function KeepList(props) {
    const [copied, setCopied] = React.useState("");
    if (!props.items.length)
        return h("div", { className: "dshKeep-empty" }, "架子上还空着。在助手的回复上点「夹一下」。");
    return h("div", { className: "dshKeep-list" }, ...props.items.map((item) => h("div", { className: "dshKeep-item", key: item.id }, h("div", { className: "dshKeep-itemTop" }, h("span", { className: "dshKeep-iTitle" }, item.title || (item.text || "").slice(0, 40)), h("span", { className: "dshKeep-meta" }, `${item.model ? item.model + " · " : ""}${clock(item.createdAt)}`)), h("div", { className: "dshKeep-body" }, item.text), h("div", { className: "dshKeep-actions" }, h("button", {
        className: "dshKeep-btn",
        onClick: async () => {
            try {
                await navigator.clipboard.writeText(item.text);
                setCopied(item.id);
                setTimeout(() => setCopied(""), 1500);
            }
            catch {
                /* clipboard may be denied; nothing to do */
            }
        },
    }, copied === item.id ? "已复制" : "复制"), h("button", { className: "dshKeep-btn", onClick: () => void drop(item.id) }, "拿掉")))));
}
// ── header button + panel ───────────────────────────────────────────────────
function KeepHeader(props) {
    const current = useKeep();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    useColdRefresh();
    const shown = filterItems(current.items, query);
    return h("div", { className: "dshKeep dshKeep-head" }, h("button", {
        className: `dshKeep-btn${open ? " dshKeep-btn--on" : ""}`,
        title: "小夹子 · 对话收藏",
        onClick: () => {
            if (!open)
                void refresh();
            setOpen((value) => !value);
        },
    }, `🦊 小夹子${current.items.length ? ` (${current.items.length})` : ""}`), open
        ? h(React.Fragment, null, h("div", { className: "dshKeep-back", onClick: () => setOpen(false) }), h("div", { className: "dshKeep dshKeep-panel" }, h("div", { className: "dshKeep-panelTop" }, h("span", { className: "dshKeep-title" }, "🦊 小夹子"), h("span", { className: "dshKeep-sub" }, `${current.items.length} 条`), h("div", { className: "dshKeep-grow" }), h("button", { className: "dshKeep-btn", onClick: () => window.open(`${ROUTE}/export?raw=1`, "_blank") }, "导出"), h("button", { className: "dshKeep-btn", onClick: () => setOpen(false) }, "关")), h("input", {
            className: "dshKeep-search",
            placeholder: "搜一搜…",
            value: query,
            onChange: (event) => setQuery(event.target.value),
        }), h(KeepList, { items: shown })))
        : null);
}
// ── settings page ───────────────────────────────────────────────────────────
function KeepSettings() {
    const current = useKeep();
    const [query, setQuery] = React.useState("");
    useColdRefresh();
    const shown = filterItems(current.items, query);
    return h("div", { className: "dshKeep", style: { display: "flex", flexDirection: "column", gap: 14 } }, h("div", { className: "dshKeep-panelTop", style: { border: "none", padding: 0 } }, h("span", { className: "dshKeep-title" }, "🦊 小夹子"), h("span", { className: "dshKeep-sub" }, `架上 ${current.items.length} 条 · 存在 ~/.dsh/keep/items.json`), h("div", { className: "dshKeep-grow" }), h("button", { className: "dshKeep-btn", onClick: () => void refresh() }, "刷新"), h("button", { className: "dshKeep-btn", onClick: () => window.open(`${ROUTE}/export?raw=1`, "_blank") }, "导出 Markdown")), h("input", { className: "dshKeep-search", style: { margin: 0 }, placeholder: "搜一搜…", value: query, onChange: (event) => setQuery(event.target.value) }), h(KeepList, { items: shown }));
}
function apply(ctx) {
    ensureStyle();
    ctx.slots.inject("conversation.chat.assistant-actions", () => ctx.slots.register({ name: "conversation.chat.assistant-actions", id: "keep", order: 30, inject: () => ({}) }, KeepAction));
    ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({ name: "conversation.session.header.utilities", id: "keep-header", order: 30, inject: () => ({}) }, KeepHeader));
    ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "keep", order: 27, label: () => "小夹子", inject: () => ({}) }, KeepSettings));
}
/** Exposed for the test suite only; the helpers are pure. */
exports.__test = { pickMessage, filterItems };


		return module.exports;
	}
});
