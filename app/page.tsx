'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Cpu,
  MessageSquare,
  Briefcase,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  TrendingUp,
  Award,
  Clock,
  Compass,
  Star,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BackgroundVideo } from '@/components/ui/background-video';
import { VideoCard } from '@/components/ui/video-card';
import { ScrollIndicator } from '@/components/ui/scroll-indicator';
import { TextReveal } from '@/components/ui/text-reveal';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly'>('monthly');
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, [supabase]);

  const targetHref = user ? '/dashboard' : '/auth';

  const partnerBrands = [
    { name: 'Linear', role: 'Frontend Engineer', fit: '94% Match', skills: 'React 19, TypeScript, UI Polish', tag: 'Fast-Track' },
    { name: 'Stripe', role: 'Software Engineer', fit: '91% Match', skills: 'Distributed Systems, Node.js, API Design', tag: 'High Yield' },
    { name: 'Razorpay', role: 'Associate Developer', fit: '95% Match', skills: 'Payment Systems, SQL, React', tag: 'Bengaluru' },
    { name: 'Postman', role: 'Backend Engineer', fit: '92% Match', skills: 'Java, Redis, API Lifecycle', tag: 'Remote' },
    { name: 'Zepto', role: 'Frontend Developer', fit: '88% Match', skills: 'Next.js, Tailwind, Performance', tag: 'Quick Commerce' },
    { name: 'Swiggy', role: 'Systems Analyst', fit: '89% Match', skills: 'Data Pipelines, Python, SQL', tag: 'High Growth' },
    { name: 'CRED', role: 'Full-Stack Engineer', fit: '90% Match', skills: 'TypeScript, Microfrontends, Golang', tag: 'FinTech' },
    { name: 'Google', role: 'Associate SWE', fit: '85% Match', skills: 'Data Structures, System Design, Go', tag: 'Scale' },
  ];

  const coreFeatures = [
    {
      num: '01',
      title: 'Career DNA Profiler',
      desc: 'Synthesize your verified experience, projects, and target role into a living AI competency vector with real-time gap analysis.',
      href: targetHref,
      icon: <Sparkles className="w-6 h-6 text-[#cc785c]" />,
      action: 'Calibrate DNA',
    },
    {
      num: '02',
      title: 'ATS Resume Intelligence',
      desc: 'Single-column parse-rate evaluation against target JDs with 1-click metric-driven STAR bullet point optimization.',
      href: targetHref,
      icon: <FileText className="w-6 h-6 text-[#cc785c]" />,
      action: 'Scan Resume',
    },
    {
      num: '03',
      title: 'Live Web Job Fit Engine',
      desc: 'Real-time web scraping across LinkedIn, Wellfound, Naukri, and Y Combinator with batch AI skill scoring and direct apply links.',
      href: targetHref,
      icon: <Cpu className="w-6 h-6 text-[#cc785c]" />,
      action: 'Scrape Opportunities',
    },
    {
      num: '04',
      title: 'AI Mock Interview Studio',
      desc: 'Interactive roleplay drills with live delivery confidence, technical accuracy, and STAR structure evaluation meters.',
      href: targetHref,
      icon: <MessageSquare className="w-6 h-6 text-[#cc785c]" />,
      action: 'Start Practice Round',
    },
    {
      num: '05',
      title: 'Next-Best Action Dashboard',
      desc: 'Priority AI orchestrator recommending your single highest-leverage daily action to maximize recruiter callback rates.',
      href: targetHref,
      icon: <BarChart3 className="w-6 h-6 text-[#cc785c]" />,
      action: 'Open Command Center',
    },
    {
      num: '06',
      title: 'Application Pipeline Kanban',
      desc: 'Drag-and-drop hiring pipeline across Saved, Applied, Interviewing, Offered, and Rejected stages with INR LPA tracking.',
      href: targetHref,
      icon: <Briefcase className="w-6 h-6 text-[#cc785c]" />,
      action: 'Track Applications',
    },
  ];

  return (
    <div className="bg-[#181715] text-[#faf9f5] selection:bg-[#cc785c] selection:text-white">
      
      {/* ═══════════════════════════════════════════════
          SECTION I: HERO — Autonomous AI Career Operating System
         ═══════════════════════════════════════════════ */}
      <section
        id="section-intro"
        className="relative min-h-[92vh] lg:min-h-screen flex flex-col justify-between pt-28 pb-12 px-4 sm:px-8 border-b border-white/10 overflow-hidden"
      >
        <BackgroundVideo
          src="/videos/hero-ambient-typing.mp4"
          overlayGradient="bg-gradient-to-t from-[#181715] via-[#181715]/75 to-[#181715]/40"
          className="absolute inset-0 z-0 h-full"
        />

        {/* Top Tag */}
        <div className="relative z-20 max-w-[1400px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#cc785c] animate-pulse" />
            <span className="font-mono text-sm uppercase tracking-widest text-[#a09d96]">
              I. INTRO · CAREERPILOT AI
            </span>
          </div>
          <span className="font-mono text-xs text-[#6c6a64] uppercase hidden sm:inline">
            Autonomous Career OS
          </span>
        </div>

        {/* Center Content */}
        <div className="relative z-20 max-w-[1400px] mx-auto w-full my-auto py-12 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 max-w-5xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm font-mono text-[#cc785c]">
              <Sparkles className="w-4 h-4" />
              <span>AUTONOMOUS AI CAREER OPERATING SYSTEM</span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl xl:text-[6.8rem] text-[#faf9f5] font-light leading-[0.96] tracking-tight">
              Your Autonomous <br />
              <span className="text-[#cc785c] italic font-normal">AI Career Operating System.</span>
            </h1>

            <p className="text-lg sm:text-2xl text-[#a09d96] max-w-2xl font-sans font-light leading-relaxed">
              Stop applying blindly. Build verified Career DNA, optimize resumes with ATS precision, practice live AI mock interviews, and land offers at top tech companies.
            </p>
          </motion.div>

          {/* Action Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Link href={targetHref}>
              <Button
                variant="primary"
                size="lg"
                data-cursor="GET STARTED"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                className="font-mono uppercase tracking-wider text-sm px-10 h-14 bg-[#cc785c] hover:bg-[#a9583e] shadow-xl"
              >
                {user ? 'Open My Workspace ↗' : 'Get Started for Free ↗'}
              </Button>
            </Link>

            <Link href="/#pricing">
              <Button
                variant="secondary-dark"
                size="lg"
                className="font-mono uppercase tracking-wider text-sm px-8 h-14 bg-white/10 hover:bg-white/20 text-[#faf9f5] border border-white/20"
              >
                View Plans (From ₹0)
              </Button>
            </Link>
          </motion.div>
        </div>

        <ScrollIndicator targetId="features" />
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION II: CORE FEATURES GRID
         ═══════════════════════════════════════════════ */}
      <section id="features" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#cc785c]">
                II. PLATFORM MODULES
              </span>
              <h2 className="font-display text-4xl sm:text-6xl text-[#faf9f5] font-light tracking-tight">
                6 Connected Career Engines. <br />
                <span className="text-[#cc785c] italic">One Unified Workspace.</span>
              </h2>
            </div>
            <p className="text-sm text-[#a09d96] font-sans max-w-md">
              Every tool shares candidate context in real-time. Changes to your resume automatically recalibrate job recommendations and mock interview drills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feat) => (
              <Card
                key={feat.num}
                variant="dark-elevated"
                className="p-8 bg-[#1f1e1b] border-white/10 hover:border-[#cc785c]/60 transition-all flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#252320] flex items-center justify-center group-hover:scale-110 transition-transform">
                      {feat.icon}
                    </div>
                    <span className="font-mono text-xs font-bold text-[#6c6a64]">{feat.num}</span>
                  </div>

                  <h3 className="font-display text-2xl font-bold text-[#faf9f5] group-hover:text-[#cc785c] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#a09d96] font-sans leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <Link
                  href={feat.href}
                  className="font-mono text-xs uppercase text-[#cc785c] group-hover:underline flex items-center gap-1.5 pt-4 border-t border-white/5"
                >
                  <span>{feat.action}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION III: SHOWREEL & LIVE DEMO
         ═══════════════════════════════════════════════ */}
      <section id="section-introduce" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto space-y-20">
          <div className="space-y-4 max-w-4xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#cc785c]">
              III. LIVE DEMO &amp; INTELLIGENCE
            </span>
            <h2 className="font-display text-4xl sm:text-6xl text-[#faf9f5] font-light leading-tight tracking-tight">
              Real-time roleplay drills with instant STAR scoring.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <VideoCard
                src="/videos/mock-interview-session.mp4"
                title="AI Mock Interview Studio"
                subtitle="Live evaluation of STAR responses, delivery tempo & technical depth"
                category="INTERACTIVE SHOWREEL"
                showMeters={true}
              />
            </div>

            <div className="lg:col-span-5 space-y-8 font-sans text-[#a09d96] text-base sm:text-lg leading-relaxed">
              <p>
                Opaque recruitment filters and ghosting end here. Our engine evaluates your real answer delivery, technical accuracy, and metric impact in live multi-turn conversations.
              </p>

              <div className="p-4 bg-[#1f1e1b] rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#5db872] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Real Placement Outcomes</span>
                </div>
                <p className="text-xs text-[#a09d96] font-mono leading-relaxed">
                  +34% higher recruiter callback rate after ATS STAR optimization. Average 2.8x increase in candidate technical confidence.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Link href={targetHref}>
                  <Button variant="primary" size="md" className="bg-[#cc785c] hover:bg-[#a9583e] font-mono uppercase text-xs">
                    Try Live Mock Drill ↗
                  </Button>
                </Link>
                <Link href="/#pricing" className="font-mono text-xs uppercase text-[#faf9f5] hover:text-[#cc785c]">
                  See Pricing ↗
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION IV: MONETIZATION & PRICING MATRIX (CRUCIAL)
         ═══════════════════════════════════════════════ */}
      <section id="pricing" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10 bg-[#141210]">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          {/* Header & Toggle */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-widest text-[#cc785c] font-bold">
              IV. TRANSPARENT PRICING
            </span>
            <h2 className="font-display text-4xl sm:text-6xl text-[#faf9f5] font-light tracking-tight">
              Invest in your career. <br />
              <span className="text-[#cc785c] italic">Land high-yield offers.</span>
            </h2>
            <p className="text-sm text-[#a09d96] font-sans">
              Choose the plan tailored for your active job hunt. Simple INR pricing with zero hidden commitments.
            </p>

            {/* Monthly / Quarterly Toggle */}
            <div className="inline-flex items-center gap-2 p-1 bg-[#1f1e1b] rounded-lg border border-white/10 mt-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                    : 'text-[#a09d96] hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('quarterly')}
                className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'quarterly'
                    ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                    : 'text-[#a09d96] hover:text-white'
                }`}
              >
                <span>Quarterly (Save 25%)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                  Best Value
                </span>
              </button>
            </div>
          </div>

          {/* 3-Tier Pricing Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* TIER 1: Starter Copilot (Free Forever) */}
            <div className="p-8 rounded-2xl bg-[#1f1e1b] border border-white/10 flex flex-col justify-between space-y-8 shadow-md">
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#a09d96]">
                    Tier 01 · Basic
                  </span>
                  <h3 className="font-display text-3xl font-bold text-[#faf9f5] mt-1">Starter Copilot</h3>
                  <p className="text-xs text-[#8e8b82] mt-1">Essential toolkit to calibrate your career baseline.</p>
                </div>

                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-4xl sm:text-5xl font-bold text-[#faf9f5]">₹0</span>
                  <span className="text-xs font-mono text-[#6c6a64]">/ month (Free Forever)</span>
                </div>

                <ul className="space-y-3 text-xs font-mono text-[#dcd7cb] pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>Full Career DNA Synthesis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>3 ATS Resume Scans / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>Unlimited Basic ATS Keyword Checks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>1 AI Mock Interview Drill / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>Application Pipeline Kanban</span>
                  </li>
                </ul>
              </div>

              <Link href={targetHref}>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full border-white/20 hover:border-[#cc785c] font-mono text-xs uppercase text-[#faf9f5]"
                >
                  Get Started for Free ↗
                </Button>
              </Link>
            </div>

            {/* TIER 2: Placement Pro (Recommended & Highlighted) */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#252320] via-[#1f1e1b] to-[#181715] border-2 border-[#cc785c] flex flex-col justify-between space-y-8 shadow-2xl relative overflow-hidden ring-4 ring-[#cc785c]/20 lg:-translate-y-2">
              <div className="absolute top-0 right-0 bg-[#cc785c] text-white text-[10px] font-mono uppercase font-bold px-4 py-1 rounded-bl-lg tracking-wider">
                ★ Recommended
              </div>

              <div className="space-y-6">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#cc785c] font-bold">
                    Tier 02 · Full Power
                  </span>
                  <h3 className="font-display text-3xl font-bold text-[#faf9f5] mt-1">Placement Pro</h3>
                  <p className="text-xs text-[#a09d96] mt-1">Comprehensive engine for serious candidate placement.</p>
                </div>

                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    {billingCycle === 'monthly' ? '₹399' : '₹899'}
                  </span>
                  <span className="text-xs font-mono text-[#a09d96]">
                    {billingCycle === 'monthly' ? '/ month' : '/ quarter (₹299/mo eqv)'}
                  </span>
                </div>

                <ul className="space-y-3 text-xs font-mono text-[#faf9f5] pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Resume Scans &amp; Tailoring</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>15 AI Mock Interviews / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#cc785c] shrink-0" />
                    <span>Cold LinkedIn &amp; HR Outreach Generator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#cc785c] shrink-0" />
                    <span>WhatsApp Placement Assistant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#cc785c] shrink-0" />
                    <span>Priority AI Inference Latency (&lt;15s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#cc785c] shrink-0" />
                    <span>Live Web Scraping Platform Deep Links</span>
                  </li>
                </ul>
              </div>

              <Link href={user ? '/settings' : '/auth'}>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-[#cc785c] hover:bg-[#a9583e] font-mono text-xs uppercase font-bold shadow-lg"
                >
                  Upgrade to Placement Pro ↗
                </Button>
              </Link>
            </div>

            {/* TIER 3: Placement Drive Pass (7-Day Top-Up) */}
            <div className="p-8 rounded-2xl bg-[#1f1e1b] border border-white/10 flex flex-col justify-between space-y-8 shadow-md">
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#a09d96]">
                    Tier 03 · Sprint Pass
                  </span>
                  <h3 className="font-display text-3xl font-bold text-[#faf9f5] mt-1">Placement Drive Pass</h3>
                  <p className="text-xs text-[#8e8b82] mt-1">High-octane sprint for campus or off-campus drive week.</p>
                </div>

                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-4xl sm:text-5xl font-bold text-[#faf9f5]">₹199</span>
                  <span className="text-xs font-mono text-[#6c6a64]">one-time (7-Day Validity)</span>
                </div>

                <ul className="space-y-3 text-xs font-mono text-[#dcd7cb] pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>5 Extra Full Mock Interview Drills</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>10 JD-Specific Resume Tailorings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>STAR Optimization Workbench Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5db872] shrink-0" />
                    <span>Valid for 7 days during active rounds</span>
                  </li>
                </ul>
              </div>

              <Link href={user ? '/settings' : '/auth'}>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full border-white/20 hover:border-[#cc785c] font-mono text-xs uppercase text-[#faf9f5]"
                >
                  Buy 7-Day Drive Pass (₹199) ↗
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION V: CONVERSION BANNER
         ═══════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 border-b border-white/10 bg-gradient-to-r from-[#1f1e1b] via-[#252320] to-[#1f1e1b]">
        <div className="max-w-[1200px] mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30 font-mono text-xs">
            <Award className="w-4 h-4" />
            <span>JOIN THOUSANDS OF PLACED ENGINEERS</span>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl text-[#faf9f5] font-light tracking-tight max-w-3xl mx-auto leading-tight">
            Ready to calibrate your Career DNA and land your next role?
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href={targetHref}>
              <Button
                variant="primary"
                size="lg"
                className="bg-[#cc785c] hover:bg-[#a9583e] font-mono uppercase text-xs sm:text-sm px-8 h-12"
              >
                Get Started for Free ↗
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button
                variant="secondary-dark"
                size="lg"
                className="bg-[#181715] hover:bg-[#252320] text-white border border-white/10 font-mono uppercase text-xs sm:text-sm px-8 h-12"
              >
                Explore Pro Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
