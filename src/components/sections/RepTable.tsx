import { RepSummary } from '../../utils/metrics';
import { fmt, fmtPctSigned, yoyColor } from '../../utils/format';
import { Users } from 'lucide-react';

interface Props {
  reps: RepSummary[];
  selectedRep: string;
  onSelectRep: (rep: string) => void;
}

const CAT_COLORS: Record<string, string> = {
  backwall: 'bg-blue-500/20 text-blue-400',
  bin: 'bg-violet-500/20 text-violet-400',
  crane: 'bg-amber-500/20 text-amber-400',
  plush: 'bg-pink-500/20 text-pink-400',
};

export default function RepTable({ reps, selectedRep, onSelectRep }: Props) {
  const totalYTD = reps.reduce((s, r) => s + r.salesYTD, 0);

  return (
    <div className="bg-[#0a1929] border border-[#1a3554] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-blue-400" />
        <h2 className="text-white font-semibold">Rep Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {['Rep', 'YTD Sales', '% of Co.', 'YOY', 'Active', 'Dormant', 'Connections', 'Top Cat'].map(h => (
                <th key={h} className="text-left text-slate-500 font-medium py-2 px-2 first:pl-0 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reps.map(r => (
              <tr
                key={r.rep}
                onClick={() => onSelectRep(selectedRep === r.rep ? '' : r.rep)}
                className={`border-b border-slate-800/50 cursor-pointer transition-colors ${
                  selectedRep === r.rep ? 'bg-blue-600/10' : 'hover:bg-slate-800/30'
                }`}
              >
                <td className="py-3 px-2 pl-0">
                  <div className="flex items-center gap-2">
                    {selectedRep === r.rep && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-white font-medium">{r.rep}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-white font-semibold tabular-nums">{fmt(r.salesYTD)}</td>
                <td className="py-3 px-2 text-slate-400 tabular-nums">
                  {totalYTD > 0 ? `${((r.salesYTD / totalYTD) * 100).toFixed(1)}%` : '—'}
                </td>
                <td className={`py-3 px-2 font-medium tabular-nums ${yoyColor(r.yoyPct)}`}>
                  {fmtPctSigned(r.yoyPct)}
                </td>
                <td className="py-3 px-2 text-emerald-400 tabular-nums">{r.activeAccounts}</td>
                <td className="py-3 px-2 tabular-nums">
                  <span className={r.dormantAccounts > r.activeAccounts ? 'text-red-400' : 'text-amber-400'}>
                    {r.dormantAccounts}
                  </span>
                </td>
                <td className="py-3 px-2 text-slate-300 tabular-nums">{r.totalConnections.toLocaleString()}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${CAT_COLORS[r.dominantCat] || 'text-slate-400 bg-slate-700'}`}>
                    {r.dominantCat}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRep && (
        <button
          onClick={() => onSelectRep('')}
          className="mt-3 text-xs text-slate-500 hover:text-slate-400 underline"
        >
          Clear filter — show all reps
        </button>
      )}
    </div>
  );
}
