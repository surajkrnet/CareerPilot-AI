'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Shield, Cpu, ExternalLink, Heart } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <footer className="mt-auto bg-[#141210] text-[#a09d96] border-t border-white/10 pt-16 pb-12 px-4 sm:px-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1 & 2: Brand Identity & Trust Statement */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group inline-flex">
              <div className="w-8 h-8 rounded-lg bg-[#cc785c] text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
                CP
              </div>
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#faf9f5] group-hover:text-[#cc785c] transition-colors uppercase">
                CAREERPILOT<span className="text-[#cc785c]"> AI</span>
              </span>
            </Link>

            <p className="text-xs text-[#a09d96] leading-relaxed max-w-sm">
              Your Autonomous AI Career Operating System. Craft verified Career DNA, optimize resumes with ATS precision, practice live STAR mock interviews, and land dream offers.
            </p>

            {/* Tech Trust Badge */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1e1b] border border-white/10 text-[11px] font-mono text-[#faf9f5]">
                <Cpu className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>Built with Next.js, Supabase &amp; OpenRouter</span>
              </div>
            </div>
          </div>

          {/* Col 3: Product Suite */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#faf9f5] font-semibold">
              Product Suite
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link href="/#features" className="hover:text-[#cc785c] transition-colors">
                  Core Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-[#cc785c] transition-colors">
                  Pricing &amp; Plans
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-[#cc785c] transition-colors">
                  Career DNA Profiler
                </Link>
              </li>
              <li>
                <Link href="/resume" className="hover:text-[#cc785c] transition-colors">
                  ATS Resume Scanner
                </Link>
              </li>
              <li>
                <Link href="/job-fit" className="hover:text-[#cc785c] transition-colors">
                  Job Fit Hub
                </Link>
              </li>
              <li>
                <Link href="/interview" className="hover:text-[#cc785c] transition-colors">
                  Mock Interview Studio
                </Link>
              </li>
              <li>
                <Link href="/tracker" className="hover:text-[#cc785c] transition-colors">
                  Application Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Company & Resources */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#faf9f5] font-semibold">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link href="/#section-introduce" className="hover:text-[#cc785c] transition-colors">
                  About Mission
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/surajkrnet/CareerPilot-AI"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#cc785c] transition-colors flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-[#6c6a64]" />
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#cc785c] transition-colors flex items-center gap-1"
                >
                  <span>LinkedIn Showcase</span>
                  <ExternalLink className="w-3 h-3 text-[#6c6a64]" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@careerpilot-ai.com"
                  className="hover:text-[#cc785c] transition-colors"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Responsible AI */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#faf9f5] font-semibold">
              Trust &amp; Privacy
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <span className="text-[#a09d96] hover:text-[#cc785c] cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-[#a09d96] hover:text-[#cc785c] cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-[#a09d96] hover:text-[#cc785c] cursor-pointer">
                  Responsible AI Guidelines
                </span>
              </li>
              <li>
                <Link href="/settings" className="text-[#cc785c] hover:underline flex items-center gap-1">
                  <span>Data Privacy &amp; Deletion</span>
                  <Shield className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6c6a64]">
          <p>© 2026 Suraj K R — CareerPilot AI. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Crafted with precision for Indian &amp; Global Tech Aspirants</span>
            <span className="text-[#cc785c]">•</span>
            <span className="text-[#faf9f5] font-semibold">Bengaluru, India</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
