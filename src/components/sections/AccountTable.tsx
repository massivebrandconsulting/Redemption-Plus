import { useState } from 'react';
import { AccountRecord } from '../../types';
import { fmt, fmtFull, fmtDate, fmtPctSigned, daysSince, dormancyBadge, yoyColor } from '../../utils/format';
import { Building2 } from 'lucide-react';

interface Props {
  accounts: AccountRecord[];
  dormant: AccountRecord[];
  top: AccountRecord[];
  worst: AccountRecord[];
  selectedRep: string;
}

type Tab = 'dormant' | 'declining' | 'top';

export default function AccountTable({ accounts, dormant, top, worst, selectedRep }: Props) {
  const [tab, setTab] = useState<Tab>('dormant');

  const activeCount = accounts.filter(a => daysSince(a.lastPurchase) <= 30).length;
  const repeatPct   = accounts.length > 0 ? activeCount / accounts.length : 0;

  const tabs = [
    { id: 'dormant'   as Tab, label: 'Dormant',       count: dormant.length,  color: 'text-red-400' },
    { id: 'declining' as Tab, label: 'Worst Decline', count: worst.length,    color: 'text-orange-400' },
    { id: 'top'       as Tab, label: 'Top Accounts',  count: top.length,      color: 'text-emerald-400' },
  ];

  return (
    <div className="bg-[#0a1929] border border-[#1a3554] rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <h2 className="text-white font-semibold">Account Health</h2>
          {selectedRep && (
            <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full px-2 py-0.5">
              {selectedRep}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          <span className="text-emerald-400 font-medium">{Math.round(repeatPct * 100)}%</span>
          {' '}reordering (active ≤30d)
        </div>
      </div>

      <div className="flex gap-1 mb-4 mt-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 ${tab === t.id ? 'text-blue-200' : t.color}`}>
              ({t.count > 25 ? '25+' : t.count})
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        {tab === 'dormant'   && <DormantTable   rows={dormant.slice(0, 30)} />}
        {tab === 'declining' && <DecliningTable rows={worst.slice(0, 30)} />}
        {tab === 'top'       && <TopTable       rows={top.slice(0, 30)} />}
      </div>
    </div>
  );
}

function DormantTable({ rows }: { rows: AccountRecord[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-[#0a1929] z-10">
        <tr className="border-b border-slate-800">
          {['Account Name', 'Rep', 'Last Order', 'Days Out', 'LY Sales', 'YTD Sales', '$ At Risk'].map(h => (
            <th key={h} className="text-left text-slate-500 font-medium py-2 px-2 first:pl-0 text-xs whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((a, i) => {
          const days = daysSince(a.lastPurchase);
          return (
            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 align-top">
              <td className="py-2.5 px-2 pl-0 text-white font-medium">
                <span className="text-white">{a.accountName}</span>
              </td>
              <td className="py-2.5 px-2 text-slate-400 text-xs whitespace-nowrap">{a.rep}</td>
              <td className="py-2.5 px-2 text-slate-300 tabular-nums whitespace-nowrap">{fmtDate(a.lastPurchase)}</td>
              <td className="py-2.5 px-2 whitespace-nowrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${dormancyBadge(days)}`}>
                  {days >= 9999 ? 'Never' : `${days}d`}
                </span>
              </td>
              <td className="py-2.5 px-2 text-slate-300 tabular-nums">{fmt(a.salesLYYTD)}</td>
              <td className="py-2.5 px-2 text-slate-400 tabular-nums">{fmt(a.salesYTD)}</td>
              <td className="py-2.5 px-2 text-red-400 font-semibold tabular-nums">{fmt(Math.abs(a.yoyDiff))}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DecliningTable({ rows }: { rows: AccountRecord[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-[#0a1929] z-10">
        <tr className="border-b border-slate-800">
          {['Account Name', 'Rep', 'YTD Sales', 'LY YTD', 'YOY $', 'YOY %', 'Last Order'].map(h => (
            <th key={h} className="text-left text-slate-500 font-medium py-2 px-2 first:pl-0 text-xs whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((a, i) => (
          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 align-top">
            <td className="py-2.5 px-2 pl-0 text-white font-medium">{a.accountName}</td>
            <td className="py-2.5 px-2 text-slate-400 text-xs whitespace-nowrap">{a.rep}</td>
            <td className="py-2.5 px-2 text-white tabular-nums">{fmt(a.salesYTD)}</td>
            <td className="py-2.5 px-2 text-slate-400 tabular-nums">{fmt(a.salesLYYTD)}</td>
            <td className="py-2.5 px-2 text-red-400 font-semibold tabular-nums">{fmtFull(a.yoyDiff)}</td>
            <td className={`py-2.5 px-2 font-semibold tabular-nums ${yoyColor(a.ytdChangePct)}`}>
              {fmtPctSigned(a.ytdChangePct)}
            </td>
            <td className="py-2.5 px-2 text-slate-500 tabular-nums whitespace-nowrap">{fmtDate(a.lastPurchase)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TopTable({ rows }: { rows: AccountRecord[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-[#0a1929] z-10">
        <tr className="border-b border-slate-800">
          {['#', 'Account Name', 'Rep', 'YTD Sales', 'LY YTD', 'YOY %', 'Last Order', 'Top Cat'].map(h => (
            <th key={h} className="text-left text-slate-500 font-medium py-2 px-2 first:pl-0 text-xs whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((a, i) => {
          const topCat = (['backwall', 'bin', 'crane', 'plush'] as const)
            .map(k => ({ k, v: a.cat[k].ytd }))
            .sort((x, y) => y.v - x.v)[0].k;
          return (
            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 align-top">
              <td className="py-2.5 px-2 pl-0 text-slate-600 font-mono text-xs">{i + 1}</td>
              <td className="py-2.5 px-2 text-white font-medium">{a.accountName}</td>
              <td className="py-2.5 px-2 text-slate-400 text-xs whitespace-nowrap">{a.rep}</td>
              <td className="py-2.5 px-2 text-emerald-400 font-semibold tabular-nums">{fmt(a.salesYTD)}</td>
              <td className="py-2.5 px-2 text-slate-400 tabular-nums">{fmt(a.salesLYYTD)}</td>
              <td className={`py-2.5 px-2 font-medium tabular-nums ${yoyColor(a.ytdChangePct)}`}>
                {fmtPctSigned(a.ytdChangePct)}
              </td>
              <td className="py-2.5 px-2 text-slate-400 whitespace-nowrap tabular-nums">{fmtDate(a.lastPurchase)}</td>
              <td className="py-2.5 px-2 text-slate-500 text-xs capitalize">{topCat}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
