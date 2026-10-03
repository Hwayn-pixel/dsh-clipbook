/**
 * Unit tests for 小夹子's pure helpers — run against the *built* bundle, not a copy.
 *
 * The client half is emitted as `window.__ModuleLoader__.load({ id, factory })`, so the test stubs
 * that loader, runs the factory with a minimal `require`, and pokes the `__test` export.
 *
 *   node test/keep.test.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bundle = join(here, "..", "lib", "client.js");

let spec = null;
globalThis.window = { __ModuleLoader__: { load: (s) => { spec = s; } }, open() {} };
globalThis.document = { getElementById: () => null, createElement: () => ({}), head: { append() {} } };
Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async () => {} } }, configurable: true, writable: true });
globalThis.fetch = async () => ({ json: async () => ({ ok: false, error: "no host in tests" }) });

const React = {
  createElement: (...args) => ({ args }),
  useState: (v) => [v, () => {}],
  useEffect: () => {},
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  Fragment: Symbol("Fragment"),
  useSyncExternalStore: (_sub, get) => get(),
};
await import(pathToFileURL(bundle).href);
if (!spec) throw new Error("the client bundle did not call window.__ModuleLoader__.load");
if (spec.id !== "dsh-clipbook") throw new Error(`unexpected client id: ${spec.id}`);
const mod = spec.factory((id) => {
  if (id === "react") return React;
  throw new Error("unexpected require: " + id);
});
const { pickMessage, filterItems } = mod.__test ?? {};
if (!pickMessage || !filterItems) throw new Error("__test helpers missing from the bundle");

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed += 1; console.log("  PASS", name); }
  else { failed += 1; console.log("  FAIL", name); }
}

const snapshot = {
  legacy: {
    nodes: [
      { kind: "user", seq: 1, content: [] },
      {
        kind: "assistant",
        seq: 2,
        messageId: "m-1",
        provenance: { model: "deepseek-flash" },
        blocks: [
          { kind: "reasoning", text: "let me think…" },
          { kind: "text", text: "第一段。" },
          { kind: "text", text: "第二段。" },
        ],
      },
      { kind: "assistant", seq: 4, messageId: "m-2", blocks: [{ kind: "text", text: "另一条。" }] },
    ],
  },
};

// 1 · the live snapshot lookup: right node, text blocks only, model kept
{
  const got = pickMessage(snapshot, "m-1");
  check("finds the assistant node by messageId", got.text === "第一段。\n\n第二段。");
  check("carries the model name", got.model === "deepseek-flash");
}
// 2 · reasoning blocks never leak into a clip
{
  check("ignores reasoning blocks", !pickMessage(snapshot, "m-1").text.includes("think"));
}
// 3 · a different message is its own text
{
  check("picks the exact message", pickMessage(snapshot, "m-2").text === "另一条。");
}
// 4 · missing / odd input never throws
{
  check("absent message is empty", pickMessage(snapshot, "nope").text === "");
  check("empty snapshot is safe", pickMessage(undefined, "m-1").text === "");
  check("null nodes is safe", pickMessage({ legacy: { nodes: null } }, "m-1").text === "");
}
// 5 · filter: empty query returns everything, matching is case-insensitive over title + body
{
  const items = [
    { id: "a", title: "结论", text: "先给结论。", createdAt: 1 },
    { id: "b", title: "Backup", text: "改动前先备份文件。", createdAt: 2 },
  ];
  check("empty query returns all", filterItems(items, "  ").length === 2);
  check("matches the body", filterItems(items, "备份").length === 1);
  check("matches the title", filterItems(items, "结论").length === 1);
  check("case-insensitive", filterItems(items, "backup").length === 1);
  check("no match returns none", filterItems(items, "zzz").length === 0);
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
