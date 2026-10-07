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
 * One clip button per assistant message, plus a header button and a panel:
 *   · `conversation.chat.assistant-actions` — the "clip" button on each finalized assistant message.
 *     The text is read from the `useChat` snapshot by message id (no DOM scraping).
 *   · `conversation.session.header.utilities` — the "🦊 Clipbook (N)" button that opens the panel.
 *   · `settings.section` — the same shelf, another view.
 *
 * UI copy is localized: Chinese browsers get Chinese, everyone else gets English.
 *
 * `React.createElement` rather than JSX: this file is transpiled straight to CommonJS for the
 * client-module loader, which has no JSX pass.
 */
const React = require("react");
const h = React.createElement;
/** Pick a language from the browser: Chinese if the UI language looks Chinese, English otherwise. */
const LANG = typeof navigator !== "undefined" && /^zh/i.test(String(navigator.language || "")) ? "zh" : "en";
/** Inline bilingual string. */
function t(zh, en) {
    return LANG === "zh" ? zh : en;
}
const NS = "ui-clipbook";
const ROUTE = "/dsh-clipbook";
const STYLE_ID = "dsh-clipbook-style";
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
function useClipbook() {
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
.dshKeep-btn--danger{border-color:rgba(214,64,64,.55);background:rgba(214,64,64,.12);color:#d64545}
.dshKeep-btn--danger:hover{background:rgba(214,64,64,.2);border-color:rgba(214,64,64,.7)}
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
function ClipAction(props) {
    const { messageId, sessionId, useChat } = props;
    const snapshot = typeof useChat === "function" ? useChat((s) => s) : undefined;
    const current = useClipbook();
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
                setNote(t("拿出来了", "Removed"));
            }
            else {
                const { text, model } = pickMessage(snapshot, messageId);
                if (!text) {
                    setNote(t("取不到正文", "No text"));
                }
                else {
                    const result = await clip({ text, model, sessionId, messageId });
                    setNote(result?.duplicate ? t("早就夹过啦", "Already clipped") : result?.ok ? t("夹好了", "Clipped") : result?.error ?? t("没夹住", "Failed"));
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
        title: saved ? t(`已夹住（${clock(saved.createdAt)}）· 再点一下拿出来`, `Clipped (${clock(saved.createdAt)}) · click again to remove`) : t("夹进小夹子", "Clip into the clipbook"),
        onClick,
        disabled: busy,
    }, h("span", { "aria-hidden": "true" }, saved ? "📌 " : "🔖 "), saved ? t("已夹", "Clipped") : t("夹一下", "Clip"), note ? h("span", { className: "dshKeep-sub", style: { marginLeft: 6 } }, note) : null);
}
// ── the shelf list (shared by the panel and the settings page) ──────────────
function ClipList(props) {
    const [copied, setCopied] = React.useState("");
    const [confirming, setConfirming] = React.useState("");
    const query = String(props.query ?? "").trim();
    if (!props.items.length) {
        // "nothing matched your search" reads very differently from "the shelf is empty".
        if (query) {
            return h("div", { className: "dshKeep-empty" }, t(`没找到和「${query}」匹配的条目。`, `No clips match “${query}”.`), h("div", { className: "dshKeep-sub", style: { marginTop: 6 } }, t(`架上一共 ${props.total ?? 0} 条，换个词再搜。`, `${props.total ?? 0} clip(s) on the shelf — try another word.`)));
        }
        return h("div", { className: "dshKeep-empty" }, t("还没夹过东西。", "Nothing clipped yet."), h("div", { className: "dshKeep-sub", style: { marginTop: 6 } }, t("在任意助手回复下方点「🔖 夹一下」，那段话就会收进这里。", "Click “🔖 Clip” under any assistant reply and it lands here.")), h("div", { className: "dshKeep-sub", style: { marginTop: 6, opacity: 0.7 } }, t("小夹子 = 你的对话收藏夹，存在本机，随时能导出 Markdown。", "The clipbook is your saved replies — stored locally, exportable to Markdown anytime.")));
    }
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
    }, copied === item.id ? t("已复制", "Copied") : t("复制", "Copy")), h("button", {
        className: `dshKeep-btn${confirming === item.id ? " dshKeep-btn--danger" : ""}`,
        title: confirming === item.id ? t("删了就找不回来了", "Deleting cannot be undone") : t("把这条拿掉", "Take this clip off the shelf"),
        onClick: () => {
            if (confirming !== item.id) {
                setConfirming(item.id);
                setTimeout(() => setConfirming((value) => (value === item.id ? "" : value)), 3000);
                return;
            }
            setConfirming("");
            void drop(item.id);
        },
    }, confirming === item.id ? t("确定删除？", "Delete?") : t("删除", "Delete"))))));
}
// ── header button + panel ───────────────────────────────────────────────────
function ClipHeader() {
    const current = useClipbook();
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    useColdRefresh();
    const shown = filterItems(current.items, query);
    return h("div", { className: "dshKeep dshKeep-head" }, h("button", {
        className: `dshKeep-btn${open ? " dshKeep-btn--on" : ""}`,
        title: t("小夹子 · 对话收藏", "Clipbook · saved replies"),
        onClick: () => {
            if (!open)
                void refresh();
            setOpen((value) => !value);
        },
    }, t(`🦊 小夹子${current.items.length ? ` (${current.items.length})` : ""}`, `🦊 Clipbook${current.items.length ? ` (${current.items.length})` : ""}`)), open
        ? h(React.Fragment, null, h("div", { className: "dshKeep-back", onClick: () => setOpen(false) }), h("div", { className: "dshKeep dshKeep-panel" }, h("div", { className: "dshKeep-panelTop" }, h("span", { className: "dshKeep-title" }, t("🦊 小夹子", "🦊 Clipbook")), h("span", { className: "dshKeep-sub" }, query.trim() ? t(`找到 ${shown.length} / ${current.items.length} 条`, `${shown.length} of ${current.items.length}`) : t(`${current.items.length} 条`, `${current.items.length} clip(s)`)), h("div", { className: "dshKeep-grow" }), h("button", { className: "dshKeep-btn", title: t("把全部收藏导出成 Markdown 文件", "Export the whole shelf as a Markdown file"), onClick: () => window.open(`${ROUTE}/export?raw=1`, "_blank") }, t("导出 Markdown", "Export Markdown")), h("button", { className: "dshKeep-btn", onClick: () => setOpen(false) }, t("关", "Close"))), h("input", {
            className: "dshKeep-search",
            placeholder: t("搜一搜…", "Search…"),
            value: query,
            onChange: (event) => setQuery(event.target.value),
        }), h(ClipList, { items: shown, query, total: current.items.length })))
        : null);
}
// ── settings page ───────────────────────────────────────────────────────────
function ClipSettings() {
    const current = useClipbook();
    const [query, setQuery] = React.useState("");
    useColdRefresh();
    const shown = filterItems(current.items, query);
    return h("div", { className: "dshKeep", style: { display: "flex", flexDirection: "column", gap: 14 } }, h("div", { className: "dshKeep-panelTop", style: { border: "none", padding: 0 } }, h("span", { className: "dshKeep-title" }, t("🦊 小夹子", "🦊 Clipbook")), h("span", { className: "dshKeep-sub" }, query.trim() ? t(`找到 ${shown.length} / ${current.items.length} 条`, `${shown.length} of ${current.items.length}`) : t(`架上 ${current.items.length} 条 · 存在本机（$DSH_HOME/clipbook/items.json）`, `${current.items.length} clip(s) · stored locally ($DSH_HOME/clipbook/items.json)`)), h("div", { className: "dshKeep-grow" }), h("button", { className: "dshKeep-btn", onClick: () => void refresh() }, t("刷新", "Refresh")), h("button", { className: "dshKeep-btn", title: t("把全部收藏导出成 Markdown 文件", "Export the whole shelf as a Markdown file"), onClick: () => window.open(`${ROUTE}/export?raw=1`, "_blank") }, t("导出 Markdown", "Export Markdown"))), h("input", { className: "dshKeep-search", style: { margin: 0 }, placeholder: t("搜一搜…", "Search…"), value: query, onChange: (event) => setQuery(event.target.value) }), h(ClipList, { items: shown, query, total: current.items.length }));
}
function apply(ctx) {
    ensureStyle();
    ctx.slots.inject("conversation.chat.assistant-actions", () => ctx.slots.register({ name: "conversation.chat.assistant-actions", id: "clipbook", order: 30, inject: () => ({}) }, ClipAction));
    ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({ name: "conversation.session.header.utilities", id: "clipbook-header", order: 30, inject: () => ({}) }, ClipHeader));
    ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "clipbook", order: 27, label: () => t("小夹子", "Clipbook"), inject: () => ({}) }, ClipSettings));
}
/** Exposed for the test suite only; the helpers are pure. */
exports.__test = { pickMessage, filterItems };


		return module.exports;
	}
});
