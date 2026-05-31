import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CategoryTotals } from '../../utils/metrics';
import { fmt, fmtFull, fmtPctSigned, yoyColor } from '../../utils/format';
import { PieChart as PieIcon } from 'lucide-react';

interface Props { totals: CategoryTotals; }

const CATS = [
  { key: 'backwall', label: 'Backwall', color: '#3b82f6' },
  { key: 'bin', label: 'Bin', color: '#8b5cf6' },
  { key: 'crane', label: 'Crane', color: '#f59e0b' },
  { key: 'plush', label: 'Plush', color: '#ec4899' },
] as const;

interface TT { active?: boolean; payload?: { payload: { ytd: number; ly: number; label: string; color: string } }[] }
function BarTT({ active, payload }: TT) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      <div className="text-white font-medium mb-1">{d.label}</div>
      <div className="text-slate-300">YTD: <span className="text-white font-semibold">{fmtFull(d.ytd)}</span></div>
      <div className="text-slate-400">LY: {fmtFull(d.ly)}</div>
    </div>
  );
}

export default function CategoryPanel({ totals }: Props) {
  const pieData = CATS.map(c => ({
    name: c.label,
    value: totals[c.key].ytd,
    color: c.color,
  }));

  const barData = CATS.map(c => ({
    label: c.label,
    ytd: totals[c.key].ytd,
    ly: totals[c.key].ly,
    color: c.color,
  }));

  const totalYTD = totals.total.ytd;

  return (
    <div className="bg-[#0a1929] border border-[#1a3554] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <PieIcon className="w-4 h-4 text-pink-400" />
        <h2 className="text-white font-semibold">Category Mix</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <div>
          <p className="text-slate-500 text-xs mb-3 uppercase tracking-wider">YTD Mix</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
              />
              <Tooltip
                formatter={(v: number) => [fmtFull(v), '']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* YTD vs LY bars */}
        <div>
          <p className="text-slate-500 text-xs mb-3 uppercase tracking-wider">YTD vs Last Year</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTT />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="ytd" name="YTD" radius={[3, 3, 0, 0]}>
                {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
              <Bar dataKey="ly" name="LY" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category stat row */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
        {CATS.map(c => {
          const ytd = totals[c.key].ytd;
          const ly = totals[c.key].ly;
          const pct = ly > 0 ? (ytd - ly) / ly : 0;
          return (
            <div key={c.key} className="text-center">
              <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">{c.label}</div>
              <div className="text-white font-semibold text-sm">{fmt(ytd)}</div>
              <div className={`text-xs font-medium ${yoyColor(pct)}`}>{fmtPctSigned(pct)}</div>
              <div className="text-slate-600 text-xs">
                {totalYTD > 0 ? `${((ytd / totalYTD) * 100).toFixed(0)}% of mix` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
