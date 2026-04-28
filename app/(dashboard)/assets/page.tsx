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
import { Plus, Search, RefreshCw, FileImage, FileVideo, Library } from 'lucide-react';
import Link from 'next/link';

interface Asset {
  id: string;
  title: string;
  asset_type: 'image' | 'video' | 'clip';
  status: 'processing' | 'active' | 'error';
  created: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const orgId = 'demo-org-123';

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch(`/api/assets?org_id=${orgId}`);
        const data = await res.json();
        setAssets(data.items || []);
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-amber-500 border-amber-500/20 animate-pulse">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Library</h1>
          <p className="text-slate-400">Manage and monitor your official media assets.</p>
        </div>
        <Link href="/assets/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus size={18} />
            Register New Asset
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Your Assets</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search assets..." 
                className="bg-slate-950 border border-slate-800 rounded-md pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
              />
            </div>
            <Button variant="outline" size="icon" className="bg-slate-950 border-slate-800">
              <RefreshCw size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="hover:bg-transparent border-slate-800">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Asset</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Registered At</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <Library size={48} className="text-slate-700" />
                      <p className="text-slate-500">No assets registered yet.</p>
                      <Link href="/assets/new">
                        <Button variant="link" className="text-blue-500">Register your first asset</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                          {asset.asset_type === 'video' ? <FileVideo size={20} /> : <FileImage size={20} />}
                        </div>
                        {asset.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-slate-400">{asset.asset_type}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(asset.status)}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {new Date(asset.created).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/assets/${asset.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                          View Details
                        </Button>
                      </Link>
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
