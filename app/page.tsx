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

  const capabilities = [
    {
      num: '01',
      title: 'Career DNA Profiler',
      desc: 'Synthesize your verified experience, projects, and target role into a living AI competency vector with real-time gap metrics.',
      href: targetHref,
      icon: <Sparkles className="w-6 h-6 text-[#cc785c]" />,
      action: 'Synthesize DNA',
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
      desc: 'Real-time web scraping across LinkedIn, Wellfound, Naukri, and Y Combinator with batch AI match scores & deep links.',
      href: targetHref,
      icon: <Cpu className="w-6 h-6 text-[#cc785c]" />,
      action: 'Analyze Fit',
    },
    {
      num: '04',
      title: 'AI Mock Interview Studio',
      desc: 'Interactive roleplay drills with live delivery confidence, technical accuracy, and STAR evaluation meters.',
      href: targetHref,
      icon: <MessageSquare className="w-6 h-6 text-[#cc785c]" />,
      action: 'Practice Now',
    },
    {
      num: '05',
      title: 'Next-Best Action Dashboard',
      desc: 'Priority AI orchestrator recommending your single highest-impact daily action based on pipeline health.',
      href: targetHref,
      icon: <BarChart3 className="w-6 h-6 text-[#cc785c]" />,
      action: 'Open Dashboard',
    },
    {
      num: '06',
      title: 'Application Pipeline Kanban',
      desc: 'Full lifecycle drag-and-drop hiring pipeline spanning Saved, Applied, Interviewing, Offered, and Rejected roles.',
      href: targetHref,
      icon: <Briefcase className="w-6 h-6 text-[#cc785c]" />,
      action: 'Track Pipeline',
    },
  ];

  return (
    <div className="bg-[#181715] text-[#faf9f5] selection:bg-[#cc785c] selection:text-white font-sans">
      
      {/* ═══════════════════════════════════════════════
          SECTION I: HERO — Full-Bleed Video Background
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
              <span>THE AUTONOMOUS AI CAREER OPERATING SYSTEM</span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl xl:text-[6.8rem] text-[#faf9f5] font-light leading-[0.96] tracking-tight">
              Craft your <span className="text-[#cc785c] italic font-normal">Career DNA.</span> <br />
              Master every interview. <br />
              Land dream offers.
            </h1>

            <p className="text-lg sm:text-2xl text-[#a09d96] max-w-2xl font-sans font-light leading-relaxed">
              An autonomous studio for tech professionals, new graduates, and career switchers. Optimize resumes, rehearse live AI mock interviews, and organize your pipeline.
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
                {user ? 'Open My Career DNA ↗' : 'Get Started for Free ↗'}
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

        <ScrollIndicator targetId="section-introduce" />
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION II: INTRODUCE & SHOWREEL
         ═══════════════════════════════════════════════ */}
      <section id="section-introduce" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto space-y-20">
          <div className="space-y-6 max-w-4xl">
            <p className="font-mono text-sm uppercase tracking-widest text-[#cc785c]">Same passion. New mission.</p>
            <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl text-[#faf9f5] font-light leading-[1.05] tracking-tight">
              After years of building products for high-growth tech companies and guiding hundreds of candidates...
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-7">
              <VideoCard
                src="/videos/mock-interview-session.mp4"
                title="AI Mock Interview Studio"
                subtitle="Live evaluation of STAR responses, delivery tempo & technical depth"
                category="INTERACTIVE SHOWREEL"
                showMeters={true}
              />
            </div>
            <div className="lg:col-span-5 space-y-8 font-sans text-[#a09d96] text-lg sm:text-xl leading-relaxed">
              <p>
                The modern hiring pipeline is broken. Candidates submit hundreds of resumes into opaque ATS algorithms with zero actionable feedback.
              </p>
              <p>
                Our mission is to arm candidates with real-time behavioral simulation used by top engineering leaders—transforming anxiety into structured, offer-winning confidence.
              </p>
              <div className="pt-4 flex flex-wrap items-center gap-6">
                <Link href={targetHref} className="font-mono text-sm uppercase tracking-wider text-[#cc785c] hover:underline flex items-center gap-1.5">
                  Synthesize Your DNA <ChevronRight className="w-5 h-5" />
                </Link>
                <Link href={targetHref} className="font-mono text-sm uppercase tracking-wider text-[#faf9f5] hover:text-[#cc785c] transition-colors flex items-center gap-1.5">
                  Start Live Drill <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION III: MASSIVE TEXT REVEAL
         ═══════════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10 overflow-hidden">
        <div className="max-w-[1400px] mx-auto space-y-12">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <span className="font-mono text-sm uppercase tracking-widest text-[#cc785c] font-bold">III. IMPACT MATRIX</span>
            <span className="font-mono text-sm text-[#6c6a64]">SCALE · PRECISION · OUTCOMES</span>
          </div>
          <TextReveal />
          <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-white/10">
            <p className="text-base sm:text-lg text-[#a09d96] max-w-xl font-sans leading-relaxed">
              Engineered with proven STAR interview frameworks, semantic ATS parsing vectors, and personalized skill gap roadmaps.
            </p>
            <Link href={targetHref}>
              <Button
                variant="secondary-dark"
                size="lg"
                icon={<ArrowRight className="w-5 h-5 text-[#cc785c]" />}
                iconPosition="right"
                className="font-mono text-sm uppercase tracking-wider h-12 px-6"
              >
                Explore Platform ↗
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION IV: BRAND EXPERIENCE (BENCHMARK ROLES)
         ═══════════════════════════════════════════════ */}
      <section id="section-brand-experience" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <span className="font-mono text-sm uppercase tracking-widest text-[#cc785c] font-bold">IV. BENCHMARK ROLES</span>
            <span className="font-mono text-sm text-[#6c6a64]">REAL-WORLD HIRING CALIBRATION</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-3">
              {partnerBrands.map((brand, idx) => {
                const isActive = activeBrandIndex === idx;
                return (
                  <div
                    key={brand.name}
                    onMouseEnter={() => setActiveBrandIndex(idx)}
                    onClick={() => setActiveBrandIndex(idx)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-[#252320] border-[#cc785c] shadow-lg translate-x-2'
                        : 'bg-[#1f1e1b]/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-[#6c6a64]">0{idx + 1}</span>
                      <span className={`font-display text-2xl sm:text-3xl ${isActive ? 'text-[#cc785c]' : 'text-[#faf9f5]'}`}>
                        {brand.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-[#a09d96] hidden sm:inline">{brand.role}</span>
                      <span className={`px-2.5 py-1 rounded-md text-sm font-mono font-bold ${isActive ? 'bg-[#cc785c] text-white' : 'bg-white/10 text-[#a09d96]'}`}>
                        {brand.fit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-5">
              <Card variant="dark-elevated" className="p-8 space-y-6 border-white/10 shadow-2xl bg-[#1f1e1b]">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="font-mono text-sm text-[#cc785c] uppercase">Target Profile</span>
                    <h3 className="font-display text-4xl sm:text-5xl text-[#faf9f5] mt-1">{partnerBrands[activeBrandIndex].name}</h3>
                  </div>
                  <Badge variant="coral" size="md">{partnerBrands[activeBrandIndex].tag}</Badge>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#6c6a64]">TARGET ROLE:</span>
                    <span className="text-[#faf9f5] font-bold">{partnerBrands[activeBrandIndex].role}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#6c6a64]">KEY ATTRIBUTES:</span>
                    <span className="text-[#5db872]">{partnerBrands[activeBrandIndex].skills}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[#6c6a64]">MATCH CONFIDENCE:</span>
                    <span className="text-[#cc785c] font-bold">{partnerBrands[activeBrandIndex].fit}</span>
                  </div>
                </div>
                <Link href={targetHref}>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full font-mono text-sm uppercase tracking-wider h-12 bg-[#cc785c] hover:bg-[#a9583e]"
                    icon={<ArrowRight className="w-5 h-5" />}
                    iconPosition="right"
                  >
                    Practice {partnerBrands[activeBrandIndex].name} Interview
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION V: 6 AUTONOMOUS CAREER ENGINES (FEATURES)
         ═══════════════════════════════════════════════ */}
      <section id="features" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="space-y-2">
            <span className="font-mono text-sm uppercase tracking-widest text-[#cc785c] font-bold">V. UNIFIED SYSTEM</span>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <h2 className="font-display text-5xl sm:text-7xl text-[#faf9f5] font-light leading-tight">6 Autonomous Career Engines</h2>
              <p className="text-base sm:text-lg text-[#a09d96] max-w-md font-sans">
                Each engine works cohesively to transform fragmented job hunting into a high-probability process.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((cap) => (
              <Card
                key={cap.num}
                variant="dark-elevated"
                hoverable
                className="p-8 space-y-6 flex flex-col justify-between border-white/10 hover:border-[#cc785c]/60 transition-all bg-[#1f1e1b]"
                data-cursor="EXPLORE"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-[#252320] border border-white/10 flex items-center justify-center">
                      {cap.icon}
                    </div>
                    <span className="font-mono text-sm text-[#cc785c] font-bold">{cap.num}</span>
                  </div>
                  <h3 className="font-display text-3xl text-[#faf9f5]">{cap.title}</h3>
                  <p className="text-sm sm:text-base text-[#a09d96] font-sans leading-relaxed">{cap.desc}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <Link href={cap.href} className="font-mono text-sm uppercase font-bold text-[#cc785c] hover:underline flex items-center gap-1">
                    {cap.action} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION VI: MONETIZATION & PRICING MATRIX (CRUCIAL)
         ═══════════════════════════════════════════════ */}
      <section id="pricing" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10 bg-[#141210]">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          {/* Header & Toggle */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-widest text-[#cc785c] font-bold">
              VI. TRANSPARENT PRICING
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
          SECTION VII: GET IN TOUCH / ACTION LAUNCHPAD
         ═══════════════════════════════════════════════ */}
      <section id="section-get-in-touch" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="space-y-4">
            <span className="font-mono text-sm uppercase tracking-widest text-[#cc785c]">VII. GET IN TOUCH</span>
            <h2 className="font-display text-6xl sm:text-8xl lg:text-9xl text-[#cc785c] font-light uppercase tracking-tighter leading-none">
              LET&apos;S GET STARTED
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/10 font-mono">
            <div className="space-y-4 p-8 rounded-xl bg-[#1f1e1b] border border-white/10">
              <span className="text-sm text-[#6c6a64] uppercase block">Route 01</span>
              <h4 className="font-display text-3xl text-[#faf9f5]">Candidate Onboarding</h4>
              <p className="text-sm text-[#a09d96] font-sans">Build your Career DNA profile in under 2 minutes.</p>
              <Link href={targetHref} className="block pt-2">
                <Button variant="primary" size="sm" className="w-full uppercase text-sm bg-[#cc785c] hover:bg-[#a9583e]">
                  Launch Onboarding ↗
                </Button>
              </Link>
            </div>
            <div className="space-y-4 p-8 rounded-xl bg-[#1f1e1b] border border-white/10">
              <span className="text-sm text-[#6c6a64] uppercase block">Route 02</span>
              <h4 className="font-display text-3xl text-[#faf9f5]">AI Mock Studio</h4>
              <p className="text-sm text-[#a09d96] font-sans">Real-time roleplay drill with live STAR evaluation.</p>
              <Link href={targetHref} className="block pt-2">
                <Button variant="secondary-dark" size="sm" className="w-full uppercase text-sm text-[#faf9f5] border border-white/10">
                  Start Live Drill ↗
                </Button>
              </Link>
            </div>
            <div className="space-y-4 p-8 rounded-xl bg-[#1f1e1b] border border-white/10">
              <span className="text-sm text-[#6c6a64] uppercase block">Route 03</span>
              <h4 className="font-display text-3xl text-[#faf9f5]">Full Workspace</h4>
              <p className="text-sm text-[#a09d96] font-sans">Access Resume intelligence, job fit matrix, and application tracker.</p>
              <Link href={targetHref} className="block pt-2">
                <Button variant="secondary-dark" size="sm" className="w-full uppercase text-sm text-[#faf9f5] border border-white/10">
                  {user ? 'Open Dashboard ↗' : 'Sign In ↗'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
