#!/usr/bin/env node
/**
 * build-dashboard.js — Part 2 of the customer-insights pipeline.
 *
 * Takes a `dashboard_data.json` (produced after the agent has clustered the
 * already-categorized Skill-1 insights into themes and written an executive
 * summary), VALIDATES its structure, then EMBEDS it into a copy of
 * `dashboard-template.html` to produce a self-contained `dashboard.html`.
 *
 * Usage:
 *   node build-dashboard.js <dashboard_data.json> [output.html] [--template <path>]
 *
 * Defaults:
 *   output   = ./dashboard.html
 *   template = ./dashboard-template.html (next to this script)
 *
 * The embed step is structural (indexOf-based), NOT regex — regex embedding is
 * fragile and has produced broken HTML in the past.
 */

const fs = require('fs');
const path = require('path');

const CATEGORY_KEYS = ['goals', 'blockers', 'feature_requests', 'feedback_positive', 'feedback_negative'];
const CLUSTER_CATEGORIES = ['blockers', 'feature_requests', 'feedback_positive', 'feedback_negative'];

function fail(msg) {
  console.error('❌ ' + msg);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { positional: [], template: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--template') { args.template = argv[++i]; }
    else args.positional.push(argv[i]);
  }
  return args;
}

// ─── validation ───
function validate(data) {
  const errors = [];
  if (!data || typeof data !== 'object') { errors.push('Root is not an object.'); return errors; }

  if (!data.product || typeof data.product.name !== 'string' || !data.product.name.trim())
    errors.push('`product.name` must be a non-empty string.');

  if (data.executive_summary != null && typeof data.executive_summary !== 'string')
    errors.push('`executive_summary` must be a string when present.');
  else if (typeof data.executive_summary === 'string' && data.executive_summary.trim().length < 100)
    errors.push('`executive_summary` is shorter than 100 chars — write a real 5-paragraph summary.');

  if (data.total_customers != null && !Number.isInteger(data.total_customers))
    errors.push('`total_customers` must be an integer when present.');

  const themes = data.themes;
  if (!themes || typeof themes !== 'object') { errors.push('`themes` object is required.'); return errors; }

  for (const key of CATEGORY_KEYS) {
    if (themes[key] == null) continue; // category may legitimately be empty
    if (!Array.isArray(themes[key])) { errors.push(`themes.${key} must be an array.`); continue; }

    themes[key].forEach((c, i) => {
      const where = `themes.${key}[${i}]`;
      if (typeof c.theme !== 'string' || !c.theme.trim())
        errors.push(`${where}.theme must be a non-empty string.`);

      if (key === 'goals') {
        // goals are lighter: theme + customers/count only
        if (!Array.isArray(c.customers) && !Number.isInteger(c.customer_count))
          errors.push(`${where} needs either a customers[] array or an integer customer_count.`);
        return;
      }

      // full clusters
      if (!Array.isArray(c.customers) || c.customers.length === 0)
        errors.push(`${where}.customers must be a non-empty array.`);
      if (!Array.isArray(c.items) || c.items.length === 0)
        errors.push(`${where}.items must be a non-empty array.`);
      else c.items.forEach((it, j) => {
        if (typeof it.customer !== 'string' || !it.customer.trim())
          errors.push(`${where}.items[${j}].customer must be a non-empty string.`);
        if (typeof it.quote !== 'string' || !it.quote.trim())
          errors.push(`${where}.items[${j}].quote must be a non-empty string (evidence is mandatory).`);
      });
      if ('cluster_summary' in c && !('theme' in c))
        errors.push(`${where} uses \`cluster_summary\` — rename it to \`theme\` (dashboard renders \`theme\`).`);
    });
  }
  return errors;
}

// ─── normalize (fill counts, sort) ───
function normalize(data) {
  const themes = data.themes || {};
  for (const key of CATEGORY_KEYS) {
    if (!Array.isArray(themes[key])) continue;
    themes[key].forEach(c => {
      if (Array.isArray(c.customers)) {
        // de-dupe customers
        c.customers = [...new Set(c.customers)];
        if (c.customer_count == null) c.customer_count = c.customers.length;
      }
      if (Array.isArray(c.items) && c.item_count == null) c.item_count = c.items.length;
    });
    // sort by customer_count desc, then item_count desc
    themes[key].sort((a, b) =>
      (b.customer_count || 0) - (a.customer_count || 0) ||
      (b.item_count || 0) - (a.item_count || 0));
  }
  if (!data.last_updated) data.last_updated = new Date().toISOString();
  return data;
}

// ─── embed ───
function embed(templateHtml, data) {
  const openTag = '<script id="dashboard-data">';
  const start = templateHtml.indexOf(openTag);
  if (start === -1) fail('Template is missing the <script id="dashboard-data"> tag.');
  const contentStart = start + openTag.length;
  const closeTag = '</script>';
  const contentEnd = templateHtml.indexOf(closeTag, contentStart);
  if (contentEnd === -1) fail('Template <script id="dashboard-data"> tag is not closed.');

  // Guard against breaking out of the <script> context.
  const payload = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
  const injected = 'window.__DASHBOARD_DATA__ = ' + payload + ';';
  return templateHtml.slice(0, contentStart) + injected + templateHtml.slice(contentEnd);
}

// ─── main ───
function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataPath = args.positional[0];
  if (!dataPath) fail('Usage: node build-dashboard.js <dashboard_data.json> [output.html] [--template <path>]');

  const outPath = args.positional[1] || path.join(process.cwd(), 'dashboard.html');
  const templatePath = args.template || path.join(__dirname, 'dashboard-template.html');

  if (!fs.existsSync(dataPath)) fail(`Data file not found: ${dataPath}`);
  if (!fs.existsSync(templatePath)) fail(`Template not found: ${templatePath}`);

  let data;
  try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
  catch (e) { fail(`Could not parse ${dataPath} as JSON: ${e.message}`); }

  const errors = validate(data);
  if (errors.length) {
    console.error(`\n❌ Validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    errors.forEach(e => console.error('   • ' + e));
    console.error('\nFix dashboard_data.json and re-run. Dashboard NOT written.\n');
    process.exit(1);
  }

  normalize(data);

  const template = fs.readFileSync(templatePath, 'utf8');
  const html = embed(template, data);

  // Re-parse the embedded payload as a sanity check.
  const check = html.indexOf('window.__DASHBOARD_DATA__ = ');
  if (check === -1) fail('Embedding did not produce the expected data assignment.');

  fs.writeFileSync(outPath, html, 'utf8');

  const themes = data.themes || {};
  const count = k => Array.isArray(themes[k]) ? themes[k].length : 0;
  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log('✅ Dashboard built successfully.');
  console.log(`   Product:   ${data.product.name}`);
  console.log(`   Customers: ${data.total_customers != null ? data.total_customers : '—'}`);
  console.log(`   Themes:    Goals(${count('goals')}) Blockers(${count('blockers')}) Features(${count('feature_requests')}) Positive(${count('feedback_positive')}) Negative(${count('feedback_negative')})`);
  console.log(`   Output:    ${outPath} (${sizeKb} KB)`);
  console.log('   Open the file in any browser — works offline and via file://.');
}

main();
