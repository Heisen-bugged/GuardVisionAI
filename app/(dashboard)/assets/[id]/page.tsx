'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileImage, 
  FileVideo, 
  ShieldCheck, 
  Fingerprint, 
  Globe, 
  AlertTriangle,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Asset {
  id: string;
  title: string;
  asset_type: 'image' | 'video' | 'clip';
  created: string;
  phash?: string;
  keywords?: string[];
  licensed_domains?: string[];
}

export default function AssetDetailPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAsset() {
      try {
        const res = await fetch(`/api/assets?org_id=demo-org-123`);
        const data = await res.json();
        const found = data.items.find((a: Asset) => a.id === id);
        setAsset(found);
      } catch (error) {
        console.error('Error fetching asset:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAsset();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-400">Asset not found</h2>
        <Button variant="link" className="text-blue-500 mt-4">Back to Library</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            {asset.asset_type === 'video' ? <FileVideo size={24} /> : <FileImage size={24} />}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{asset.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="capitalize text-slate-400">{asset.asset_type}</Badge>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-900 border-slate-800 gap-2">
            <Download size={16} />
            Download Original
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <RefreshCw size={16} className="mr-1" />
            Trigger Scan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Protection Summary */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-400">
              <ShieldCheck size={16} className="text-blue-500" />
              WATERMARK STATUS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold text-emerald-500">SynthID Embedded</div>
              <p className="text-xs text-slate-400">
                Verified watermark embedded on {new Date(asset.created).toLocaleDateString()}.
              </p>
              <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300 p-0 h-auto">
                View Watermarked Copy <ExternalLink size={12} className="ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-400">
              <Fingerprint size={16} className="text-purple-500" />
              FINGERPRINT (pHash)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-xl font-mono text-slate-200 truncate">{asset.phash || '78a1c3e4f9b02d...'}</div>
              <p className="text-xs text-slate-400">
                64-bit perceptual hash generated using Block Mean Value.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-400">
              <Globe size={16} className="text-amber-500" />
              MONITORING
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">48 Active Scans</div>
              <p className="text-xs text-slate-400">
                Monitoring YouTube, Vision Web, and RSS feeds every 6h.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Recent Violations</CardTitle>
            <CardDescription>Latest unauthorized matches for this asset.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-slate-500 border border-dashed border-slate-800 rounded-lg">
              <AlertTriangle size={32} className="text-slate-700" />
              <p className="text-sm">No violations detected in the last 24h.</p>
              <Button variant="outline" size="sm" className="bg-slate-950 border-slate-800">
                View All History
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Asset Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Keywords</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {asset.keywords?.map((k: string) => (
                    <Badge key={k} variant="secondary" className="bg-slate-800 text-slate-300 font-normal">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Licensed Domains</span>
                <div className="flex flex-wrap gap-2 mt-1">
                   {asset.licensed_domains?.map((d: string) => (
                    <Badge key={d} variant="outline" className="text-slate-500 font-normal">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-800">
              <Button variant="outline" size="sm" className="w-full bg-slate-950 border-slate-800">
                Edit Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
