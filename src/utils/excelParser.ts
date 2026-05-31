import * as XLSX from 'xlsx';
import { AccountRecord, ActivityRecord, LeadRecord } from '../types';

type Row = (string | number | boolean | null | undefined)[];

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v.replace(/[$,%\s]/g, '')) || 0;
  return 0;
};

const toStr = (v: unknown): string => (v == null ? '' : String(v).trim());

const toDate = (v: unknown): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const slash = s.split('/');
    if (slash.length === 3) {
      const d = new Date(+slash[2], +slash[0] - 1, +slash[1]);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s.split('T')[0]);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/** Returns true only if value looks like a person/team name — not a date, number, or metadata. */
const looksLikeName = (val: string): boolean => {
  if (!val || val.length < 2) return false;
  // Reject date patterns M/D/YYYY, MM/DD/YYYY, YYYY-MM-DD
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(val)) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return false;
  // Reject pure numbers / currency
  if (/^\$?[\d,]+\.?\d*%?$/.test(val)) return false;
  // Reject known non-name tokens
  if (/^(total|subtotal|grand|average|count|sum|filtered|show:|status|type|none|true|false|as of|generated|sorted|copyright)/i.test(val)) return false;
  // Must contain letters and be at least 3 chars
  return /[a-zA-Z]/.test(val) && val.length >= 3;
};

const readWorkbook = (file: File): Promise<XLSX.WorkBook> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(XLSX.read(e.target?.result as string, { type: 'binary', cellDates: false }));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });

/** Finds the first row with enough non-empty cells that matches given keyword hints. */
const findHeaderRow = (rows: Row[], keywords: string[], maxScan = 30): number => {
  // First pass: look for row containing known keywords
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const rowStr = rows[i].map(v => toStr(v).toLowerCase()).join(' ');
    const hits = keywords.filter(kw => rowStr.includes(kw.toLowerCase())).length;
    if (hits >= 2) return i;
  }
  // Fallback: first row with 5+ non-empty cells
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    if (rows[i].filter(v => v != null && v !== '').length >= 5) return i;
  }
  return 0;
};

/** Find a column index by scanning header row for keyword matches. */
const findCol = (headers: string[], candidates: string[]): number => {
  for (const kw of candidates) {
    const idx = headers.findIndex(h => h.toLowerCase().includes(kw.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
};

/** Find category YTD/LY column pair by checking for category name + ytd/ly distinction. */
const findCatCols = (headers: string[], catName: string) => ({
  ytd: headers.findIndex(h => {
    const l = h.toLowerCase();
    return l.includes(catName) && l.includes('ytd') && !l.includes('lyytd') && !l.includes('ly ytd');
  }),
  ly: headers.findIndex(h => {
    const l = h.toLowerCase();
    return l.includes(catName) && (l.includes('lyytd') || l.includes('ly ytd') || (l.includes('ly') && l.includes('ytd') && l.indexOf('ly') < l.indexOf('ytd')));
  }),
});

// ─── Decline / Accounts List ───────────────────────────────────────────────

export const parseDeclineFile = async (file: File): Promise<{ records: AccountRecord[]; asOf: string }> => {
  const wb = await readWorkbook(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null });

  // Extract as-of metadata
  let asOf = '';
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const text = rows[i].map(toStr).join(' ');
    if (/as of/i.test(text)) { asOf = text.replace(/\s+/g, ' ').trim().slice(0, 120); break; }
  }

  const headerIdx = findHeaderRow(rows, ['account owner', 'account name', 'sales ytd', 'yoy']);
  const headers = rows[headerIdx].map(v => toStr(v));

  // Map columns by keyword
  const repCol    = findCol(headers, ['account owner', 'owner', 'rep', 'assigned to', 'salesperson']);
  const nameCol   = findCol(headers, ['account name', 'customer name', 'company / account', 'company', 'account']);
  const lastPurCol = findCol(headers, ['last purchase', 'last order', 'last activity date']);
  const salesYTDCol = findCol(headers, ['sales ytd', 'ytd sales', 'amount ytd', 'revenue ytd']);
  const yoyDiffCol  = findCol(headers, ['yoy difference', 'yoy diff', 'ly difference', 'difference']);
  const ytdPctCol   = findCol(headers, ['ytd change %', 'ytd change', 'yoy %', 'change %', 'pct change']);

  const bw = findCatCols(headers, 'backwall');
  const bn = findCatCols(headers, 'bin');
  const cr = findCatCols(headers, 'crane');
  const pl = findCatCols(headers, 'plush');

  // Positional fallbacks (original Salesforce export column order)
  const rc  = repCol      !== -1 ? repCol      : 1;
  const nc  = nameCol     !== -1 ? nameCol     : 3;
  const lpc = lastPurCol  !== -1 ? lastPurCol  : 4;
  const syc = salesYTDCol !== -1 ? salesYTDCol : 5;
  const ydc = yoyDiffCol  !== -1 ? yoyDiffCol  : 6;
  const ypc = ytdPctCol   !== -1 ? ytdPctCol   : 7;
  const bwYTD = bw.ytd !== -1 ? bw.ytd : 8;  const bwLY = bw.ly !== -1 ? bw.ly : 9;
  const bnYTD = bn.ytd !== -1 ? bn.ytd : 10; const bnLY = bn.ly !== -1 ? bn.ly : 11;
  const crYTD = cr.ytd !== -1 ? cr.ytd : 12; const crLY = cr.ly !== -1 ? cr.ly : 13;
  const plYTD = pl.ytd !== -1 ? pl.ytd : 14; const plLY = pl.ly !== -1 ? pl.ly : 15;

  const records: AccountRecord[] = [];
  let currentRep = '';

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const nonEmpty = row.filter(v => v != null && v !== '').length;
    if (nonEmpty < 3) continue;

    // Update rep — only if the cell has a valid person name
    const repCandidate = toStr(row[rc]);
    if (repCandidate && looksLikeName(repCandidate)) {
      currentRep = repCandidate;
    }

    const accountName = toStr(row[nc]);
    if (!accountName || !looksLikeName(accountName)) continue;
    // Skip subtotal/summary rows
    if (/^(total|subtotal|grand total)/i.test(accountName)) continue;

    const salesYTD = toNum(row[syc]);
    const yoyDiff  = toNum(row[ydc]);

    records.push({
      rep: currentRep || 'Unassigned',
      accountName,
      lastPurchase: toDate(row[lpc]),
      salesYTD,
      salesLYYTD: salesYTD - yoyDiff,
      yoyDiff,
      ytdChangePct: toNum(row[ypc]),
      cat: {
        backwall: { ytd: toNum(row[bwYTD]), ly: toNum(row[bwLY]) },
        bin:      { ytd: toNum(row[bnYTD]), ly: toNum(row[bnLY]) },
        crane:    { ytd: toNum(row[crYTD]), ly: toNum(row[crLY]) },
        plush:    { ytd: toNum(row[plYTD]), ly: toNum(row[plLY]) },
      },
    });
  }

  return { records, asOf };
};

// ─── Connections Pivot ─────────────────────────────────────────────────────

export const parseConnectionsFile = async (file: File): Promise<ActivityRecord[]> => {
  const wb = await readWorkbook(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null });

  let dateHeaderIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    if (rows[i].some(v => /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i.test(toStr(v)))) {
      dateHeaderIdx = i;
      break;
    }
  }
  if (dateHeaderIdx === -1) return [];

  const monthCols: { col: number; month: string }[] = [];
  rows[dateHeaderIdx].forEach((v, c) => {
    const s = toStr(v);
    if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i.test(s)) {
      monthCols.push({ col: c, month: s });
    }
  });

  const records: ActivityRecord[] = [];
  let currentRep = '';

  for (let i = dateHeaderIdx + 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const repCandidate = toStr(row[1]);
    if (repCandidate && looksLikeName(repCandidate)) currentRep = repCandidate;

    const type = toStr(row[2]);
    if (!type || /^(type|sum|total|subtotal)/i.test(type) || !currentRep) continue;

    monthCols.forEach(({ col, month }) => {
      const count = toNum(row[col]);
      if (count > 0) records.push({ rep: currentRep, type, month, count });
    });
  }

  return records;
};

// ─── Leads ─────────────────────────────────────────────────────────────────

export const parseLeadsFile = async (file: File): Promise<LeadRecord[]> => {
  const wb = await readWorkbook(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null });

  const headerIdx = findHeaderRow(rows, ['lead owner', 'first name', 'company', 'lead source', 'engagement']);
  const headers = rows[headerIdx].map(v => toStr(v));

  const ownerCol    = findCol(headers, ['lead owner', 'owner', 'assigned to', 'rep']);
  const firstCol    = findCol(headers, ['first name', 'first']);
  const lastCol     = findCol(headers, ['last name', 'last']);
  const titleCol    = findCol(headers, ['title', 'job title']);
  const companyCol  = findCol(headers, ['company / account', 'company', 'account', 'organization']);
  const stateCol    = findCol(headers, ['state/province', 'state', 'province']);
  const sourceCol   = findCol(headers, ['lead source', 'source']);
  const lastActCol  = findCol(headers, ['last activity', 'last contact']);
  const createCol   = findCol(headers, ['create date', 'created date', 'created', 'date created']);
  const scoreCol    = findCol(headers, ['account engagement score', 'engagement score', 'score']);

  const oc  = ownerCol   !== -1 ? ownerCol   : 1;
  const fc  = firstCol   !== -1 ? firstCol   : 3;
  const lc  = lastCol    !== -1 ? lastCol    : 4;
  const tc  = titleCol   !== -1 ? titleCol   : 5;
  const cc  = companyCol !== -1 ? companyCol : 6;
  const sc  = stateCol   !== -1 ? stateCol   : 7;
  const src = sourceCol  !== -1 ? sourceCol  : 9;
  const lac = lastActCol !== -1 ? lastActCol : 10;
  const crc = createCol  !== -1 ? createCol  : 11;
  const scr = scoreCol   !== -1 ? scoreCol   : 12;

  const records: LeadRecord[] = [];
  let currentOwner = '';

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const ownerCandidate = toStr(row[oc]);
    if (ownerCandidate && looksLikeName(ownerCandidate)) currentOwner = ownerCandidate;

    const first = toStr(row[fc]);
    const last  = toStr(row[lc]);
    if (!first && !last) continue;

    records.push({
      owner: currentOwner || 'Unassigned',
      fullName: `${first} ${last}`.trim(),
      title: toStr(row[tc]),
      company: toStr(row[cc]),
      state: toStr(row[sc]),
      leadSource: toStr(row[src]),
      lastActivity: toDate(row[lac]),
      createDate: toDate(row[crc]),
      engagementScore: toNum(row[scr]),
    });
  }

  return records;
};

// ─── File type detection ───────────────────────────────────────────────────

export type FileKind = 'decline' | 'connections' | 'leads' | 'unknown';

export const detectKind = (filename: string): FileKind => {
  const l = filename.toLowerCase();
  if (l.includes('decline') || l.includes('account')) return 'decline';
  if (l.includes('connect')) return 'connections';
  if (l.includes('lead')) return 'leads';
  return 'unknown';
};
