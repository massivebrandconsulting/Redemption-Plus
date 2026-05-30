import { Opportunity } from '../types/opportunity';
import { fmt, fmtShortDate } from '../utils/metrics';
import { Trophy } from 'lucide-react';

interface Props {
  opportunities: Opportunity[];
}

const STAGE_COLOR: Record<string, string> = {
  'negotiation': 'text-emerald-400 bg-emerald-400/10',
  'proposal': 'text-blue-400 bg-blue-400/10',
  'value proposition': 'text-violet-400 bg-violet-400/10',
  'needs analysis': 'text-amber-400 bg-amber-400/10',
  'qualification': 'text-orange-400 bg-orange-400/10',
  'prospecting': 'text-slate-400 bg-slate-400/10',
};

const stageColor = (stage: string): string => {
  const lower = stage.toLowerCase();
  for (const [key, cls] of Object.entries(STAGE_COLOR)) {
    if (lower.includes(key)) return cls;
  }
  return 'text-slate-400 bg-slate-400/10';
};

export default function TopOpportunities({ opportunities }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h2 className="text-white font-semibold">Top Open Opportunities</h2>
        <span className="ml-auto text-slate-500 text-sm">{opportunities.length} deals</span>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-slate-600 text-sm py-8 text-center">No open opportunities found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['#', 'Opportunity', 'Account', 'Stage', 'Amount', 'Close Date', 'Owner'].map(h => (
                  <th key={h} className="text-left text-slate-500 font-medium py-2 px-3 first:pl-0 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-3 pl-0 text-slate-600 font-mono text-xs w-6">
                    {i + 1}
                  </td>
                  <td className="py-3 px-3 text-white font-medium max-w-[200px]">
                    <div className="truncate" title={opp.name}>{opp.name}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-400 max-w-[140px]">
                    <div className="truncate" title={opp.accountName}>{opp.accountName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${stageColor(opp.stage)}`}>
                      {opp.stage}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-white tabular-nums">
                    {fmt(opp.amount)}
                  </td>
                  <td className="py-3 px-3 text-slate-400 tabular-nums whitespace-nowrap">
                    {fmtShortDate(opp.closeDate)}
                  </td>
                  <td className="py-3 px-3 pr-0 text-slate-400 max-w-[120px]">
                    <div className="truncate" title={opp.owner}>{opp.owner}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
