'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Library, 
  AlertTriangle, 
  CheckCircle2, 
  Scan,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Stats {
  totalAssets: number;
  openViolations: number;
  scansToday: number;
  resolvedThisWeek: number;
  trendData: Array<{ name: string; violations: number }>;
  platformData: Array<{ name: string; value: number }>;
  recentActivity: Array<{
    id: string;
    source_url: string;
    created: string;
    platform: string;
    confidence: number;
    expand?: {
      asset_id?: {
        title: string;
      };
    };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalAssets: 0,
    openViolations: 0,
    scansToday: 0,
    resolvedThisWeek: 0,
    trendData: [],
    platformData: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setError(null);
        setLoading(true);
        const res = await fetch('/api/stats?org_id=demo-org-123');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
        setStats(data);
      } catch (err: unknown) {
        console.error('Failed to fetch stats:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const COLORS = ['#ef4444', '#3b82f6', '#ec4899', '#0ea5e9'];

  const kpis = [
    { title: 'Registered Assets', value: stats.totalAssets, icon: Library, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Open Violations', value: stats.openViolations, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'Scans Today', value: stats.scansToday, icon: Scan, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Resolved (7d)', value: stats.resolvedThisWeek, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold font-outfit tracking-tight">Welcome back, <span className="text-premium">Sports Admin</span></h1>
        <p className="text-slate-400 font-medium">Here&apos;s what&apos;s happening with your protected assets today.</p>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10 text-red-500 glass-card">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle size={20} />
            <div className="flex-1">
              <p className="font-bold">Backend Connection Issue</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="glass-card border-none hover:bg-slate-900/80 transition-all cursor-default group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.title}</p>
                  <p className="text-3xl font-bold mt-2 font-outfit tracking-tighter">
                    {loading ? <span className="inline-block w-8 h-8 bg-slate-800 animate-pulse rounded" /> : kpi.value}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                  <kpi.icon size={24} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-6 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                <TrendingUp size={12} />
                <span>+12% from last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 glass-card border-none">
          <CardHeader>
            <CardTitle className="text-lg font-outfit tracking-tight">Violation Trends (7d)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="violations" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.platformData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {stats.platformData.map((p, index) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_var(--color-p)]" style={{ backgroundColor: COLORS[index % COLORS.length], '--color-p': COLORS[index % COLORS.length] } as React.CSSProperties} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Live Protection Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No recent activity detected.
              </div>
            ) : (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/10 group-hover:scale-110 transition-transform">
                    <Scan size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-bold text-slate-200">Violation Detected</span> on 
                      <span className="text-blue-400 ml-1 hover:underline cursor-pointer font-medium">
                        {(() => {
                          try {
                            return new URL(activity.source_url).hostname;
                          } catch (_e) {
                            return activity.source_url || 'Unknown Source';
                          }
                        })()}
                      </span>
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>{new Date(activity.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Globe size={10} /> {activity.platform}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">{activity.expand?.asset_id?.title}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`
                    border-none font-bold text-[10px] uppercase tracking-tighter px-2 py-0.5
                    ${activity.confidence >= 0.9 ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}
                  `}>
                    {(activity.confidence * 100).toFixed(0)}% Match
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
