import { Opportunity, Period, PeriodMetrics } from '../types/opportunity';

export const isClosedWon = (stage: string) =>
  /closed[\s-]?won/i.test(stage) || stage.toLowerCase() === 'won';

export const isClosedLost = (stage: string) =>
  /closed[\s-]?lost/i.test(stage) || stage.toLowerCase() === 'lost';

export const isOpen = (stage: string) =>
  !isClosedWon(stage) && !isClosedLost(stage);

const sod = (d: Date): Date => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; };
const eod = (d: Date): Date => { const r = new Date(d); r.setHours(23, 59, 59, 999); return r; };

export const getPeriodRange = (period: Period, ref: Date): { start: Date; end: Date } => {
  const now = eod(ref);
  let start: Date;

  switch (period) {
    case 'WTD': {
      const d = new Date(ref);
      const dow = d.getDay();
      d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
      start = sod(d);
      break;
    }
    case 'MTD':
      start = sod(new Date(ref.getFullYear(), ref.getMonth(), 1));
      break;
    case 'QTD': {
      const q = Math.floor(ref.getMonth() / 3);
      start = sod(new Date(ref.getFullYear(), q * 3, 1));
      break;
    }
    case 'YTD':
      start = sod(new Date(ref.getFullYear(), 0, 1));
      break;
  }

  return { start, end: now };
};

export const getPreviousWeekRange = (ref: Date): { start: Date; end: Date } => {
  const d = new Date(ref);
  const dow = d.getDay();
  const thisMonday = new Date(d);
  thisMonday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);

  return { start: sod(lastMonday), end: eod(lastSunday) };
};

const inRange = (d: Date, start: Date, end: Date) => d >= start && d <= end;

export const calcPeriodMetrics = (
  opps: Opportunity[],
  period: Period,
  ref: Date,
): PeriodMetrics => {
  const { start, end } = getPeriodRange(period, ref);

  const closedWon = opps.filter(o => isClosedWon(o.stage) && inRange(o.closeDate, start, end));
  const newPipeline = opps.filter(o => inRange(o.createdDate, start, end));
  const openInPeriod = opps.filter(o => isOpen(o.stage) && inRange(o.closeDate, start, end));

  return {
    closedWonValue: closedWon.reduce((s, o) => s + o.amount, 0),
    closedWonCount: closedWon.length,
    newPipelineValue: newPipeline.reduce((s, o) => s + o.amount, 0),
    newPipelineCount: newPipeline.length,
    openPipelineValue: openInPeriod.reduce((s, o) => s + o.amount, 0),
    openPipelineCount: openInPeriod.length,
  };
};

const STAGE_ORDER = [
  'prospecting', 'qualification', 'needs analysis', 'value proposition',
  'id. decision makers', 'perception analysis', 'proposal', 'negotiation',
  'commit', 'contract',
];

export const getStageDistribution = (opps: Opportunity[]) => {
  const map = new Map<string, { count: number; value: number }>();
  opps.filter(o => isOpen(o.stage)).forEach(o => {
    const cur = map.get(o.stage) ?? { count: 0, value: 0 };
    map.set(o.stage, { count: cur.count + 1, value: cur.value + o.amount });
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => {
      const ai = STAGE_ORDER.findIndex(s => a.toLowerCase().includes(s));
      const bi = STAGE_ORDER.findIndex(s => b.toLowerCase().includes(s));
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([stage, data]) => ({ stage, ...data }));
};

export const getBigWins = (opps: Opportunity[], ref: Date): Opportunity[] => {
  const { start, end } = getPreviousWeekRange(ref);
  return opps
    .filter(o => isClosedWon(o.stage) && inRange(o.closeDate, start, end))
    .sort((a, b) => b.amount - a.amount);
};

export const getTopOpportunities = (opps: Opportunity[], limit = 10): Opportunity[] =>
  opps
    .filter(o => isOpen(o.stage) && o.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

export const fmt = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
};

export const fmtFull = (n: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const fmtShortDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
