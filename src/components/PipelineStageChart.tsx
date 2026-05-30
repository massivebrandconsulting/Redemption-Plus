import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { fmt, fmtFull } from '../utils/metrics';

interface StageData {
  stage: string;
  count: number;
  value: number;
}

interface Props {
  data: StageData[];
}

const COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
];

interface TooltipPayload {
  payload: StageData;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      <div className="text-white font-medium mb-1">{d.stage}</div>
      <div className="text-emerald-400">{fmtFull(d.value)}</div>
      <div className="text-slate-400">{d.count} deal{d.count !== 1 ? 's' : ''}</div>
    </div>
  );
}

export default function PipelineStageChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
        No open pipeline data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke="#1e293b" />
        <XAxis
          type="number"
          tickFormatter={v => fmt(v)}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          width={160}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{
          position: 'right',
          formatter: (v: number) => fmt(v),
          fill: '#64748b',
          fontSize: 11,
        }}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
