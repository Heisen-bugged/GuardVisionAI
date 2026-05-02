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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ExternalLink, 
  CheckCircle, 
  Video, 
  Globe, 
  MoreHorizontal,
  Bell,
  ShieldCheck
} from 'lucide-react';
import { pb } from '@/lib/pocketbase';

interface Violation {
  id: string;
  asset_id: string;
  source_url: string;
  platform: 'youtube' | 'web' | 'twitter' | 'instagram' | 'unknown';
  match_type: 'exact' | 'partial' | 'semantic' | 'watermark_confirmed';
  confidence: number;
  status: 'pending_review' | 'confirmed' | 'licensed' | 'dmca_sent' | 'resolved';
  created: string;
  expand?: {
    asset_id: {
      title: string;
    }
  };
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchViolations() {
      try {
        const res = await fetch('/api/violations');
        const data = await res.json();
        setViolations(data.items || []);
      } catch (error) {
        console.error('Error fetching violations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchViolations();

    // Subscribe to realtime updates
    pb.collection('violations').subscribe('*', (e) => {
      if (e.action === 'create') {
        setViolations(prev => [e.record as unknown as Violation, ...prev]);
      } else if (e.action === 'update') {
        setViolations(prev => prev.map(v => v.id === e.record.id ? e.record as unknown as Violation : v));
      }
    });

    return () => {
      pb.collection('violations').unsubscribe('*');
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="outline" className="text-amber-500 border-amber-500/20">Pending Review</Badge>;
      case 'confirmed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Confirmed</Badge>;
      case 'licensed':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Licensed</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Video size={16} className="text-red-500" />;
      default:
        return <Globe size={16} className="text-slate-400" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-red-500';
    if (score >= 0.75) return 'text-amber-500';
    return 'text-blue-500';
  };

  const updateStatus = async (id: string, status: Violation['status']) => {
    try {
      await fetch('/api/violations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      // Local update will happen via SSE if configured, or manually here
      setViolations(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Violation Feed</h1>
          <p className="text-slate-400">Review and action detected unauthorized content.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="bg-slate-900 border-slate-800 gap-2">
            <Bell size={18} />
            Notifications
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Recent Detections</CardTitle>
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="bg-slate-950 border-slate-800">
                {violations.length} total
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-slate-800">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Asset & Platform</TableHead>
                <TableHead className="text-slate-400">Match Type</TableHead>
                <TableHead className="text-slate-400">Confidence</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Loading detections...
                  </TableCell>
                </TableRow>
              ) : violations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldCheck size={48} className="text-slate-700" />
                      <p className="text-slate-500">No violations found yet. Your assets are safe.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                violations.map((v) => (
                  <TableRow key={v.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{v.expand?.asset_id?.title || 'Unknown Asset'}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {getPlatformIcon(v.platform)}
                          <a href={v.source_url} target="_blank" rel="noreferrer" className="hover:text-blue-400 flex items-center gap-1">
                            {new URL(v.source_url).hostname} <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-400 font-normal capitalize">
                        {v.match_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`font-mono font-bold ${getConfidenceColor(v.confidence)}`}>
                        {(v.confidence * 100).toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(v.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => updateStatus(v.id, 'confirmed')}
                          title="Confirm Violation"
                        >
                          <CheckCircle size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-500 hover:bg-blue-500/10"
                          onClick={() => updateStatus(v.id, 'licensed')}
                          title="Mark as Licensed"
                        >
                          <ShieldCheck size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:bg-slate-800"
                        >
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>
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
