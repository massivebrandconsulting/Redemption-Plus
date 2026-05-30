import Papa from 'papaparse';
import { Opportunity } from '../types/opportunity';

const findField = (row: Record<string, string>, names: string[]): string | undefined => {
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
    const key = Object.keys(row).find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (key !== undefined) return row[key];
  }
  return undefined;
};

const parseAmount = (val?: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace(/[$,\s]/g, '')) || 0;
};

const parseDate = (val?: string): Date | null => {
  if (!val?.trim()) return null;
  const slash = val.split('/');
  if (slash.length === 3) {
    const [m, d, y] = slash;
    const date = new Date(+y, +m - 1, +d);
    return isNaN(date.getTime()) ? null : date;
  }
  // ISO or other formats
  const iso = new Date(val.split('T')[0]);
  return isNaN(iso.getTime()) ? null : iso;
};

const parsePct = (val?: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace('%', '')) || 0;
};

export interface ParseResult {
  opportunities: Opportunity[];
  errors: string[];
  totalRows: number;
}

export const parseCSV = (text: string): ParseResult => {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  });

  const errors: string[] = [];
  const opportunities: Opportunity[] = [];

  result.data.forEach((row, i) => {
    const name = findField(row, [
      'Opportunity Name', 'Name', 'Opp Name', 'OPPORTUNITY_NAME', 'opportunity_name',
    ]);
    const accountName = findField(row, [
      'Account Name', 'Account', 'ACCOUNT_NAME', 'Company', 'account_name',
    ]);
    const stage = findField(row, [
      'Stage', 'Opportunity Stage', 'STAGE_NAME', 'Sales Stage', 'Pipeline Stage', 'stage',
    ]);
    const amountStr = findField(row, [
      'Amount', 'AMOUNT', 'Deal Value', 'Value', 'Revenue', 'amount',
    ]);
    const closeDateStr = findField(row, [
      'Close Date', 'CLOSE_DATE', 'Expected Close Date', 'Exp Close Date', 'Closing Date', 'close_date',
    ]);
    const createdDateStr = findField(row, [
      'Created Date', 'CREATED_DATE', 'Date Created', 'Create Date', 'created_date',
    ]);
    const lastModifiedStr = findField(row, [
      'Last Modified Date', 'LAST_MODIFIED_DATE', 'Last Activity Date',
      'Last Modified', 'Modified Date', 'Last Updated', 'last_modified_date',
    ]);
    const owner = findField(row, [
      'Owner', 'Opportunity Owner', 'OWNER_NAME', 'Rep', 'Sales Rep', 'Account Owner', 'owner',
    ]);
    const probabilityStr = findField(row, [
      'Probability (%)', 'Probability', 'WIN_LIKELIHOOD', 'Win %', 'Prob (%)',
      'Win Likelihood (%)', 'probability',
    ]);
    const type = findField(row, [
      'Type', 'Opportunity Type', 'TYPE', 'Deal Type', 'type',
    ]);

    if (!name) { errors.push(`Row ${i + 2}: missing Opportunity Name`); return; }
    if (!stage) { errors.push(`Row ${i + 2} (${name}): missing Stage`); return; }

    const closeDate = parseDate(closeDateStr);
    const createdDate = parseDate(createdDateStr);

    if (!closeDate) {
      errors.push(`Row ${i + 2} (${name}): invalid or missing Close Date`);
      return;
    }
    if (!createdDate) {
      errors.push(`Row ${i + 2} (${name}): invalid or missing Created Date`);
      return;
    }

    opportunities.push({
      name: name.trim(),
      accountName: (accountName || 'Unknown').trim(),
      stage: stage.trim(),
      amount: parseAmount(amountStr),
      closeDate,
      createdDate,
      lastModifiedDate: parseDate(lastModifiedStr),
      owner: (owner || 'Unknown').trim(),
      probability: parsePct(probabilityStr),
      type: (type || 'Unknown').trim(),
    });
  });

  return { opportunities, errors, totalRows: result.data.length };
};
