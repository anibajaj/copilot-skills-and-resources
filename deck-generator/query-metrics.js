/**
 * Query a product's saved metrics history.
 *
 *   node query-metrics.js <store.json | product-slug> [command] [metric]
 *
 * Store files live in ./data/<slug>.metrics.json and are written automatically
 * by generate-deck.js after each deck is built (full history, one point/month).
 *
 * Commands:
 *   list                 (default) every metric with latest value + change
 *   get "<metric>"       full month-by-month history (with provenance)
 *   change "<metric>"    up or down vs the chosen basis? % + values
 *   compare "<metric>"   alias of change (explicit)
 *   up | down            list metrics that rose / fell
 *   basis [MoM|QoQ|YoY|baseline]   show or persist the default comparison basis
 *   feedback [period]    verbatim user quotes + satisfaction KPIs
 *   events [period]      product events (launches) and their before/after impact
 *   breakdowns [period]  segment breakdowns (by plan, region, …)
 *
 * Comparison basis: MoM (prev month), QoQ (3 months back), YoY (12), baseline
 * (first). Default comes from the store's saved preference, overridable per call
 * with --basis=QoQ. Set the default once with the `basis` command.
 *
 * For any question the shortcuts don't cover, read the store JSON directly —
 * it holds the full metric history plus per-period snapshots.
 *
 * Metric matching is case-insensitive substring, with common aliases
 * (mau, dau, nrr, nps, csat). If a name is ambiguous, candidates are listed.
 */
const fs = require("fs");
const path = require("path");

const ALIASES = {
  mau: "monthly active", dau: "daily active", wau: "weekly active",
  nrr: "net revenue retention", grr: "gross revenue retention",
  nps: "net promoter", csat: "satisfaction", arr: "annual recurring",
  mrr: "monthly recurring",
};

function resolveStore(arg) {
  if (!arg) return null;
  const candidates = [
    arg,
    path.join(__dirname, "data", arg),
    path.join(__dirname, "data", `${arg}.metrics.json`),
    path.join(__dirname, "data", `${arg.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.metrics.json`),
  ];
  return candidates.find(p => fs.existsSync(p)) || null;
}

function listStores() {
  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".metrics.json"));
}

function pn(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
}
function fmt(n, unit) {
  if (n == null) return "N/A";
  let s;
  if (Math.abs(n) >= 1e6) s = (n / 1e6).toFixed(2) + "M";
  else if (Math.abs(n) >= 1e3) s = (n / 1e3).toFixed(1) + "k";
  else s = String(Math.round(n * 100) / 100);
  if (unit === "%") s = (Math.round(n * 100) / 100) + "%";
  else if (unit === "$") s = "$" + s;
  return s;
}
function momOf(history) {
  const h = (history || []).filter(p => pn(p.value) != null);
  if (h.length < 2) return null;
  const last = pn(h[h.length - 1].value), prev = pn(h[h.length - 2].value);
  if (prev === 0) return null;
  return { last, prev, pct: +(((last - prev) / Math.abs(prev)) * 100).toFixed(1),
    lastP: h[h.length - 1].period, prevP: h[h.length - 2].period };
}
// Comparison engine: pick the reference point by basis, not just the prior month.
//   MoM = previous point · QoQ = 3 months back · YoY = 12 months back · baseline = first
const BASES = { mom: 1, qoq: 3, yoy: 12 };
function shiftKey(period, back) {
  const m = String(period).match(/^(\d{4})-(\d{1,2})$/); if (!m) return null;
  const i = (+m[1]) * 12 + (+m[2] - 1) - back;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}
function compareBasis(history, basis) {
  const h = (history || []).filter(p => pn(p.value) != null);
  if (h.length < 2) return null;
  const cur = h[h.length - 1];
  const b = String(basis || "mom").toLowerCase();
  let ref = null;
  if (b === "baseline") ref = h[0];
  else if (BASES[b]) {
    const key = shiftKey(cur.period, BASES[b]);
    ref = h.find(p => p.period === key) || (b === "mom" ? h[h.length - 2] : null);
  } else ref = h[h.length - 2];
  if (!ref || ref === cur) return null;
  const last = pn(cur.value), prev = pn(ref.value);
  if (prev === 0) return null;
  return { basis: b.toUpperCase(), last, prev, pct: +(((last - prev) / Math.abs(prev)) * 100).toFixed(1),
    lastP: cur.period, prevP: ref.period };
}
function findMetric(store, query) {
  const names = Object.keys(store.metrics || {});
  const q = (ALIASES[query.toLowerCase()] || query).toLowerCase();
  const exact = names.filter(n => n.toLowerCase() === q);
  if (exact.length) return { match: exact[0] };
  const subs = names.filter(n => n.toLowerCase().includes(q));
  if (subs.length === 1) return { match: subs[0] };
  if (subs.length > 1) return { candidates: subs };
  return { candidates: [] };
}

function dir(pct) { return pct > 0 ? "▲ up" : pct < 0 ? "▼ down" : "▬ flat"; }

// ─────────────────────────── CLI ───────────────────────────
const rawArgs = process.argv.slice(2);
// Optional --basis=<MoM|QoQ|YoY|baseline> override for comparison commands.
let basisFlag = null;
const args = rawArgs.filter(a => {
  const m = a.match(/^--basis=(.+)$/i); if (m) { basisFlag = m[1]; return false; }
  return true;
});
const storeArg = args[0];
if (!storeArg) {
  const stores = listStores();
  console.log("Usage: node query-metrics.js <store.json|product> [list|get|change|compare|up|down|feedback|events|breakdowns|basis] [metric] [--basis=MoM|QoQ|YoY|baseline]");
  console.log(stores.length ? `\nAvailable products in data/:\n  ${stores.join("\n  ")}` : "\nNo saved metrics yet — build a deck first.");
  process.exit(0);
}
const storePath = resolveStore(storeArg);
if (!storePath) {
  console.error(`No metrics store found for "${storeArg}".`);
  const stores = listStores();
  if (stores.length) console.error(`Available: ${stores.join(", ")}`);
  process.exit(1);
}
const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
const cmd = (args[1] || "list").toLowerCase();
const metricArg = args.slice(2).join(" ");
// Default comparison basis: CLI flag > saved preference > MoM.
const defaultBasis = (basisFlag || (store.preferences && store.preferences.comparison) || "MoM");

if (cmd === "basis") {
  // Persist the preferred comparison basis so future questions reuse it.
  const val = (metricArg || "").trim();
  if (!val) { console.log(`Current comparison basis: ${defaultBasis}. Set with: node query-metrics.js ${storeArg} basis QoQ`); process.exit(0); }
  store.preferences = store.preferences || {};
  store.preferences.comparison = val;
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  console.log(`✔ Comparison basis set to ${val} for ${store.product}. Future change/list queries default to it.`);
} else if (cmd === "list") {
  console.log(`${store.product} — metrics through ${store.updated || "?"} (${defaultBasis})\n`);
  Object.entries(store.metrics).forEach(([name, m]) => {
    const c = compareBasis(m.history, defaultBasis);
    const latest = m.history[m.history.length - 1];
    const val = latest ? fmt(pn(latest.value), m.unit) : "N/A";
    const chg = c ? `${dir(c.pct)} ${Math.abs(c.pct)}% ${c.basis}` + (c.pct < 0 ? "  ⚠ needs attention" : "") : "";
    console.log(`  ${name.padEnd(28)} ${val.padStart(10)}   ${chg}`);
  });
} else if (cmd === "up" || cmd === "down") {
  const want = cmd === "up" ? (p) => p > 0 : (p) => p < 0;
  console.log(`${store.product} — metrics that went ${cmd} (${defaultBasis}):\n`);
  let any = false;
  Object.entries(store.metrics).forEach(([name, m]) => {
    const c = compareBasis(m.history, defaultBasis);
    if (c && want(c.pct)) { any = true; console.log(`  ${dir(c.pct)}  ${name} — ${Math.abs(c.pct)}% ${c.basis} (${fmt(c.prev, m.unit)} → ${fmt(c.last, m.unit)})`); }
  });
  if (!any) console.log("  (none)");
} else if (cmd === "get" || cmd === "change" || cmd === "compare") {
  if (!metricArg) { console.error(`Provide a metric name, e.g. node query-metrics.js ${storeArg} ${cmd} "monthly active users"`); process.exit(1); }
  const r = findMetric(store, metricArg);
  if (!r.match) {
    console.error(r.candidates && r.candidates.length ? `Ambiguous — did you mean:\n  ${r.candidates.join("\n  ")}` : `No metric matching "${metricArg}". Try: node query-metrics.js ${storeArg} list`);
    process.exit(1);
  }
  const m = store.metrics[r.match];
  if (cmd === "change" || cmd === "compare") {
    const c = compareBasis(m.history, defaultBasis);
    if (!c) { console.log(`${r.match}: not enough history to compute a ${defaultBasis} change.`); process.exit(0); }
    console.log(`${r.match} went ${dir(c.pct)} ${Math.abs(c.pct)}% ${c.basis} from ${c.prevP} to ${c.lastP}: ${fmt(c.prev, m.unit)} → ${fmt(c.last, m.unit)}.${c.pct < 0 ? "  ⚠ needs attention" : ""}`);
    if (m.source && (m.source.name || m.source.url)) console.log(`  source: ${m.source.name || m.source.url}`);
  } else {
    console.log(`${r.match}${m.unit ? " (" + m.unit + ")" : ""}${m.section ? " · " + m.section : ""}`);
    m.history.forEach(p => console.log(`  ${p.period}   ${fmt(pn(p.value), m.unit)}${p.pulledAt ? "   (pulled " + p.pulledAt + ")" : ""}`));
    if (m.source && (m.source.name || m.source.url)) console.log(`  source: ${m.source.name || m.source.url}`);
  }
} else if (cmd === "feedback" || cmd === "events" || cmd === "breakdowns") {
  const snaps = store.snapshots || {};
  const periods = Object.keys(snaps).sort();
  const period = metricArg && snaps[metricArg] ? metricArg : periods[periods.length - 1];
  if (!period || !snaps[period]) { console.log(`No ${cmd} captured yet. Build a deck with a ${cmd === "feedback" ? "feedback" : cmd === "events" ? "impact" : "pies"} slide first.`); process.exit(0); }
  const snap = snaps[period];
  if (cmd === "feedback") {
    const fb = snap.feedback;
    if (!fb) { console.log(`No feedback captured for ${period}.`); process.exit(0); }
    console.log(`${store.product} — user feedback (${period}):\n`);
    (fb.kpis || []).forEach(k => console.log(`  ${k.label}: ${k.value}${k.sub ? " (" + k.sub + ")" : ""}`));
    if ((fb.quotes || []).length) {
      console.log("\n  Verbatim quotes:");
      fb.quotes.forEach(q => console.log(`   • “${q.text}”${q.author ? " — " + q.author : ""}${q.url ? "  <" + q.url + ">" : ""}`));
    }
  } else if (cmd === "events") {
    if (!snap.events) { console.log(`No events captured for ${period}.`); process.exit(0); }
    console.log(`${store.product} — product events (${period}):\n`);
    snap.events.forEach(e => {
      console.log(`  ${e.name}${e.date ? " · launched " + e.date : ""}`);
      (e.metrics || []).forEach(m => {
        const o = pn(m.original), c = pn(m.current);
        const pct = (o != null && c != null && o !== 0) ? `  (${((c - o) / Math.abs(o) * 100).toFixed(0)}%)` : "";
        console.log(`     ${m.title}: ${fmt(o)} → ${fmt(c)}${pct}`);
      });
    });
  } else {
    if (!snap.breakdowns) { console.log(`No breakdowns captured for ${period}.`); process.exit(0); }
    console.log(`${store.product} — breakdowns (${period}):\n`);
    snap.breakdowns.forEach(b => {
      const tot = (b.slices || []).reduce((s, x) => s + (pn(x.value) || 0), 0);
      console.log(`  ${b.title}:`);
      (b.slices || []).forEach(s => { const v = pn(s.value) || 0; console.log(`     ${s.name}: ${fmt(v)}${tot ? " (" + Math.round(v / tot * 100) + "%)" : ""}`); });
    });
  }
} else {
  console.error(`Unknown command "${cmd}". Use: list | get | change | compare | up | down | feedback | events | breakdowns | basis`);
  process.exit(1);
}
