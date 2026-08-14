'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  // 1. Streamlined Minimal Footer for Authenticated Workspace Pages
  if (!isLandingPage) {
    return (
      <footer className="mt-auto bg-[#141210] text-[#a09d96] border-t border-white/10 py-6 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#cc785c] text-white flex items-center justify-center font-bold text-[10px]">
              CP
            </div>
            <span className="text-[#faf9f5]">CAREERPILOT AI</span>
            <span className="text-[#6c6a64] hidden sm:inline">•</span>
            <span className="text-[#6c6a64] hidden sm:inline">Autonomous Career OS</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[#6c6a64]">
            <Link href="/dashboard" className="hover:text-[#cc785c] transition-colors">Dashboard</Link>
            <Link href="/onboarding?edit=true" className="hover:text-[#cc785c] transition-colors">Career DNA</Link>
            <Link href="/resume" className="hover:text-[#cc785c] transition-colors">ATS Studio</Link>
            <Link href="/jobs" className="hover:text-[#cc785c] transition-colors">Job Fit</Link>
            <Link href="/interview" className="hover:text-[#cc785c] transition-colors">Mock Prep</Link>
            <Link href="/tracker" className="hover:text-[#cc785c] transition-colors">Tracker</Link>
          </div>

          <div className="text-center md:text-right text-[#6c6a64] text-[11px]">
            <span>© 2026 CareerPilot AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    );
  }

  // 2. Full Showcase Marketing Footer for Public Landing Page
  return (
    <footer className="mt-auto bg-[#141210] text-[#a09d96] border-t border-white/10 pt-20 pb-12 px-4 sm:px-8">
      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* Social Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-12 border-b border-white/10">
          <div className="flex items-center gap-6">
            <span className="font-mono text-sm uppercase tracking-widest text-[#6c6a64]">Social</span>
            <div className="flex items-center gap-6 font-mono text-sm">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">LinkedIn ↗</a>
              <a href="https://github.com/surajkrnet/CareerPilot-AI" target="_blank" rel="noreferrer" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">GitHub ↗</a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">Twitter/X ↗</a>
            </div>
          </div>
        </div>

        {/* Brand Banner */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#cc785c] text-white flex items-center justify-center font-mono font-bold text-base">CP</div>
            <span className="font-mono text-sm text-[#cc785c] uppercase tracking-widest">Autonomous Career Intelligence</span>
          </div>
          <h3 className="font-display text-4xl sm:text-6xl lg:text-7xl text-[#faf9f5] font-light leading-tight tracking-tight">
            Stop applying blindly. <br />
            <span className="text-[#cc785c]">Interview with calm certainty.</span>
          </h3>
        </div>

        {/* Bottom Action Row & Copyright Notice with Clean Responsive Grid Separation */}
        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8 pb-4">
          {/* Action Links */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-sm">
            <Link href="/onboarding" className="text-[#cc785c] hover:underline font-semibold">TRY DEMO ↗</Link>
            <Link href="/dashboard" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">CAREER DNA ↗</Link>
            <Link href="/resume" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">ATS SCANNER ↗</Link>
            <Link href="/interview" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">MOCK STUDIO ↗</Link>
            <Link href="/tracker" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">JOB TRACKER ↗</Link>
          </div>

          {/* Copyright Information */}
          <div className="md:text-right font-mono text-xs text-[#6c6a64] space-y-1">
            <p>Copyright © 2026 CareerPilot AI. All rights reserved.</p>
            <p className="text-[#cc785c]">Crafted with precision &amp; care.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
