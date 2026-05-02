'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  FileText,
  ShieldCheck,
  Globe
} from 'lucide-react';
import Link from 'next/link';

interface Violation {
  id: string;
  created: string;
  source_url: string;
  platform: string;
  match_type: string;
  confidence: number;
}

export default function ViolationDetailPage() {
  const { id } = useParams();
  const [violation, setViolation] = useState<Violation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchViolation() {
      try {
        const res = await fetch(`/api/violations`);
        const data = await res.json();
        const found = data.items.find((v: Violation) => v.id === id);
        setViolation(found);
      } catch (error) {
        console.error('Error fetching violation:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchViolation();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!violation) return <div className="p-8 text-center">Violation not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4">
        <Link href="/violations">
          <Button variant="ghost" size="icon" className="text-slate-400">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Violation Detail
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-3">High Confidence</Badge>
          </h1>
          <p className="text-slate-400 mt-1">Detected on {new Date(violation.created).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Comparison Card */}
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-800">
              <CardTitle>Content Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 h-80">
                <div className="p-6 border-r border-slate-800 flex flex-col items-center justify-center bg-slate-950/50">
                  <span className="text-xs text-slate-500 uppercase tracking-widest mb-4">Original Asset</span>
                  <div className="w-full h-full bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center">
                    <Globe size={40} className="text-slate-700" />
                  </div>
                </div>
                <div className="p-6 flex flex-col items-center justify-center bg-red-500/5">
                  <span className="text-xs text-red-500/50 uppercase tracking-widest mb-4">Detected Content</span>
                  <div className="w-full h-full bg-slate-900 rounded-lg border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle size={40} className="text-red-500/20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Details */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Detection Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 uppercase font-medium">Source URL</span>
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <a href={violation.source_url} target="_blank" rel="noreferrer" className="underline truncate">
                      {violation.source_url}
                    </a>
                    <ExternalLink size={14} />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 uppercase font-medium">Platform</span>
                  <div className="flex items-center gap-2 text-sm capitalize">
                    {violation.platform}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 uppercase font-medium">Match Method</span>
                  <div className="flex items-center gap-2 text-sm capitalize">
                    {violation.match_type.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <h4 className="text-sm font-medium mb-4">Confidence Breakdown</h4>
                <div className="space-y-3">
                  {[
                    { label: 'SynthID Watermark', status: 'Detected', color: 'text-emerald-500', score: 0.98 },
                    { label: 'pHash Similarity', status: '92% Match', color: 'text-emerald-500', score: 0.92 },
                    { label: 'Semantic Embedding', status: '88% Similarity', color: 'text-blue-500', score: 0.88 },
                  ].map((signal) => (
                    <div key={signal.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle size={14} className={signal.color} />
                        <span className="text-slate-300">{signal.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${signal.color.replace('text-', 'bg-')}`} 
                            style={{ width: `${signal.score * 100}%` }} 
                          />
                        </div>
                        <span className={`text-xs font-mono font-bold ${signal.color}`}>{signal.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Action Panel */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Enforcement Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-red-600 hover:bg-red-700 gap-2">
                <FileText size={18} />
                Issue DMCA Takedown
              </Button>
              <Button variant="outline" className="w-full bg-slate-950 border-slate-800 gap-2 text-emerald-500 hover:bg-emerald-500/10">
                <CheckCircle size={18} />
                Confirm Violation
              </Button>
              <Button variant="outline" className="w-full bg-slate-950 border-slate-800 gap-2 text-blue-500 hover:bg-blue-500/10">
                <ShieldCheck size={18} />
                Mark as Licensed
              </Button>
              <div className="pt-4 border-t border-slate-800">
                <Button variant="ghost" className="w-full text-slate-500 gap-2">
                  <XCircle size={18} />
                  Dismiss / Ignore
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 pb-6 space-y-4">
                <div className="flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                  <div className="space-y-1">
                    <p className="text-slate-300">Detection triggered by YouTube Crawler</p>
                    <p className="text-slate-500">Today at 2:34 PM</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1" />
                  <div className="space-y-1">
                    <p className="text-slate-300">Status changed to Pending Review</p>
                    <p className="text-slate-500">Today at 2:35 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
