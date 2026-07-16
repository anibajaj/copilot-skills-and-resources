/**
 * Generic, config-driven telemetry deck generator.
 *
 *   node generate-deck.js <config.json> [output.pptx]
 *
 * Reads a deck-config.json describing a product-neutral growth deck and renders
 * a Fluent-styled .pptx. One renderer, any product — the config decides the
 * slides. See deck-config.schema.md and examples/deck-config.example.json.
 *
 * Slide block types: title | summary | metrics | hero-list | pies | table |
 *                    trends | bullets | definitions
 *
 * Design language carried over from the People Skills deck: accent top bar,
 * primary left bar, section label + title, white KPI cards with soft shadow,
 * avg month-over-month trend badges, custom bar charts for trends, native pie
 * charts for breakdowns, footer with product | period | page.
 */

const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ─────────────────────────── CLI ───────────────────────────
const args = process.argv.slice(2);
const configPath = args[0] || "deck-config.json";
if (!fs.existsSync(configPath)) {
  console.error(`Config not found: ${configPath}`);
  console.error("Usage: node generate-deck.js <config.json> [output.pptx]");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));

// ─────────────────────────── THEME ─────────────────────────
const DEFAULT_THEME = {
  primary: "0078D4", accent: "00B7C3", dark: "1B1B1B",
  white: "FFFFFF", lightBg: "F3F2F1", medGrey: "8A8886",
  green: "107C10", red: "E74856", amber: "FFB900", purple: "8661C5",
  cardTint: "EFF6FF", font: "Segoe UI",
};
const T = Object.assign({}, DEFAULT_THEME, cfg.theme || {});
const FONT = T.font;
const PIE_PALETTE = [T.primary, T.amber, T.purple, T.accent, T.medGrey, T.green, T.red];

// ─────────────────────────── LAYOUT ────────────────────────
const SW = 13.33, SH = 7.5;
const ML = 0.5, MR = 0.5, CW = SW - ML - MR;
const TY = 0.20, T2Y = 0.48, CY = 1.15, FY = 7.10;
const PAD = 0.20, RAD = 0.08, GAP = 0.25;

const PRODUCT = cfg.product || "Product";
const PERIOD = cfg.period || "";
const CONFIDENTIAL = cfg.confidential !== false;

// ─────────────────────────── UTILS ─────────────────────────
function pn(v) {
  if (v == null) return null;
  let s = String(v).replace(/,/g, "").replace(/\$/g, "").replace(/%/g, "").trim();
  const k = s.match(/^([0-9.]+)\s*[kK]$/); if (k) return parseFloat(k[1]) * 1e3;
  const m = s.match(/^([0-9.]+)\s*[mM]$/); if (m) return parseFloat(m[1]) * 1e6;
  const b = s.match(/^([0-9.]+)\s*[bB]$/); if (b) return parseFloat(b[1]) * 1e9;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
function fn(n, dec) {
  if (n == null) return "N/A";
  if (typeof dec === "number") return n.toFixed(dec);
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(Math.round(n * 100) / 100);
}
// Arithmetic mean of month-over-month step % across a series.
function avgMoRate(series) {
  const vals = (series || []).map(p => pn(p && p.value)).filter(v => v != null);
  if (vals.length < 2) return null;
  let sum = 0, steps = 0;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i - 1] === 0) continue;
    sum += (vals[i] - vals[i - 1]) / Math.abs(vals[i - 1]) * 100; steps++;
  }
  return steps ? (sum / steps).toFixed(1) : null;
}
// Display a value: pass raw string through, format numbers, honor unit.
function disp(v, unit) {
  if (v == null || v === "" || v === "TBD" || v === "N/A") return "N/A";
  const n = pn(v);
  if (n != null && /^[\d.,$%kKmMbB\s]+$/.test(String(v))) {
    let s = fn(n);
    if (unit === "%" ) s = (parseFloat((Math.round(n * 100) / 100).toFixed(2))) + "%";
    else if (unit === "$") s = "$" + s;
    return s;
  }
  return String(v);
}

// ─────────────────────── METRICS STORE ─────────────────────
// After a deck is built, every metric's values are upserted into a per-product
// JSON store (data/<slug>.metrics.json) keeping FULL history. Query later with
// query-metrics.js. Month labels ("Apr") or unlabeled series are both mapped to
// YYYY-MM periods relative to the deck period.
const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
  january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12 };
function parsePeriodStr(str) {
  if (!str) return null;
  const iso = String(str).match(/^(\d{4})-(\d{1,2})$/);
  if (iso) return { y: +iso[1], m: +iso[2] };
  let y = null, m = null;
  for (const p of String(str).trim().split(/[\s,]+/)) {
    const pm = MONTHS[p.toLowerCase()]; if (pm) m = pm;
    if (/^\d{4}$/.test(p)) y = +p;
  }
  return (y && m) ? { y, m } : null;
}
function periodKey(p) { return `${p.y}-${String(p.m).padStart(2, "0")}`; }
function shiftMonth(y, m, delta) { const i = y * 12 + (m - 1) + delta; return { y: Math.floor(i / 12), m: (i % 12) + 1 }; }
function labelToPeriod(month, deck) {
  const mm = MONTHS[String(month).toLowerCase()]; if (!mm || !deck) return null;
  return { y: mm > deck.m ? deck.y - 1 : deck.y, m: mm };
}
// Provenance stamp applied to every value written this run.
const PULLED_AT = new Date().toISOString().slice(0, 10);
function blockSource(b) {
  const s = (b && b.sources && b.sources[0]) || (cfg.sources && cfg.sources[0]) || null;
  return s ? { name: s.name || "", url: s.url || "" } : null;
}
function extractSeries() {
  const deck = parsePeriodStr(PERIOD), out = [];
  // Capture a metric from a time series when present, otherwise from a single
  // value pinned to the deck period — so EVERY number in the deck is stored.
  const push = (name, unit, section, series, value, source) => {
    if (!name) return;
    let pts = [];
    if (Array.isArray(series)) {
      const vals = series.map(p => ({ month: p && p.month, value: pn(p && p.value) })).filter(p => p.value != null);
      vals.forEach((p, i) => {
        const per = p.month ? labelToPeriod(p.month, deck) : (deck ? shiftMonth(deck.y, deck.m, -(vals.length - 1 - i)) : null);
        if (per) pts.push({ period: periodKey(per), value: p.value, pulledAt: PULLED_AT });
      });
    }
    if (!pts.length && value != null && pn(value) != null && deck) {
      pts = [{ period: periodKey(deck), value: pn(value), pulledAt: PULLED_AT }];
    }
    if (pts.length) out.push({ name, unit: unit || "", section: section || "", source: source || null, points: pts });
  };
  (cfg.slides || []).forEach(b => {
    const src = blockSource(b);
    if (b.type === "summary") (b.highlights || []).forEach(c => push(c.label, c.unit, b.label, c.series, c.value, src));
    if (b.type === "metrics") (b.cards || []).forEach(c => push(c.title, c.unit, b.label, c.series, c.value, src));
    if (b.type === "trends") (b.charts || []).forEach(c => push(c.title, c.unit, b.label, c.series, c.value, src));
    if (b.type === "feedback") (b.cards || []).forEach(c => push(c.title, c.unit, b.label, c.series, c.value, src));
    if (b.type === "impact") (b.metrics || []).forEach(c => push(c.title, c.unit, b.label, c.series, c.current, src));
    if (b.type === "pies") (b.charts || []).forEach(c => (c.breakdown || []).forEach(s => push(`${c.title} — ${s.name}`, c.unit, b.label, null, s.value, src)));
  });
  return out;
}
function buildSnapshot() {
  const snap = {}, quotes = [], kpis = [], events = [], breakdowns = [], tables = [];
  (cfg.slides || []).forEach(b => {
    if (b.type === "feedback") {
      (b.quotes || []).forEach(q => quotes.push({ text: q.text, author: q.author || "", url: q.url || "" }));
      (b.cards || []).forEach(c => kpis.push({ label: c.title, value: c.value, sub: c.sub || "" }));
    }
    if (b.type === "impact" && b.event) {
      events.push({ name: b.event.name, date: b.event.date,
        metrics: (b.metrics || []).map(m => ({ title: m.title, original: m.original, current: m.current })) });
    }
    if (b.type === "pies") (b.charts || []).forEach(c => breakdowns.push({ title: c.title, unit: c.unit || "",
      slices: (c.breakdown || []).map(s => ({ name: s.name, value: s.value })) }));
    if (b.type === "table") tables.push({ title: b.title, columns: b.columns || [], rows: b.rows || [] });
  });
  if (quotes.length || kpis.length) snap.feedback = { kpis, quotes };
  if (events.length) snap.events = events;
  if (breakdowns.length) snap.breakdowns = breakdowns;
  if (tables.length) snap.tables = tables;
  return snap;
}
function saveMetrics() {
  if (cfg.saveMetrics === false || args.includes("--no-save")) return;
  const extracted = extractSeries();
  const snap = buildSnapshot();
  if (!extracted.length && !Object.keys(snap).length) return;
  const slug = (PRODUCT.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) || "product";
  const file = cfg.metricsStore
    ? path.resolve(path.dirname(configPath), cfg.metricsStore)
    : path.join(__dirname, "data", `${slug}.metrics.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let store = { product: PRODUCT, metrics: {} };
  if (fs.existsSync(file)) { try { store = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { /* start fresh */ } }
  store.product = store.product || PRODUCT;
  store.metrics = store.metrics || {};
  extracted.forEach(e => {
    const m = store.metrics[e.name] || { unit: e.unit, section: e.section, history: [] };
    if (e.unit) m.unit = e.unit;
    if (e.section) m.section = e.section;
    if (e.source) m.source = e.source;
    const byPeriod = {};
    (m.history || []).forEach(h => { byPeriod[h.period] = h; });
    e.points.forEach(p => { byPeriod[p.period] = Object.assign({}, byPeriod[p.period], p); });
    m.history = Object.keys(byPeriod).sort().map(k => byPeriod[k]);
    store.metrics[e.name] = m;
  });
  const deck = parsePeriodStr(PERIOD);
  const pkey = deck ? periodKey(deck) : PERIOD;
  if (Object.keys(snap).length) { store.snapshots = store.snapshots || {}; store.snapshots[pkey] = snap; }
  // Persist the user's chosen comparison basis (MoM/QoQ/YoY/baseline) once so
  // query-metrics.js reuses it on every future question without re-asking.
  if (cfg.comparison) { store.preferences = store.preferences || {}; store.preferences.comparison = cfg.comparison; }
  store.updated = pkey;
  fs.writeFileSync(file, JSON.stringify(store, null, 2));
  const parts = [`${Object.keys(store.metrics).length} metrics`];
  if (Object.keys(snap).length) parts.push(`${pkey} snapshot`);
  console.log(`✔ Saved ${parts.join(" + ")} → ${path.relative(process.cwd(), file)}`);
}

// ──────────────── PREFLIGHT (completeness + eval) ───────────
// One pass over the config BEFORE rendering. Completeness = missing dates /
// placeholder values; eval = untraceable figures (no cited source), thin
// series, un-annotated declines. Warnings print and continue; with --strict
// any hard error aborts the build so weak decks never ship.
const PLACEHOLDERS = ["", "TBD", "N/A", "[FILL MANUALLY]", "?"];
function isBad(v) { return v == null || PLACEHOLDERS.includes(String(v).trim().toUpperCase()); }
function cardsOf(b) { return b.highlights || b.cards || b.charts || b.metrics || []; }
function monthGaps(series) {
  const ms = (series || []).map(p => MONTHS[String(p && p.month).toLowerCase()]).filter(Boolean);
  const gaps = [];
  for (let i = 1; i < ms.length; i++) { let d = ms[i] - ms[i - 1]; if (d < 0) d += 12; if (d > 1) gaps.push(`${ms[i - 1]}→${ms[i]}`); }
  return gaps;
}
function preflight() {
  const errors = [], warnings = [];
  if (!PERIOD) errors.push("Deck 'period' is not set — metric history cannot be dated.");
  const cited = b => (b.sources && b.sources.length) || (cfg.sources && cfg.sources.length);
  (cfg.slides || []).forEach((b, i) => {
    const tag = `slide ${i + 1} (${b.type}${b.title ? ": " + b.title : ""})`;
    cardsOf(b).forEach(c => {
      const label = c.label || c.title || c.name || "value";
      if (Array.isArray(c.series)) {
        if (c.series.some(p => isBad(p && p.value))) errors.push(`${tag}: "${label}" series has a missing/placeholder value.`);
        const g = monthGaps(c.series);
        if (g.length) warnings.push(`${tag}: "${label}" series skips month(s) ${g.join(", ")}.`);
        if (c.series.filter(p => pn(p && p.value) != null).length < 2) warnings.push(`${tag}: "${label}" has <2 points — no trend/comparison possible.`);
      } else if ("value" in c || "current" in c) {
        if (isBad("value" in c ? c.value : c.current)) errors.push(`${tag}: "${label}" has a missing/placeholder value.`);
      }
    });
    if (["summary", "metrics", "trends", "impact", "feedback", "pies"].includes(b.type) && !cited(b))
      warnings.push(`${tag}: no data source cited — figures are not traceable.`);
  });
  const declines = collectAttention();
  if (declines.length) warnings.push(`${declines.length} metric(s) declining: ${declines.join(", ")} — ensure the deck explains why.`);
  return { errors, warnings };
}
function printPreflight(pf) {
  if (!pf.errors.length && !pf.warnings.length) { console.log("✔ Preflight: no issues.\n"); return; }
  console.log("── Preflight ──");
  pf.errors.forEach(e => console.log(`  ✖ ${e}`));
  pf.warnings.forEach(w => console.log(`  ⚠ ${w}`));
  console.log("");
}
function printOutline() {
  console.log(`Outline — ${PRODUCT} · ${PERIOD}\n`);
  (cfg.slides || []).forEach((b, i) => {
    const title = b.title || b.label || b.type;
    const nums = [];
    cardsOf(b).slice(0, 4).forEach(c => {
      const label = c.label || c.title || c.name;
      const val = c.value != null ? c.value : (Array.isArray(c.series) && c.series.length ? c.series[c.series.length - 1].value : c.current);
      if (label && val != null) nums.push(`${label}=${val}`);
    });
    console.log(`  ${String(i + 1).padStart(2)}. [${b.type}] ${title}${nums.length ? "  · " + nums.join(", ") : ""}`);
  });
  console.log("\nReview the outline above, then re-run without --outline to render the deck.");
}

// ─────────────────────── SHARED DRAWING ────────────────────
function tx(o) { return Object.assign({ fontFace: FONT, margin: 0, valign: "middle" }, o); }

function bars(s, x, y, w, h, series, clr) {
  const d3 = (series || []).filter(p => p);
  if (!d3.length) return;
  const n = d3.length, bw = w * (n <= 3 ? 0.20 : 0.6 / n);
  const gap = (w - bw * n) / (n + 1);
  const vals = d3.map(p => pn(p.value) || 0);
  const mx = Math.max(...vals, 1), tH = 0.18, lH = 0.16, cH = h - tH - lH;
  vals.forEach((vl, i) => {
    const bH = Math.max(cH * (vl / mx), 0.05);
    const bx = x + gap + i * (bw + gap), by = y + tH + (cH - bH);
    s.addShape("roundRect", { x: bx, y: by, w: bw, h: bH, fill: { color: clr || T.accent }, rectRadius: 0.03 });
    s.addText(fn(vl), tx({ x: bx - 0.2, y: by - tH, w: bw + 0.4, h: tH, fontSize: 7, bold: true, color: T.dark, align: "center" }));
    s.addText(d3[i].month || "", tx({ x: bx - 0.1, y: y + h - lH, w: bw + 0.2, h: lH, fontSize: 6.5, color: T.medGrey, align: "center" }));
  });
}
function badge(s, x, y, rate, w) {
  if (rate == null) return;
  const pos = parseFloat(rate) >= 0, bw = w || 1.05;
  s.addShape("roundRect", { x, y, w: bw, h: 0.24, fill: { color: pos ? "E8F5E9" : "FFEBEE" }, rectRadius: 0.05 });
  s.addText(`${pos ? "▲" : "▼"} ${Math.abs(parseFloat(rate))}% avg/mo`,
    tx({ x, y, w: bw, h: 0.24, fontSize: 8, bold: true, color: pos ? T.green : T.red, align: "center" }));
}
// Month-over-month: latest point vs the immediately prior point.
function momRate(series) {
  const vals = (series || []).map(p => pn(p && p.value)).filter(v => v != null);
  if (vals.length < 2) return null;
  const last = vals[vals.length - 1], prev = vals[vals.length - 2];
  if (prev === 0) return null;
  return ((last - prev) / Math.abs(prev) * 100).toFixed(1);
}
// Scan the entire deck for declining metrics (negative MoM) so the executive
// summary can surface every metric that needs attention, wherever it lives.
function collectAttention() {
  const found = [], seen = new Set();
  const add = (name, rate) => {
    if (!name || rate == null) return;
    const r = parseFloat(rate);
    if (isNaN(r) || r >= 0) return;
    const key = String(name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    found.push(`${name} (${Math.abs(r)}%)`);
  };
  (cfg.slides || []).forEach(b => {
    if (b.type === "summary") (b.highlights || []).forEach(c => add(c.label, c.change != null ? c.change : momRate(c.series)));
    if (b.type === "metrics") (b.cards || []).forEach(c => add(c.title, momRate(c.series)));
    if (b.type === "trends") (b.charts || []).forEach(c => add(c.title, momRate(c.series)));
  });
  return found;
}
// MoM badge — always shown above a chart in this deck. Falling metrics get a
// ⚠ "needs attention" treatment in red; rising metrics are green.
function momBadge(s, x, y, rate, maxW) {
  if (rate == null) return;
  const r = parseFloat(rate), pos = r >= 0;
  const txt = pos ? `▲ ${Math.abs(r)}% MoM` : `⚠ ${Math.abs(r)}% MoM · needs attention`;
  let bw = pos ? 1.2 : 2.55;
  if (maxW) bw = Math.min(bw, maxW);
  s.addShape("roundRect", { x, y, w: bw, h: 0.24, fill: { color: pos ? "E8F5E9" : "FDE7E9" }, rectRadius: 0.05 });
  s.addText(txt, tx({ x, y, w: bw, h: 0.24, fontSize: 8, bold: true, color: pos ? T.green : T.red, align: "center" }));
}
function footer(s, n, tot) {
  const bits = [PRODUCT, PERIOD].filter(Boolean);
  if (CONFIDENTIAL) bits.push("Confidential");
  s.addText(bits.join("  |  "), tx({ x: ML, y: FY, w: 9, h: 0.28, fontSize: 8, color: T.medGrey }));
  s.addText(`${n} / ${tot}`, tx({ x: SW - MR - 1.5, y: FY, w: 1.5, h: 0.28, fontSize: 8, color: T.medGrey, align: "right" }));
}
function frame(s, tint) {
  if (tint) s.addShape("rect", { x: 0, y: 0, w: SW, h: SH, fill: { color: T.lightBg } });
  s.addShape("rect", { x: 0, y: 0, w: SW, h: 0.05, fill: { color: T.accent } });
  s.addShape("rect", { x: 0, y: 0, w: 0.05, h: SH, fill: { color: T.primary } });
}
function heading(s, label, title) {
  if (label) s.addText(label.toUpperCase(), tx({ x: ML, y: TY, w: 8, h: 0.22, fontSize: 10, bold: true, color: T.accent, charSpacing: 3 }));
  s.addText(title || "", tx({ x: ML, y: T2Y, w: 12, h: 0.5, fontSize: 24, bold: true, color: T.dark }));
}
function sourceLink(s, sources) {
  if (!sources || !sources.length) return;
  const src = sources[0];
  if (src && src.url) {
    s.addText([{ text: "🔗 ", options: { fontSize: 9 } },
      { text: src.name || "Source", options: { fontSize: 9, color: T.primary, underline: true, hyperlink: { url: src.url } } }],
      tx({ x: SW - MR - 2.6, y: FY, w: 2.6, h: 0.25, align: "right" }));
  }
}

// ───────────────────────── SLIDE TYPES ─────────────────────
const pres = new pptxgen();
pres.defineLayout({ name: "W", width: SW, height: SH });
pres.layout = "W";
pres.author = PRODUCT;
pres.title = `${PRODUCT} Telemetry — ${PERIOD}`;

function slideTitle(b) {
  const s = pres.addSlide();
  s.background = { color: T.primary };
  s.addShape("rect", { x: 0, y: SH - 0.12, w: SW, h: 0.12, fill: { color: T.accent } });
  s.addText(b.title || PRODUCT, tx({ x: 1, y: 2.5, w: SW - 2, h: 1.2, fontSize: 46, bold: true, color: T.white }));
  s.addText(b.subtitle || `${PERIOD} · Monthly Telemetry`, tx({ x: 1, y: 3.8, w: SW - 2, h: 0.6, fontSize: 22, color: "D6EAF8" }));
  if (b.footnote) s.addText(b.footnote, tx({ x: 1, y: SH - 0.9, w: SW - 2, h: 0.4, fontSize: 11, color: "D6EAF8" }));
}

function slideSummary(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label || "Executive Summary", b.title || `Executive Summary — ${PERIOD}`);
  let y = CY;
  if (b.body) {
    s.addShape("roundRect", { x: ML, y, w: CW, h: 1.45, fill: { color: T.white }, rectRadius: RAD, shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 } });
    s.addText(b.body, tx({ x: ML + PAD, y: y + 0.1, w: CW - PAD * 2, h: 1.25, fontSize: 12.5, color: T.dark, valign: "top", lineSpacingMultiple: 1.25, autoFit: true }));
    y += 1.65;
  }
  // Highlight cards (up to 8, 4 per row) — each shows value, label and % change.
  if (b.highlights && b.highlights.length) {
    const cards = b.highlights.slice(0, 8);
    const cols = Math.min(cards.length, 4), rows = Math.ceil(cards.length / cols);
    const cw = (CW - GAP * (cols - 1)) / cols, ch = rows > 1 ? 1.05 : 1.3;
    const vFs = rows > 1 ? 22 : 28;
    cards.forEach((c, i) => {
      const r = Math.floor(i / cols), ci = i % cols;
      const x = ML + ci * (cw + GAP), cy = y + r * (ch + GAP);
      s.addShape("roundRect", { x, y: cy, w: cw, h: ch, fill: { color: T.cardTint }, rectRadius: RAD });
      s.addText(disp(c.value, c.unit), tx({ x: x + PAD, y: cy + 0.12, w: cw - PAD * 2, h: 0.5, fontSize: vFs, bold: true, color: T.primary, align: "center", autoFit: true }));
      s.addText(c.label || "", tx({ x: x + PAD, y: cy + 0.58, w: cw - PAD * 2, h: 0.28, fontSize: 9, bold: true, color: T.dark, align: "center", valign: "top" }));
      const chg = c.change != null ? c.change : momRate(c.series);
      if (chg != null && chg !== "") {
        const r2 = parseFloat(chg), isNum = !isNaN(r2);
        const pos = isNum ? r2 >= 0 : true;
        const label = isNum ? `${pos ? "▲" : "▼"} ${Math.abs(r2)}%` : String(chg);
        s.addText(label, tx({ x: x + PAD, y: cy + ch - 0.3, w: cw - PAD * 2, h: 0.24, fontSize: 9, bold: true, color: pos ? T.green : T.red, align: "center" }));
      }
    });
    y += rows * ch + (rows - 1) * GAP + GAP;
    // Needs-attention callout: surfaces every declining metric across the deck so
    // the reader is immediately aware of what requires attention.
    const attention = collectAttention();
    if (attention.length) {
      const bh = 0.44;
      s.addShape("roundRect", { x: ML, y, w: CW, h: bh, fill: { color: "FDE7E9" }, rectRadius: RAD, line: { color: T.red, width: 0.75 } });
      s.addText([
        { text: "⚠  Needs attention:  ", options: { bold: true, color: T.red } },
        { text: attention.join("      ·      "), options: { bold: true, color: T.dark } },
      ], tx({ x: ML + PAD, y, w: CW - PAD * 2, h: bh, fontSize: 10.5, valign: "middle" }));
      y += bh + GAP;
    }
  }
  if (b.bullets && b.bullets.length) {
    s.addText(b.bullets.map(t => ({ text: t, options: { bullet: { code: "2022" }, fontSize: 12, color: T.dark, paraSpaceAfter: 6 } })),
      tx({ x: ML + 0.1, y, w: CW - 0.2, h: FY - y - 0.2, valign: "top" }));
  }
  sourceLink(s, b.sources || cfg.sources);
  footer(s, n, tot);
}

function slideMetrics(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label, b.title);
  const cards = (b.cards || []).slice(0, 8);
  if (!cards.length) { footer(s, n, tot); return; }
  const cols = cards.length <= 3 ? cards.length : (cards.length === 4 ? 4 : (cards.length <= 6 ? 3 : 4));
  const rows = Math.ceil(cards.length / cols);
  const areaY = CY, areaH = FY - CY - 0.3;
  const cw = (CW - GAP * (cols - 1)) / cols, ch = (areaH - GAP * (rows - 1)) / rows;
  const cp = 0.16;
  cards.forEach((c, i) => {
    const r = Math.floor(i / cols), cIdx = i % cols;
    const x = ML + cIdx * (cw + GAP), y = areaY + r * (ch + GAP);
    s.addShape("roundRect", { x, y, w: cw, h: ch, fill: { color: T.white }, rectRadius: RAD, line: { color: "E6E6E6", width: 0.75 }, shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 } });
    s.addText(c.title || "", tx({ x: x + cp, y: y + cp, w: cw - cp * 2, h: 0.5, fontSize: 10, bold: true, color: T.dark, valign: "top", lineSpacingMultiple: 1.0 }));
    s.addText(disp(c.value, c.unit), tx({ x: x + cp, y: y + cp + 0.48, w: cw - cp * 2, h: 0.55, fontSize: 26, bold: true, color: T.primary, autoFit: true }));
    const rate = momRate(c.series);
    let cursorY = y + cp + 1.08;
    if (rate != null) { momBadge(s, x + cp, cursorY, rate, cw - cp * 2); cursorY += 0.3; }
    else if (c.sub) { s.addText(c.sub, tx({ x: x + cp, y: cursorY, w: cw - cp * 2, h: 0.24, fontSize: 8, italic: true, color: T.medGrey })); cursorY += 0.28; }
    const chartH = (y + ch) - cursorY - 0.12;
    if (c.series && c.series.length >= 2 && chartH > 0.45) bars(s, x + cp, cursorY, cw - cp * 2, chartH, c.series, c.color || T.accent);
  });
  sourceLink(s, b.sources || cfg.sources);
  footer(s, n, tot);
}

function colWidthsH(total, cols, headers) {
  if (cols <= 1) return [total];
  const narrow = headers && headers[0] && String(headers[0]).length <= 3 ? 0.5 : null;
  if (narrow) {
    const rest = (total - narrow) / (cols - 1);
    return [narrow].concat(Array(cols - 1).fill(rest));
  }
  return colWidths(total, cols);
}

function slideHeroList(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label, b.title);
  const leftW = 4.0, rX = ML + leftW + GAP, rW = CW - leftW - GAP, y = CY, h = FY - CY - 0.3;
  // Left: hero + secondary
  s.addShape("roundRect", { x: ML, y, w: leftW, h, fill: { color: T.cardTint }, rectRadius: RAD });
  const hero = b.hero || {};
  s.addText(disp(hero.value, hero.unit), tx({ x: ML + PAD, y: y + 0.5, w: leftW - PAD * 2, h: 1.1, fontSize: 60, bold: true, color: T.primary, align: "center", autoFit: true }));
  s.addText(hero.label || "", tx({ x: ML + PAD, y: y + 1.7, w: leftW - PAD * 2, h: 0.5, fontSize: 14, bold: true, color: T.dark, align: "center", valign: "top" }));
  if (hero.sub) s.addText(hero.sub, tx({ x: ML + PAD, y: y + 2.2, w: leftW - PAD * 2, h: 0.5, fontSize: 9, color: T.medGrey, align: "center", valign: "top" }));
  if (b.secondary) {
    const sy = y + h - 1.4;
    s.addShape("line", { x: ML + PAD, y: sy - 0.1, w: leftW - PAD * 2, h: 0, line: { color: "E0E0E0", width: 1 } });
    s.addText(disp(b.secondary.value, b.secondary.unit), tx({ x: ML + PAD, y: sy, w: leftW - PAD * 2, h: 0.7, fontSize: 34, bold: true, color: T.accent, align: "center", autoFit: true }));
    s.addText(b.secondary.label || "", tx({ x: ML + PAD, y: sy + 0.72, w: leftW - PAD * 2, h: 0.5, fontSize: 11, color: T.dark, align: "center", valign: "top" }));
  }
  // Right: table/list
  const list = b.list;
  if (list && list.rows && list.rows.length) {
    const cols = list.columns || [];
    const header = cols.map(c => ({ text: String(c), options: { bold: true, color: T.white, fill: { color: T.primary }, fontSize: 10, align: "left" } }));
    const body = list.rows.slice(0, 12).map(row => row.map(cell => ({ text: String(cell), options: { fontSize: 9, color: T.dark, align: "left" } })));
    const table = [header].concat(body);
    s.addTable(table, { x: rX, y, w: rW, colW: colWidthsH(rW, cols.length, cols), rowH: (h - 0.0) / (body.length + 1), border: { type: "solid", pt: 0.5, color: "E0E0E0" }, fill: { color: T.white }, valign: "middle", autoPage: false });
  }
  sourceLink(s, b.sources || cfg.sources);
  footer(s, n, tot);
}

function slidePies(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label, b.title);
  const charts = (b.charts || []).slice(0, 2), y = CY, h = FY - CY - 0.3;
  const cw = (CW - GAP * (charts.length - 1)) / charts.length;
  charts.forEach((c, i) => {
    const x = ML + i * (cw + GAP);
    s.addShape("roundRect", { x, y, w: cw, h, fill: { color: T.white }, rectRadius: RAD, shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 } });
    s.addText(c.title || "", tx({ x: x + PAD, y: y + PAD, w: cw - PAD * 2, h: 0.3, fontSize: 13, bold: true, color: T.dark }));
    const bd = (c.breakdown || []).filter(x => x);
    const total = bd.reduce((a, x) => a + (pn(x.value) || 0), 0);
    s.addText(total ? `Total: ${fn(total)}${c.unit ? " " + c.unit : ""}` : "", tx({ x: x + PAD, y: y + PAD + 0.3, w: cw - PAD * 2, h: 0.22, fontSize: 9, color: T.medGrey }));
    if (bd.length) {
      s.addChart("pie", [{ name: c.title || "", labels: bd.map(x => `${x.name} (${fn(pn(x.value) || 0)})`), values: bd.map(x => pn(x.value) || 0) }],
        { x: x + 0.1, y: y + 0.85, w: cw - 0.2, h: h - 1.0, showPercent: true, showValue: false, showLabel: false, showLegend: true, legendPos: "r", legendFontSize: 9, dataLabelPosition: "bestFit", dataLabelFontSize: 8, dataLabelColor: T.white, chartColors: PIE_PALETTE });
    } else {
      s.addText("Data pending", tx({ x: x + PAD, y: y + h / 2, w: cw - PAD * 2, h: 0.3, fontSize: 12, italic: true, color: T.medGrey, align: "center" }));
    }
  });
  sourceLink(s, b.sources || cfg.sources);
  footer(s, n, tot);
}

function slideTable(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label, b.title);
  const cols = b.columns || [], y = CY;
  const header = cols.map(c => ({ text: String(c), options: { bold: true, color: T.white, fill: { color: T.primary }, fontSize: 11, align: "left" } }));
  const body = (b.rows || []).slice(0, 14).map(row => row.map(cell => ({ text: String(cell), options: { fontSize: 10, color: T.dark, align: "left" } })));
  if (body.length) {
    s.addTable([header].concat(body), { x: ML, y, w: CW, colW: colWidthsH(CW, cols.length, cols), rowH: 0.3, border: { type: "solid", pt: 0.5, color: "E0E0E0" }, fill: { color: T.white }, valign: "middle", autoPage: false });
  }
  if (b.note) s.addText(b.note, tx({ x: ML, y: FY - 0.35, w: CW, h: 0.3, fontSize: 9, italic: true, color: T.medGrey }));
  sourceLink(s, b.sources || cfg.sources);
  footer(s, n, tot);
}

function slideTrends(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label, b.title);
  const charts = (b.charts || []).slice(0, 3), y = CY, h = FY - CY - 0.3;
  const cw = (CW - GAP * (charts.length - 1)) / charts.length;
  const palette = [T.primary, T.green, T.accent];
  charts.forEach((c, i) => {
    const x = ML + i * (cw + GAP), clr = c.color || palette[i % palette.length];
    s.addShape("roundRect", { x, y, w: cw, h, fill: { color: T.white }, rectRadius: RAD, shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 } });
    s.addText(c.title || "", tx({ x: x + PAD, y: y + PAD, w: cw - PAD * 2, h: 0.3, fontSize: 13, bold: true, color: T.dark }));
    const latest = (c.series || []).filter(p => p && pn(p.value) != null).slice(-1)[0];
    if (latest) s.addText(disp(latest.value, c.unit), tx({ x: x + PAD, y: y + PAD + 0.32, w: cw - PAD * 2, h: 0.5, fontSize: 26, bold: true, color: clr }));
    const rate = momRate(c.series);
    if (rate != null) momBadge(s, x + PAD, y + PAD + 0.9, rate, cw - PAD * 2);
    bars(s, x + 0.3, y + 2.0, cw - 0.6, h - 2.3, c.series, clr);
  });
  sourceLink(s, b.sources || cfg.sources);
  footer(s, n, tot);
}

function slideImpact(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  const ev = b.event || {};
  heading(s, b.label || "Impact Since Launch", b.title || (ev.name ? `Impact Since ${ev.name}` : "Impact Since Key Event"));
  if (ev.name || ev.date) {
    s.addText([
      { text: (ev.name || "Launch") + "  ", options: { bold: true, color: T.dark } },
      { text: ev.date ? `· launched ${ev.date}` : "", options: { color: T.medGrey } },
    ], tx({ x: ML, y: 0.98, w: CW, h: 0.26, fontSize: 11 }));
  }
  const metrics = (b.metrics || []).slice(0, 3);
  const y = CY + 0.3, h = FY - y - 0.3;
  const cw = metrics.length ? (CW - GAP * (metrics.length - 1)) / metrics.length : CW;
  const palette = [T.primary, T.accent, T.purple];
  metrics.forEach((m, i) => {
    const x = ML + i * (cw + GAP), clr = m.color || palette[i % palette.length], cp = 0.2;
    s.addShape("roundRect", { x, y, w: cw, h, fill: { color: T.white }, rectRadius: RAD, shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 } });
    s.addText(m.title || "", tx({ x: x + cp, y: y + cp, w: cw - cp * 2, h: 0.35, fontSize: 13, bold: true, color: T.dark, valign: "top" }));
    const orig = pn(m.original), cur = pn(m.current);
    const incr = (orig != null && cur != null && orig !== 0) ? Math.round((cur - orig) / Math.abs(orig) * 100) : null;
    const pos = incr == null || incr >= 0;
    if (incr != null) {
      s.addText(`${incr >= 0 ? "+" : ""}${incr}%`, tx({ x: x + cp, y: y + cp + 0.42, w: cw - cp * 2, h: 0.6, fontSize: 34, bold: true, color: pos ? T.green : T.red }));
      s.addText("since launch", tx({ x: x + cp, y: y + cp + 1.02, w: cw - cp * 2, h: 0.22, fontSize: 9, color: T.medGrey }));
    }
    const arrow = `${disp(m.original, m.unit)}  →  ${disp(m.current, m.unit)}`;
    s.addText(arrow, tx({ x: x + cp, y: y + cp + 1.28, w: cw - cp * 2, h: 0.3, fontSize: 13, bold: true, color: T.dark }));
    if (!pos) s.addText("⚠ needs attention", tx({ x: x + cp, y: y + cp + 1.58, w: cw - cp * 2, h: 0.24, fontSize: 9, bold: true, color: T.red }));
    const rate = momRate(m.series);
    const chartTop = y + cp + 1.95;
    if (rate != null) momBadge(s, x + cp, chartTop, rate, cw - cp * 2);
    bars(s, x + cp, chartTop + 0.32, cw - cp * 2, (y + h) - (chartTop + 0.32) - 0.15, m.series, clr);
  });
  sourceLink(s, b.sources || cfg.sources);
  footer(s, n, tot);
}

function slideFeedback(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label || "User Satisfaction & Feedback", b.title || "How Users Feel");
  const cards = (b.cards || []).slice(0, 4);
  const topH = 1.55, y = CY;
  if (cards.length) {
    const cw = (CW - GAP * (cards.length - 1)) / cards.length, cp = 0.16;
    cards.forEach((c, i) => {
      const x = ML + i * (cw + GAP);
      s.addShape("roundRect", { x, y, w: cw, h: topH, fill: { color: T.white }, rectRadius: RAD, line: { color: "E6E6E6", width: 0.75 }, shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 } });
      s.addText(c.title || "", tx({ x: x + cp, y: y + cp, w: cw - cp * 2, h: 0.3, fontSize: 10, bold: true, color: T.dark, valign: "top" }));
      s.addText(disp(c.value, c.unit), tx({ x: x + cp, y: y + cp + 0.34, w: cw - cp * 2, h: 0.5, fontSize: 24, bold: true, color: T.primary, autoFit: true }));
      const rate = momRate(c.series);
      if (rate != null) momBadge(s, x + cp, y + topH - 0.36, rate, cw - cp * 2);
      else if (c.sub) s.addText(c.sub, tx({ x: x + cp, y: y + topH - 0.34, w: cw - cp * 2, h: 0.24, fontSize: 8, italic: true, color: T.medGrey }));
    });
  }
  // Verbatim quotes with hyperlinks
  const quotes = (b.quotes || []).slice(0, 3);
  if (quotes.length) {
    const qy = y + topH + GAP, qh = FY - qy - 0.3;
    const qw = (CW - GAP * (quotes.length - 1)) / quotes.length, cp = 0.2;
    quotes.forEach((q, i) => {
      const x = ML + i * (qw + GAP);
      s.addShape("roundRect", { x, y: qy, w: qw, h: qh, fill: { color: T.cardTint }, rectRadius: RAD });
      s.addText("“", tx({ x: x + cp - 0.05, y: qy + 0.02, w: 0.6, h: 0.6, fontSize: 40, bold: true, color: T.accent, valign: "top" }));
      s.addText(q.text || "", tx({ x: x + cp, y: qy + 0.6, w: qw - cp * 2, h: qh - 1.5, fontSize: 12, italic: true, color: T.dark, valign: "top", lineSpacingMultiple: 1.2, autoFit: true }));
      s.addText(q.author || "", tx({ x: x + cp, y: qy + qh - 0.85, w: qw - cp * 2, h: 0.28, fontSize: 10, bold: true, color: T.dark }));
      const link = { text: "View feedback →", options: { fontSize: 9, color: T.primary, underline: true } };
      if (q.url) link.options.hyperlink = { url: q.url };
      s.addText([link], tx({ x: x + cp, y: qy + qh - 0.5, w: qw - cp * 2, h: 0.28 }));
    });
  }
  sourceLink(s, b.sources || cfg.sources);
  footer(s, n, tot);
}

function slideBullets(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label || "Milestones", b.title || `Key Events — ${PERIOD}`);
  const items = b.items || [];
  if (items.length) {
    s.addText(items.map(t => ({ text: typeof t === "string" ? t : (t.text || ""), options: { bullet: { code: "2022" }, fontSize: 14, color: T.dark, paraSpaceAfter: 12 } })),
      tx({ x: ML + 0.2, y: CY, w: CW - 0.4, h: FY - CY - 0.3, valign: "top" }));
  } else {
    s.addText("[ Fill manually ]", tx({ x: ML + 0.2, y: CY, w: CW - 0.4, h: 1, fontSize: 14, italic: true, color: T.medGrey }));
  }
  if (b.note) s.addText(b.note, tx({ x: ML, y: FY - 0.35, w: CW, h: 0.3, fontSize: 9, italic: true, color: T.medGrey }));
  footer(s, n, tot);
}

function slideDefinitions(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label || "Appendix", b.title || "Definitions");
  const groups = (b.groups || []).slice(0, 2), y = CY, h = FY - CY - 0.3;
  const cw = groups.length ? (CW - GAP * (groups.length - 1)) / groups.length : CW;
  groups.forEach((g, i) => {
    const x = ML + i * (cw + GAP);
    s.addShape("roundRect", { x, y, w: cw, h, fill: { color: T.white }, rectRadius: RAD, shadow: { type: "outer", blur: 3, offset: 1, color: "000000", opacity: 0.06 } });
    s.addText(g.heading || "", tx({ x: x + PAD, y: y + PAD, w: cw - PAD * 2, h: 0.35, fontSize: 14, bold: true, color: T.primary }));
    const runs = [];
    (g.items || []).forEach(it => {
      runs.push({ text: (it.term || "") + "  ", options: { bold: true, fontSize: 11, color: T.dark, breakLine: false } });
      runs.push({ text: it.def || "", options: { fontSize: 11, color: T.medGrey, breakLine: true, paraSpaceAfter: 8 } });
    });
    s.addText(runs, tx({ x: x + PAD, y: y + PAD + 0.45, w: cw - PAD * 2, h: h - PAD - 0.55, valign: "top", lineSpacingMultiple: 1.1 }));
  });
  footer(s, n, tot);
}

// Top issues / underperforming signals — an auto watchlist. Every declining
// metric across the deck is collected, ranked worst-first, and listed with its
// latest value and MoM drop. Optional manual `items` append. Complements the
// exec-summary needs-attention banner with a dedicated, sortable slide.
function slideIssues(b, n, tot) {
  const s = pres.addSlide();
  frame(s, true);
  heading(s, b.label || "Watchlist", b.title || `Top Issues & Underperforming Signals — ${PERIOD}`);
  const lastVal = ser => (Array.isArray(ser) && ser.length ? ser[ser.length - 1].value : null);
  const auto = [], seen = new Set();
  const add = (name, rate, value, unit) => {
    if (!name || rate == null) return;
    const r = parseFloat(rate); if (isNaN(r) || r >= 0) return;
    const key = String(name).toLowerCase(); if (seen.has(key)) return; seen.add(key);
    auto.push({ name, rate: r, value, unit });
  };
  (cfg.slides || []).forEach(bl => {
    if (bl.type === "summary") (bl.highlights || []).forEach(c => add(c.label, c.change != null ? c.change : momRate(c.series), c.value != null ? c.value : lastVal(c.series), c.unit));
    if (bl.type === "metrics") (bl.cards || []).forEach(c => add(c.title, momRate(c.series), c.value != null ? c.value : lastVal(c.series), c.unit));
    if (bl.type === "trends") (bl.charts || []).forEach(c => add(c.title, momRate(c.series), lastVal(c.series), c.unit));
  });
  auto.sort((a, c) => a.rate - c.rate);
  const notes = b.notes || {};
  const rows = auto.map(a => ({
    name: a.name,
    meta: `${disp(a.value, a.unit)}   ·   ▼ ${Math.abs(a.rate)}% MoM`,
    note: notes[a.name] || "",
  }));
  (b.items || []).forEach(it => { const o = typeof it === "string" ? { name: it } : it; rows.push({ name: o.name || o.title || o.text || "", meta: o.meta || "", note: o.note || "" }); });
  let y = CY;
  if (b.body) { s.addText(b.body, tx({ x: ML, y, w: CW, h: 0.5, fontSize: 12, color: T.medGrey, valign: "top" })); y += 0.6; }
  if (!rows.length) {
    s.addShape("roundRect", { x: ML, y, w: CW, h: 0.8, fill: { color: "E8F5E9" }, rectRadius: RAD, line: { color: T.green, width: 0.75 } });
    s.addText("✓  No declining metrics this period — all tracked signals are flat or improving.", tx({ x: ML + PAD, y, w: CW - PAD * 2, h: 0.8, fontSize: 13, bold: true, color: T.green }));
    footer(s, n, tot); return;
  }
  const shown = rows.slice(0, 8);
  const rh = Math.min(0.82, (FY - y - 0.3) / shown.length - 0.12);
  shown.forEach((r, i) => {
    const cy = y + i * (rh + 0.12);
    s.addShape("roundRect", { x: ML, y: cy, w: CW, h: rh, fill: { color: "FDE7E9" }, rectRadius: RAD, line: { color: T.red, width: 0.5 } });
    s.addShape("roundRect", { x: ML, y: cy, w: 0.55, h: rh, fill: { color: T.red }, rectRadius: RAD });
    s.addText(`${i + 1}`, tx({ x: ML, y: cy, w: 0.55, h: rh, fontSize: 18, bold: true, color: T.white, align: "center" }));
    s.addText([{ text: r.name + "     ", options: { bold: true, fontSize: 13, color: T.dark } }, { text: r.meta, options: { fontSize: 11, bold: true, color: T.red } }],
      tx({ x: ML + 0.7, y: cy + (r.note ? 0.06 : 0), w: CW - 1.4, h: r.note ? rh * 0.5 : rh, valign: r.note ? "top" : "middle" }));
    if (r.note) s.addText(r.note, tx({ x: ML + 0.7, y: cy + rh * 0.48, w: CW - 1.4, h: rh * 0.46, fontSize: 10, italic: true, color: T.medGrey, valign: "top" }));
  });
  footer(s, n, tot);
}

function colWidths(total, cols) {
  if (cols <= 1) return [total];
  const first = Math.min(total * 0.5, total / cols * 1.6);
  const rest = (total - first) / (cols - 1);
  return [first].concat(Array(cols - 1).fill(rest));
}

// ───────────────────────── DISPATCH ────────────────────────
const RENDERERS = {
  title: slideTitle, summary: slideSummary, metrics: slideMetrics,
  "hero-list": slideHeroList, pies: slidePies, table: slideTable,
  trends: slideTrends, impact: slideImpact, feedback: slideFeedback,
  bullets: slideBullets, definitions: slideDefinitions, issues: slideIssues,
};

// --outline: print the planned slides + key numbers and stop (review before render).
if (args.includes("--outline")) { printOutline(); process.exit(0); }
// Preflight runs on every build. --strict aborts when hard errors are present.
const pf = preflight();
printPreflight(pf);
if (pf.errors.length && args.includes("--strict")) {
  console.error(`${pf.errors.length} error(s) and --strict is set — aborting without rendering.`);
  process.exit(1);
}

const slides = cfg.slides || [];
const total = slides.filter(b => b.type !== "title").length;
let pageNo = 0;
slides.forEach(b => {
  const fn = RENDERERS[b.type];
  if (!fn) { console.warn(`Unknown slide type: ${b.type} — skipped`); return; }
  if (b.type === "title") { fn(b); }
  else { pageNo++; fn(b, pageNo, total); }
});

const out = args.find(a => a.endsWith(".pptx")) || `${PRODUCT} Telemetry - ${PERIOD}.pptx`.replace(/[\\/:*?"<>|]/g, "");
pres.writeFile({ fileName: out }).then(() => {
  console.log(`✔ Wrote ${out}  (${slides.length} slides)`);
  saveMetrics();
}).catch(e => { console.error("Failed to write deck:", e); process.exit(1); });
