'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

export default function NewAssetPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [domains, setDomains] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !title) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('org_id', 'demo-org-123'); // Demo Org ID
    formData.append('asset_type', file.type.startsWith('video') ? 'video' : 'image');
    formData.append('keywords', JSON.stringify(keywords.split(',').map(k => k.trim())));
    formData.append('licensed_domains', JSON.stringify(domains.split(',').map(d => d.trim())));

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setStep(3); // Success step
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading asset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Register New Asset</h1>
        <p className="text-slate-400">Add a new media asset to the protection system.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-4 py-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              step === s ? 'bg-blue-600 text-white' : 
              step > s ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="bg-slate-900 border-slate-800 animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Step 1: Upload Media</CardTitle>
            <CardDescription>Upload the high-quality source file for watermarking and fingerprinting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div 
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 transition-colors ${
                file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              {file ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-slate-500 hover:text-white">
                    <X size={14} className="mr-2" /> Remove file
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Click or drag to upload</p>
                    <p className="text-sm text-slate-500">High-res JPEG, PNG, or MP4 (Max 500MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                  />
                  <Button className="bg-blue-600">Select File</Button>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                disabled={!file} 
                onClick={() => setStep(2)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next Step <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-slate-900 border-slate-800 animate-in fade-in slide-in-from-right-4">
          <CardHeader>
            <CardTitle>Step 2: Asset Details</CardTitle>
            <CardDescription>Define how DAPS should monitor this asset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Asset Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Champions League Final Highlights" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-950 border-slate-800"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Crawler Keywords (comma separated)</Label>
              <Input 
                id="keywords" 
                placeholder="e.g. UCL goals, Madrid vs Liverpool" 
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="bg-slate-950 border-slate-800"
              />
              <p className="text-xs text-slate-500">Our crawlers will use these terms to find matches on YouTube and the web.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domains">Licensed Domains / Channels (comma separated)</Label>
              <Input 
                id="domains" 
                placeholder="e.g. broadcaster.com, @official_channel" 
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                className="bg-slate-950 border-slate-800"
              />
              <p className="text-xs text-slate-500">DAPS will ignore matches found on these platforms.</p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="bg-slate-950 border-slate-800">
                Back
              </Button>
              <Button 
                disabled={!title || loading} 
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>Register Asset <CheckCircle2 size={18} className="ml-2" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="bg-slate-900 border-slate-800 border-emerald-500/20 animate-in zoom-in-95">
          <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl text-emerald-500">Registration Initiated!</CardTitle>
              <CardDescription className="text-slate-400 max-w-sm mx-auto">
                Your asset "{title}" is now being watermarked and fingerprinted. 
                It will appear in your library shortly.
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => {
                setFile(null);
                setTitle('');
                setKeywords('');
                setDomains('');
                setStep(1);
              }} className="bg-slate-950 border-slate-800">
                Register Another
              </Button>
              <Button onClick={() => router.push('/assets')} className="bg-emerald-600 hover:bg-emerald-700">
                Go to Library
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
