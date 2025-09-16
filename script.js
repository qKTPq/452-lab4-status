// script.js (ES module)
// Reads a CSV from a URL and returns an array of rows (each row is an array of cells)

export async function loadCsv(url) {
  // Cache-busting query to make sure GitHub updates are reflected immediately
  const bust = url.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
  const res = await fetch(url + bust, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
  const text = await res.text();
  return parseCsv(text);
}

// Minimal CSV parser supporting quotes and commas
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

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
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        // Handle Windows newlines \r\n
        if (c === '\r' && text[i + 1] === '\n') i++;
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