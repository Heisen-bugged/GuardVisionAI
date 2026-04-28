'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Shield, 
  Key, 
  Globe, 
  Bell, 
  Save, 
  ShieldAlert,
  Server,
  Cloud
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-outfit">Organization Settings</h1>
        <p className="text-slate-400">Manage your organization's protection parameters and API configurations.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-blue-600">
            <Settings size={14} /> General
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2 data-[state=active]:bg-blue-600">
            <Key size={14} /> API Keys
          </TabsTrigger>
          <TabsTrigger value="protection" className="gap-2 data-[state=active]:bg-blue-600">
            <ShieldAlert size={14} /> Protection
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-blue-600">
            <Bell size={14} /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-outfit">Organization Profile</CardTitle>
              <CardDescription>Basic information about your protection entity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input defaultValue="Premium Sports Media" className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input defaultValue="admin@sportsmedia.com" className="bg-slate-950 border-slate-800" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input defaultValue="UTC (Coordinated Universal Time)" className="bg-slate-950 border-slate-800" />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Save size={16} /> Save Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-none border-red-500/20">
            <CardHeader>
              <CardTitle className="font-outfit text-red-500">Danger Zone</CardTitle>
              <CardDescription>Actions that cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">
                Delete Organization Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-outfit flex items-center gap-2">
                <Cloud size={18} className="text-blue-500" /> Google Cloud Integration
              </CardTitle>
              <CardDescription>Configure your GCP credentials for Vertex AI and Vision API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project ID</Label>
                <Input placeholder="gcp-project-123" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label>Vision API Key</Label>
                <Input type="password" value="••••••••••••••••" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label>Vertex AI Location</Label>
                <Input defaultValue="us-central1" className="bg-slate-950 border-slate-800" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-outfit flex items-center gap-2">
                <Server size={18} className="text-purple-500" /> PocketBase Backend
              </CardTitle>
              <CardDescription>Connection settings for your database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>PocketBase URL</Label>
                <Input defaultValue="http://127.0.0.1:8090" className="bg-slate-950 border-slate-800" />
              </div>
              <Button variant="outline" className="border-slate-800 hover:bg-slate-800">
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protection" className="space-y-6">
           <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-outfit">Detection Thresholds</CardTitle>
              <CardDescription>Adjust the sensitivity of the matching engines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>pHash Similarity Threshold</Label>
                  <span className="text-sm font-mono text-blue-400">10 (Distance)</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Cosine Similarity Threshold</Label>
                  <span className="text-sm font-mono text-blue-400">0.85 (Score)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-outfit">Global Licensed Domains</CardTitle>
              <CardDescription>Domains that should never be flagged as violations across all assets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Whitelisted Domains (comma separated)</Label>
                <Input placeholder="youtube.com, facebook.com, twitter.com" className="bg-slate-950 border-slate-800" />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">Update Whitelist</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="font-outfit">Alert Configurations</CardTitle>
              <CardDescription>Configure when and how you receive infringement alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                <div>
                  <p className="font-medium">Critical Infringement Alert</p>
                  <p className="text-xs text-slate-500">Notify immediately when confidence is &gt; 95%.</p>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800 opacity-50">
                <div>
                  <p className="font-medium">Daily Summary Email</p>
                  <p className="text-xs text-slate-500">Receive a daily PDF report of all activities.</p>
                </div>
                <div className="w-10 h-5 bg-slate-800 rounded-full relative">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-slate-600 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
