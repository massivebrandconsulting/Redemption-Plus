export const fmt = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};

export const fmtFull = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`;

export const fmtPctSigned = (n: number): string =>
  `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;

export const fmtDate = (d: Date | null): string => {
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtShort = (d: Date | null): string => {
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const daysSince = (d: Date | null, ref = new Date()): number => {
  if (!d) return 9999;
  return Math.floor((ref.getTime() - d.getTime()) / 86_400_000);
};

export const dormancyColor = (days: number): string => {
  if (days <= 30) return 'text-emerald-400';
  if (days <= 60) return 'text-amber-400';
  if (days <= 90) return 'text-orange-400';
  return 'text-red-500';
};

export const dormancyBadge = (days: number): string => {
  if (days <= 30) return 'bg-emerald-400/10 text-emerald-400';
  if (days <= 60) return 'bg-amber-400/10 text-amber-400';
  if (days <= 90) return 'bg-orange-400/10 text-orange-400';
  return 'bg-red-500/10 text-red-500';
};

export const yoyColor = (pct: number): string => {
  if (pct >= 0) return 'text-emerald-400';
  if (pct >= -0.2) return 'text-amber-400';
  if (pct >= -0.5) return 'text-orange-400';
  return 'text-red-500';
};
