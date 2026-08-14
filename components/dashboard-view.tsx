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
  Zap,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Target,
  Edit3,
  BookOpen,
  Layers,
  MapPin,
  GraduationCap,
  Clock,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';

export interface DashboardViewProps {
  userEmail?: string;
  userName?: string;
  careerDnaData?: {
    target_role?: string;
    experience_level?: string;
    health_score?: number;
    readiness_score?: number;
    strengths?: string[];
    skill_gaps?: string[];
    areas_to_improve?: string[];
    current_skills?: string[];
    skills_to_acquire?: string[];
    target_roles?: string[];
    recommended_actions?: string[];
    summary?: string;
    education?: string;
    preferred_location?: string;
    work_preference?: string;
  } | null;
  resumeScansData?: Array<{
    id?: string;
    ats_score?: number;
    missing_skills?: string[];
    feedback_summary?: any;
    target_jd?: string;
    created_at?: string;
  }> | null;
  applicationsData?: Array<{
    id: string;
    company: string;
    role: string;
    status: string;
    match_score?: number;
    salary?: string;
  }> | null;
}

export default function DashboardView({
  userEmail,
  userName,
  careerDnaData,
  resumeScansData,
  applicationsData,
}: DashboardViewProps) {
  const { profile, applications, resumeState } = useCareer();
  const [mounted, setMounted] = useState(false);
  const [cachedDna, setCachedDna] = useState<any>(null);

  // Avoid hydration mismatches by mounting safely on client
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('careerpilot_career_dna');
        if (saved) {
          setCachedDna(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Cache read notice:', e);
      }
    }
  }, []);

  // Compute values with safe fallbacks
  const displayName =
    userName || cachedDna?.fullName || profile?.name || (userEmail ? userEmail.split('@')[0] : 'Engineer');
  const targetRole =
    careerDnaData?.target_role || cachedDna?.targetRole || profile?.targetRole || 'Full-Stack Development';
  const experienceLevel =
    careerDnaData?.experience_level || cachedDna?.experienceLevel || profile?.experienceLevel || '0–1 Years';
  const healthScore =
    careerDnaData?.health_score || cachedDna?.resumeHealthScore || profile?.resumeHealthScore || 92;
  const readinessScore =
    careerDnaData?.readiness_score || cachedDna?.interviewReadinessScore || profile?.interviewReadinessScore || 86;
  const strengths =
    careerDnaData?.strengths ||
    careerDnaData?.current_skills ||
    cachedDna?.strengths ||
    profile?.strengths || [
      'React 19 & Next.js Architecture',
      'TypeScript & Modular Systems',
      'Node.js & Express / NestJS',
      'PostgreSQL & Relational Data Modeling',
      'RESTful & GraphQL API Design',
    ];
  const skillGaps =
    careerDnaData?.areas_to_improve ||
    careerDnaData?.skill_gaps ||
    careerDnaData?.skills_to_acquire ||
    cachedDna?.skillGaps ||
    profile?.skillGaps || [
      'Distributed Caching & Redis Pipelines',
      'Docker & Kubernetes Cloud Deployment',
      'Automated Integration Testing Suites',
    ];
  const summary =
    careerDnaData?.summary ||
    cachedDna?.summary ||
    profile?.title ||
    'Full-stack engineer with strong front-to-back mastery, modern TypeScript proficiency, and agile product execution focus.';
  const education = cachedDna?.education || 'B.Tech / B.E.';
  const location = cachedDna?.preferredLocation || 'Bangalore';
  const workPreference = cachedDna?.workPreference || 'Hybrid';

  const currentApps =
    applicationsData && applicationsData.length > 0
      ? applicationsData
      : applications && applications.length > 0
      ? applications
      : [
          { id: '1', company: 'Linear', role: 'Frontend Engineer', status: 'interviewing', match_score: 94, salary: '₹28L - ₹42L LPA' },
          { id: '2', company: 'Stripe', role: 'Full-Stack Engineer', status: 'applied', match_score: 91, salary: '₹32L - ₹48L LPA' },
          { id: '3', company: 'Vercel', role: 'DevRel Specialist', status: 'saved', match_score: 89, salary: '₹24L - ₹36L LPA' },
        ];

  // Latest resume scan from DB or store
  const latestDbScan = resumeScansData && resumeScansData.length > 0 ? resumeScansData[0] : null;
  const latestAtsScore = latestDbScan?.ats_score || resumeState?.atsScore || healthScore;
  const latestMissingSkills = latestDbScan?.missing_skills || resumeState?.missingSkills || skillGaps;
  const latestBullet =
    latestDbScan?.feedback_summary?.tailoredBulletPoints?.[0] || resumeState?.tailoredBulletPoints?.[0];

  const hasCareerDna = !!careerDnaData || !!cachedDna;
  const hasResumeAnalysis = !!latestDbScan || (resumeState?.atsScore > 0 && resumeState?.matchStrengths?.length > 0);

  // Loading skeleton while mounting on first paint
  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-28 pb-16 space-y-8 animate-pulse">
        <div className="h-32 bg-[#252320] rounded-xl border border-white/10" />
        <div className="h-24 bg-[#cc785c]/20 rounded-xl border border-white/10" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-[#252320] rounded-xl border border-white/10" />
          <div className="lg:col-span-5 h-96 bg-[#252320] rounded-xl border border-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-28 pb-16 space-y-10">
      
      {/* 1. HEADER ROW: CANDIDATE CAREER IDENTITY & QUICK STATS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-xl bg-[#252320] border border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1f1e1b] border-2 border-[#cc785c] flex items-center justify-center font-display text-2xl font-bold text-[#faf9f5] shadow-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl text-[#faf9f5]">Welcome back, {displayName}</h1>
              <Badge variant="coral" size="sm">{experienceLevel}</Badge>
            </div>
            <p className="text-sm font-medium text-[#a09d96]">{targetRole}</p>
            <p className="text-xs text-[#6c6a64] flex flex-wrap items-center gap-2">
              <span>Target: <strong className="text-[#faf9f5]">{targetRole}</strong></span>
              <span>•</span>
              <span>Location: <strong className="text-[#faf9f5]">{location} ({workPreference})</strong></span>
              <span>•</span>
              <span>Degree: <strong className="text-[#faf9f5]">{education}</strong></span>
            </p>
          </div>
        </div>

        {/* Action & Stats summary */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
          <div className="text-center px-4 py-2 bg-[#1f1e1b] rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-[#cc785c] font-sans">{healthScore}%</div>
            <div className="text-[11px] text-[#6c6a64] font-medium">ATS Match</div>
          </div>

          <div className="text-center px-4 py-2 bg-[#1f1e1b] rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-[#5db872] font-sans">{readinessScore}%</div>
            <div className="text-[11px] text-[#6c6a64] font-medium">Interview Ready</div>
          </div>

          <Link href="/onboarding?edit=true">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              className="border-white/20 hover:border-[#cc785c]"
            >
              Edit DNA
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. ONBOARDING PROMPT BANNER (IF CAREER DNA IS NOT YET FULLY CONFIGURED) */}
      {!hasCareerDna && (
        <div className="p-6 rounded-xl bg-[#1f1e1b] border border-[#cc785c]/50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#cc785c] shrink-0" />
            <div>
              <h3 className="font-display text-xl text-[#faf9f5]">Your Career DNA is not yet fully calibrated</h3>
              <p className="text-xs text-[#a09d96]">Run our 2-minute onboarding to extract strengths and calibrate interview questions.</p>
            </div>
          </div>
          <Link href="/onboarding">
            <Button variant="primary" size="sm" className="bg-[#cc785c] hover:bg-[#a9583e] uppercase font-mono text-xs">
              Complete Onboarding ↗
            </Button>
          </Link>
        </div>
      )}

      {/* 3. AI NEXT-BEST ACTION PRIORITY BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#cc785c] text-white rounded-xl p-6 sm:p-8 border border-[#b8674d] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="w-12 h-12 rounded-lg bg-[#1f1e1b]/20 border border-white/20 flex items-center justify-center shrink-0 mt-0.5 text-yellow-300">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#1f1e1b]/30 px-2 py-0.5 rounded text-white font-mono">
                ⚡ Priority AI Next Action
              </span>
              <span className="text-xs text-white/90">• High Impact (+22% Interview Conversion)</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-white">
              Scan &amp; Optimize Your Resume for target {targetRole} roles.
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Your Career DNA has been synthesized. Run a live JD-aligned scan in Resume Intelligence to inject active STAR bullet points and increase your ATS pass rate.
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <Link href="/resume">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto bg-[#1f1e1b] text-[#faf9f5] hover:bg-[#252320] border-none shadow-md font-semibold font-mono text-xs uppercase"
              icon={<ArrowRight className="w-4 h-4 text-[#cc785c]" />}
              iconPosition="right"
            >
              Resume Studio
            </Button>
          </Link>
          <Link href="/jobs">
            <Button
              variant="secondary-dark"
              size="md"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md font-semibold font-mono text-xs uppercase"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Explore Jobs
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 4. CORE COMMAND CENTER: 4-PILLAR INTELLIGENCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PILLAR 1 & 2 (LEFT 7 COLS): CAREER DNA + RESUME INTELLIGENCE */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION: CAREER DNA SUMMARY */}
          <Card variant="dark-elevated" className="p-6 sm:p-7 border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-[#faf9f5]">Career DNA Profile</h3>
                  <p className="text-[11px] text-[#6c6a64]">Synthesized by n8n Agent Workflow</p>
                </div>
              </div>
              <Badge variant="teal" size="sm">Active Vector</Badge>
            </div>

            <p className="text-xs text-[#a09d96] leading-relaxed bg-[#1f1e1b] p-3.5 rounded-lg border border-white/5 font-sans">
              &quot;{summary}&quot;
            </p>

            {/* Core Competencies Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Core Technical Strengths ({strengths.length})</span>
                <span className="text-[#5db872] font-mono text-[11px]">✓ Verified Match</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((str: string) => (
                  <Badge key={str} variant="dark" size="sm" className="bg-[#1f1e1b] border-white/10 text-xs">
                    ✓ {str}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Target Skill Gaps to Close */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#e8a55a] uppercase font-mono text-[11px]">Identified Skill Gaps ({skillGaps.length})</span>
                <span className="text-[#e8a55a] font-mono text-[11px]">! Recommended to Learn</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skillGaps.map((gap: string) => (
                  <Badge key={gap} variant="amber" size="sm" className="text-xs">
                    + {gap}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64] font-mono">Readiness: {readinessScore}%</span>
              <Link href="/onboarding?edit=true" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Edit Preferences <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* SECTION: RESUME INTELLIGENCE & ATS SUMMARY */}
          <Card variant="dark-elevated" className="p-6 sm:p-7 border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-[#faf9f5]">Resume &amp; ATS Intelligence</h3>
                  <p className="text-[11px] text-[#6c6a64]">Keyword density, formatting &amp; bullet points</p>
                </div>
              </div>
              <Badge variant="coral" size="sm">{latestAtsScore}% ATS Score</Badge>
            </div>

            {hasResumeAnalysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#1f1e1b] rounded-lg border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#6c6a64]">Match Strengths</span>
                    <p className="text-xs text-[#5db872] font-semibold">{strengths?.length || 3} Core Areas</p>
                  </div>
                  <div className="p-3 bg-[#1f1e1b] rounded-lg border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#6c6a64]">Missing Keywords</span>
                    <p className="text-xs text-[#e8a55a] font-semibold">{latestMissingSkills?.length || 2} Keyword Gaps</p>
                  </div>
                </div>

                {/* Sample Tailored Bullet */}
                {latestBullet && (
                  <div className="p-3 bg-[#181715] rounded-lg border border-[#cc785c]/30 space-y-1.5">
                    <span className="text-[10px] font-mono text-[#cc785c] uppercase font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Optimized Active Bullet Available:</span>
                    </span>
                    <p className="text-xs text-[#faf9f5] italic font-sans leading-relaxed">
                      &quot;{latestBullet.suggestedText || latestBullet}&quot;
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-[#1f1e1b] border border-white/10 text-center space-y-3">
                <p className="text-xs text-[#a09d96]">
                  Resume analysis ready to run against your target job posting.
                </p>
                <Link href="/resume">
                  <Button variant="primary" size="sm" className="bg-[#cc785c] hover:bg-[#a9583e]">
                    Open Resume Studio
                  </Button>
                </Link>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64] font-mono">3 Tailored Bullet Points</span>
              <Link href="/resume" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Open Resume Studio <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

        </div>

        {/* PILLAR 3 & 4 (RIGHT 5 COLS): JOB FIT + INTERVIEWS + RECOMMENDATIONS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SECTION: JOB FIT OPPORTUNITIES */}
          <Card variant="dark-elevated" className="p-6 sm:p-7 border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-[#faf9f5]">Job Fit Matches</h3>
                  <p className="text-[11px] text-[#6c6a64]">8 Hiring Engines Connected</p>
                </div>
              </div>
              <Badge variant="teal" size="sm">India &amp; Global</Badge>
            </div>

            <div className="space-y-2">
              {currentApps.slice(0, 3).map((app) => (
                <div key={app.id} className="p-3 bg-[#1f1e1b] rounded-lg border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#faf9f5]">{app.company}</h4>
                    <p className="text-[11px] text-[#6c6a64] truncate max-w-[180px]">{app.role}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-[#5db872] font-bold">{(app as any).match_score || (app as any).matchScore || 92}% Fit</span>
                    <p className="text-[10px] text-[#a09d96] font-mono">{app.salary || '₹28L - ₹42L LPA'}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64] font-mono">LinkedIn, Naukri, Indeed</span>
              <Link href="/jobs" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Explore All Jobs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* SECTION: CAREERPILOT AI RECOMMENDATIONS */}
          <Card variant="dark-elevated" className="p-6 sm:p-7 border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#cc785c]" />
                <h3 className="font-display text-lg text-[#faf9f5]">CareerPilot Recommendations</h3>
              </div>
              <Badge variant="coral" size="sm">Action Items</Badge>
            </div>

            <ul className="space-y-3">
              <li className="text-xs text-[#a09d96] bg-[#1f1e1b] p-3 rounded-lg border border-white/10 space-y-1">
                <span className="font-bold text-[#faf9f5] flex items-center gap-1.5">
                  <span className="text-[#5db872]">1.</span> Target Role Alignment
                </span>
                <p className="text-[11px] text-[#6c6a64] leading-relaxed">
                  Your profile shows strong mastery in {strengths.slice(0, 2).join(' and ')}. Highlight your production projects on your resume header.
                </p>
              </li>

              <li className="text-xs text-[#a09d96] bg-[#1f1e1b] p-3 rounded-lg border border-white/10 space-y-1">
                <span className="font-bold text-[#faf9f5] flex items-center gap-1.5">
                  <span className="text-[#e8a55a]">2.</span> Close Top Skill Gap: {skillGaps[0] || 'System Architecture'}
                </span>
                <p className="text-[11px] text-[#6c6a64] leading-relaxed">
                  High-paying roles in {location} frequently test for this competency during technical rounds.
                </p>
              </li>

              <li className="text-xs text-[#a09d96] bg-[#1f1e1b] p-3 rounded-lg border border-white/10 space-y-1">
                <span className="font-bold text-[#faf9f5] flex items-center gap-1.5">
                  <span className="text-[#cc785c]">3.</span> Rehearse STAR Interview Scenarios
                </span>
                <p className="text-[11px] text-[#6c6a64] leading-relaxed">
                  Practice 15 minutes of roleplay drills in the AI Mock Studio to boost live response clarity.
                </p>
              </li>
            </ul>

            <div className="pt-2">
              <Link href="/interview">
                <Button variant="outline" size="sm" className="w-full text-xs font-mono" icon={<MessageSquare className="w-3.5 h-3.5" />}>
                  Launch Mock Interview Simulator
                </Button>
              </Link>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
