/**
 * RFC 4180 compliant CSV parser and generator without external dependencies.
 */

export interface ParsedCsvRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface CsvParseResult {
  headers: string[];
  rows: ParsedCsvRow[];
  totalRows: number;
}

/**
 * Escapes a field for CSV output.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts array of objects into CSV string.
 */
export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  const headerRow = columns.map((c) => escapeCsvField(c.header)).join(',');
  const rows = data.map((item) =>
    columns.map((c) => escapeCsvField(item[c.key])).join(',')
  );
  return [headerRow, ...rows].join('\r\n');
}

/**
 * Parses raw CSV string into structured headers and records.
 */
export function parseCsv(csvText: string): CsvParseResult {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const rawLines = splitCsvLines(csvText.trim());
  if (rawLines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = parseCsvLine(rawLines[0]).map((h) => h.trim().toLowerCase());
  const rows: ParsedCsvRow[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    const values = parseCsvLine(rawLines[i]);
    const rowObj: Record<string, string> = {};

    headers.forEach((header, idx) => {
      rowObj[header] = values[idx] !== undefined ? values[idx].trim() : '';
    });

    rows.push({
      rowNumber: i + 1, // 1-based, accounting for header
      data: rowObj,
    });
  }

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Splits CSV into logical lines, keeping multi-line quoted fields intact.
 */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '""';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parses a single CSV line into an array of string values.
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  values.push(currentVal);
  return values;
}

