'use client';

import React from 'react';
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
    current_skills?: string[];
  } | null;
  applicationsData?: Array<{
    id: string;
    company: string;
    role: string;
    status: string;
    match_score?: number;
  }> | null;
}

export default function DashboardView({
  userEmail,
  userName,
  careerDnaData,
  applicationsData,
}: DashboardViewProps) {
  const { profile, applications, setIsOnboardingOpen, setOnboardingStep } = useCareer();

  // Merge server Supabase data with career store defaults
  const displayName = userName || profile.name || userEmail?.split('@')[0] || 'Job Seeker';
  const targetRole = careerDnaData?.target_role || profile.targetRole;
  const experienceLevel = careerDnaData?.experience_level || profile.experienceLevel;
  const healthScore = careerDnaData?.health_score || profile.resumeHealthScore;
  const readinessScore = careerDnaData?.readiness_score || profile.interviewReadinessScore;
  const strengths = careerDnaData?.strengths || careerDnaData?.current_skills || profile.strengths;
  const skillGaps = careerDnaData?.skill_gaps || profile.skillGaps;

  const currentApps = applicationsData && applicationsData.length > 0 ? applicationsData : applications;
  const interviewingCount = currentApps.filter((a) => a.status === 'interviewing').length;
  const appliedCount = currentApps.filter((a) => a.status === 'applied').length;
  const offeredCount = currentApps.filter((a) => a.status === 'offered').length || 1;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-28 pb-16 space-y-10">
      
      {/* HEADER ROW: Candidate Profile Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-xl bg-[#252320] border border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#cc785c] shadow-sm"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl text-[#faf9f5]">Welcome back, {displayName}</h1>
              <Badge variant="coral" size="sm">{experienceLevel}</Badge>
            </div>
            <p className="text-sm font-medium text-[#a09d96]">{targetRole}</p>
            <p className="text-xs text-[#6c6a64] flex items-center gap-2">
              <span>Target Role: <strong className="text-[#faf9f5]">{targetRole}</strong></span>
              <span>•</span>
              <span>Target Companies: <strong className="text-[#faf9f5]">{profile.targetCompanies.join(', ')}</strong></span>
            </p>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
          <div className="text-center px-4 py-2 bg-[#1f1e1b] rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-[#cc785c]">{healthScore}%</div>
            <div className="text-[11px] text-[#6c6a64] font-medium">ATS Resume Fit</div>
          </div>

          <div className="text-center px-4 py-2 bg-[#1f1e1b] rounded-lg border border-white/10">
            <div className="text-2xl font-bold text-[#5db872]">{readinessScore}%</div>
            <div className="text-[11px] text-[#6c6a64] font-medium font-sans">Interview Ready</div>
          </div>

          <Button
            variant="secondary-dark"
            size="sm"
            onClick={() => {
              setOnboardingStep(3);
              setIsOnboardingOpen(true);
            }}
          >
            Edit DNA
          </Button>
        </div>
      </div>

      {/* AI NEXT-BEST ACTION BANNER (Full-width Coral #cc785c Callout Card) */}
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
                ⚡ Priority AI Recommendation
              </span>
              <span className="text-xs text-white/90">• High Impact (+18% Offer Probability)</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-white">
              Run a JD-Aligned Resume Scan for your target {targetRole.split('(')[0]} roles.
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Tailor your resume against your saved roles to boost your ATS match score before applying. Practicing 15 mins now boosts confidence score by 24%.
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <Link href="/resume">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto bg-[#1f1e1b] text-[#faf9f5] hover:bg-[#252320] border-none shadow-md font-semibold"
              icon={<ArrowRight className="w-4 h-4 text-[#cc785c]" />}
              iconPosition="right"
            >
              Scan Resume
            </Button>
          </Link>
          <Link href="/interview">
            <Button
              variant="secondary-dark"
              size="md"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md font-semibold"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Mock Interview
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* CAPABILITY GRID: 6 INTERACTIVE MODULE CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-[#faf9f5]">Connected Workspace Capabilities</h2>
          <span className="text-xs text-[#6c6a64]">6 Modules Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Career DNA */}
          <Card variant="dark-elevated" hoverable className="space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <Badge variant="teal" size="sm">Synthesized</Badge>
              </div>

              <h3 className="font-display text-2xl text-[#faf9f5]">1. Career DNA Studio</h3>
              <p className="text-xs text-[#a09d96] leading-relaxed">
                Profile strengths: {strengths.slice(0, 3).join(', ')}. Target gaps identified: {skillGaps.slice(0, 2).join(', ')}.
              </p>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-[#6c6a64]">
                  <span>Competency Density</span>
                  <span className="font-semibold text-[#faf9f5]">{healthScore}%</span>
                </div>
                <div className="w-full bg-[#1f1e1b] h-2 rounded-full overflow-hidden border border-white/5">
                  <div className="bg-[#cc785c] h-full rounded-full" style={{ width: `${healthScore}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64]">{strengths.length} Core Strengths</span>
              <Link href="/dashboard" onClick={() => { setOnboardingStep(3); setIsOnboardingOpen(true); }} className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Edit DNA Profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 2: Resume Intelligence */}
          <Card variant="dark-elevated" hoverable className="space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <Badge variant="coral" size="sm">{healthScore}% ATS Score</Badge>
              </div>

              <h3 className="font-display text-2xl text-[#faf9f5]">2. Resume Intelligence</h3>
              <p className="text-xs text-[#a09d96] leading-relaxed">
                3 AI-tailored bullet points ready to copy. Target JD alignment for Linear & Stripe verified.
              </p>

              <div className="p-2.5 rounded bg-[#1f1e1b] border border-white/10 text-xs font-mono text-[#a09d96]">
                ✓ Tailored bullet: &quot;Architected Next.js 14 App Router...&quot;
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64]">3 Tailored Bullets</span>
              <Link href="/resume" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Open Studio <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 3: Job Intelligence */}
          <Card variant="dark-elevated" hoverable className="space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <Badge variant="amber" size="sm">6 Roles Mapped</Badge>
              </div>

              <h3 className="font-display text-2xl text-[#faf9f5]">3. Job Fit Intelligence</h3>
              <p className="text-xs text-[#a09d96] leading-relaxed">
                Top match: Linear (94% Fit). Missing skills: System Architecture, Docker, WebGL.
              </p>

              <div className="flex flex-wrap gap-1">
                <Badge variant="dark" size="sm">Linear (94%)</Badge>
                <Badge variant="dark" size="sm">Stripe (91%)</Badge>
                <Badge variant="dark" size="sm">Vercel (89%)</Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64]">4 High Alignment</span>
              <Link href="/jobs" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                View Job Fit <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 4: Mock Interview */}
          <Card variant="dark-elevated" hoverable className="space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <Badge variant="success" size="sm">Live Session Ready</Badge>
              </div>

              <h3 className="font-display text-2xl text-[#faf9f5]">4. Mock Interview Agent</h3>
              <p className="text-xs text-[#a09d96] leading-relaxed">
                Live interviewer simulator active for Linear (Frontend Engineer). Real-time STAR score feedback.
              </p>

              <div className="p-2.5 rounded bg-[#181715] text-white text-xs space-y-1 font-mono">
                <div className="flex justify-between text-[#a09d96]">
                  <span>Confidence: <strong className="text-emerald-400">89%</strong></span>
                  <span>Accuracy: <strong className="text-emerald-400">92%</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64]">STAR Feedback</span>
              <Link href="/interview" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Launch Studio <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 5: Progress Analytics */}
          <Card variant="dark-elevated" hoverable className="space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <Badge variant="teal" size="sm">+14% Growth</Badge>
              </div>

              <h3 className="font-display text-2xl text-[#faf9f5]">5. Career Progress Stats</h3>
              <p className="text-xs text-[#a09d96] leading-relaxed">
                Weekly application pipeline velocity: 3 applications, 2 interview rounds active, 1 job offer extended.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#1f1e1b] p-2 rounded border border-white/10">
                  <div className="font-bold text-[#faf9f5] text-sm">{interviewingCount}</div>
                  <div className="text-[10px] text-[#6c6a64]">Interviewing</div>
                </div>
                <div className="bg-[#1f1e1b] p-2 rounded border border-white/10">
                  <div className="font-bold text-[#faf9f5] text-sm">{appliedCount}</div>
                  <div className="text-[10px] text-[#6c6a64]">Applied</div>
                </div>
                <div className="bg-[#1f1e1b] p-2 rounded border border-white/10">
                  <div className="font-bold text-[#5db872] text-sm">{offeredCount}</div>
                  <div className="text-[10px] text-[#6c6a64]">Offered</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64]">Weekly Benchmark</span>
              <Link href="/tracker" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                View Velocity <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 6: Application Tracker */}
          <Card variant="dark-elevated" hoverable className="space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <Badge variant="coral" size="sm">{currentApps.length} Roles</Badge>
              </div>

              <h3 className="font-display text-2xl text-[#faf9f5]">6. Application Tracker</h3>
              <p className="text-xs text-[#a09d96] leading-relaxed">
                Kanban pipeline managing active roles across Linear, Stripe, Vercel, Google, and Figma.
              </p>

              <div className="space-y-1 text-xs">
                {currentApps.slice(0, 2).map((app) => (
                  <div key={app.id} className="flex justify-between items-center bg-[#1f1e1b] p-2 rounded border border-white/10">
                    <span className="font-medium text-[#faf9f5]">{app.company}</span>
                    <Badge variant="teal" size="sm">{app.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#6c6a64]">Kanban Workspace</span>
              <Link href="/tracker" className="text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1">
                Open Tracker <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

        </div>
      </div>

    </div>
  );
}
