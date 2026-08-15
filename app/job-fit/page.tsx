'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MapPin,
  Building,
  BookmarkPlus,
  FileText,
  MessageSquare,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Zap,
  DollarSign,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCareer } from '@/lib/career-store';

interface JobOpportunity {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  experienceRequired: string;
  fitScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  whyFit: string;
  platform: 'LinkedIn' | 'Wellfound' | 'Naukri' | 'Y Combinator' | 'Indeed' | 'Glassdoor';
  applyUrl: string;
  estimatedSalary?: string;
  fullJobDescription: string;
}

interface MarketInsights {
  trendingSkills: string[];
  hiringOutlook: string;
}

export default function JobFitPage() {
  const router = useRouter();
  const supabase = createClient();
  const { setActiveInterviewCompany, setActiveInterviewRole } = useCareer();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [targetRole, setTargetRole] = useState<string>('Frontend / Full-Stack Engineer');
  const [verifiedSkills, setVerifiedSkills] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedFitScore, setSelectedFitScore] = useState<string>('All');
  const [expandedJdId, setExpandedJdId] = useState<string | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Modal JD State
  const [modalJob, setModalJob] = useState<JobOpportunity | null>(null);

  const fetchRecommendations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/jobs/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        json = { error: text || 'Failed to parse job recommendations response.' };
      }

      if (!res.ok) {
        if (json.needsOnboarding) {
          setErrorMsg('Career DNA profile not found. Please complete the Onboarding setup first.');
          return;
        }
        throw new Error(json.error || 'Failed to fetch job opportunities');
      }

      const recs = json.data?.recommendations || json.recommendations;
      if (Array.isArray(recs) && recs.length > 0) {
        setOpportunities(recs);
      }
      if (json.data?.marketInsights || json.marketInsights) {
        setMarketInsights(json.data?.marketInsights || json.marketInsights);
      }
      if (json.targetRole) {
        setTargetRole(json.targetRole);
      }
      if (json.currentSkills) {
        setVerifiedSkills(json.currentSkills);
      }
    } catch (err: any) {
      console.error('Job fit fetch error:', err);
      setErrorMsg(err.message || 'Unable to load job recommendations. Please retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Read cached Career DNA on mount for zero-latency initial state
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('careerpilot_career_dna');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.targetRoles?.[0] || parsed.targetRole) {
            setTargetRole(parsed.targetRoles?.[0] || parsed.targetRole);
          }
          if (parsed.currentSkills) {
            setVerifiedSkills(parsed.currentSkills);
          }
        }
      } catch (e) {}
    }
    fetchRecommendations();
  }, []);

  // Save Job to Supabase public.applications
  const handleSaveToTracker = async (job: JobOpportunity) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setToastMsg('Please sign in to save jobs to your tracker.');
        return;
      }

      const { error: insertError } = await supabase.from('applications').insert({
        user_id: user.id,
        company_name: job.companyName,
        job_title: job.jobTitle,
        status: 'Saved',
        job_url: job.applyUrl,
        match_score: job.fitScore,
        notes: `Matched via Job Fit Studio (${job.fitScore}% Match). Why Fit: ${job.whyFit}`,
        applied_date: new Date().toISOString(),
      });

      if (insertError) {
        console.warn('Track insert note:', insertError.message);
      }

      setSavedJobIds((prev) => new Set([...prev, job.id]));
      setToastMsg(`✓ "${job.jobTitle}" at ${job.companyName} saved to Application Tracker!`);
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err: any) {
      console.error('Error saving application:', err);
      setToastMsg('Could not save to tracker. Please retry.');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Pre-load JD into Resume Intelligence Studio
  const handleAnalyzeInResumeStudio = (job: JobOpportunity) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerpilot_target_jd', job.fullJobDescription);
      localStorage.setItem('careerpilot_target_role', `${job.companyName} - ${job.jobTitle}`);
    }
    router.push('/resume-intelligence');
  };

  // Forward JD & Role into Mock Interview Studio
  const handlePracticeMockInterview = (job: JobOpportunity) => {
    setActiveInterviewCompany(job.companyName);
    setActiveInterviewRole(job.jobTitle);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerpilot_target_jd', job.fullJobDescription);
      localStorage.setItem('careerpilot_target_role', job.jobTitle);
    }
    router.push('/interview');
  };

  // Filtered Opportunities
  const filteredJobs = opportunities.filter((job) => {
    const matchesSearch =
      job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.matchedSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = selectedPlatform === 'All' || job.platform === selectedPlatform;

    let matchesFit = true;
    if (selectedFitScore === '90') matchesFit = job.fitScore >= 90;
    else if (selectedFitScore === '75') matchesFit = job.fitScore >= 75;

    return matchesSearch && matchesPlatform && matchesFit;
  });

  const platformsList = ['All', 'LinkedIn', 'Wellfound', 'Naukri', 'Y Combinator', 'Indeed', 'Glassdoor'];

  return (
    <main className="min-h-screen bg-[#141413] text-[#faf9f5] pt-32 sm:pt-36 pb-16 px-4 sm:px-8 md:px-10 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-6 z-50 p-4 rounded-xl bg-[#1f1e1b] border border-[#cc785c] text-[#faf9f5] text-xs font-mono shadow-2xl flex items-center gap-3"
            >
              <Sparkles className="w-4 h-4 text-[#cc785c]" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 rounded bg-[#cc785c]/10 text-[#cc785c] text-[11px] font-mono font-semibold border border-[#cc785c]/30 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Job Fit &amp; Opportunity Hub
              </span>
              <span className="px-2.5 py-1 rounded bg-[#5db872]/10 text-[#5db872] text-[11px] font-mono font-semibold border border-[#5db872]/30">
                AI Match Grounded
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-[#faf9f5]">
              Job Fit &amp; Opportunity Recommendation Engine
            </h1>
            <p className="text-sm text-[#a09d96] mt-1 max-w-2xl">
              High-relevance job opportunities matched directly against your verified Career DNA competencies across top platforms.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => fetchRecommendations(true)}
              disabled={refreshing || loading}
              className="px-4 py-2.5 rounded-lg bg-[#252320] hover:bg-[#2c2a27] text-xs font-mono text-[#faf9f5] border border-white/10 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#cc785c] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Analyzing Market...' : 'Refresh AI Opportunities'}</span>
            </button>
          </div>
        </header>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.includes('Onboarding') && (
              <Link href="/onboarding">
                <button className="px-3 py-1.5 rounded bg-[#cc785c] text-white text-xs font-mono font-semibold cursor-pointer">
                  Start Onboarding ↗
                </button>
              </Link>
            )}
          </div>
        )}

        {/* CONTEXT BANNER: CANDIDATE CAREER DNA SNAPSHOT */}
        <section className="p-6 rounded-2xl bg-[#1f1e1b] border border-white/10 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#cc785c]" />
                <span className="text-xs font-mono text-[#a09d96] uppercase tracking-wider font-bold">
                  Active Career Calibration Track:
                </span>
                <strong className="text-sm font-display text-[#faf9f5] font-semibold">{targetRole}</strong>
              </div>
              <p className="text-xs text-[#a09d96]">
                Matching algorithms cross-reference candidate technical depth, frameworks, and seniority requirements.
              </p>
            </div>

            {marketInsights && (
              <div className="p-3.5 rounded-xl bg-[#252320] border border-white/10 text-xs flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-[#5db872] shrink-0" />
                <div>
                  <span className="text-[11px] font-mono text-[#a09d96] block">Hiring Outlook:</span>
                  <span className="text-[#faf9f5] font-medium">{marketInsights.hiringOutlook}</span>
                </div>
              </div>
            )}
          </div>

          {/* Verified Skills Tags */}
          {verifiedSkills.length > 0 && (
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-[#6c6a64] uppercase tracking-wider mr-1">
                Verified Skills:
              </span>
              {verifiedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-[#252320] text-[#e6dfd8] text-[11px] font-mono border border-white/10"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* SEARCH & FILTERS BAR */}
        <section className="p-4 rounded-xl bg-[#1f1e1b] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6c6a64] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company name, skills (e.g. React, Zepto, Linear)..."
              className="w-full bg-[#181715] text-[#faf9f5] text-xs font-mono pl-10 pr-4 py-2.5 rounded-lg border border-white/10 focus:border-[#cc785c] focus:outline-none placeholder-[#6c6a64]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Platform Selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {platformsList.map((plat) => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    selectedPlatform === plat
                      ? 'bg-[#cc785c] text-white font-semibold shadow-sm'
                      : 'bg-[#252320] text-[#a09d96] hover:text-white border border-white/5'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            {/* Fit Score Filter */}
            <select
              value={selectedFitScore}
              onChange={(e) => setSelectedFitScore(e.target.value)}
              className="bg-[#252320] text-[#faf9f5] text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 focus:border-[#cc785c] focus:outline-none cursor-pointer"
            >
              <option value="All">All Fit Scores</option>
              <option value="90">90%+ Strong Fit</option>
              <option value="75">75%+ Moderate Fit</option>
            </select>
          </div>
        </section>

        {/* OPPORTUNITIES GRID */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-[#cc785c] animate-spin mx-auto" />
            <div className="space-y-1 font-mono text-xs text-[#a09d96]">
              <p className="text-[#faf9f5] font-semibold">Synthesizing Job Opportunities with Gemma AI...</p>
              <p>Evaluating candidate skill overlap against active platform market criteria.</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#1f1e1b] border border-white/10 space-y-3">
            <Briefcase className="w-8 h-8 text-[#6c6a64] mx-auto" />
            <h3 className="text-sm font-semibold text-[#faf9f5] font-display">No matching opportunities found</h3>
            <p className="text-xs text-[#a09d96] font-mono">
              Try adjusting your search keywords or platform filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => {
              const isHighFit = job.fitScore >= 88;
              const isSaved = savedJobIds.has(job.id);
              const isExpanded = expandedJdId === job.id;

              return (
                <div
                  key={job.id}
                  className="p-6 rounded-2xl bg-[#1f1e1b] border border-white/10 hover:border-[#cc785c]/60 transition-all flex flex-col justify-between space-y-5 shadow-md group"
                >
                  {/* Top: Header Info & Fit Score Badge */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-[#252320] text-[#cc785c] font-mono text-[10px] font-bold uppercase border border-white/5">
                            {job.platform}
                          </span>
                          {job.estimatedSalary && (
                            <span className="px-2 py-0.5 rounded bg-[#5db872]/10 text-[#5db872] font-mono text-[10px] font-semibold border border-[#5db872]/20">
                              {job.estimatedSalary}
                            </span>
                          )}
                        </div>
                        <h2 className="font-display text-xl font-bold text-[#faf9f5] group-hover:text-[#cc785c] transition-colors">
                          {job.jobTitle}
                        </h2>
                        <p className="text-xs font-medium text-[#e6dfd8] flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[#cc785c]" />
                          <span>{job.companyName}</span>
                          <span className="text-[#6c6a64]">•</span>
                          <MapPin className="w-3.5 h-3.5 text-[#6c6a64]" />
                          <span className="text-[#a09d96]">{job.location}</span>
                        </p>
                      </div>

                      {/* Numeric / Radial Fit Gauge */}
                      <div
                        className={`px-3 py-2 rounded-xl flex flex-col items-center justify-center font-mono text-center border ${
                          isHighFit
                            ? 'bg-[#5db872]/10 border-[#5db872]/40 text-[#5db872]'
                            : 'bg-[#cc785c]/10 border-[#cc785c]/40 text-[#cc785c]'
                        }`}
                      >
                        <span className="text-xl font-bold leading-none">{job.fitScore}%</span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold mt-0.5">Fit Score</span>
                      </div>
                    </div>

                    {/* AI Reasoning Text */}
                    <p className="text-xs text-[#a09d96] leading-relaxed bg-[#181715] p-3 rounded-xl border border-white/5">
                      <strong className="text-[#faf9f5] font-semibold">AI Match Rationale: </strong>
                      {job.whyFit}
                    </p>

                    {/* Skill Alignment Chips */}
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[#5db872] font-semibold">Matched:</span>
                        {job.matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded bg-[#5db872]/10 text-[#5db872] text-[10px] font-mono border border-[#5db872]/20"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>

                      {job.missingSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono text-[#e8a55a] font-semibold">Growth Gaps:</span>
                          {job.missingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono border border-amber-500/20"
                            >
                              ! {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Collapsible Full Job Description */}
                    {isExpanded && (
                      <div className="mt-3 p-3.5 rounded-xl bg-[#181715] border border-white/10 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between text-[#cc785c] font-bold text-[11px]">
                          <span>Synthesized Job Description:</span>
                          <button
                            onClick={() => setExpandedJdId(null)}
                            className="text-[#6c6a64] hover:text-white cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                        <p className="text-[#a09d96] whitespace-pre-line leading-relaxed font-sans text-xs">
                          {job.fullJobDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION TOOLBAR (4 Key Integrations) */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 1. Track in Kanban */}
                      <button
                        onClick={() => handleSaveToTracker(job)}
                        disabled={isSaved}
                        className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isSaved
                            ? 'bg-[#5db872]/20 text-[#5db872] border-[#5db872]/40'
                            : 'bg-[#252320] hover:bg-[#2e2c28] text-[#faf9f5] border-white/10 hover:border-[#cc785c]'
                        }`}
                        title="Save to Application Tracker"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>{isSaved ? 'Saved to Tracker' : 'Track in Kanban'}</span>
                      </button>

                      {/* 2. Run Resume ATS Match */}
                      <button
                        onClick={() => handleAnalyzeInResumeStudio(job)}
                        className="px-3 py-2 rounded-lg bg-[#252320] hover:bg-[#2e2c28] text-xs font-mono text-[#faf9f5] border border-white/10 hover:border-[#cc785c] flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Test Resume Fit with AI Agent"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>ATS Match</span>
                      </button>

                      {/* 3. Start Mock Interview */}
                      <button
                        onClick={() => handlePracticeMockInterview(job)}
                        className="px-3 py-2 rounded-lg bg-[#252320] hover:bg-[#2e2c28] text-xs font-mono text-[#faf9f5] border border-white/10 hover:border-[#cc785c] flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Practice Live Roleplay for this Role"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>Interview Drill</span>
                      </button>
                    </div>

                    {/* 4. Direct Apply Link */}
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                    >
                      <span>Apply on {job.platform}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
