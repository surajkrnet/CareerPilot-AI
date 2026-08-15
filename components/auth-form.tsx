'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/onboarding');
    }
    setLoading(false);
  };

  // Log In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (data?.user) {
      // Check if Career DNA exists, otherwise go to onboarding
      const { data: dna } = await supabase
        .from('career_dna')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (dna) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
    setLoading(false);
  };

  // Google SSO
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="bg-[#252320] p-8 rounded-xl border border-white/10 max-w-md w-full shadow-2xl space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-display text-3xl text-[#faf9f5]">Welcome to CareerPilot AI</h2>
        <p className="text-xs text-[#a09d96]">
          Sign in to synthesize your Career DNA & access your workspace.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Google SSO */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full bg-[#1f1e1b] text-[#faf9f5] border border-white/10 hover:border-[#cc785c] py-2.5 px-4 rounded-md font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Continue with Google
      </button>

      <div className="relative flex items-center justify-center my-4">
        <div className="w-full h-px bg-white/10" />
        <span className="absolute px-3 bg-[#252320] text-[10px] uppercase font-mono text-[#6c6a64]">
          or email
        </span>
      </div>

      {/* Email / Password Form */}
      <form className="space-y-4">
        <div className="space-y-1 text-left">
          <label className="text-[11px] font-semibold text-[#faf9f5] uppercase tracking-wider">Email address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#6c6a64] absolute left-3 top-2.5" />
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#1f1e1b] border border-white/10 rounded-md text-[#faf9f5] placeholder-[#6c6a64] focus:outline-none focus:border-[#cc785c]"
              required
            />
          </div>
        </div>

        <div className="space-y-1 text-left">
          <label className="text-[11px] font-semibold text-[#faf9f5] uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#6c6a64] absolute left-3 top-2.5" />
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#1f1e1b] border border-white/10 rounded-md text-[#faf9f5] placeholder-[#6c6a64] focus:outline-none focus:border-[#cc785c]"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 bg-[#cc785c] hover:bg-[#a9583e] text-white py-2.5 px-4 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 bg-transparent border border-[#cc785c] text-[#cc785c] hover:bg-[#cc785c] hover:text-white py-2.5 px-4 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
}
