import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Search, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl text-center space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Shield size={14} /> AI-Powered Asset Protection
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold font-outfit tracking-tighter leading-[0.9]">
            Protect Your <span className="text-premium">Digital Legacy</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            GuardVision AI monitors your media assets across the web, identifying infringements and protecting your intellectual property in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 text-lg font-bold rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95">
                Enter Dashboard
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-800 bg-slate-900/50 backdrop-blur-xl px-8 h-14 text-lg font-bold rounded-2xl hover:bg-slate-800 transition-all">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-24 animate-in fade-in zoom-in duration-1000 delay-300">
          {[
            { icon: Zap, title: 'Instant Detection', desc: 'Identify infringements within seconds of publication.' },
            { icon: Search, title: 'Visual DNA', desc: 'Advanced pHash and AI similarity matching engines.' },
            { icon: Activity, title: 'Global Monitoring', desc: 'Continuous crawling of major video and image platforms.' },
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 rounded-3xl space-y-4 hover:bg-slate-900/80 transition-colors border-none">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold font-outfit">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-900/50 bg-slate-950/50 backdrop-blur-sm text-center">
        <p className="text-slate-500 text-sm">
          &copy; 2026 GuardVision AI. Built for the modern protection era.
        </p>
      </footer>
    </div>
  );
}
