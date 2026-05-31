import { PulseSummary } from '../../utils/metrics';
import { fmt, fmtPct, fmtPctSigned, yoyColor } from '../../utils/format';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Inbox, Zap, Activity } from 'lucide-react';

interface Props { pulse: PulseSummary; }

interface CardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

function Card({ label, value, sub, icon, iconBg, valueColor = 'text-white' }: CardProps) {
  return (
    <div className="bg-[#0a1929] border border-[#1a3554] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      <div className="text-slate-500 text-xs">{sub}</div>
    </div>
  );
}

export default function PulseBar({ pulse }: Props) {
  const isUp = pulse.yoyDiff >= 0;
  const hasTimeSeries = pulse.wtd > 0 || pulse.mtd > 0;
  const colClass = hasTimeSeries
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-9'
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-7';
  return (
    <div className={`grid ${colClass} gap-3`}>
      {hasTimeSeries && (
        <Card
          label="WTD Sales"
          value={fmt(pulse.wtd)}
          sub="week-to-date"
          icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
          iconBg="bg-emerald-400/10"
          valueColor="text-emerald-400"
        />
      )}
      {hasTimeSeries && (
        <Card
          label="MTD Sales"
          value={fmt(pulse.mtd)}
          sub="month-to-date"
          icon={<Activity className="w-3.5 h-3.5 text-blue-400" />}
          iconBg="bg-blue-400/10"
          valueColor="text-blue-400"
        />
      )}
      <Card
        label="Sales YTD"
        value={fmt(pulse.totalYTD)}
        sub={pulse.totalLYYTD > 0 ? `vs ${fmt(pulse.totalLYYTD)} last year` : 'year-to-date'}
        icon={isUp ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
        iconBg={isUp ? 'bg-emerald-400/10' : 'bg-red-400/10'}
      />
      <Card
        label="YOY Change"
        value={pulse.totalLYYTD > 0 ? fmtPctSigned(pulse.yoyPct) : '—'}
        sub={pulse.totalLYYTD > 0 ? `${fmt(Math.abs(pulse.yoyDiff))} ${isUp ? 'ahead' : 'behind'} LY` : 'no prior-year data'}
        icon={<Activity className="w-3.5 h-3.5 text-blue-400" />}
        iconBg="bg-blue-400/10"
        valueColor={pulse.totalLYYTD > 0 ? yoyColor(pulse.yoyPct) : 'text-slate-400'}
      />
      <Card
        label="Active Accounts"
        value={pulse.activeAccounts.toString()}
        sub="ordered in last 30 days"
        icon={<Users className="w-3.5 h-3.5 text-emerald-400" />}
        iconBg="bg-emerald-400/10"
        valueColor="text-emerald-400"
      />
      <Card
        label="Dormant Accounts"
        value={pulse.dormantAccounts.toString()}
        sub={`${fmtPct(pulse.dormantPct)} of account base`}
        icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
        iconBg="bg-red-400/10"
        valueColor="text-red-400"
      />
      <Card
        label="Avg Rev / Active Acct"
        value={fmt(pulse.avgOrderValue)}
        sub="YTD per active account"
        icon={<TrendingUp className="w-3.5 h-3.5 text-violet-400" />}
        iconBg="bg-violet-400/10"
      />
      <Card
        label="Open Leads"
        value={pulse.totalLeads.toString()}
        sub={`${pulse.hotLeads} hot (score 1000+)`}
        icon={<Inbox className="w-3.5 h-3.5 text-amber-400" />}
        iconBg="bg-amber-400/10"
        valueColor="text-amber-400"
      />
      <Card
        label="Total Connections"
        value={pulse.totalConnections.toLocaleString()}
        sub="all reps, all time in data"
        icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}
        iconBg="bg-cyan-400/10"
      />
    </div>
  );
}
