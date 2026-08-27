'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '▦' },
  { href: '/status-tracker', label: 'Status Tracker', icon: '☑' },
  { href: '/el-tracker', label: 'EL Tracker', icon: '📄' },
  { href: '/gst-reconciliation', label: 'GST Reconciliation', icon: '🧾' },
  { href: '/lease-agreement', label: 'Lease Agreement', icon: '🏢' },
  { href: '/todo-list', label: 'To-Do List', icon: '✓' },
  { href: '/e-signature', label: 'e-Signature', icon: '✍' },
  { href: '/settings', label: 'Settings', icon: '⚙' }
];

export default function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role?: string };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();
  const currentPage = NAV.find((item) => item.href === pathname);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col bg-slate-900 text-slate-200">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-900">
            FA
          </div>
          <span className="text-sm font-semibold text-white">Firm Automations</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-5 pt-2 text-xs text-slate-500">
          Signed in as
          <br />
          <span className="text-slate-300">{user.email}</span>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {!online && (
          <div className="bg-amber-100 px-6 py-2 text-center text-xs font-medium text-amber-800">
            You&apos;re offline -- showing the last saved data. Changes will sync once you&apos;re
            back online.
          </div>
        )}
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Firm Automations</span>
            {currentPage && currentPage.href !== '/' && (
              <>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-900">{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full pr-2 hover:bg-slate-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {initial}
              </span>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-3 py-2 text-xs text-slate-500">
                  <p className="font-medium text-slate-800">{user.name}</p>
                  <p>{user.email}</p>
                  {user.role && (
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                      {user.role}
                    </span>
                  )}
                </div>
                <Link
                  href="/settings"
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
