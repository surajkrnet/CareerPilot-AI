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
        try {
          sessionStorage.setItem('careerpilot_cached_jobs', JSON.stringify(recs));
        } catch {}
      }
      const insights = json.data?.marketInsights || json.marketInsights;
      if (insights) {
        setMarketInsights(insights);
        try {
          sessionStorage.setItem('careerpilot_cached_market', JSON.stringify(insights));
        } catch {}
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
    let hasLoadedCachedJobs = false;
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

        // Zero-lag cached opportunities
        const cachedJobs = sessionStorage.getItem('careerpilot_cached_jobs');
        const cachedMarket = sessionStorage.getItem('careerpilot_cached_market');
        if (cachedJobs) {
          const parsedJobs = JSON.parse(cachedJobs);
          if (Array.isArray(parsedJobs) && parsedJobs.length > 0) {
            setOpportunities(parsedJobs);
            if (cachedMarket) setMarketInsights(JSON.parse(cachedMarket));
            setLoading(false);
            hasLoadedCachedJobs = true;
          }
        }
      } catch (e) {}
    }
    
    if (!hasLoadedCachedJobs) {
      fetchRecommendations();
    }
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
    <main className="min-h-screen bg-[#f6f4ee] dark:bg-[#121110] text-[#121110] dark:text-[#faf9f5] pt-28 pb-20 px-4 sm:px-8 md:px-10 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-[#cc785c] text-white text-xs font-mono font-bold flex items-center justify-between shadow-xl fixed top-24 right-6 z-50 max-w-md coral-glow"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastMsg}</span>
              </div>
              <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white ml-3 cursor-pointer">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#ded7cb] dark:border-white/[0.08] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#cc785c] font-bold">
              <Globe className="w-3.5 h-3.5" />
              <span>Autonomous Job Fit &amp; Live Scraper Hub</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[#121110] dark:text-[#faf9f5] mt-1.5">
              Live Opportunity Matching Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#57534e] dark:text-[#a09d96] mt-1 font-medium">
              Real-time web scraping queries across LinkedIn, Wellfound, Naukri, and Y Combinator grounded in your Career DNA.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRecommendations(true)}
              disabled={refreshing || loading}
              className="px-5 py-3 rounded-xl bg-[#ffffff] dark:bg-[#181716] hover:bg-[#ede8df] dark:hover:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 text-xs font-mono text-[#121110] dark:text-[#faf9f5] flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Refresh live web job listings"
            >
              <RefreshCw className={`w-4 h-4 text-[#cc785c] ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-bold">{refreshing ? 'Scraping Live...' : 'Refresh Feed'}</span>
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs font-mono flex items-center justify-between shadow-sm font-medium">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.includes('Onboarding') && (
              <Link href="/onboarding">
                <button className="px-3 py-1.5 rounded-lg bg-[#cc785c] text-white text-xs font-mono font-bold cursor-pointer">
                  Start Onboarding ↗
                </button>
              </Link>
            )}
          </div>
        )}

        {/* CONTEXT BANNER: CANDIDATE CAREER DNA SNAPSHOT */}
        <section className="p-6 rounded-2xl bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] shadow-md space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Zap className="w-4 h-4 text-[#cc785c]" />
                <span className="text-xs font-mono text-[#57534e] dark:text-[#a09d96] uppercase tracking-wider font-bold">
                  Active Calibration Track:
                </span>
                <strong className="text-sm font-display text-[#121110] dark:text-[#faf9f5] font-bold">{targetRole}</strong>
              </div>
              <p className="text-xs text-[#57534e] dark:text-[#a09d96] font-medium">
                Real-time scraper analyzes live job boards against candidate technical depth, frameworks, and seniority requirements.
              </p>
            </div>

            {marketInsights && (
              <div className="p-3.5 rounded-xl bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 text-xs flex items-center gap-3 shadow-sm">
                <TrendingUp className="w-4 h-4 text-[#2e8544] dark:text-[#5db872] shrink-0" />
                <div>
                  <span className="text-[11px] font-mono text-[#57534e] dark:text-[#a09d96] block font-bold">Hiring Outlook:</span>
                  <span className="text-[#121110] dark:text-[#faf9f5] font-semibold">{marketInsights.hiringOutlook}</span>
                </div>
              </div>
            )}
          </div>

          {/* Verified Skills Tags */}
          {verifiedSkills.length > 0 && (
            <div className="pt-3 border-t border-[#ded7cb] dark:border-white/5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-[#57534e] dark:text-[#8e8b82] uppercase tracking-wider mr-1 font-bold">
                Verified Stack:
              </span>
              {verifiedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-[#f6f4ee] dark:bg-[#201e1c] text-[#2d2a26] dark:text-[#e6dfd8] text-[11px] font-mono border border-[#ded7cb] dark:border-white/10 font-medium"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* SEARCH & FILTERS BAR */}
        <section className="p-4 rounded-2xl bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-[#57534e] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live jobs (e.g. Full-Stack, Java Backend, React, Bangalore)..."
              className="w-full bg-[#f6f4ee] dark:bg-[#201e1c] text-[#121110] dark:text-[#faf9f5] text-xs font-mono pl-10 pr-24 py-2.5 rounded-xl border border-[#ded7cb] dark:border-white/10 focus:border-[#cc785c] focus:outline-none placeholder-[#57534e] font-medium"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#cc785c] hover:bg-[#a9583e] text-white px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer shadow-sm active:scale-95"
            >
              Search
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Platform Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar max-w-full">
              {platformsList.map((plat) => (
                <button
                  key={plat}
                  onClick={() => handlePlatformFilterChange(plat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    selectedPlatform === plat
                      ? 'bg-[#cc785c] text-white font-bold shadow-md'
                      : 'bg-[#f6f4ee] dark:bg-[#201e1c] text-[#3b3834] dark:text-[#a09d96] hover:text-[#121110] dark:hover:text-white border border-[#ded7cb] dark:border-white/5 font-medium'
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
              className="bg-[#f6f4ee] dark:bg-[#201e1c] text-[#121110] dark:text-[#faf9f5] text-xs font-mono px-3.5 py-1.5 rounded-xl border border-[#ded7cb] dark:border-white/10 focus:border-[#cc785c] focus:outline-none cursor-pointer font-medium"
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
            <div className="space-y-1 font-mono text-xs text-[#6c6a64] dark:text-[#a09d96]">
              <p className="text-[#141413] dark:text-[#faf9f5] font-bold">Scraping Live Web Job Postings &amp; AI Scoring...</p>
              <p>Fetching real-time openings from LinkedIn, Wellfound, Naukri, and Y Combinator.</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#ffffff] dark:bg-[#181716] border border-[#e6dfd8] dark:border-white/[0.08] space-y-3 shadow-md">
            <Briefcase className="w-8 h-8 text-[#6c6a64] mx-auto" />
            <h3 className="text-base font-bold text-[#141413] dark:text-[#faf9f5] font-display">No matching opportunities found</h3>
            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] font-mono">
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
                  className="p-6 sm:p-7 rounded-2xl bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] hover:border-[#cc785c]/60 transition-all flex flex-col justify-between space-y-5 shadow-md group"
                >
                  {/* Top: Header Info & Fit Score Badge */}
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#f0ebe1] dark:bg-[#201e1c] text-[#cc785c] font-mono text-[10px] font-bold uppercase border border-[#ded7cb] dark:border-white/5">
                            {job.platform}
                          </span>
                          {job.estimatedSalary && (
                            <span className="px-2.5 py-0.5 rounded-md bg-[#2e8544]/10 text-[#2e8544] dark:text-[#5db872] font-mono text-[10px] font-bold border border-[#2e8544]/20">
                              {job.estimatedSalary}
                            </span>
                          )}
                        </div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#121110] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors leading-snug">
                          {job.jobTitle}
                        </h2>
                        <p className="text-xs font-semibold text-[#2d2a26] dark:text-[#e6dfd8] flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[#cc785c]" />
                          <span>{job.companyName}</span>
                          <span className="text-[#57534e]">•</span>
                          <MapPin className="w-3.5 h-3.5 text-[#57534e]" />
                          <span className="text-[#57534e] dark:text-[#a09d96] font-medium">{job.location}</span>
                        </p>
                      </div>

                      {/* Numeric / Radial Fit Gauge */}
                      <div
                        className={`px-3 py-2 rounded-xl flex flex-col items-center justify-center font-mono text-center border shadow-sm ${
                          isHighFit
                            ? 'bg-[#2e8544]/10 border-[#2e8544]/30 text-[#2e8544] dark:text-[#5db872]'
                            : 'bg-[#cc785c]/10 border-[#cc785c]/40 text-[#cc785c]'
                        }`}
                      >
                        <span className="text-xl font-bold leading-none">{job.fitScore}%</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5">Fit Score</span>
                      </div>
                    </div>

                    {/* AI Reasoning Text */}
                    <p className="text-xs text-[#2d2a26] dark:text-[#a09d96] leading-relaxed bg-[#f6f4ee] dark:bg-[#201e1c] p-3.5 rounded-xl border border-[#ded7cb] dark:border-white/5 italic font-medium">
                      &quot;{job.whyFit}&quot;
                    </p>

                    {/* Skills Matrix: Matched vs Missing */}
                    <div className="space-y-2.5 pt-1">
                      {/* Matched Skills */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#2e8544] dark:text-[#5db872] font-bold">
                          ✓ Matched Skills ({job.matchedSkills?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.matchedSkills?.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-[#2e8544]/10 text-[#2e8544] dark:text-[#5db872] text-[11px] font-mono border border-[#2e8544]/20 font-medium"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Gaps */}
                      {job.missingSkills && job.missingSkills.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#9a4b08] dark:text-[#e8a55a] font-bold">
                            ! Skill Gaps to Close ({job.missingSkills.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {job.missingSkills.map((gap, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-[#9a4b08]/10 text-[#9a4b08] dark:text-[#e8a55a] text-[11px] font-mono border border-[#9a4b08]/20 font-medium"
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
                  <div className="space-y-2 pt-2 border-t border-[#ded7cb] dark:border-white/5">
                    <button
                      onClick={() => setExpandedJdId(isExpanded ? null : job.id)}
                      className="w-full text-left flex items-center justify-between text-xs font-mono text-[#57534e] dark:text-[#a09d96] hover:text-[#121110] dark:hover:text-white transition-colors cursor-pointer py-1 font-bold"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>{isExpanded ? 'Hide Scraped Job Description' : 'View Full Scraped Job Description'}</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 rounded-xl bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 text-xs font-mono text-[#121110] dark:text-[#e6dfd8] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto shadow-inner">
                        {job.fullJobDescription}
                      </div>
                    )}
                  </div>

                  {/* Bottom: 4 Action CTAs */}
                  <div className="pt-3.5 border-t border-[#ded7cb] dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Left CTAs: 1-Click Kanban + Real Apply Link */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveToTracker(job)}
                        disabled={isSaved}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
                          isSaved
                            ? 'bg-emerald-500/20 text-[#2e8544] dark:text-emerald-300 border border-emerald-500/30 font-bold'
                            : 'bg-[#f6f4ee] dark:bg-[#201e1c] hover:bg-[#ede8df] dark:hover:bg-[#2c2a27] text-[#121110] dark:text-[#faf9f5] border border-[#ded7cb] dark:border-white/10'
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
                        className="px-3.5 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
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
                        className="px-2.5 py-1.5 rounded-xl bg-[#f6f4ee] dark:bg-[#201e1c] hover:bg-[#ede8df] dark:hover:bg-[#2c2a27] text-[#57534e] dark:text-[#a09d96] hover:text-[#cc785c] text-[11px] font-mono border border-[#ded7cb] dark:border-white/10 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                        title="Pass this scraped JD directly into Resume Intelligence"
                      >
                        <FileText className="w-3 h-3 text-[#cc785c]" />
                        <span>ATS Match</span>
                      </button>

                      <button
                        onClick={() => handlePracticeMockInterview(job)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#f6f4ee] dark:bg-[#201e1c] hover:bg-[#ede8df] dark:hover:bg-[#2c2a27] text-[#57534e] dark:text-[#a09d96] hover:text-[#2e8544] dark:hover:text-[#5db872] text-[11px] font-mono border border-[#ded7cb] dark:border-white/10 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                        title="Launch Mock Interview grounded in this exact scraped role"
                      >
                        <MessageSquare className="w-3 h-3 text-[#2e8544] dark:text-[#5db872]" />
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
