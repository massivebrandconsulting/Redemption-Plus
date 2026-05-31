import { useState, useMemo } from 'react';
import { AppData } from '../types';
import {
  getPulse, getRepSummaries, getCategoryTotals,
  getDormantAccounts, getTopAccounts, getWorstDecline, allReps,
} from '../utils/metrics';
import { generateSignals } from '../utils/signals';
import PulseBar from './sections/PulseBar';
import RepTable from './sections/RepTable';
import CategoryPanel from './sections/CategoryPanel';
import AccountTable from './sections/AccountTable';
import ActivityPanel from './sections/ActivityPanel';
import SignalsPanel from './sections/SignalsPanel';
import { Upload, RefreshCw } from 'lucide-react';

interface Props {
  data: AppData;
  onReset: () => void;
}

export default function CommandCenter({ data, onReset }: Props) {
  const [selectedRep, setSelectedRep] = useState('');
  const ref = new Date();

  const reps = useMemo(() => allReps(data.accounts, data.activity, data.leads), [data]);
  const pulse = useMemo(() => getPulse(data.accounts, data.leads, data.activity, ref), [data]);
  const repSummaries = useMemo(() => getRepSummaries(data.accounts, data.activity, ref), [data]);
  const categoryTotals = useMemo(() => getCategoryTotals(
    selectedRep ? data.accounts.filter(a => a.rep === selectedRep) : data.accounts
  ), [data, selectedRep]);
  const dormant = useMemo(() => getDormantAccounts(data.accounts, ref), [data]);
  const topAccounts = useMemo(() => getTopAccounts(data.accounts), [data]);
  const worstDecline = useMemo(() => getWorstDecline(data.accounts), [data]);
  const signals = useMemo(() => generateSignals(data.accounts, data.activity, data.leads, ref), [data]);

  const today = ref.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#1a3554] bg-[#050d1a]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-bold tracking-tight">Command Center</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{today}</span>
            </div>
            {data.asOf && (
              <span className="hidden lg:block text-xs text-slate-600 truncate max-w-xs">{data.asOf}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Rep filter */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedRep('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !selectedRep ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              {reps.filter(r => !r.toLowerCase().includes('total')).map(rep => (
                <button
                  key={rep}
                  onClick={() => setSelectedRep(selectedRep === rep ? '' : rep)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hidden lg:block ${
                    selectedRep === rep ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {rep.split(' ')[0]}
                </button>
              ))}
              {/* Mobile: dropdown */}
              <select
                value={selectedRep}
                onChange={e => setSelectedRep(e.target.value)}
                className="lg:hidden bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1.5"
              >
                <option value="">All Reps</option>
                {reps.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              New Upload
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <PulseBar pulse={pulse} />

        {/* Rep table */}
        <RepTable
          reps={repSummaries}
          selectedRep={selectedRep}
          onSelectRep={setSelectedRep}
        />

        {/* Category + Account health */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <CategoryPanel totals={categoryTotals} />
          <AccountTable
            accounts={data.accounts}
            dormant={dormant}
            top={topAccounts}
            worst={worstDecline}
            selectedRep={selectedRep}
          />
        </div>

        {/* Activity + Leads */}
        <ActivityPanel
          activity={data.activity}
          leads={data.leads}
          selectedRep={selectedRep}
        />

        {/* Signals */}
        <SignalsPanel signals={signals} />

        <div className="pb-8 text-center text-slate-700 text-xs">
          {data.fileNames.join(' · ')} · Uploaded {data.uploadedAt.toLocaleTimeString()}
        </div>
      </main>
    </div>
  );
}
