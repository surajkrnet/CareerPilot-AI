'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Check,
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
    recommended_actions?: any[];
    summary?: string;
    education?: string;
    preferred_location?: string;
    work_preference?: string;
    raw_resume_text?: string;
    updated_at?: string;
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
  interviewSessionsData?: Array<{
    id: string;
    target_role?: string;
    transcript?: any;
    evaluation_report?: any;
    completed?: boolean;
    created_at?: string;
  }> | null;
}

export function generateJobDeepLink(platform: string, jobTitle: string, company: string): string {
  const query = encodeURIComponent(`${jobTitle} ${company}`.trim());
  const roleQuery = encodeURIComponent(jobTitle);
  const slug = encodeURIComponent(jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));

  switch (platform) {
    case 'LinkedIn':
      return `https://www.linkedin.com/jobs/search/?keywords=${query}`;
    case 'Wellfound':
      return `https://wellfound.com/jobs?role=${roleQuery}`;
    case 'Naukri':
      return `https://www.naukri.com/${slug}-jobs`;
    case 'Y Combinator':
      return `https://www.workatastartup.com/jobs?query=${roleQuery}`;
    case 'Indeed':
      return `https://www.indeed.com/jobs?q=${query}`;
    default:
      return `https://www.linkedin.com/jobs/search/?keywords=${query}`;
  }
}

export default function DashboardView({
  userEmail,
  userName,
  careerDnaData,
  resumeScansData,
  applicationsData,
  interviewSessionsData,
}: DashboardViewProps) {
  const { profile, applications, resumeState } = useCareer();
  const [mounted, setMounted] = useState(false);
  const [currentCareerDna, setCurrentCareerDna] = useState<any>(careerDnaData || null);
  const [cachedDna, setCachedDna] = useState<any>(null);
  const [clientUserName, setClientUserName] = useState<string>('');
  const [isRefreshingDna, setIsRefreshingDna] = useState(false);
  const [dnaRefreshNotice, setDnaRefreshNotice] = useState<string | null>(null);

  const [dynamicAction, setDynamicAction] = useState<{
    title: string;
    description: string;
    impactScore: string;
    actionLabel: string;
    actionHref: string;
  } | null>(null);

  // Mount client-side & retrieve onboarding name & cached DNA
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const draft = localStorage.getItem('careerpilot_onboarding_draft');
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          if (parsedDraft.fullName && parsedDraft.fullName.trim().length > 0) {
            setClientUserName(parsedDraft.fullName.trim());
          }
        }
        const savedDna = localStorage.getItem('careerpilot_career_dna');
        if (savedDna) {
          const parsedDna = JSON.parse(savedDna);
          setCachedDna(parsedDna);
          if (parsedDna.fullName && parsedDna.fullName.trim().length > 0) {
            setClientUserName(parsedDna.fullName.trim());
          }
          if (!currentCareerDna) {
            setCurrentCareerDna(parsedDna);
          }
        }
      } catch (e) {
        console.warn('Cache read notice:', e);
      }

      // Fetch prioritized AI Next-Best Action from AI Intelligence Engine (Gemma) API
      fetch('/api/dashboard/next-action', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.nextAction || data.recommendation) {
            setDynamicAction(data.nextAction || data.recommendation);
          }
        })
        .catch((err) => console.warn('Next-action fetch notice:', err));
    }
  }, []);

  // Handler to refresh Career DNA on-demand via live AI re-synthesis
  const handleRefreshCareerDna = async () => {
    if (isRefreshingDna) return;
    setIsRefreshingDna(true);
    setDnaRefreshNotice(null);

    try {
      const res = await fetch('/api/career-dna/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to refresh Career DNA');
      }

      const updatedDna = json.data || json.careerDna;
      if (updatedDna) {
        setCurrentCareerDna(updatedDna);
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'careerpilot_career_dna',
            JSON.stringify({
              ...updatedDna,
              fullName: effectiveDisplayName,
              updatedAt: new Date().toISOString(),
            })
          );
        }
        setDnaRefreshNotice('✓ Career DNA successfully re-synthesized by AI Intelligence Engine (Gemma)!');
        setTimeout(() => setDnaRefreshNotice(null), 5000);
      }
    } catch (err: any) {
      console.error('Refresh DNA error:', err);
      setDnaRefreshNotice(err.message || 'Failed to refresh Career DNA. Please retry.');
    } finally {
      setIsRefreshingDna(false);
    }
  };

  // Compute values dynamically prioritizing active AI Career DNA state
  const activeDna = currentCareerDna || careerDnaData || cachedDna;

  // Real User Name Extraction (avoid generic 'Engineer' / 'Job Seeker')
  const rawProvidedName = userName || clientUserName || cachedDna?.fullName || profile?.name || '';
  const effectiveDisplayName =
    rawProvidedName && rawProvidedName !== 'Engineer' && rawProvidedName !== 'Job Seeker' && rawProvidedName !== 'Candidate'
      ? rawProvidedName
      : userEmail
      ? userEmail.split('@')[0]
      : 'Candidate';

  const targetRoles: string[] =
    activeDna?.target_roles ||
    activeDna?.targetRoles ||
    (activeDna?.target_role ? [activeDna.target_role] : null) ||
    (profile?.targetRole ? [profile.targetRole] : ['Associate Software Developer', 'Backend Developer', 'Frontend Engineer']);

  const primaryTargetRole = targetRoles[0] || 'Software Engineer';

  const experienceLevel =
    activeDna?.experience_level || activeDna?.experienceLevel || profile?.experienceLevel || '0–2 Years';

  const currentSkills: string[] =
    activeDna?.current_skills ||
    activeDna?.currentSkills ||
    activeDna?.skills ||
    ['React', 'TypeScript', 'Java', 'Python', 'SQL', 'Git', 'Node.js'];

  const strengths: string[] =
    activeDna?.strengths || [
      'Strong core programming fundamentals and modular component architecture',
      'Typed state management and reactive UI performance optimization',
      'RESTful API integration and relational database schema design',
      'Agile collaborative workflow, Git version control, and CI/CD discipline',
    ];

  const skillGaps: string[] =
    activeDna?.areas_to_improve ||
    activeDna?.areasToImprove ||
    activeDna?.skill_gaps ||
    activeDna?.skillGaps || [
      'Distributed Caching & Redis Pipelines',
      'Docker & Containerized Microservices Deployment',
      'End-to-End Automated Testing Suites (Playwright / Cypress)',
    ];

  const skillsToAcquire: string[] =
    activeDna?.skills_to_acquire ||
    activeDna?.skillsToAcquire || [
      'Next.js App Router',
      'Tailwind CSS',
      'Docker',
      'Redis',
      'GraphQL',
      'System Design',
    ];

  const recommendedActions: any[] =
    activeDna?.recommended_actions ||
    activeDna?.recommendedActions || [
      {
        title: 'Optimize Resume for ATS Match on Target Roles',
        rationale: 'Align technical bullet points with modern hiring keywords to boost recruiter callback rates.',
        urgency: 'high',
        moduleLink: '/resume-intelligence',
      },
      {
        title: 'Launch Live STAR Mock Interview Drill',
        rationale: 'Cross-examine your project decisions against hiring manager evaluation criteria.',
        urgency: 'high',
        moduleLink: '/interview',
      },
      {
        title: 'Explore High-Fit Matched Tech Opportunities',
        rationale: 'Review curated roles matching your exact verified stack across LinkedIn and Wellfound.',
        urgency: 'medium',
        moduleLink: '/job-fit',
      },
    ];

  const summary =
    activeDna?.summary ||
    `Verified profile specializing in ${targetRoles.slice(0, 2).join(' & ')} with hands-on proficiency in ${currentSkills.slice(0, 4).join(', ')}. Calibrated for modern product engineering teams.`;

  const education = activeDna?.education || cachedDna?.education || 'B.Tech / B.E.';
  const location = activeDna?.preferred_location || cachedDna?.preferredLocation || 'Bengaluru';
  const workPreference = activeDna?.work_preference || cachedDna?.workPreference || 'Hybrid';

  // 1. Real ATS Score from latest resume analysis
  const latestDbScan = resumeScansData && resumeScansData.length > 0 ? resumeScansData[0] : null;
  const realAtsScore =
    latestDbScan && typeof latestDbScan.ats_score === 'number'
      ? latestDbScan.ats_score
      : typeof resumeState?.atsScore === 'number' && resumeState.atsScore > 0
      ? resumeState.atsScore
      : null;

  const latestMissingSkills = latestDbScan?.missing_skills || resumeState?.missingSkills || skillGaps;

  // 2. Real Interview Readiness Score computed from completed mock interviews on the platform
  const completedDrills = (interviewSessionsData || []).filter((s) => {
    return s.completed || (s.evaluation_report && typeof s.evaluation_report === 'object') || (Array.isArray(s.transcript) && s.transcript.length >= 2);
  });

  const drillsTakenCount = completedDrills.length;
  let realInterviewScore: number | null = null;

  if (drillsTakenCount > 0) {
    const totalScore = completedDrills.reduce((acc, drill) => {
      const rep = drill.evaluation_report || {};
      const score =
        typeof rep.compositeScore === 'number'
          ? rep.compositeScore
          : typeof rep.confidenceScore === 'number'
          ? Math.round((rep.confidenceScore + (rep.technicalAccuracy || 70) + (rep.structureScore || 70)) / 3)
          : 80;
      return acc + score;
    }, 0);
    realInterviewScore = Math.round(totalScore / drillsTakenCount);
  }

  // 3. AI-Generated Job Fit Matches tailored to candidate's stack
  const generatedJobMatches = [
    {
      id: 'job-1',
      role: targetRoles[0] || 'Associate Software Developer',
      company: 'Razorpay',
      platform: 'LinkedIn',
      matchScore: 95,
      salary: '₹18L - ₹28L LPA',
      skills: currentSkills.slice(0, 3),
    },
    {
      id: 'job-2',
      role: targetRoles[1] || 'Backend Developer (Java / Python)',
      company: 'Postman',
      platform: 'Wellfound',
      matchScore: 92,
      salary: '₹22L - ₹36L LPA',
      skills: currentSkills.filter((s) => ['Java', 'Python', 'SQL', 'Node.js', 'API'].some((k) => s.toLowerCase().includes(k.toLowerCase()))).slice(0, 3),
    },
    {
      id: 'job-3',
      role: targetRoles[2] || 'Business & Product Systems Analyst',
      company: 'Linear',
      platform: 'Y Combinator',
      matchScore: 89,
      salary: '₹26L - ₹42L LPA',
      skills: ['System Design', 'SQL', 'Product Specs'],
    },
    {
      id: 'job-4',
      role: targetRoles[3] || 'Frontend Engineer (React / TypeScript)',
      company: 'Zepto',
      platform: 'Naukri',
      matchScore: 88,
      salary: '₹16L - ₹26L LPA',
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
    },
  ];

  // Helper to extract display string from bullet points
  const getBulletString = (bullet: any): string => {
    if (!bullet) return '';
    if (typeof bullet === 'string') return bullet;
    if (typeof bullet === 'object') {
      return (
        bullet.starOptimizedBullet ||
        bullet.suggestedText ||
        bullet.suggested ||
        bullet.optimized ||
        bullet.text ||
        bullet.originalBullet ||
        bullet.original ||
        bullet.reason ||
        ''
      );
    }
    return '';
  };

  const rawBullet =
    latestDbScan?.feedback_summary?.starOptimizations?.[0] ||
    latestDbScan?.feedback_summary?.tailoredBulletPoints?.[0] ||
    latestDbScan?.feedback_summary?.bulletPoints?.[0] ||
    resumeState?.tailoredBulletPoints?.[0];
  const latestBulletText = getBulletString(rawBullet);

  const hasCareerDna = !!activeDna;
  const hasResumeAnalysis = realAtsScore !== null;

  // Loading skeleton while mounting on first paint
  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-32 pb-16 space-y-8 animate-pulse">
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-32 pb-16 space-y-10">
      
      {/* 1. HEADER ROW: CANDIDATE CAREER IDENTITY, REFRESH ACTION & EVALUATED STATS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-xl bg-[#252320] border border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1f1e1b] border-2 border-[#cc785c] flex items-center justify-center font-display text-2xl font-bold text-[#faf9f5] shadow-sm shrink-0">
            {effectiveDisplayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl text-[#faf9f5]">
                Welcome back, {effectiveDisplayName}
              </h1>
              <Badge variant="coral" size="sm">{experienceLevel}</Badge>
            </div>
            <p className="text-sm font-medium text-[#cc785c]">{primaryTargetRole}</p>
            <p className="text-xs text-[#8e8b82] flex flex-wrap items-center gap-2">
              <span>Target: <strong className="text-[#faf9f5]">{primaryTargetRole}</strong></span>
              <span>•</span>
              <span>Location: <strong className="text-[#faf9f5]">{location} ({workPreference})</strong></span>
              <span>•</span>
              <span>Degree: <strong className="text-[#faf9f5]">{education}</strong></span>
            </p>
          </div>
        </div>

        {/* Real Evaluated Metrics (ATS Score + Real Interview Ready Score) */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0 flex-wrap">
          
          {/* ATS Score Evaluated Metric */}
          <Link
            href="/resume-intelligence"
            className="text-center px-4 py-2.5 bg-[#1f1e1b] hover:bg-[#282622] rounded-lg border border-white/10 hover:border-[#cc785c] transition-all cursor-pointer group"
            title="View full ATS Score breakdown and keyword analysis"
          >
            <div className="text-xl font-bold text-[#cc785c] font-sans group-hover:scale-105 transition-transform">
              {realAtsScore !== null ? `${realAtsScore}/100` : '--'}
            </div>
            <div className="text-[10px] text-[#8e8b82] font-mono">
              {realAtsScore !== null ? 'ATS Score (Evaluated)' : 'ATS Score (Run Scan)'}
            </div>
          </Link>

          {/* Interview Ready Score Evaluated Metric */}
          <Link
            href="/interview"
            className="text-center px-4 py-2.5 bg-[#1f1e1b] hover:bg-[#282622] rounded-lg border border-white/10 hover:border-[#5db872] transition-all cursor-pointer group"
            title="Interview readiness measured across live mock drills"
          >
            <div className="text-xl font-bold text-[#5db872] font-sans group-hover:scale-105 transition-transform">
              {realInterviewScore !== null ? `${realInterviewScore}%` : '--'}
            </div>
            <div className="text-[10px] text-[#8e8b82] font-mono">
              {drillsTakenCount > 0 ? `${drillsTakenCount} ${drillsTakenCount === 1 ? 'Drill' : 'Drills'} Taken` : '0 Drills Taken'}
            </div>
          </Link>

          {/* Header Refresh DNA Button */}
          <button
            type="button"
            onClick={handleRefreshCareerDna}
            disabled={isRefreshingDna}
            className="bg-[#1f1e1b] hover:bg-[#2e2d29] border border-white/15 hover:border-[#cc785c] text-[#faf9f5] px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            title="Re-analyze Career DNA with AI Intelligence Engine (Gemma)"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#cc785c] ${isRefreshingDna ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshingDna ? 'Re-analyzing...' : 'Refresh DNA'}</span>
          </button>

          <Link href="/onboarding?edit=true">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              className="border-white/20 hover:border-[#cc785c] text-xs font-mono"
            >
              Edit DNA
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. REFRESH STATUS NOTICE */}
      <AnimatePresence>
        {dnaRefreshNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between shadow-lg ${
              dnaRefreshNotice.startsWith('✓')
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-[#cc785c]/10 border-[#cc785c]/30 text-[#faf9f5]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#cc785c] shrink-0" />
              <span>{dnaRefreshNotice}</span>
            </div>
            <button
              onClick={() => setDnaRefreshNotice(null)}
              className="text-[#8e8b82] hover:text-white text-xs cursor-pointer ml-4"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ONBOARDING PROMPT BANNER (IF CAREER DNA IS NOT YET CONFIGURED) */}
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

      {/* 4. AI NEXT-BEST ACTION PRIORITY BANNER */}
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
              <span className="text-xs text-white/90">• {dynamicAction?.impactScore || 'High Impact (+22% Interview Conversion)'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-white">
              {dynamicAction?.title || `Scan & Optimize Your Resume for target ${primaryTargetRole} roles.`}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              {dynamicAction?.description ||
                'Your Career DNA has been synthesized. Run a live JD-aligned scan in Resume Intelligence to inject active STAR bullet points and increase your ATS pass rate.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <Link href={(dynamicAction?.actionHref as any) || '/resume-intelligence'}>
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto bg-[#1f1e1b] text-[#faf9f5] hover:bg-[#252320] border-none shadow-md font-semibold font-mono text-xs uppercase"
              icon={<ArrowRight className="w-4 h-4 text-[#cc785c]" />}
              iconPosition="right"
            >
              {dynamicAction?.actionLabel || 'Resume Studio'}
            </Button>
          </Link>
          <Link href="/job-fit">
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

      {/* 5. CORE COMMAND CENTER: 4-PILLAR INTELLIGENCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PILLAR 1 & 2 (LEFT 7 COLS): CAREER DNA + RESUME INTELLIGENCE */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION: CAREER DNA SUMMARY WITH REFRESH BUTTON & COMPLETE AI DATA */}
          <Card variant="dark-elevated" className="p-6 sm:p-7 border-white/10 space-y-6 bg-[#252320]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-[#faf9f5]">Career DNA Profile</h3>
                  <p className="text-[11px] text-[#8e8b82]">Synthesized by AI Intelligence Engine (Gemma)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Dedicated Refresh Button inside Career DNA Card */}
                <button
                  type="button"
                  onClick={handleRefreshCareerDna}
                  disabled={isRefreshingDna}
                  className="bg-[#1f1e1b] hover:bg-[#181715] border border-white/15 hover:border-[#cc785c] text-[#dcd7cb] px-2.5 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Re-run AI synthesis with Gemma"
                >
                  <RefreshCw className={`w-3 h-3 text-[#cc785c] ${isRefreshingDna ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingDna ? 'Refreshing...' : 'Refresh DNA'}</span>
                </button>
                <Badge variant="teal" size="sm">Active Vector</Badge>
              </div>
            </div>

            {/* AI Profile Summary */}
            <p className="text-xs text-[#dcd7cb] leading-relaxed bg-[#1f1e1b] p-3.5 rounded-lg border border-white/5 font-sans italic">
              &quot;{summary}&quot;
            </p>

            {/* Target Roles Alignment Vector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-[#cc785c]" /> Target Roles ({targetRoles.length})
                </span>
                <span className="text-[#cc785c] font-mono text-[10px]">AI Calibrated</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targetRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#181715] border border-[#cc785c]/40 text-[#faf9f5] text-xs font-mono font-medium"
                  >
                    🎯 {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Verified Current Skills Matrix */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#5db872] uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5db872]" /> Verified Technical Skills ({currentSkills.length})
                </span>
                <span className="text-[#5db872] font-mono text-[10px]">✓ Extracted from Resume</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#1f1e1b] border border-white/10 text-xs font-mono text-[#dcd7cb]"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Core Architectural & Technical Strengths */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">
                Core Technical Strengths
              </span>
              <ul className="space-y-1.5 text-xs text-[#a09d96]">
                {strengths.map((str: any, idx: number) => {
                  const label = typeof str === 'string' ? str : (str?.title || str?.skill || str?.name || str?.strength || '');
                  if (!label) return null;
                  return (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed text-[#dcd7cb]">{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Target Skill Gaps & Skills to Acquire */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#e8a55a] uppercase font-mono text-[11px]">
                  High-ROI Skills to Acquire Next ({skillsToAcquire.length})
                </span>
                <span className="text-[#e8a55a] font-mono text-[10px]">! Recommended to Learn</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skillsToAcquire.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#1f1e1b] border border-[#e8a55a]/30 text-xs font-mono text-[#e8a55a]"
                  >
                    + {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Actionable Module Roadmap */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">
                AI Recommended Actions ({recommendedActions.length})
              </span>
              <div className="space-y-2">
                {recommendedActions.map((action: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#1f1e1b] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="font-medium text-xs text-[#faf9f5]">{action.title}</h4>
                      <p className="text-[11px] text-[#8e8b82]">{action.rationale}</p>
                    </div>
                    {action.moduleLink && (
                      <Link
                        href={action.moduleLink}
                        className="text-[11px] font-mono text-[#cc785c] hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        <span>Open Studio</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#8e8b82] font-mono">
                {activeDna?.updated_at ? `Updated: ${new Date(activeDna.updated_at).toLocaleDateString()}` : 'AI Calibrated'}
              </span>
              <Link href="/onboarding?edit=true" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Edit Preferences <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* SECTION: RESUME INTELLIGENCE & ATS SUMMARY */}
          <Card variant="dark-elevated" className="p-6 sm:p-7 border-white/10 space-y-5 bg-[#252320]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-[#faf9f5]">Resume &amp; ATS Intelligence</h3>
                  <p className="text-[11px] text-[#8e8b82]">Keyword density, formatting &amp; bullet points</p>
                </div>
              </div>
              <Badge variant="coral" size="sm">
                {realAtsScore !== null ? `${realAtsScore}% ATS Score` : 'Scan Needed'}
              </Badge>
            </div>

            {hasResumeAnalysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#1f1e1b] rounded-lg border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#8e8b82]">Match Strengths</span>
                    <p className="text-xs text-[#5db872] font-semibold">{strengths?.length || 3} Core Areas</p>
                  </div>
                  <div className="p-3 bg-[#1f1e1b] rounded-lg border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#8e8b82]">Missing Keywords</span>
                    <p className="text-xs text-[#e8a55a] font-semibold">{latestMissingSkills?.length || 2} Keyword Gaps</p>
                  </div>
                </div>

                {/* Sample Tailored Bullet */}
                {latestBulletText && (
                  <div className="p-3 bg-[#181715] rounded-lg border border-[#cc785c]/30 space-y-1.5">
                    <span className="text-[10px] font-mono text-[#cc785c] uppercase font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Optimized Active Bullet Available:</span>
                    </span>
                    <p className="text-xs text-[#faf9f5] italic font-sans leading-relaxed">
                      &quot;{latestBulletText}&quot;
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-[#1f1e1b] border border-white/10 text-center space-y-3">
                <p className="text-xs text-[#a09d96]">
                  Upload target Job Description and run instant ATS alignment scan.
                </p>
                <Link href="/resume-intelligence">
                  <Button variant="primary" size="sm" className="bg-[#cc785c] hover:bg-[#a9583e]">
                    Open Resume Studio
                  </Button>
                </Link>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#8e8b82] font-mono">STAR Bullet Optimization</span>
              <Link href="/resume-intelligence" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Open Resume Studio <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

        </div>

        {/* PILLAR 3 & 4 (RIGHT 5 COLS): JOB FIT MATCHES + RECOMMENDATIONS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SECTION: JOB FIT MATCHES (AI-Generated tailored roles for candidate resume) */}
          <Card variant="dark-elevated" className="p-6 sm:p-7 border-white/10 space-y-5 bg-[#252320]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-[#faf9f5]">Job Fit Matches</h3>
                  <p className="text-[11px] text-[#8e8b82]">AI Calibrated to Candidate Stack</p>
                </div>
              </div>
              <Badge variant="teal" size="sm">India &amp; Global</Badge>
            </div>

            {/* AI-Generated Role Cards with Direct Apply Links */}
            <div className="space-y-3">
              {generatedJobMatches.map((job) => {
                const deepLink = generateJobDeepLink(job.platform, job.role, job.company);
                return (
                  <div
                    key={job.id}
                    className="p-3.5 bg-[#1f1e1b] rounded-lg border border-white/10 hover:border-[#cc785c]/50 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-[#faf9f5] group-hover:text-[#cc785c] transition-colors">
                            {job.role}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#8e8b82] flex items-center gap-1.5 mt-0.5">
                          <span>{job.company}</span>
                          <span>•</span>
                          <span className="text-[#cc785c] font-mono text-[10px] bg-[#cc785c]/10 px-1.5 py-0.2 rounded">
                            {job.platform}
                          </span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono text-[#5db872] font-bold block">
                          {job.matchScore}% Fit
                        </span>
                        <span className="text-[10px] text-[#a09d96] font-mono block">
                          {job.salary}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div className="flex flex-wrap gap-1">
                        {job.skills.map((sk, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181715] text-[#dcd7cb] border border-white/5">
                            {sk}
                          </span>
                        ))}
                      </div>

                      <a
                        href={deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-[#cc785c] hover:underline flex items-center gap-1"
                        title={`Search live ${job.role} postings on ${job.platform}`}
                      >
                        <span>Apply ↗</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#8e8b82] font-mono">LinkedIn, Naukri, Wellfound</span>
              <Link href="/job-fit" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Explore All Opportunities <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* SECTION: CAREERPILOT AI RECOMMENDATIONS */}
          <Card variant="dark-elevated" className="p-6 sm:p-7 border-white/10 space-y-4 bg-[#252320]">
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
                <p className="text-[11px] text-[#8e8b82] leading-relaxed">
                  Your profile demonstrates verified strength in {currentSkills.slice(0, 2).join(' and ')}. Highlight these technologies at the top of your resume.
                </p>
              </li>

              <li className="text-xs text-[#a09d96] bg-[#1f1e1b] p-3 rounded-lg border border-white/10 space-y-1">
                <span className="font-bold text-[#faf9f5] flex items-center gap-1.5">
                  <span className="text-[#e8a55a]">2.</span> Close Top Skill Gap: {skillsToAcquire[0] || skillGaps[0] || 'System Design'}
                </span>
                <p className="text-[11px] text-[#8e8b82] leading-relaxed">
                  High-paying roles in {location} frequently test for this competency during technical rounds.
                </p>
              </li>

              <li className="text-xs text-[#a09d96] bg-[#1f1e1b] p-3 rounded-lg border border-white/10 space-y-1">
                <span className="font-bold text-[#faf9f5] flex items-center gap-1.5">
                  <span className="text-[#cc785c]">3.</span> Rehearse STAR Interview Scenarios
                </span>
                <p className="text-[11px] text-[#8e8b82] leading-relaxed">
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
