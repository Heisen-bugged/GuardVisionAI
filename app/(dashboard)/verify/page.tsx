'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShieldCheck, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileSearch
} from 'lucide-react';

interface VerificationResult {
  verdict: 'WATERMARK_DETECTED' | 'NOT_DETECTED' | string;
  confidence: number;
  error?: string;
}

export default function VerifyPage() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!file && !url) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (url) formData.append('url', url);

    try {
      const res = await fetch('/api/detect/verify', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Verification failed:', error);
      setResult({ verdict: 'ERROR', confidence: 0, error: 'Failed to verify content.' });
    } finally {
      setLoading(false);
    }
  };

  const getVerdictInfo = (verdict: string) => {
    switch (verdict) {
      case 'WATERMARK_DETECTED':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          title: 'Watermark Detected',
          desc: 'This content contains a valid Google SynthID invisible watermark.'
        };
      case 'NOT_DETECTED':
        return {
          icon: XCircle,
          color: 'text-slate-400',
          bg: 'bg-slate-800',
          border: 'border-slate-700',
          title: 'No Watermark Detected',
          desc: 'We could not find any SynthID watermark in this media.'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          title: 'Inconclusive Result',
          desc: 'The analysis was inconclusive. The content may be too distorted or low quality.'
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">SynthID Verifier</h1>
          <p className="text-slate-400 mt-1">Verify content authenticity using Google SynthID invisible watermarking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-slate-900 border-slate-800 h-fit">
          <CardHeader>
            <CardTitle>Verify Content</CardTitle>
            <CardDescription>Upload a file or provide a public URL to check for watermarks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 transition-colors relative cursor-pointer ${
                  file ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFile(e.target.files[0]);
                      setUrl('');
                    }
                  }}
                />
                <Upload size={24} className={file ? 'text-blue-500' : 'text-slate-500'} />
                <p className="text-sm font-medium">{file ? file.name : 'Upload media file'}</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500 font-mono italic">OR</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Content URL</Label>
                <div className="flex gap-2">
                  <Input 
                    id="url" 
                    placeholder="https://example.com/image.jpg" 
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setFile(null);
                    }}
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={loading || (!file && !url)}
              onClick={handleVerify}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Analyzing Media...
                </>
              ) : (
                <>
                  <FileSearch size={18} className="mr-2" />
                  Run Verification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div>
          {result ? (
            <Card className={`bg-slate-900 border-slate-800 h-full animate-in zoom-in-95 duration-300 ${getVerdictInfo(result.verdict).border}`}>
              <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-6">
                {(() => {
                  const info = getVerdictInfo(result.verdict);
                  return (
                    <>
                      <div className={`w-20 h-20 rounded-full ${info.bg} flex items-center justify-center ${info.color} border ${info.border}`}>
                        <info.icon size={40} />
                      </div>
                      <div className="space-y-2">
                        <h2 className={`text-2xl font-bold ${info.color}`}>{info.title}</h2>
                        <p className="text-slate-400 max-w-xs">{info.desc}</p>
                      </div>
                      
                      {result.confidence > 0 && (
                        <div className="w-full pt-6 border-t border-slate-800 space-y-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 uppercase font-medium">Confidence Score</span>
                            <span className={`font-mono font-bold ${info.color}`}>{(result.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full ${info.bg.replace('/10', '')} ${info.color.replace('text-', 'bg-')}`} 
                              style={{ width: `${result.confidence * 100}%` }} 
                            />
                          </div>
                        </div>
                      )}

                      {result.verdict === 'WATERMARK_DETECTED' && (
                        <div className="bg-slate-950/50 rounded-lg p-4 w-full border border-slate-800 text-left space-y-2">
                           <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Origin Trace</div>
                           <p className="text-sm text-slate-300">
                             Watermark matches organization key: <span className="text-blue-400 font-mono">DAPS_SECURE_AUTH</span>
                           </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 text-center gap-4 text-slate-600">
              <FileSearch size={48} className="opacity-20" />
              <p className="text-sm">Analysis results will appear here after running the verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
