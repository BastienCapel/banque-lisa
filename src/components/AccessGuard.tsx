'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { KeyRound, Lock, Loader2, Sparkles } from 'lucide-react';

interface AccessGuardProps {
  children: React.ReactNode;
}

export default function AccessGuard({ children }: AccessGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setIsAuthenticated(data.lisa || data.admin);
    } catch (err) {
      setIsAuthenticated(false);
    }
  };

  // 1. Check if authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // 2. Intercept query parameters (e.g. ?token=Lisa2026)
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      const autoLogin = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenParam }),
          });
          if (res.ok) {
            setIsAuthenticated(true);
            // Remove token from URL for clean address bar
            router.replace(window.location.pathname);
            router.refresh();
          } else {
            setError("Le jeton d'accès dans le lien est incorrect.");
          }
        } catch (err) {
          setError("Erreur de connexion.");
        } finally {
          setLoading(false);
        }
      };
      autoLogin();
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Code d'accès incorrect.");
      }

      setIsAuthenticated(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-pink-50/40 p-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200/60 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3.5 text-white shadow-lg shadow-indigo-500/20">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>
            
            <h2 className="mt-5 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Accès Sécurisé
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xs">
              Bienvenue dans ta <strong>Banque de l'été</strong>. Saisis le jeton d'accès privé fourni par tes parents pour entrer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="text-[11px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Jeton ou Mot de passe privé
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  placeholder="Ex: Lisa2026"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-10 pr-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Vérification...
                </>
              ) : (
                'Accéder à mon espace'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 text-center">
            <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Apprends le pouvoir des intérêts composés !
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
