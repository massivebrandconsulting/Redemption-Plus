import { useState } from 'react';
import { Opportunity, Period } from '../types/opportunity';
import {
  calcPeriodMetrics, getStageDistribution,
  getBigWins, getTopOpportunities, fmt,
} from '../utils/metrics';
import PeriodSummary from './PeriodSummary';
import PipelineStageChart from './PipelineStageChart';
import TopOpportunities from './TopOpportunities';
import BigWins from './BigWins';
import { Upload, FileText } from 'lucide-react';

interface Props {
  opportunities: Opportunity[];
  filename: string;
  onReset: () => void;
  referenceDate: Date;
}

export default function Dashboard({ opportunities, filename, onReset, referenceDate }: Props) {
  const [period, setPeriod] = useState<Period>('MTD');

  const metrics = calcPeriodMetrics(opportunities, period, referenceDate);
  const stageData = getStageDistribution(opportunities);
  const bigWins = getBigWins(opportunities, referenceDate);
  const topOpps = getTopOpportunities(opportunities, 10);

  const totalOpenPipeline = opportunities
    .filter(o => !o.stage.toLowerCase().includes('closed'))
    .reduce((s, o) => s + o.amount, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold">Pipeline Dashboard</span>
            <span className="text-slate-600 text-sm hidden sm:block">·</span>
            <span className="text-slate-500 text-sm hidden sm:block truncate max-w-xs">{filename}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
              <span><span className="text-white font-medium">{opportunities.length}</span> opportunities</span>
              <span><span className="text-white font-medium">{fmt(totalOpenPipeline)}</span> open pipeline</span>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              New upload
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Period metrics */}
        <PeriodSummary
          activePeriod={period}
          onPeriodChange={setPeriod}
          metrics={metrics}
        />

        {/* Pipeline movement + Big Wins */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-1">Pipeline by Stage</h2>
            <p className="text-slate-500 text-xs mb-5">Open pipeline value across all active stages</p>
            <PipelineStageChart data={stageData} />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <BigWins wins={bigWins} referenceDate={referenceDate} />
          </div>
        </div>

        {/* Top opportunities */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <TopOpportunities opportunities={topOpps} />
        </div>
      </main>
    </div>
  );
}
