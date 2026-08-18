'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Menu,
  ArrowRight,
  LogOut,
  Sparkles,
  FileText,
  Briefcase,
  MessageSquare,
  BarChart3,
  User,
  Compass,
  Settings,
  HelpCircle,
  ChevronDown,
  Shield,
  CreditCard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCareer } from '@/lib/career-store';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useCareer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/auth';

  // Check Supabase Auth State
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.warn('Auth check notice:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Click outside to close user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
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
      <header className="fixed top-0 left-0 right-0 z-50 h-20 w-full nav-blur-dark text-[#faf9f5] border-b border-white/10 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          
          {/* Left: Brand Identity (Logo + CAREERPILOT AI) */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#faf9f5] flex items-center justify-center text-[#181715] group-hover:bg-[#cc785c] group-hover:text-white transition-all shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="18" fill="none" viewBox="0 0 31 25">
                <path fill="currentColor" d="M5.838.705H.5L9.94 24.28l2.743-6.92zM25.162.705H30.5L21.06 24.28l-2.743-6.92zM19.281.73h-7.562l3.732 9.538z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#faf9f5] group-hover:text-[#cc785c] transition-colors leading-none uppercase">
                CAREERPILOT<span className="text-[#cc785c]"> AI</span>
              </span>
              <span className="text-[9px] font-mono text-[#6c6a64] uppercase tracking-widest hidden sm:inline">
                Autonomous Career OS
              </span>
            </div>
          </Link>

          {/* Center Navigation:
              1. PUBLIC LANDING PAGE: Features, Pricing
              2. AUTHENTICATED PAGES: Full app suite navigation
          */}
          {isLandingPage ? (
            <nav className="hidden md:flex items-center gap-6 font-mono text-xs text-[#a09d96]">
              <Link href="/#features" className="hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="hover:text-[#cc785c] transition-colors font-medium">
                Pricing &amp; Plans
              </Link>
              <Link href="/#section-introduce" className="hover:text-white transition-colors">
                About
              </Link>
            </nav>
          ) : (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {appNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === '/resume' && pathname === '/resume-intelligence') ||
                  (item.href === '/job-fit' && (pathname === '/job-fit' || pathname === '/jobs'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                      isActive
                        ? 'bg-[#252320] text-[#cc785c] border border-[#cc785c]/40 font-semibold shadow-sm'
                        : 'text-[#a09d96] hover:text-white hover:bg-[#252320]/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {isLandingPage ? (
              // Public Landing Page Header Actions
              <div className="flex items-center gap-3">
                {user ? (
                  <Link href="/dashboard">
                    <button className="px-5 py-2.5 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth" className="hidden sm:inline-block">
                      <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#faf9f5] border border-white/10 transition-colors cursor-pointer">
                        Log In
                      </button>
                    </Link>
                    <Link href="/auth">
                      <button className="px-5 py-2.5 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
                        <span>Get Started Free</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </>
                )}
              </div>
            ) : isAuthPage ? (
              // Auth Page Header: Clean Back to Home Link
              <div className="flex items-center gap-3">
                <Link href="/">
                  <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#faf9f5] border border-white/10 transition-colors cursor-pointer">
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
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1e1b] hover:bg-[#252320] border border-white/10 hover:border-[#cc785c]/40 text-xs font-mono text-[#a09d96] transition-all cursor-pointer shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#252320] border border-[#cc785c] flex items-center justify-center font-bold text-[10px] text-[#faf9f5]">
                        {userDisplayName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[#faf9f5] truncate max-w-[110px] hidden sm:inline">{userDisplayName}</span>
                      <ChevronDown className="w-3 h-3 text-[#6c6a64]" />
                    </button>

                    {/* Authenticated Dropdown Menu */}
                    <AnimatePresence>
                      {userDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-[#1f1e1b] border border-white/10 rounded-xl p-2 shadow-2xl z-50 text-xs font-mono space-y-1"
                        >
                          <div className="p-2 border-b border-white/5 pb-2.5">
                            <p className="font-bold text-[#faf9f5] truncate">{userDisplayName}</p>
                            <p className="text-[11px] text-[#6c6a64] truncate">{user?.email}</p>
                          </div>

                          <Link
                            href="/settings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-lg text-[#faf9f5] hover:bg-[#252320] hover:text-[#cc785c] transition-colors"
                          >
                            <Settings className="w-4 h-4 text-[#cc785c]" />
                            <span>Settings &amp; Billing</span>
                          </Link>

                          <Link
                            href="/onboarding?edit=true"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-lg text-[#faf9f5] hover:bg-[#252320] hover:text-[#cc785c] transition-colors"
                          >
                            <Compass className="w-4 h-4 text-[#5db872]" />
                            <span>Career DNA Vector</span>
                          </Link>

                          <a
                            href="mailto:contact@careerpilot-ai.com"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-lg text-[#a09d96] hover:bg-[#252320] hover:text-white transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
                            <span>Help &amp; Support</span>
                          </a>

                          <div className="pt-1 border-t border-white/5">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
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
                    <button className="px-4 py-2 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
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
              className="lg:hidden w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Global Scroll Progress */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
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
            className="fixed inset-0 z-40 bg-[#181715] pt-24 pb-8 px-6 flex flex-col justify-between overflow-y-auto max-h-screen lg:hidden"
          >
            <div className="space-y-6">
              <span className="font-mono text-xs text-[#cc785c] uppercase tracking-widest block">
                CAREERPILOT AI · MENU
              </span>
              
              <nav className="space-y-2">
                {isLandingPage ? (
                  <>
                    <Link
                      href="/#features"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3 rounded-lg border border-white/5 bg-[#1f1e1b] text-white hover:text-[#cc785c] transition-colors font-display text-xl"
                    >
                      Features
                    </Link>
                    <Link
                      href="/#pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3 rounded-lg border border-white/5 bg-[#1f1e1b] text-[#cc785c] font-display text-xl"
                    >
                      Pricing &amp; Plans
                    </Link>
                    <Link
                      href="/#section-introduce"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3 rounded-lg border border-white/5 bg-[#1f1e1b] text-white hover:text-[#cc785c] transition-colors font-display text-xl"
                    >
                      About Mission
                    </Link>
                  </>
                ) : (
                  appNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-3 rounded-lg border border-white/5 bg-[#1f1e1b] text-white hover:text-[#cc785c] transition-colors"
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
                    className="flex items-center gap-3 py-3 px-3 rounded-lg border border-white/5 bg-[#1f1e1b] text-white hover:text-[#cc785c] transition-colors"
                  >
                    <Settings className="w-5 h-5 text-[#cc785c]" />
                    <span className="font-display text-xl font-normal">Settings &amp; Billing</span>
                  </Link>
                )}
              </nav>
            </div>
            
            <div className="space-y-3 pt-6 border-t border-white/10">
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-lg bg-[#252320] text-red-400 font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out ({user.email})
                </button>
              ) : (
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-3.5 rounded-lg bg-[#cc785c] text-white font-mono text-sm uppercase font-bold tracking-wider flex items-center justify-center gap-2">
                    Sign In / Register <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              )}
              <p className="text-center font-mono text-xs text-[#6c6a64]">CAREERPILOT AI © 2026</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
