'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PiggyBank, Calendar, Wallet, BarChart2, Shield, LogOut, BookOpen } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: PiggyBank },
    { name: 'Évolution', href: '/evolution', icon: Calendar },
    { name: 'Retraits', href: '/retraits', icon: Wallet },
    { name: 'Simulations', href: '/simulations', icon: BarChart2 },
    { name: 'Comprendre', href: '/comprendre', icon: BookOpen },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    router.push('/');
    router.refresh();
  };

  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo / Title */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 text-white">
            <PiggyBank className="h-4.5 w-4.5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
            Banque de l'été
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Admin link */}
          <Link
            href="/admin"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAdmin
                ? 'bg-purple-600 text-white shadow-md'
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Banquier</span>
          </Link>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav (sticky to bottom on mobile, but header nav bar is top, let's make a bottom navigation for true mobile-first feel!) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-100 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 pb-safe">
        <div className="flex h-14 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
