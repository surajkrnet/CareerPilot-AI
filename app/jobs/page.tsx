'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Target,
  BookOpen,
  Briefcase,
  Globe,
  Share2,
  Search,
  MapPin,
  IndianRupee,
  Layers,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';

export default function JobIntelligencePage() {
  const { profile, applications, setActiveInterviewCompany, setActiveInterviewRole } = useCareer();
  const [selectedJobId, setSelectedJobId] = useState(applications[0]?.id || 'app-1');
  const [cachedDna, setCachedDna] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('careerpilot_career_dna');
      if (saved) {
        try {
          setCachedDna(JSON.parse(saved));
        } catch (e) {
          console.warn('DNA parse note:', e);
        }
      }
    }
  }, []);

  const selectedApp = applications.find((a) => a.id === selectedJobId) || applications[0] || {
    id: 'app-1',
    company: 'Linear',
    role: 'Frontend Engineer - Product Systems',
    location: 'Remote / Bengaluru',
    salary: '₹28L - ₹42L LPA',
    matchScore: 94,
    appliedDate: '2026-08-10',
    status: 'interviewing',
    jdText: 'Looking for a Frontend Engineer with expert knowledge in Next.js, TypeScript, and design systems.',
  };

  // Personalized parameters from Career DNA
  const userTargetRole = cachedDna?.targetRole || profile.targetRole || 'Full-Stack Development';
  const userLocation = cachedDna?.preferredLocation || 'Bangalore';
  const userSkills = profile.strengths.slice(0, 3).join(' • ') || 'React • TypeScript • Node.js';

  // Construct Personalized Job Platform Search URLs
  const roleQuery = encodeURIComponent(userTargetRole);
  const locationQuery = encodeURIComponent(userLocation);
  const companyRoleQuery = encodeURIComponent(`${selectedApp.role} ${selectedApp.company}`);
  const slugRole = encodeURIComponent(userTargetRole.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

  // Quick Navigation Bar for External Platforms (Requirement 22, 23, 24)
  const quickJobPlatforms = [
    {
      name: 'LinkedIn',
      badge: 'Official Jobs',
      url: `https://www.linkedin.com/jobs/search/?keywords=${roleQuery}&location=${locationQuery}`,
      icon: '💼',
      color: 'hover:border-[#0077b5] hover:text-[#0077b5]',
    },
    {
      name: 'Naukri',
      badge: 'Top in India',
      url: `https://www.naukri.com/${slugRole}-jobs-in-${locationQuery.toLowerCase()}?k=${roleQuery}`,
      icon: '🇮🇳',
      color: 'hover:border-[#4a90e2] hover:text-[#4a90e2]',
    },
    {
      name: 'Indeed',
      badge: 'India & Remote',
      url: `https://in.indeed.com/jobs?q=${roleQuery}&l=${locationQuery}`,
      icon: '🔍',
      color: 'hover:border-[#2164f3] hover:text-[#2164f3]',
    },
    {
      name: 'foundit',
      badge: 'Direct Recruiter',
      url: `https://www.foundit.in/srp/results?query=${roleQuery}&locations=${locationQuery}`,
      icon: '⚡',
      color: 'hover:border-[#6c5ce7] hover:text-[#6c5ce7]',
    },
    {
      name: 'Wellfound',
      badge: 'Startups & Equity',
      url: `https://wellfound.com/jobs?query=${roleQuery}`,
      icon: '🦄',
      color: 'hover:border-[#ff4a00] hover:text-[#ff4a00]',
    },
    {
      name: 'Instahyre',
      badge: 'Unicorns',
      url: `https://www.instahyre.com/search-jobs/?query=${roleQuery}`,
      icon: '🚀',
      color: 'hover:border-[#10b981] hover:text-[#10b981]',
    },
    {
      name: 'Glassdoor',
      badge: 'Salaries & Reviews',
      url: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${roleQuery}`,
      icon: '🏢',
      color: 'hover:border-[#0caa41] hover:text-[#0caa41]',
    },
    {
      name: 'Internshala',
      badge: 'Freshers & Switchers',
      url: `https://internshala.com/jobs/${slugRole}-jobs/`,
      icon: '🎓',
      color: 'hover:border-[#008bd3] hover:text-[#008bd3]',
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-28 pb-16 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="coral" size="sm">Job Fit Opportunity Hub</Badge>
            <Badge variant="teal" size="sm">Calibrated with Career DNA</Badge>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#faf9f5]">Personalized Job Fit &amp; Direct Search</h1>
          <p className="text-sm text-[#a09d96]">
            Discover opportunities calibrated with your Career DNA and apply directly across verified hiring portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/resume">
            <Button variant="outline" size="sm" icon={<FileText className="w-4 h-4" />}>
              Resume Studio
            </Button>
          </Link>
          <Link href="/tracker">
            <Button variant="secondary" size="sm" icon={<Briefcase className="w-4 h-4" />}>
              Application Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK JOB PLATFORMS COMPACT NAVIGATION BAR (Master Requirement 22-24) */}
      <div className="p-5 rounded-xl bg-[#252320] border border-white/10 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#faf9f5] uppercase tracking-wider">
            <Compass className="w-4 h-4 text-[#cc785c]" />
            <span>Job Platforms Navigation — One-Click Direct Search:</span>
          </div>
          <span className="text-[11px] font-mono text-[#6c6a64]">
            Pre-filtered for <strong className="text-[#faf9f5]">{userTargetRole}</strong> in <strong className="text-[#faf9f5]">{userLocation}</strong>
          </span>
        </div>

        {/* Clean, Compact Platform Navigation Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {quickJobPlatforms.map((plat) => (
            <a
              key={plat.name}
              href={plat.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3 rounded-lg bg-[#1f1e1b] border border-white/10 transition-all flex flex-col items-center justify-center text-center gap-1 group cursor-pointer shadow-sm hover:scale-[1.02] ${plat.color}`}
            >
              <span className="text-base">{plat.icon}</span>
              <span className="font-semibold text-xs text-[#faf9f5] group-hover:text-inherit font-display flex items-center gap-1">
                {plat.name}
                <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
              </span>
              <span className="text-[9px] font-mono text-[#6c6a64] truncate max-w-full">
                {plat.badge}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* WORKSPACE: LEFT LIST, RIGHT DEEP DIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: TARGET ROLES LIST */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#faf9f5] font-mono">Target Companies &amp; Openings</h3>
          
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedJobId(app.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedJobId === app.id
                    ? 'bg-[#252320] border-[#cc785c] shadow-md translate-x-1'
                    : 'bg-[#1f1e1b] border-white/10 hover:border-[#cc785c]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#faf9f5]">{app.company}</h4>
                  <Badge variant="teal" size="sm">{app.matchScore}% Fit</Badge>
                </div>
                <p className="text-xs text-[#a09d96] mt-1 truncate">{app.role}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-[#6c6a64]">
                  <span className="capitalize font-mono">Stage: {app.status}</span>
                  <span className="font-mono text-[#5db872] font-semibold">{app.salary.replace('$', '₹').replace('k', 'L')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: JOB DEEP DIVE & DIRECT APPLY LINKS */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="dark-elevated" className="space-y-6 p-8 border-white/10">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl sm:text-3xl text-[#faf9f5]">{selectedApp.company}</h2>
                  <Badge variant="coral" size="sm">{selectedApp.matchScore}% Match Score</Badge>
                </div>
                <p className="text-sm font-medium text-[#a09d96] mt-0.5">{selectedApp.role}</p>
                <p className="text-xs text-[#6c6a64] mt-1">
                  {selectedApp.location} • <span className="text-[#5db872] font-mono font-semibold">{selectedApp.salary.replace('$', '₹').replace('k', 'L')}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/interview"
                  onClick={() => {
                    setActiveInterviewCompany(selectedApp.company);
                    setActiveInterviewRole(selectedApp.role);
                  }}
                >
                  <Button variant="primary" size="sm" icon={<MessageSquare className="w-3.5 h-3.5" />} className="bg-[#cc785c] hover:bg-[#a9583e]">
                    Practice Mock Interview
                  </Button>
                </Link>
              </div>
            </div>

            {/* Direct Platform Links for Selected Role */}
            <div className="space-y-3 bg-[#181715] p-5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Direct Search for {selectedApp.company} ({selectedApp.role})</span>
                </h4>
                <span className="text-[11px] text-[#6c6a64] font-mono">India &amp; Remote</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    platform: 'LinkedIn Jobs',
                    url: `https://www.linkedin.com/jobs/search/?keywords=${companyRoleQuery}&location=${locationQuery}`,
                    badge: 'Direct Search',
                    desc: `Search open ${selectedApp.company} positions on LinkedIn`,
                  },
                  {
                    platform: 'Naukri.com',
                    url: `https://www.naukri.com/${slugRole}-jobs?k=${companyRoleQuery}`,
                    badge: 'India Portal',
                    desc: `Explore recruiters hiring for ${selectedApp.company} on Naukri`,
                  },
                  {
                    platform: 'Indeed India',
                    url: `https://in.indeed.com/jobs?q=${companyRoleQuery}&l=${locationQuery}`,
                    badge: 'Index Search',
                    desc: `Aggregated job postings for ${selectedApp.company}`,
                  },
                  {
                    platform: 'foundit',
                    url: `https://www.foundit.in/srp/results?query=${companyRoleQuery}`,
                    badge: 'Direct Recruiter',
                    desc: `Rapid direct recruiter pipelines on foundit`,
                  },
                ].map((item) => (
                  <a
                    key={item.platform}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl bg-[#1f1e1b] border border-white/10 hover:border-[#cc785c] transition-all flex flex-col justify-between group cursor-pointer shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#faf9f5] group-hover:text-[#cc785c] transition-colors font-display">
                          {item.platform}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#6c6a64] group-hover:text-[#cc785c] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-[#6c6a64] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] font-mono">
                      <span className="text-[#a09d96]">{item.badge}</span>
                      <span className="text-[#cc785c] font-bold group-hover:underline">
                        Apply Now ↗
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Target Job Requirements Context */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#faf9f5] uppercase tracking-wider font-mono">Target Requirements Context</h4>
              <p className="text-xs text-[#a09d96] bg-[#1f1e1b] p-4 rounded-xl border border-white/10 leading-relaxed font-sans">
                {selectedApp.jdText}
              </p>
            </div>

            {/* Skill Alignment Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Matched Competencies */}
              <div className="space-y-3 bg-[#1f1e1b] p-5 rounded-xl border border-white/10">
                <h4 className="text-xs font-semibold text-[#faf9f5] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#5db872]" />
                  <span>Strengths Covered (88%)</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.strengths.map((str) => (
                    <Badge key={str} variant="dark" size="sm">
                      ✓ {str}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skill Gaps to Close */}
              <div className="space-y-3 bg-[#1f1e1b] p-5 rounded-xl border border-white/10">
                <h4 className="text-xs font-semibold text-[#faf9f5] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#e8a55a]" />
                  <span>Missing Skill Gaps ({profile.skillGaps.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skillGaps.map((gap) => (
                    <Badge key={gap} variant="amber" size="sm">
                      ! {gap}
                    </Badge>
                  ))}
                </div>
              </div>

            </div>

            {/* STEP TRANSITION: PROCEED TO INTERVIEW PREP */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/10 gap-4">
              <div className="text-xs text-[#a09d96]">
                Target jobs identified! Rehearse live roleplay drills with STAR evaluation before interviews.
              </div>

              <Link
                href="/interview"
                onClick={() => {
                  setActiveInterviewCompany(selectedApp.company);
                  setActiveInterviewRole(selectedApp.role);
                }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                  className="bg-[#cc785c] hover:bg-[#a9583e] font-mono text-xs uppercase tracking-wider px-8 h-12"
                >
                  Start Mock Interview (Step 4) ↗
                </Button>
              </Link>
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
}
