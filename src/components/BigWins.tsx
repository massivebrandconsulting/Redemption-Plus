import { Opportunity } from '../types/opportunity';
import { fmtFull, fmtShortDate, getPreviousWeekRange } from '../utils/metrics';
import { Star } from 'lucide-react';

interface Props {
  wins: Opportunity[];
  referenceDate: Date;
}

export default function BigWins({ wins, referenceDate }: Props) {
  const { start, end } = getPreviousWeekRange(referenceDate);

  const weekLabel = `${fmtShortDate(start)} – ${fmtShortDate(end)}`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <h2 className="text-white font-semibold">Big Wins</h2>
      </div>
      <p className="text-slate-500 text-xs mb-4">Previous week: {weekLabel}</p>

      {wins.length === 0 ? (
        <div className="text-slate-600 text-sm py-8 text-center border border-slate-800 rounded-xl">
          No closed-won deals last week
        </div>
      ) : (
        <div className="space-y-3">
          {wins.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 font-bold text-xs">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">{w.name}</div>
                <div className="text-slate-500 text-xs truncate">{w.accountName}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-emerald-400 font-bold text-sm">{fmtFull(w.amount)}</div>
                <div className="text-slate-500 text-xs">{fmtShortDate(w.closeDate)}</div>
              </div>
            </div>
          ))}

          <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
            <div className="text-emerald-400 font-bold text-lg">
              {fmtFull(wins.reduce((s, w) => s + w.amount, 0))}
            </div>
            <div className="text-slate-500 text-xs mt-0.5">Total closed last week</div>
          </div>
        </div>
      )}
    </div>
  );
}
