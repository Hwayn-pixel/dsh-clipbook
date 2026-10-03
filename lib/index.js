/// <reference types="node" />
/**
 * dsh-clipbook — Host half.
 *
 * 小夹子 keeps a *shelf of things worth keeping*. The host half is the shelf itself:
 *
 *   1. **One file, one shelf** — every clipped message lives in `~/.dsh/keep/items.json`.
 *      A clip is a small structured record (text, title, model, time), not a copy of the
 *      whole conversation, so the shelf stays readable and cheap to load.
 *   2. **Closing is idempotent** — clipping the same message twice keeps the first clip.
 *      The `messageId` is the identity; the button can be pressed as often as you like.
 *   3. **The shelf has a limit** — `maxItems` holds the newest N and drops the oldest
 *      beyond it. A shelf that grows forever is a junk drawer.
 *   4. **It hands you the shelf back** — `/dsh-clipbook/export` renders the whole thing as
 *      Markdown, so what you kept is never trapped in this plugin.
 */
import z from "@deepseek-ai/schemastery";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
export const name = "dsh-clipbook";
export const SETTINGS_NAMESPACE = "ui-clipbook";
const ROUTE_PREFIX = "/dsh-clipbook";
const DEFAULT_MAX = 500;
const TITLE_MAX = 60;
export const KeepSchema = z
    .object({
    enabled: z.boolean().default(true).description("总开关：关闭后小夹子不再收新东西（已有的仍在）"),
    maxItems: z.number().default(DEFAULT_MAX).description("架子上最多留多少条，超出丢掉最旧的"),
})
    .description("dsh-clipbook：把对话里值得留的话夹起来");
const DEFAULTS = { enabled: true, maxItems: DEFAULT_MAX };
// ── the shelf ───────────────────────────────────────────────────────────────
let items = [];
function shelfFile() {
    return join(process.env.DSH_HOME || join(homedir(), ".dsh"), "clipbook", "items.json");
}
/** First non-empty line, flattened and cut — a shelf label, not a summary. */
export function firstLine(text, max = TITLE_MAX) {
    const source = String(text ?? "");
    const line = source
        .split(/\r?\n/)
        .map((row) => row.replace(/^[#>\-*\s]+/, "").trim())
        .find((row) => row.length > 0) ?? "";
    const flat = line.replace(/\s+/g, " ").trim();
    if (!flat)
        return "(无标题)";
    return flat.length > max ? flat.slice(0, max) + "…" : flat;
}
/** Normalize one clip; fill an id and a title so the client never has to. */
export function makeItem(input, now = Date.now()) {
    const text = String(input.text ?? "");
    return {
        id: String(input.id || randomUUID()),
        text,
        title: input.title ? String(input.title).slice(0, TITLE_MAX * 2) : firstLine(text),
        model: input.model ? String(input.model) : undefined,
        sessionId: input.sessionId ? String(input.sessionId) : undefined,
        messageId: input.messageId ? String(input.messageId) : undefined,
        createdAt: Number(input.createdAt) || now,
    };
}
export function toMarkdown(list, now = new Date()) {
    const out = [
        "# 小夹子 · 对话收藏",
        "",
        `> 导出时间：${now.toLocaleString()} · 共 ${list.length} 条`,
        "",
    ];
    for (const item of list) {
        out.push(`## ${item.title || firstLine(item.text)}`, "");
        const meta = [];
        if (item.model)
            meta.push(item.model);
        meta.push(new Date(item.createdAt).toLocaleString());
        out.push(`*${meta.join(" · ")}*`, "");
        out.push(item.text.trim(), "", "---", "");
    }
    return out.join("\n");
}
/** Newest first; a stable shelf order for the client. */
export function newestFirst(list) {
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
}
function load() {
    try {
        const parsed = JSON.parse(readFileSync(shelfFile(), "utf8"));
        if (Array.isArray(parsed)) {
            items = parsed
                .filter((row) => row && typeof row.text === "string")
                .map((row) => makeItem(row));
        }
    }
    catch {
        /* no shelf yet — that is the normal first run */
    }
}
let flushTimer = null;
function persist(value) {
    if (flushTimer)
        clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
        try {
            mkdirSync(dirname(shelfFile()), { recursive: true });
            writeFileSync(shelfFile(), JSON.stringify(value, null, 1), "utf8");
        }
        catch {
            /* the shelf is a convenience, never a failure */
        }
    }, 120);
}
function readValue(settings) {
    try {
        const raw = settings?.get(SETTINGS_NAMESPACE);
        if (raw && typeof raw === "object")
            return { ...DEFAULTS, ...raw };
    }
    catch {
        /* the settings service may not be attached yet */
    }
    return DEFAULTS;
}
function readBody(req, limit = 2_000_000) {
    return new Promise((resolve) => {
        let size = 0;
        const chunks = [];
        req.on("data", (chunk) => {
            size += chunk.length;
            if (size > limit) {
                resolve({});
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => {
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
            }
            catch {
                resolve({});
            }
        });
        req.on("error", () => resolve({}));
    });
}
export function apply(ctx) {
    load();
    ctx.inject(["settings"], (settingsCtx) => {
        settingsCtx.settings.register?.(SETTINGS_NAMESPACE, KeepSchema);
    });
    const settingsOf = () => (ctx.get ? ctx.get("settings") : undefined);
    ctx.inject(["webServer"], (httpCtx) => {
        const server = httpCtx.webServer;
        httpCtx.effect(() => server.register({
            kind: "prefix",
            path: ROUTE_PREFIX,
            handler: async (req, res) => {
                const url = new URL(req.url ?? "/", "http://local");
                const ok = (status, body, type = "application/json; charset=utf-8") => {
                    const payload = typeof body === "string" ? body : JSON.stringify(body);
                    res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
                    res.end(payload);
                };
                const value = readValue(settingsOf());
                try {
                    // GET /dsh-clipbook/items — the shelf, newest first.
                    if (req.method === "GET" && url.pathname === `${ROUTE_PREFIX}/items`) {
                        return ok(200, { ok: true, enabled: value.enabled !== false, maxItems: value.maxItems ?? DEFAULT_MAX, items: newestFirst(items) });
                    }
                    // POST /dsh-clipbook/items — clip one message. Idempotent on messageId.
                    if (req.method === "POST" && url.pathname === `${ROUTE_PREFIX}/items`) {
                        if (value.enabled === false)
                            return ok(200, { ok: false, error: "小夹子现在是关着的" });
                        const body = await readBody(req);
                        const text = String(body?.text ?? "");
                        if (!text.trim())
                            return ok(400, { ok: false, error: "空的东西不收" });
                        const messageId = body?.messageId ? String(body.messageId) : undefined;
                        if (messageId) {
                            const existing = items.find((row) => row.messageId === messageId);
                            if (existing)
                                return ok(200, { ok: true, item: existing, duplicate: true });
                        }
                        const item = makeItem({
                            text,
                            title: body?.title,
                            model: body?.model,
                            sessionId: body?.sessionId,
                            messageId,
                        });
                        const next = [item, ...items];
                        const cap = Math.max(1, Number(value.maxItems) || DEFAULT_MAX);
                        items = next.slice(0, cap);
                        persist(items);
                        return ok(200, { ok: true, item, count: items.length });
                    }
                    // PATCH /dsh-clipbook/items — rename a clip.
                    if (req.method === "PATCH" && url.pathname === `${ROUTE_PREFIX}/items`) {
                        const body = await readBody(req);
                        const id = String(body?.id ?? "");
                        const found = items.find((row) => row.id === id);
                        if (!found)
                            return ok(404, { ok: false, error: "没找到这条" });
                        if (body?.title !== undefined)
                            found.title = String(body.title).slice(0, TITLE_MAX * 2) || firstLine(found.text);
                        persist(items);
                        return ok(200, { ok: true, item: found });
                    }
                    // DELETE /dsh-clipbook/items?id=… — take one clip off the shelf.
                    if (req.method === "DELETE" && url.pathname === `${ROUTE_PREFIX}/items`) {
                        const id = url.searchParams.get("id") ?? "";
                        const before = items.length;
                        items = items.filter((row) => row.id !== id);
                        persist(items);
                        return ok(200, { ok: true, removed: before - items.length, count: items.length });
                    }
                    // GET /dsh-clipbook/export — the whole shelf as Markdown.
                    if (req.method === "GET" && url.pathname === `${ROUTE_PREFIX}/export`) {
                        const markdown = toMarkdown(newestFirst(items));
                        if (url.searchParams.get("raw") === "1")
                            return ok(200, markdown, "text/markdown; charset=utf-8");
                        return ok(200, { ok: true, markdown, count: items.length });
                    }
                    return ok(404, { ok: false, error: `no route ${req.method} ${url.pathname}` });
                }
                catch (error) {
                    return ok(500, { ok: false, error: String(error?.message ?? error) });
                }
            },
        }), "dsh-clipbook: shelf routes");
    });
}
