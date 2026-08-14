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
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, [supabase]);

  const targetHref = user ? '/onboarding' : '/auth';

  const partnerBrands = [
    { name: 'Linear', role: 'Frontend Engineer', fit: '94% Match', skills: 'React 19, TypeScript, UI Polish', tag: 'Fast-Track' },
    { name: 'Stripe', role: 'Software Engineer', fit: '91% Match', skills: 'Distributed Systems, Node.js, API Design', tag: 'High Yield' },
    { name: 'Vercel', role: 'DevRel Specialist', fit: '89% Match', skills: 'Next.js 16, App Router, Edge Runtime', tag: 'Active' },
    { name: 'Notion', role: 'Product Manager', fit: '96% Match', skills: 'Product Strategy, Execution, User Analytics', tag: 'Top Pick' },
    { name: 'Figma', role: 'Product Engineer', fit: '95% Match', skills: 'Canvas APIs, WebGL, Design Systems', tag: 'Featured' },
    { name: 'Anthropic', role: 'AI Systems Engineer', fit: '92% Match', skills: 'Prompt Engineering, Python, Model Eval', tag: 'AI Core' },
    { name: 'OpenAI', role: 'Full-Stack Developer', fit: '90% Match', skills: 'Next.js, Python, Streaming APIs', tag: 'High Fit' },
    { name: 'Google', role: 'Associate SWE', fit: '85% Match', skills: 'Data Structures, System Design, Go', tag: 'Scale' },
  ];

  const capabilities = [
    { num: '01', title: 'Career DNA Profiler', desc: 'Synthesize your experience, projects, and intent into a living competency vector with real-time gap metrics.', href: targetHref, icon: <Sparkles className="w-6 h-6 text-[#cc785c]" />, action: 'Synthesize DNA' },
    { num: '02', title: 'ATS Resume Intelligence', desc: 'Deep diagnostic scoring against target JDs with 1-click tailored bullet points that preserve authenticity.', href: targetHref, icon: <FileText className="w-6 h-6 text-[#cc785c]" />, action: 'Scan Resume' },
    { num: '03', title: 'Job Fit & Gap Analysis', desc: 'Understand why a role matches 94% or 62%, uncover missing prerequisites and generate prep checklists.', href: targetHref, icon: <Cpu className="w-6 h-6 text-[#cc785c]" />, action: 'Analyze Fit' },
    { num: '04', title: 'AI Mock Studio', desc: 'Interactive roleplay interviews with real-time STAR technique, technical accuracy, and behavioral feedback.', href: targetHref, icon: <MessageSquare className="w-6 h-6 text-[#cc785c]" />, action: 'Practice Now' },
    { num: '05', title: 'Next-Best Action Dashboard', desc: 'AI orchestrator recommending your single most impactful daily action based on pipeline health.', href: targetHref, icon: <BarChart3 className="w-6 h-6 text-[#cc785c]" />, action: 'Open Dashboard' },
    { num: '06', title: 'Application Pipeline', desc: 'Full lifecycle Kanban spanning Saved, Applied, Interviewing, Offered, and Rejected roles.', href: targetHref, icon: <Briefcase className="w-6 h-6 text-[#cc785c]" />, action: 'Track Pipeline' },
  ];

  return (
    <div className="bg-[#181715] text-[#faf9f5] selection:bg-[#cc785c] selection:text-white">
      
      {/* ═══════════════════════════════════════════════
          SECTION I: HERO — Full-Bleed Video Background
         ═══════════════════════════════════════════════ */}
      <section
        id="section-intro"
        className="relative min-h-[92vh] lg:min-h-screen flex flex-col justify-between pt-28 pb-12 px-4 sm:px-8 border-b border-white/10 overflow-hidden"
      >
        <BackgroundVideo
          src="/videos/hero-ambient-typing.mp4"
          overlayGradient="bg-gradient-to-t from-[#181715] via-[#181715]/65 to-[#181715]/35"
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
        </div>

        {/* Center Content */}
        <div className="relative z-20 max-w-[1400px] mx-auto w-full my-auto py-12 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 max-w-5xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm font-mono text-[#cc785c]">
              <Sparkles className="w-4 h-4" />
              <span>THE INTELLIGENT CAREER CO-PILOT</span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl xl:text-[7rem] text-[#faf9f5] font-light leading-[0.96] tracking-tight">
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
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <Link href={targetHref}>
              <Button
                variant="primary"
                size="lg"
                data-cursor="GET STARTED"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                className="font-mono uppercase tracking-wider text-sm px-10 h-14 bg-[#cc785c] hover:bg-[#a9583e]"
              >
                {user ? 'Open My Career DNA ↗' : 'Get Started Free ↗'}
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
              <p>The modern hiring pipeline is broken. Candidates submit hundreds of resumes into opaque ATS algorithms with zero actionable feedback.</p>
              <p>Our mission is to arm candidates with real-time behavioral simulation used by top engineering leaders—transforming anxiety into structured, offer-winning confidence.</p>
              <div className="pt-4 flex items-center gap-6">
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
              <Button variant="secondary-dark" size="lg"
                icon={<ArrowRight className="w-5 h-5 text-[#cc785c]" />} iconPosition="right"
                className="font-mono text-sm uppercase tracking-wider h-12 px-6">
                Explore Platform ↗
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION IV: BRAND EXPERIENCE
         ═══════════════════════════════════════════════ */}
      <section id="section-brand-experience" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-2">
              <span className="font-mono text-sm uppercase tracking-widest text-[#cc785c]">IV. TARGET BRAND EXPERIENCE</span>
              <h2 className="font-display text-4xl sm:text-6xl text-[#faf9f5] font-light">Target Companies &amp; Roles</h2>
            </div>
            <span className="font-mono text-sm text-[#6c6a64]">Hover any company to inspect live fit match</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-2">
              {partnerBrands.map((brand, idx) => {
                const isActive = activeBrandIndex === idx;
                return (
                  <div key={brand.name} onMouseEnter={() => setActiveBrandIndex(idx)}
                    className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isActive ? 'bg-[#252320] border-[#cc785c] translate-x-2 shadow-xl' : 'bg-[#1f1e1b]/60 border-white/5 hover:border-white/20'
                    }`}>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-[#6c6a64]">0{idx + 1}.</span>
                      <span className={`font-display text-3xl sm:text-4xl transition-colors ${isActive ? 'text-[#faf9f5]' : 'text-[#a09d96]'}`}>
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
              <Card variant="dark-elevated" className="p-8 space-y-6 border-white/10 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="font-mono text-sm text-[#cc785c] uppercase">Target Profile</span>
                    <h3 className="font-display text-5xl text-[#faf9f5] mt-1">{partnerBrands[activeBrandIndex].name}</h3>
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
                  <Button variant="primary" size="md" className="w-full font-mono text-sm uppercase tracking-wider h-12"
                    icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                    Practice {partnerBrands[activeBrandIndex].name} Interview
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION V: 6 CAPABILITIES
         ═══════════════════════════════════════════════ */}
      <section id="section-education" className="py-28 sm:py-36 px-4 sm:px-8 border-b border-white/10">
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
              <Card key={cap.num} variant="dark-elevated" hoverable
                className="p-8 space-y-6 flex flex-col justify-between border-white/10 hover:border-[#cc785c]/40 transition-colors"
                data-cursor="EXPLORE">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-lg bg-[#1f1e1b] border border-white/10 flex items-center justify-center">{cap.icon}</div>
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
          SECTION VI: CTA
         ═══════════════════════════════════════════════ */}
      <section id="section-get-in-touch" className="py-28 sm:py-36 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="space-y-4">
            <span className="font-mono text-sm uppercase tracking-widest text-[#cc785c]">VI. GET IN TOUCH</span>
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
                <Button variant="primary" size="sm" className="w-full uppercase text-sm">Launch Onboarding ↗</Button>
              </Link>
            </div>
            <div className="space-y-4 p-8 rounded-xl bg-[#1f1e1b] border border-white/10">
              <span className="text-sm text-[#6c6a64] uppercase block">Route 02</span>
              <h4 className="font-display text-3xl text-[#faf9f5]">AI Mock Studio</h4>
              <p className="text-sm text-[#a09d96] font-sans">Real-time roleplay drill with live STAR evaluation.</p>
              <Link href={targetHref} className="block pt-2">
                <Button variant="secondary-dark" size="sm" className="w-full uppercase text-sm text-[#faf9f5]">Start Live Drill ↗</Button>
              </Link>
            </div>
            <div className="space-y-4 p-8 rounded-xl bg-[#1f1e1b] border border-white/10">
              <span className="text-sm text-[#6c6a64] uppercase block">Route 03</span>
              <h4 className="font-display text-3xl text-[#faf9f5]">Full Workspace</h4>
              <p className="text-sm text-[#a09d96] font-sans">Access Resume intelligence, job fit matrix, and application tracker.</p>
              <Link href={targetHref} className="block pt-2">
                <Button variant="secondary-dark" size="sm" className="w-full uppercase text-sm text-[#faf9f5]">{user ? 'Open Dashboard ↗' : 'Sign In ↗'}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
