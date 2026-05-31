import { ActivityRecord, LeadRecord } from '../../types';
import { getActivityByType, getLeadsBySource } from '../../utils/metrics';
import { daysSince } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Phone, Inbox } from 'lucide-react';

interface Props {
  activity: ActivityRecord[];
  leads: LeadRecord[];
  selectedRep: string;
}

const TYPE_COLORS: Record<string, string> = {
  'Email': '#3b82f6',
  'Call': '#22c55e',
  'Site Visit': '#f59e0b',
  'Video Conference Call': '#8b5cf6',
  'Shared Meal': '#ec4899',
  'Customer Dinner - Tradeshow': '#06b6d4',
};

const MONTHS_ORDER = ['February 2026', 'March 2026', 'April 2026', 'May 2026'];

export default function ActivityPanel({ activity, leads, selectedRep }: Props) {
  const filteredActivity = selectedRep ? activity.filter(r => r.rep === selectedRep) : activity;
  const filteredLeads = selectedRep ? leads.filter(l => l.owner === selectedRep) : leads;

  // Monthly totals
  const monthlyData = MONTHS_ORDER.map(month => {
    const count = filteredActivity.filter(r => r.month === month).reduce((s, r) => s + r.count, 0);
    return { month: month.split(' ')[0], count };
  }).filter(m => m.count > 0);

  // By type
  const byType = getActivityByType(filteredActivity);

  // By source
  const bySource = getLeadsBySource(filteredLeads).slice(0, 6);

  // Hot leads (score ≥ 1000)
  const hotLeads = filteredLeads
    .filter(l => l.engagementScore >= 1000)
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Activity section */}
      <div className="bg-[#0a1929] border border-[#1a3554] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-violet-400" />
          <h2 className="text-white font-semibold">Connections & Activity</h2>
        </div>

        {filteredActivity.length === 0 ? (
          <p className="text-slate-600 text-sm py-8 text-center">No connections data uploaded</p>
        ) : (
          <>
            {monthlyData.length > 0 && (
              <div className="mb-5">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">Monthly Total</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">By Type (All Months)</p>
            <div className="space-y-2">
              {byType.slice(0, 6).map(({ type, count }) => {
                const max = byType[0]?.count || 1;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="text-slate-400 text-xs w-40 truncate" title={type}>{type}</div>
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / max) * 100}%`,
                          backgroundColor: TYPE_COLORS[type] || '#64748b',
                        }}
                      />
                    </div>
                    <div className="text-slate-300 text-xs tabular-nums w-12 text-right">
                      {count.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Leads section */}
      <div className="bg-[#0a1929] border border-[#1a3554] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-4 h-4 text-amber-400" />
          <h2 className="text-white font-semibold">Open Leads</h2>
          <span className="ml-auto text-slate-500 text-xs">{filteredLeads.length} total</span>
        </div>

        {filteredLeads.length === 0 ? (
          <p className="text-slate-600 text-sm py-8 text-center">No leads data uploaded</p>
        ) : (
          <>
            {bySource.length > 0 && (
              <div className="mb-5">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">By Lead Source</p>
                <div className="space-y-1.5">
                  {bySource.map(({ source, count }) => {
                    const max = bySource[0]?.count || 1;
                    const shortSrc = source.replace('Trade Show - ', '');
                    return (
                      <div key={source} className="flex items-center gap-3">
                        <div className="text-slate-400 text-xs w-32 truncate" title={shortSrc}>{shortSrc}</div>
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                        <div className="text-slate-300 text-xs tabular-nums w-8 text-right">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">
              Hot Leads (Score 1000+) — {hotLeads.length}
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {hotLeads.map((l, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{l.company}</div>
                    <div className="text-slate-500 text-xs">{l.owner} · {l.state}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-amber-400 text-xs font-bold">{l.engagementScore.toLocaleString()}</div>
                    <div className="text-slate-600 text-xs">
                      {l.lastActivity ? `${daysSince(l.lastActivity)}d ago` : 'no contact'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
