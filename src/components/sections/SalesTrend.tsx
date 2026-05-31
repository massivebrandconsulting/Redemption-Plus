import { useMemo } from 'react';
import { InvoiceRecord } from '../../types';
import { getSalesTrend } from '../../utils/metrics';
import { fmt } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2 } from 'lucide-react';

interface Props {
  invoices: InvoiceRecord[];
  selectedRep: string;
  refDate: Date;
}

export default function SalesTrend({ invoices, selectedRep, refDate }: Props) {
  const filtered = useMemo(
    () => selectedRep ? invoices.filter(i => i.rep === selectedRep) : invoices,
    [invoices, selectedRep],
  );

  const { weekly, wtd, mtd } = useMemo(() => getSalesTrend(filtered, refDate), [filtered, refDate]);

  const lastIdx = weekly.length - 1;

  return (
    <div className="bg-[#0a1929] border border-[#1a3554] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <BarChart2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <h2 className="text-white font-semibold">Sales Trend</h2>
        {selectedRep && (
          <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full px-2 py-0.5">
            {selectedRep}
          </span>
        )}
        <div className="ml-auto flex items-center gap-6">
          <div className="text-right">
            <div className="text-slate-500 text-xs uppercase tracking-wider">WTD</div>
            <div className="text-emerald-400 font-bold text-lg">{fmt(wtd)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 text-xs uppercase tracking-wider">MTD</div>
            <div className="text-blue-400 font-bold text-lg">{fmt(mtd)}</div>
          </div>
        </div>
      </div>

      {weekly.length === 0 ? (
        <p className="text-slate-600 text-sm py-8 text-center">No weekly data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekly} margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1e293b" />
            <XAxis
              dataKey="weekLabel"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 'Sales']}
              labelStyle={{ color: '#fff' }}
              labelFormatter={label => `Week of ${label}`}
            />
            <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
              {weekly.map((_, i) => (
                <Cell key={i} fill={i === lastIdx ? '#6366f1' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <p className="text-slate-600 text-xs mt-2">
        8-week rolling · current week (purple) is partial
      </p>
    </div>
  );
}
