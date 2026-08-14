'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#141210] text-[#a09d96] border-t border-white/10 pt-20 pb-12 px-4 sm:px-8">
      <div className="max-w-[1400px] mx-auto space-y-16">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-12 border-b border-white/10">
          <div className="flex items-center gap-6">
            <span className="font-mono text-sm uppercase tracking-widest text-[#6c6a64]">Social</span>
            <div className="flex items-center gap-6 font-mono text-sm">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">LinkedIn ↗</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">GitHub ↗</a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">Twitter/X ↗</a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#cc785c] text-white flex items-center justify-center font-mono font-bold text-base">CP</div>
            <span className="font-mono text-sm text-[#cc785c] uppercase tracking-widest">Autonomous Career Intelligence</span>
          </div>
          <h3 className="font-display text-5xl sm:text-7xl lg:text-8xl text-[#faf9f5] font-light leading-none tracking-tight">
            Stop applying blindly. <br />
            <span className="text-[#cc785c]">Interview with calm certainty.</span>
          </h3>
        </div>

        <div className="pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-8 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-sm">
            <Link href="/onboarding" className="text-[#cc785c] hover:underline">TRY DEMO ↗</Link>
            <Link href="/dashboard" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">CAREER DNA ↗</Link>
            <Link href="/resume" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">ATS SCANNER ↗</Link>
            <Link href="/interview" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">MOCK STUDIO ↗</Link>
            <Link href="/tracker" className="text-[#faf9f5] hover:text-[#cc785c] transition-colors">JOB TRACKER ↗</Link>
          </div>
          <div className="md:col-span-4 md:text-right font-mono text-xs text-[#6c6a64]">
            <p>Copyright ©2026 CareerPilot AI. All rights reserved.</p>
            <p className="text-[#cc785c] mt-0.5">Crafted with precision &amp; care.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
