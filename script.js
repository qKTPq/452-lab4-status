// script.js (ES module)

export async function loadCsv(urlOrBase, maybeFilename) {
  // Build a safe URL (handles spaces) if base + filename provided
  const url = maybeFilename
    ? String(new URL(maybeFilename, urlOrBase))
    : String(new URL(urlOrBase, window.location.href));

  // Cache-busting query to make sure GitHub updates are reflected immediately
  const bust = url.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;

  const res = await fetch(url + bust, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText} at ${url}`);
  }

  let text = await res.text();

  // Strip UTF-8 BOM if present and normalize newlines
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  text = text.replace(/\r\n?/g, '\n');

  return parseCsv(text);
}

// Minimal CSV parser supporting quotes and commas/semicolons/tabs
function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const delim = delimiter || detectDelimiter(text); // ',', ';', '\t', or '|'

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        // Handle escaped quotes ""
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === delim) {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }

  // Push the last field/row if any
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Remove empty trailing rows
  return rows.filter(r => r.some(cell => (cell ?? '').trim() !== ''));
}

function detectDelimiter(text) {
  const firstLine = text.split('\n', 1)[0] ?? '';
  const candidates = [',', ';', '\t', '|'];
  let best = ',', bestCount = 0;
  for (const d of candidates) {
    const count = firstLine.split(d).length;
    if (count > bestCount) { best = d; bestCount = count; }
  }
  return best;
}