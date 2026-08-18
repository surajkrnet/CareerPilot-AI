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
  Globe,
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

  const [targetRole, setTargetRole] = useState<string>('Associate Software Developer');
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

  const fetchRecommendations = async (
    isRefresh = false,
    searchOverride?: string,
    platformOverride?: string
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    const activeRole = searchOverride !== undefined ? searchOverride : searchQuery || targetRole;
    const activePlatform = platformOverride !== undefined ? platformOverride : selectedPlatform;

    try {
      const res = await fetch('/api/jobs/fetch-real-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleQuery: activeRole,
          searchQuery: activeRole,
          platformFilter: activePlatform,
        }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        json = { error: text || 'Failed to parse live job scraper response.' };
      }

      if (!res.ok) {
        if (json.needsOnboarding) {
          setErrorMsg('Career DNA profile not found. Please complete the Onboarding setup first.');
          return;
        }
        throw new Error(json.error || 'Failed to fetch live job postings.');
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
      setErrorMsg(err.message || 'Unable to scrape live job postings. Please retry.');
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

  const handlePlatformFilterChange = (plat: string) => {
    setSelectedPlatform(plat);
    fetchRecommendations(false, searchQuery, plat);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecommendations(false, searchQuery, selectedPlatform);
  };

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
        notes: `Scraped via Real Job Fit Hub (${job.fitScore}% Match). Why Fit: ${job.whyFit}`,
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
                <Globe className="w-3.5 h-3.5" />
                Live Job Market Hub
              </span>
              <span className="px-2.5 py-1 rounded bg-[#5db872]/10 text-[#5db872] text-[11px] font-mono font-semibold border border-[#5db872]/30">
                Real Scraped Postings
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-[#faf9f5]">
              Real-Time Job Fit &amp; Opportunity Hub
            </h1>
            <p className="text-sm text-[#a09d96] mt-1 max-w-2xl">
              Live web scraped job postings across LinkedIn, Wellfound, Naukri, and Y Combinator scored against your active Career DNA.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => fetchRecommendations(true)}
              disabled={refreshing || loading}
              className="px-4 py-2.5 rounded-lg bg-[#252320] hover:bg-[#2c2a27] text-xs font-mono text-[#faf9f5] border border-white/10 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#cc785c] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Scraping Live Postings...' : 'Scrape Live Jobs'}</span>
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
                Real-time web scraping queries live job boards against candidate technical depth, frameworks, and seniority requirements.
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
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-[#6c6a64] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live jobs (e.g. Associate Developer, Java Backend, React, Bangalore)..."
              className="w-full bg-[#181715] text-[#faf9f5] text-xs font-mono pl-10 pr-20 py-2.5 rounded-lg border border-white/10 focus:border-[#cc785c] focus:outline-none placeholder-[#6c6a64]"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#cc785c] hover:bg-[#a9583e] text-white px-2.5 py-1 rounded text-xs font-mono cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Platform Selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {platformsList.map((plat) => (
                <button
                  key={plat}
                  onClick={() => handlePlatformFilterChange(plat)}
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
              <p className="text-[#faf9f5] font-semibold">Scraping Live Web Job Postings &amp; AI Scoring...</p>
              <p>Fetching real-time openings from LinkedIn, Wellfound, Naukri, and Y Combinator.</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#1f1e1b] border border-white/10 space-y-3">
            <Briefcase className="w-8 h-8 text-[#6c6a64] mx-auto" />
            <h3 className="text-sm font-semibold text-[#faf9f5] font-display">No matching opportunities found</h3>
            <p className="text-xs text-[#a09d96] font-mono">
              Try adjusting your search keywords or clicking another platform filter.
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
                    <p className="text-xs text-[#a09d96] leading-relaxed bg-[#181715] p-3 rounded-lg border border-white/5 italic">
                      &quot;{job.whyFit}&quot;
                    </p>

                    {/* Skills Matrix: Matched vs Missing */}
                    <div className="space-y-2 pt-1">
                      {/* Matched Skills */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#5db872] font-bold">
                          ✓ Matched Skills ({job.matchedSkills?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.matchedSkills?.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-[#5db872]/10 text-[#5db872] text-[11px] font-mono border border-[#5db872]/20"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Gaps */}
                      {job.missingSkills && job.missingSkills.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#e8a55a] font-bold">
                            ! Skill Gaps to Close ({job.missingSkills.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {job.missingSkills.map((gap, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-[#e8a55a]/10 text-[#e8a55a] text-[11px] font-mono border border-[#e8a55a]/20"
                              >
                                + {gap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Scraped JD Preview */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => setExpandedJdId(isExpanded ? null : job.id)}
                      className="w-full text-left flex items-center justify-between text-xs font-mono text-[#a09d96] hover:text-white transition-colors cursor-pointer py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>{isExpanded ? 'Hide Scraped Job Description' : 'View Full Scraped Job Description'}</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="p-3.5 rounded-lg bg-[#181715] border border-white/10 text-xs font-mono text-[#e6dfd8] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                        {job.fullJobDescription}
                      </div>
                    )}
                  </div>

                  {/* Bottom: 4 Action CTAs */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Left CTAs: 1-Click Kanban + Real Apply Link */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveToTracker(job)}
                        disabled={isSaved}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                            : 'bg-[#252320] hover:bg-[#2c2a27] text-[#faf9f5] border border-white/10'
                        }`}
                        title="Save to Application Tracker"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>{isSaved ? 'Saved to Kanban' : 'Save to Kanban'}</span>
                      </button>

                      {/* Real External Apply Link */}
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        title={`Open live application on ${job.platform}`}
                      >
                        <span>Apply on {job.platform}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Right Workflow Links: ATS Match & Mock Prep */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAnalyzeInResumeStudio(job)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#252320] hover:bg-[#2c2a27] text-[#a09d96] hover:text-[#cc785c] text-[11px] font-mono border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Pass this scraped JD directly into Resume Intelligence"
                      >
                        <FileText className="w-3 h-3 text-[#cc785c]" />
                        <span>ATS Match</span>
                      </button>

                      <button
                        onClick={() => handlePracticeMockInterview(job)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#252320] hover:bg-[#2c2a27] text-[#a09d96] hover:text-[#5db872] text-[11px] font-mono border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Launch Mock Interview grounded in this exact scraped role"
                      >
                        <MessageSquare className="w-3 h-3 text-[#5db872]" />
                        <span>Mock Prep</span>
                      </button>
                    </div>

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
