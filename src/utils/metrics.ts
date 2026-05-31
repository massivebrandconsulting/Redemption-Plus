import { AccountRecord, ActivityRecord, LeadRecord } from '../types';
import { daysSince } from './format';

export const DORMANT_DAYS = 30;

export interface RepSummary {
  rep: string;
  totalAccounts: number;
  activeAccounts: number;
  dormantAccounts: number;
  salesYTD: number;
  salesLYYTD: number;
  yoyDiff: number;
  yoyPct: number;
  totalConnections: number;
  dominantCat: string;
}

export interface CategoryTotals {
  backwall: { ytd: number; ly: number };
  bin: { ytd: number; ly: number };
  crane: { ytd: number; ly: number };
  plush: { ytd: number; ly: number };
  total: { ytd: number; ly: number };
}

export interface PulseSummary {
  totalYTD: number;
  totalLYYTD: number;
  yoyDiff: number;
  yoyPct: number;
  activeAccounts: number;
  dormantAccounts: number;
  totalAccounts: number;
  dormantPct: number;
  totalLeads: number;
  hotLeads: number;
  totalConnections: number;
  avgOrderValue: number;
}

const isActive = (a: AccountRecord, ref = new Date()) =>
  a.lastPurchase !== null && daysSince(a.lastPurchase, ref) <= DORMANT_DAYS;

export const getRepSummaries = (
  accounts: AccountRecord[],
  activity: ActivityRecord[],
  ref = new Date(),
): RepSummary[] => {
  const repsMap = new Map<string, AccountRecord[]>();
  accounts.forEach(a => {
    if (!repsMap.has(a.rep)) repsMap.set(a.rep, []);
    repsMap.get(a.rep)!.push(a);
  });

  const activityByRep = new Map<string, number>();
  activity.forEach(r => {
    activityByRep.set(r.rep, (activityByRep.get(r.rep) || 0) + r.count);
  });

  return Array.from(repsMap.entries())
    .map(([rep, accts]) => {
      const salesYTD = accts.reduce((s, a) => s + a.salesYTD, 0);
      const salesLYYTD = accts.reduce((s, a) => s + a.salesLYYTD, 0);
      const active = accts.filter(a => isActive(a, ref));
      const yoyDiff = salesYTD - salesLYYTD;

      // Dominant category by YTD
      const cats = { backwall: 0, bin: 0, crane: 0, plush: 0 };
      accts.forEach(a => {
        cats.backwall += a.cat.backwall.ytd;
        cats.bin += a.cat.bin.ytd;
        cats.crane += a.cat.crane.ytd;
        cats.plush += a.cat.plush.ytd;
      });
      const dominantCat = (Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0]);

      return {
        rep,
        totalAccounts: accts.length,
        activeAccounts: active.length,
        dormantAccounts: accts.length - active.length,
        salesYTD,
        salesLYYTD,
        yoyDiff,
        yoyPct: salesLYYTD > 0 ? yoyDiff / salesLYYTD : 0,
        totalConnections: activityByRep.get(rep) || 0,
        dominantCat,
      };
    })
    .sort((a, b) => b.salesYTD - a.salesYTD);
};

export const getCategoryTotals = (accounts: AccountRecord[]): CategoryTotals => {
  const t: CategoryTotals = {
    backwall: { ytd: 0, ly: 0 },
    bin: { ytd: 0, ly: 0 },
    crane: { ytd: 0, ly: 0 },
    plush: { ytd: 0, ly: 0 },
    total: { ytd: 0, ly: 0 },
  };
  accounts.forEach(a => {
    t.backwall.ytd += a.cat.backwall.ytd;
    t.backwall.ly += a.cat.backwall.ly;
    t.bin.ytd += a.cat.bin.ytd;
    t.bin.ly += a.cat.bin.ly;
    t.crane.ytd += a.cat.crane.ytd;
    t.crane.ly += a.cat.crane.ly;
    t.plush.ytd += a.cat.plush.ytd;
    t.plush.ly += a.cat.plush.ly;
  });
  t.total.ytd = t.backwall.ytd + t.bin.ytd + t.crane.ytd + t.plush.ytd;
  t.total.ly = t.backwall.ly + t.bin.ly + t.crane.ly + t.plush.ly;
  return t;
};

export const getPulse = (
  accounts: AccountRecord[],
  leads: LeadRecord[],
  activity: ActivityRecord[],
  ref = new Date(),
): PulseSummary => {
  const totalYTD = accounts.reduce((s, a) => s + a.salesYTD, 0);
  const totalLYYTD = accounts.reduce((s, a) => s + a.salesLYYTD, 0);
  const active = accounts.filter(a => isActive(a, ref));
  const dormant = accounts.filter(a => !isActive(a, ref));
  const hotLeads = leads.filter(l => l.engagementScore >= 1000);
  const totalConnections = activity.reduce((s, r) => s + r.count, 0);

  return {
    totalYTD,
    totalLYYTD,
    yoyDiff: totalYTD - totalLYYTD,
    yoyPct: totalLYYTD > 0 ? (totalYTD - totalLYYTD) / totalLYYTD : 0,
    activeAccounts: active.length,
    dormantAccounts: dormant.length,
    totalAccounts: accounts.length,
    dormantPct: accounts.length > 0 ? dormant.length / accounts.length : 0,
    totalLeads: leads.length,
    hotLeads: hotLeads.length,
    totalConnections,
    avgOrderValue: active.length > 0 ? totalYTD / active.length : 0,
  };
};

export const getDormantAccounts = (accounts: AccountRecord[], ref = new Date()) =>
  accounts
    .filter(a => !isActive(a, ref))
    .sort((a, b) => b.salesLYYTD - a.salesLYYTD);

export const getTopAccounts = (accounts: AccountRecord[]) =>
  [...accounts].sort((a, b) => b.salesYTD - a.salesYTD).slice(0, 30);

export const getWorstDecline = (accounts: AccountRecord[]) =>
  [...accounts].sort((a, b) => a.yoyDiff - b.yoyDiff).slice(0, 30);

export const getActivityByType = (activity: ActivityRecord[]) => {
  const map = new Map<string, number>();
  activity.forEach(r => map.set(r.type, (map.get(r.type) || 0) + r.count));
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
};

export const getLeadsBySource = (leads: LeadRecord[]) => {
  const map = new Map<string, number>();
  leads.forEach(l => {
    const src = l.leadSource || 'Unknown';
    map.set(src, (map.get(src) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count }));
};

export const filterByRep = <T extends { rep?: string; owner?: string }>(
  items: T[],
  rep: string,
): T[] => {
  if (!rep) return items;
  return items.filter(i => (i.rep || i.owner || '') === rep);
};

export const allReps = (
  accounts: AccountRecord[],
  activity: ActivityRecord[],
  leads: LeadRecord[],
): string[] => {
  const s = new Set<string>();
  accounts.forEach(a => { if (a.rep) s.add(a.rep); });
  activity.forEach(r => { if (r.rep) s.add(r.rep); });
  leads.forEach(l => { if (l.owner) s.add(l.owner); });
  return Array.from(s).sort();
};
