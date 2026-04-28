'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search,
  ExternalLink,
  Shield
} from 'lucide-react';

interface ScanJob {
  id: string;
  asset_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'youtube' | 'web' | 'comprehensive';
  results: any;
  created: string;
  expand?: {
    asset_id: {
      title: string;
    }
  };
}

export default function ScansPage() {
  const [jobs, setJobs] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/scans');
        const data = await res.json();
        setJobs(data.items || []);
      } catch (error) {
        console.error('Error fetching scan jobs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-outfit">Scan History</h1>
          <p className="text-slate-400">Track and monitor automated detection engine activities.</p>
        </div>
      </div>

      <Card className="glass-card border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-outfit">Detection Logs</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-950 border-slate-800">
              {jobs.length} Jobs Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-slate-800/50">
              <TableRow className="border-slate-800/50 hover:bg-transparent">
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Asset</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Type</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Status</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Detections</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                    <Loader2 className="mx-auto animate-spin mb-2" size={32} />
                    Loading scan history...
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <History size={48} className="text-slate-800" />
                      <p className="text-slate-500">No scan jobs found. Start a scan from the Asset Library.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                          <Shield size={16} />
                        </div>
                        {job.expand?.asset_id?.title || 'System-wide Scan'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize bg-slate-950 text-slate-400 border-slate-800 font-normal">
                        {job.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(job.status)}
                    </TableCell>
                    <TableCell>
                      <span className={job.results?.violations_found > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>
                        {job.results?.violations_found || 0} violations
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm">
                      {new Date(job.created).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
