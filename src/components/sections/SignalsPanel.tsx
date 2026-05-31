import { Signal, SignalLevel } from '../../types';
import { AlertOctagon, AlertTriangle, TrendingUp, Eye } from 'lucide-react';

interface Props { signals: Signal[]; }

const LEVEL_CONFIG: Record<SignalLevel, {
  icon: React.ReactNode;
  label: string;
  border: string;
  bg: string;
  badge: string;
  dot: string;
}> = {
  critical: {
    icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
    label: 'Critical',
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
    dot: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    label: 'Warning',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-400',
  },
  opportunity: {
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    label: 'Opportunity',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  watch: {
    icon: <Eye className="w-4 h-4 text-blue-400" />,
    label: 'Watch',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    dot: 'bg-blue-400',
  },
};

const LEVEL_ORDER: SignalLevel[] = ['critical', 'warning', 'opportunity', 'watch'];

export default function SignalsPanel({ signals }: Props) {
  const grouped = LEVEL_ORDER.reduce((acc, level) => {
    acc[level] = signals.filter(s => s.level === level);
    return acc;
  }, {} as Record<SignalLevel, Signal[]>);

  const total = signals.length;
  const criticalCount = grouped.critical.length;

  return (
    <div className="bg-[#0a1929] border border-[#1a3554] rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-400" />
          <h2 className="text-white font-semibold">Signals & Red Flags</h2>
        </div>
        <span className="text-slate-500 text-xs">{total} signals</span>
        {criticalCount > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-red-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {criticalCount} critical — act today
          </span>
        )}
      </div>
      <p className="text-slate-500 text-xs mb-5">Coaching prompts and business intelligence — ranked by urgency.</p>

      <div className="space-y-5">
        {LEVEL_ORDER.map(level => {
          const items = grouped[level];
          if (!items.length) return null;
          const cfg = LEVEL_CONFIG[level];
          return (
            <div key={level}>
              <div className="flex items-center gap-2 mb-3">
                {cfg.icon}
                <span className="text-white text-sm font-semibold">{cfg.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((s, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${cfg.border} ${cfg.bg}`}>
                    <div className="flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{s.title}</span>
                          {s.metric && (
                            <span className={`text-xs px-2 py-0.5 rounded ${cfg.badge} flex-shrink-0`}>
                              {s.metric}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{s.detail}</p>
                        <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-white/5">
                          <span className="text-slate-600 text-xs flex-shrink-0 mt-0.5">→</span>
                          <p className="text-slate-300 text-xs italic leading-relaxed">{s.action}</p>
                        </div>
                        {(s.rep || s.account) && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {s.rep && (
                              <span className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-400">
                                👤 {s.rep}
                              </span>
                            )}
                            {s.account && s.account !== s.title.split(' ')[0] && (
                              <span className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-400">
                                🏢 {s.account}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
