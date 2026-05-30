import { Period, PeriodMetrics } from '../types/opportunity';
import { fmt } from '../utils/metrics';
import { TrendingUp, DollarSign, Target, BarChart2 } from 'lucide-react';

interface Props {
  activePeriod: Period;
  onPeriodChange: (p: Period) => void;
  metrics: PeriodMetrics;
}

const PERIODS: Period[] = ['WTD', 'MTD', 'QTD', 'YTD'];

const PERIOD_LABELS: Record<Period, string> = {
  WTD: 'Week to Date',
  MTD: 'Month to Date',
  QTD: 'Quarter to Date',
  YTD: 'Year to Date',
};

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}

function MetricCard({ icon, label, value, sub, color }: CardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-slate-500 text-xs mt-1">{sub}</div>
      </div>
    </div>
  );
}

export default function PeriodSummary({ activePeriod, onPeriodChange, metrics }: Props) {
  const {
    closedWonValue, closedWonCount,
    newPipelineValue, newPipelineCount,
    openPipelineValue, openPipelineCount,
  } = metrics;

  return (
    <div>
      {/* Period tabs */}
      <div className="flex items-center gap-1 mb-6">
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activePeriod === p
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
        <span className="ml-3 text-slate-600 text-sm">{PERIOD_LABELS[activePeriod]}</span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
          label="Closed Won"
          value={fmt(closedWonValue)}
          sub={`${closedWonCount} deal${closedWonCount !== 1 ? 's' : ''} closed`}
          color="bg-emerald-500/10"
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
          label="New Pipeline Created"
          value={fmt(newPipelineValue)}
          sub={`${newPipelineCount} new opportunit${newPipelineCount !== 1 ? 'ies' : 'y'}`}
          color="bg-blue-500/10"
        />
        <MetricCard
          icon={<Target className="w-4 h-4 text-violet-400" />}
          label="Open Pipeline Due"
          value={fmt(openPipelineValue)}
          sub={`${openPipelineCount} deals expected to close`}
          color="bg-violet-500/10"
        />
        <MetricCard
          icon={<BarChart2 className="w-4 h-4 text-amber-400" />}
          label="Avg Deal Size"
          value={newPipelineCount > 0 ? fmt(newPipelineValue / newPipelineCount) : '—'}
          sub="of new pipeline created"
          color="bg-amber-500/10"
        />
      </div>
    </div>
  );
}
