/**
 * Exports the campus data from the TypeScript constants into a JSON file the
 * Python backend can consume, keeping a single source of truth for the graph.
 *
 * Usage:  node backend/scripts/export_campus.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'constants', 'campus.ts');
const FEATURES_SRC = path.join(__dirname, '..', '..', 'constants', 'campusFeatures.ts');
const OUT_DIR = path.join(__dirname, '..', 'data');
const OUT = path.join(OUT_DIR, 'campus.json');

const source = fs.readFileSync(SRC, 'utf8');
const featuresSource = fs.readFileSync(FEATURES_SRC, 'utf8');

/**
 * Extracts the array/object literal that follows `export const NAME ... =`
 * and evaluates it as JavaScript. The campus constants are pure data literals
 * (no functions), so eval is safe and sufficient here.
 */
function extractLiteral(src, name, openChar, closeChar) {
  const marker = `export const ${name}`;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`Could not find ${name}`);

  const eqIndex = src.indexOf('=', start);
  const openIndex = src.indexOf(openChar, eqIndex);

  let depth = 0;
  let i = openIndex;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) break;
    }
  }

  const literal = src.slice(openIndex, i + 1);
  // eslint-disable-next-line no-eval
  return eval(`(${literal})`);
}

const data = {
  campus_center: extractLiteral(source, 'CAMPUS_CENTER', '{', '}'),
  buildings: extractLiteral(source, 'BUILDINGS', '[', ']'),
  paths: extractLiteral(source, 'PATHS', '[', ']'),
  events: extractLiteral(source, 'SAMPLE_EVENTS', '[', ']'),
  path_attributes: extractLiteral(featuresSource, 'PATH_ATTRIBUTES', '{', '}'),
  campus_pulse: extractLiteral(featuresSource, 'CAMPUS_PULSE', '[', ']'),
  safety_pois: extractLiteral(featuresSource, 'SAFETY_POIS', '[', ']'),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 2));

console.log(
  `Wrote ${OUT}\n  buildings: ${data.buildings.length}\n  paths: ${data.paths.length}\n  events: ${data.events.length}\n  pulse: ${data.campus_pulse.length}\n  safety: ${data.safety_pois.length}`
);
