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
    // Excel serial date
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    // M/D/YYYY
    const slash = s.split('/');
    if (slash.length === 3) {
      const d = new Date(+slash[2], +slash[0] - 1, +slash[1]);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const readWorkbook = (file: File): Promise<XLSX.WorkBook> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target?.result as string, {
          type: 'binary',
          cellDates: false,
        });
        resolve(wb);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });

const findDataStart = (rows: Row[], minCells = 5, maxScan = 30): number => {
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const count = rows[i].filter(v => v != null && v !== '').length;
    if (count >= minCells) return i;
  }
  return 0;
};

// --- Decline / Account List ---
export const parseDeclineFile = async (file: File): Promise<{ records: AccountRecord[]; asOf: string }> => {
  const wb = await readWorkbook(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null });

  // Grab "as of" text from the metadata rows
  let asOf = '';
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const text = rows[i].map(toStr).join(' ');
    if (text.toLowerCase().includes('as of')) { asOf = text.trim(); break; }
  }

  const headerIdx = findDataStart(rows, 5);
  const records: AccountRecord[] = [];
  let currentRep = '';

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const nonEmpty = row.filter(v => v != null && v !== '').length;
    if (nonEmpty < 3) continue;

    const repCell = toStr(row[1]);
    if (repCell && !repCell.toLowerCase().includes('total') && !repCell.toLowerCase().includes('subtotal')) {
      currentRep = repCell;
    }

    const accountName = toStr(row[3]);
    if (!accountName || accountName.toLowerCase().includes('account name') ||
        accountName.toLowerCase().includes('total') || accountName.toLowerCase().includes('grand total')) {
      continue;
    }

    const salesYTD = toNum(row[5]);
    const yoyDiff = toNum(row[6]);

    records.push({
      rep: currentRep,
      accountName,
      lastPurchase: toDate(row[4]),
      salesYTD,
      salesLYYTD: salesYTD - yoyDiff,
      yoyDiff,
      ytdChangePct: toNum(row[7]),
      cat: {
        backwall: { ytd: toNum(row[8]), ly: toNum(row[9]) },
        bin: { ytd: toNum(row[10]), ly: toNum(row[11]) },
        crane: { ytd: toNum(row[12]), ly: toNum(row[13]) },
        plush: { ytd: toNum(row[14]), ly: toNum(row[15]) },
      },
    });
  }

  return { records, asOf };
};

// --- Connections / Activity Pivot ---
export const parseConnectionsFile = async (file: File): Promise<ActivityRecord[]> => {
  const wb = await readWorkbook(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null });

  // Find the date header row — it contains month names
  let dateHeaderIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const hasMonth = rows[i].some(v =>
      /february|march|april|may|june|july/i.test(toStr(v))
    );
    if (hasMonth) { dateHeaderIdx = i; break; }
  }
  if (dateHeaderIdx === -1) return [];

  // Build col → month name map
  const monthCols: { col: number; month: string }[] = [];
  rows[dateHeaderIdx].forEach((v, c) => {
    const s = toStr(v);
    if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i.test(s)) {
      monthCols.push({ col: c, month: s });
    }
  });

  const records: ActivityRecord[] = [];
  let currentRep = '';

  // Data starts 2 rows after date header (skip "Assigned / Type / Sum of Connects" row)
  for (let i = dateHeaderIdx + 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const repCell = toStr(row[1]);
    if (repCell && !repCell.toLowerCase().includes('subtotal') && !repCell.toLowerCase().includes('total')) {
      currentRep = repCell;
    }

    const type = toStr(row[2]);
    if (!type || type.toLowerCase().includes('type') || !currentRep) continue;

    monthCols.forEach(({ col, month }) => {
      const count = toNum(row[col]);
      if (count > 0) records.push({ rep: currentRep, type, month, count });
    });
  }

  return records;
};

// --- Leads ---
export const parseLeadsFile = async (file: File): Promise<LeadRecord[]> => {
  const wb = await readWorkbook(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null });

  const headerIdx = findDataStart(rows, 5);
  const records: LeadRecord[] = [];
  let currentOwner = '';

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const ownerCell = toStr(row[1]);
    if (ownerCell && !ownerCell.includes('↑') &&
        !ownerCell.toLowerCase().includes('subtotal') &&
        !ownerCell.toLowerCase().includes('total')) {
      currentOwner = ownerCell;
    }

    const first = toStr(row[3]);
    const last = toStr(row[4]);
    if (!first && !last) continue;

    records.push({
      owner: currentOwner,
      fullName: `${first} ${last}`.trim(),
      title: toStr(row[5]),
      company: toStr(row[6]),
      state: toStr(row[7]),
      leadSource: toStr(row[9]),
      lastActivity: toDate(row[10]),
      createDate: toDate(row[11]),
      engagementScore: toNum(row[12]),
    });
  }

  return records;
};

export type FileKind = 'decline' | 'connections' | 'leads' | 'unknown';

export const detectKind = (filename: string): FileKind => {
  const l = filename.toLowerCase();
  if (l.includes('decline') || l.includes('account')) return 'decline';
  if (l.includes('connect')) return 'connections';
  if (l.includes('lead')) return 'leads';
  return 'unknown';
};
