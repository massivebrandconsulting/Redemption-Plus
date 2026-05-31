import { AccountRecord, ActivityRecord, LeadRecord, Signal } from '../types';
import { daysSince } from './format';
import { DORMANT_DAYS } from './metrics';

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const generateSignals = (
  accounts: AccountRecord[],
  activity: ActivityRecord[],
  leads: LeadRecord[],
  ref = new Date(),
): Signal[] => {
  const signals: Signal[] = [];

  // --- CRITICAL ---

  // Fully dormant high-value accounts (went to $0 YTD after buying last year)
  const goingDark = accounts
    .filter(a => a.salesYTD === 0 && a.salesLYYTD >= 20_000)
    .sort((a, b) => b.salesLYYTD - a.salesLYYTD)
    .slice(0, 5);
  goingDark.forEach(a => {
    signals.push({
      level: 'critical',
      title: `${a.accountName} has gone completely dark`,
      detail: `Zero YTD sales. Did ${fmt(a.salesLYYTD)} last year. Last order: ${
        a.lastPurchase ? a.lastPurchase.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'unknown'
      }.`,
      rep: a.rep,
      account: a.accountName,
      metric: `${fmt(a.salesLYYTD)} at risk`,
      action: `${a.rep} — call immediately. Determine if this account is lost or just paused. Offer a quarterly reset plan.`,
    });
  });

  // Long-dormant high-value accounts
  const longDormant = accounts
    .filter(a => daysSince(a.lastPurchase, ref) >= 90 && a.salesLYYTD >= 30_000 && a.salesYTD > 0)
    .sort((a, b) => b.salesLYYTD - a.salesLYYTD)
    .slice(0, 3);
  longDormant.forEach(a => {
    signals.push({
      level: 'critical',
      title: `${a.accountName} — ${daysSince(a.lastPurchase, ref)} days since last order`,
      detail: `Did ${fmt(a.salesLYYTD)} last year. Only ${fmt(a.salesYTD)} YTD this year.`,
      rep: a.rep,
      account: a.accountName,
      metric: `${daysSince(a.lastPurchase, ref)} days dormant`,
      action: `${a.rep} — prioritize reactivation call this week. Bring a catalog and new arrivals list.`,
    });
  });

  // --- WARNINGS ---

  // Reps where >60% of accounts are dormant
  const repMap = new Map<string, AccountRecord[]>();
  accounts.forEach(a => { if (!repMap.has(a.rep)) repMap.set(a.rep, []); repMap.get(a.rep)!.push(a); });

  repMap.forEach((accts, rep) => {
    const dormant = accts.filter(a => daysSince(a.lastPurchase, ref) > DORMANT_DAYS).length;
    const pct = dormant / accts.length;
    if (pct >= 0.65 && accts.length >= 10) {
      signals.push({
        level: 'warning',
        title: `${rep} has ${Math.round(pct * 100)}% dormant accounts`,
        detail: `${dormant} of ${accts.length} accounts haven't ordered in 30+ days.`,
        rep,
        metric: `${Math.round(pct * 100)}% dormant`,
        action: `Review ${rep}'s territory plan. Are they making enough proactive calls? Run a dormant account blitz.`,
      });
    }
  });

  // Accounts with >50% YOY decline and >$15K LY value
  const steepDecline = accounts
    .filter(a => a.ytdChangePct <= -0.5 && a.salesLYYTD >= 15_000 && a.salesYTD > 0)
    .sort((a, b) => a.yoyDiff - b.yoyDiff)
    .slice(0, 5);
  steepDecline.forEach(a => {
    signals.push({
      level: 'warning',
      title: `${a.accountName} down ${Math.round(a.ytdChangePct * 100)}% YOY`,
      detail: `${fmt(a.salesLYYTD)} last year → ${fmt(a.salesYTD)} this year. Gap: ${fmt(Math.abs(a.yoyDiff))}.`,
      rep: a.rep,
      account: a.accountName,
      metric: `${fmt(a.yoyDiff)} YOY`,
      action: `${a.rep} — understand what changed. Competition? Budget cuts? Product issue? Build a recovery plan with specific commitments.`,
    });
  });

  // The Smile Team low activity
  const smileTeam = activity.filter(r => r.rep === 'The Smile Team');
  const smileTotal = smileTeam.reduce((s, r) => s + r.count, 0);
  if (smileTotal < 20) {
    signals.push({
      level: 'warning',
      title: `"The Smile Team" has only ${smileTotal} logged connections`,
      detail: `Nearly zero outreach activity on record. Their accounts have some of the largest YOY declines.`,
      rep: 'The Smile Team',
      metric: `${smileTotal} total connections`,
      action: `Investigate whether this is a data entry issue or a genuine activity gap. If the latter, coach immediately.`,
    });
  }

  // Reps with no connections logged in most recent month
  const months = [...new Set(activity.map(r => r.month))].sort();
  const latestMonth = months[months.length - 1];
  if (latestMonth) {
    const activeInLatest = new Set(
      activity.filter(r => r.month === latestMonth && r.count > 0).map(r => r.rep)
    );
    repMap.forEach((_, rep) => {
      if (!activeInLatest.has(rep) && rep !== 'The Smile Team') {
        signals.push({
          level: 'warning',
          title: `${rep} logged zero connections in ${latestMonth}`,
          detail: `No calls, emails, or site visits recorded in the most recent period.`,
          rep,
          metric: '0 connections',
          action: `Confirm data is being logged. If accurate, address cadence expectations in next 1:1.`,
        });
      }
    });
  }

  // --- OPPORTUNITIES ---

  // Hot leads (high engagement score) with no recent activity
  const hotStale = leads
    .filter(l => l.engagementScore >= 2000 && daysSince(l.lastActivity, ref) >= 14)
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 5);
  hotStale.forEach(l => {
    signals.push({
      level: 'opportunity',
      title: `${l.company} is highly engaged — follow up now`,
      detail: `Score: ${l.engagementScore}. Source: ${l.leadSource}. Last contact: ${
        l.lastActivity ? `${daysSince(l.lastActivity, ref)} days ago` : 'never'
      }.`,
      rep: l.owner,
      account: l.company,
      metric: `Score ${l.engagementScore}`,
      action: `${l.owner} — this prospect is warm. Schedule a personalized outreach or demo this week.`,
    });
  });

  // Category growth opportunity: any category where YTD > LY
  const catTotals = { backwall: { ytd: 0, ly: 0 }, bin: { ytd: 0, ly: 0 }, crane: { ytd: 0, ly: 0 }, plush: { ytd: 0, ly: 0 } };
  accounts.forEach(a => {
    catTotals.backwall.ytd += a.cat.backwall.ytd; catTotals.backwall.ly += a.cat.backwall.ly;
    catTotals.bin.ytd += a.cat.bin.ytd; catTotals.bin.ly += a.cat.bin.ly;
    catTotals.crane.ytd += a.cat.crane.ytd; catTotals.crane.ly += a.cat.crane.ly;
    catTotals.plush.ytd += a.cat.plush.ytd; catTotals.plush.ly += a.cat.plush.ly;
  });
  Object.entries(catTotals).forEach(([cat, { ytd, ly }]) => {
    if (ytd > ly && ly > 0) {
      signals.push({
        level: 'opportunity',
        title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} is up YOY — double down`,
        detail: `${fmt(ytd)} YTD vs ${fmt(ly)} same period last year. Up ${fmt(ytd - ly)}.`,
        metric: `+${fmt(ytd - ly)} YOY`,
        action: `Feature ${cat} in upcoming outreach. Which reps are driving the growth? Share best practices.`,
      });
    }
  });

  // --- WATCH ---

  // Accounts 30-50% YOY decline with >$10K LY
  const moderateDecline = accounts
    .filter(a => a.ytdChangePct > -0.5 && a.ytdChangePct <= -0.3 && a.salesLYYTD >= 10_000)
    .sort((a, b) => a.yoyDiff - b.yoyDiff)
    .slice(0, 4);
  moderateDecline.forEach(a => {
    signals.push({
      level: 'watch',
      title: `${a.accountName} trending down ${Math.round(Math.abs(a.ytdChangePct) * 100)}%`,
      detail: `${fmt(a.salesLYYTD)} last year → ${fmt(a.salesYTD)} YTD. Gap: ${fmt(Math.abs(a.yoyDiff))}.`,
      rep: a.rep,
      account: a.accountName,
      metric: `${fmt(a.yoyDiff)} YOY`,
      action: `${a.rep} — include in next check-in. Ask about product mix and order frequency.`,
    });
  });

  // Leads created 90+ days ago with no activity
  const staleLong = leads
    .filter(l => l.createDate && daysSince(l.createDate, ref) >= 90 && !l.lastActivity && l.engagementScore > 0)
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 3);
  if (staleLong.length > 0) {
    signals.push({
      level: 'watch',
      title: `${staleLong.length} leads are 90+ days old with no contact logged`,
      detail: `Avg engagement score: ${Math.round(staleLong.reduce((s, l) => s + l.engagementScore, 0) / staleLong.length)}. From: ${[...new Set(staleLong.map(l => l.leadSource))].slice(0, 2).join(', ')}.`,
      metric: `${staleLong.length} stale leads`,
      action: `Assign a reactivation campaign or archive. Dead leads pollute the funnel — make a decision.`,
    });
  }

  return signals;
};
