'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ArrowRight,
  FileText,
  Briefcase,
  MessageSquare,
  Sparkles,
  Compass,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  Settings,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCareer } from '@/lib/career-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useCareer();

  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/auth';

  // Listen to Auth State once on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Scroll Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / windowHeight) * 100}`;
      setScrollProgress(Number(scroll) || 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserDropdownOpen(false);
    router.push('/');
    router.refresh();
  };

  // Authenticated App Nav Links
  const appNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { label: 'Career DNA', href: '/onboarding', icon: <Compass className="w-3.5 h-3.5" /> },
    { label: 'Resume Intelligence', href: '/resume', icon: <FileText className="w-3.5 h-3.5" /> },
    { label: 'Job Fit', href: '/job-fit', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { label: 'Interview Prep', href: '/interview', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { label: 'Tracker', href: '/tracker', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  const userDisplayName =
    profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-20 w-full glass-nav bg-[#f6f4ee]/85 dark:bg-[#121110]/95 backdrop-blur-2xl text-[#121110] dark:text-[#faf9f5] border-b border-[#ded7cb] dark:border-white/10 transition-colors duration-200">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          
          {/* Left: Locked Brand Identity (Logo + CAREERPILOT AI) */}
          <div className="w-auto lg:w-[280px] shrink-0 flex items-center">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#121110] dark:bg-[#faf9f5] flex items-center justify-center text-white dark:text-[#121110] group-hover:bg-[#cc785c] dark:group-hover:bg-[#cc785c] group-hover:text-white transition-all shadow-md group-hover:scale-105 active:scale-95 duration-200 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="18" fill="none" viewBox="0 0 31 25">
                  <path fill="currentColor" d="M5.838.705H.5L9.94 24.28l2.743-6.92zM25.162.705H30.5L21.06 24.28l-2.743-6.92zM19.281.73h-7.562l3.732 9.538z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#121110] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors leading-none uppercase select-none">
                  CAREERPILOT<span className="text-[#cc785c]"> AI</span>
                </span>
                <span className="text-[9px] font-mono text-[#57534e] dark:text-[#8e8b82] uppercase tracking-widest hidden sm:inline mt-0.5 font-semibold">
                  Autonomous Career OS
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation (Centered with Smooth Transition) */}
          <div className="flex-1 flex justify-center items-center">
            <AnimatePresence mode="wait">
              {isLandingPage ? (
                <motion.nav
                  key="landing-nav"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="hidden md:flex items-center gap-8 font-mono text-xs text-[#3b3834] dark:text-[#dcd7cb]"
                >
                  <Link href="/#features" className="hover:text-[#cc785c] dark:hover:text-white transition-colors relative py-1 font-medium">
                    Features
                  </Link>
                  <Link href="/#pricing" className="hover:text-[#cc785c] transition-colors font-bold text-[#cc785c] relative py-1">
                    Pricing &amp; Plans
                  </Link>
                  <Link href="/#section-introduce" className="hover:text-[#cc785c] dark:hover:text-white transition-colors relative py-1 font-medium">
                    Platform DNA
                  </Link>
                </motion.nav>
              ) : (
                <motion.nav
                  key="app-nav"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="hidden lg:flex items-center gap-1 glass-capsule bg-[#eee9e0]/90 dark:bg-[#1c1a18]/95 backdrop-blur-2xl border border-[#d7cfc2] dark:border-white/15 p-1.5 rounded-2xl transition-all shadow-md dark:shadow-2xl"
                >
                  {appNavItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href === '/resume' && pathname === '/resume-intelligence') ||
                      (item.href === '/job-fit' && (pathname === '/job-fit' || pathname === '/jobs'));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="relative px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 z-10"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNavPill"
                            className="absolute inset-0 bg-[#cc785c] rounded-xl shadow-md shadow-[#cc785c]/35"
                            transition={{ type: 'spring', stiffness: 600, damping: 38 }}
                          />
                        )}
                        <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${isActive ? 'text-white font-bold' : 'text-[#2d2a26] dark:text-[#dcd7cb] hover:text-[#121110] dark:hover:text-white'}`}>
                          {item.icon}
                          <span>{item.label}</span>
                        </span>
                      </Link>
                    );
                  })}
                </motion.nav>
              )}
            </AnimatePresence>
          </div>

          {/* Right Action Area (Locked) */}
          <div className="w-auto lg:w-[280px] shrink-0 flex items-center justify-end gap-3">
            {/* Theme Toggle Switch */}
            <ThemeToggle />

            {isLandingPage ? (
              // Public Landing Page Actions
              <div className="flex items-center gap-3">
                {user ? (
                  <Link href="/dashboard">
                    <button className="px-5 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth" className="hidden sm:inline-block">
                      <button className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-mono text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10 transition-colors cursor-pointer active:scale-95">
                        Log In
                      </button>
                    </Link>
                    <Link href="/auth">
                      <button className="px-5 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                        <span>Get Started Free</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </>
                )}
              </div>
            ) : isAuthPage ? (
              // Auth Page Back Link
              <div className="flex items-center gap-3">
                <Link href="/">
                  <button className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-mono text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-white/10 transition-colors cursor-pointer">
                    Back to Home
                  </button>
                </Link>
              </div>
            ) : (
              // Authenticated Workspace Header with User Profile Dropdown
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#ffffff] dark:bg-[#181716] hover:bg-[#ede8df] dark:hover:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 hover:border-[#cc785c]/60 text-xs font-mono text-[#121110] dark:text-[#faf9f5] transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#f0ebe1] dark:bg-[#252320] border border-[#cc785c] flex items-center justify-center font-bold text-[10px] text-[#cc785c] dark:text-[#faf9f5]">
                        {userDisplayName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[#121110] dark:text-[#faf9f5] font-bold truncate max-w-[110px] hidden sm:inline">{userDisplayName}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#57534e] dark:text-[#a09d96] transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Authenticated Dropdown Menu */}
                    <AnimatePresence>
                      {userDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-64 bg-[#ffffff]/95 dark:bg-[#181716]/95 border border-[#ded7cb] dark:border-white/10 rounded-2xl p-2.5 shadow-2xl z-50 text-xs font-mono space-y-1 backdrop-blur-2xl"
                        >
                          <div className="p-3 border-b border-[#ded7cb] dark:border-white/5 pb-3">
                            <p className="font-bold text-sm text-[#121110] dark:text-[#faf9f5] truncate">{userDisplayName}</p>
                            <p className="text-[11px] text-[#57534e] dark:text-[#8e8b82] truncate mt-0.5">{user?.email}</p>
                          </div>

                          <Link
                            href="/settings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#121110] dark:text-[#faf9f5] hover:bg-[#f6f4ee] dark:hover:bg-[#201e1c] hover:text-[#cc785c] transition-colors font-medium"
                          >
                            <Settings className="w-4 h-4 text-[#cc785c]" />
                            <span>Settings &amp; Billing</span>
                          </Link>

                          <Link
                            href="/onboarding?edit=true"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#121110] dark:text-[#faf9f5] hover:bg-[#f6f4ee] dark:hover:bg-[#201e1c] hover:text-[#cc785c] transition-colors font-medium"
                          >
                            <Compass className="w-4 h-4 text-[#2e8544] dark:text-[#5db872]" />
                            <span>Career DNA Vector</span>
                          </Link>

                          <a
                            href="mailto:contact@careerpilot-ai.com"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl text-[#57534e] dark:text-[#a09d96] hover:bg-[#f6f4ee] dark:hover:bg-[#201e1c] hover:text-[#121110] dark:hover:text-white transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
                            <span>Help &amp; Support</span>
                          </a>

                          <div className="pt-2 border-t border-[#ded7cb] dark:border-white/5">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer font-bold"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href="/auth">
                    <button className="px-4 py-2 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[#141413] dark:text-white transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Global Scroll Progress */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5 dark:bg-white/5">
          <div className="h-full bg-[#cc785c] transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
        </div>
      </header>

      {/* Mobile Full-Screen Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-[#f6f4ee]/98 dark:bg-[#121110]/98 backdrop-blur-2xl text-[#121110] dark:text-[#faf9f5] pt-24 pb-8 px-6 flex flex-col justify-between overflow-y-auto max-h-screen lg:hidden"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#ded7cb] dark:border-white/10">
                <span className="font-mono text-xs text-[#cc785c] uppercase tracking-widest block font-bold">
                  CAREERPILOT AI · MENU
                </span>
                <ThemeToggle showLabel />
              </div>
              
              <nav className="space-y-2">
                {isLandingPage ? (
                  <>
                    <Link
                      href="/#features"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3.5 rounded-xl border border-[#ded7cb] dark:border-white/5 bg-[#ffffff] dark:bg-[#181716] text-[#121110] dark:text-white hover:text-[#cc785c] transition-colors font-display text-xl"
                    >
                      Features
                    </Link>
                    <Link
                      href="/#pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3.5 rounded-xl border border-[#ded7cb] dark:border-white/5 bg-[#ffffff] dark:bg-[#181716] text-[#cc785c] font-display text-xl font-medium"
                    >
                      Pricing &amp; Plans
                    </Link>
                    <Link
                      href="/#section-introduce"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3.5 rounded-xl border border-[#ded7cb] dark:border-white/5 bg-[#ffffff] dark:bg-[#181716] text-[#121110] dark:text-white hover:text-[#cc785c] transition-colors font-display text-xl"
                    >
                      Platform DNA
                    </Link>
                  </>
                ) : (
                  appNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3.5 rounded-xl border border-[#ded7cb] dark:border-white/5 bg-[#ffffff] dark:bg-[#181716] text-[#121110] dark:text-white hover:text-[#cc785c] transition-colors shadow-sm"
                    >
                      <span className="text-[#cc785c]">{item.icon}</span>
                      <span className="font-display text-xl font-normal">{item.label}</span>
                    </Link>
                  ))
                )}

                {user && (
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-3.5 rounded-xl border border-[#ded7cb] dark:border-white/5 bg-[#ffffff] dark:bg-[#181716] text-[#121110] dark:text-white hover:text-[#cc785c] transition-colors shadow-sm"
                  >
                    <Settings className="w-5 h-5 text-[#cc785c]" />
                    <span className="font-display text-xl font-normal">Settings &amp; Billing</span>
                  </Link>
                )}
              </nav>
            </div>
            
            <div className="space-y-3 pt-6 border-t border-[#ded7cb] dark:border-white/10">
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#f0ebe1] dark:bg-[#1f1e1b] text-red-600 dark:text-red-400 font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out ({user.email})
                </button>
              ) : (
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-3.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-sm uppercase font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                    Sign In / Register <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
              <p className="text-center font-mono text-xs text-[#57534e] dark:text-[#8e8b82]">CAREERPILOT AI © 2026</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

