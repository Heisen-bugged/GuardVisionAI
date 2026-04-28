import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Library, 
  AlertTriangle, 
  History, 
  Settings,
  ShieldCheck
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Asset Library', icon: Library, href: '/assets' },
    { label: 'Violation Feed', icon: AlertTriangle, href: '/violations' },
    { label: 'Scan History', icon: History, href: '/scans' },
    { label: 'SynthID Verify', icon: ShieldCheck, href: '/verify' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/50 flex flex-col bg-slate-950/80 backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800/50">
          <h1 className="text-2xl font-bold font-outfit text-premium flex items-center gap-2">
            <ShieldCheck className="text-blue-400" />
            DAPS
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-medium">Digital Asset Protection</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer text-slate-300 hover:text-white">
                <item.icon size={18} />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-900 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">S</div>
            <div>
              <p className="text-sm font-medium">Sports Admin</p>
              <p className="text-xs text-slate-500">Premium Org</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-950/40 backdrop-blur-md z-10">
          <h2 className="text-sm font-medium uppercase tracking-widest text-slate-400">GuardVision AI Dashboard</h2>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 hover:bg-slate-800">
              API Docs
            </Button>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
