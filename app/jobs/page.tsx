'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';

export default function JobIntelligencePage() {
  const { profile, applications, setActiveInterviewCompany, setActiveInterviewRole } = useCareer();
  const [selectedJobId, setSelectedJobId] = useState(applications[0]?.id || 'app-1');

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

  // Extract user personalized attributes from Career DNA
  const userTargetRole = profile.targetRole || 'Full-Stack Software Engineer';
  const userSkills = profile.strengths.slice(0, 3).join(' • ') || 'React • TypeScript • Node.js';
  const userLocation = 'Bengaluru / Remote';

  // Construct Personalized Job Platform Search URLs
  const getPersonalizedPlatformLinks = (role: string, company?: string) => {
    const roleQuery = encodeURIComponent(role);
    const companyRoleQuery = encodeURIComponent(`${role} ${company || ''}`);
    const slugRole = encodeURIComponent(role.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

    return [
      {
        platform: 'LinkedIn Jobs',
        description: 'Find premium tech and engineering opportunities matched to your Career DNA.',
        url: `https://www.linkedin.com/jobs/search/?keywords=${companyRoleQuery}&location=India`,
        badge: 'Tier 1 Tech & Global',
        accentColor: 'hover:border-[#0077b5] group-hover:text-[#0077b5]',
        tag: 'LinkedIn',
      },
      {
        platform: 'Naukri.com',
        description: "India's largest tech hiring marketplace with direct recruiter contact.",
        url: `https://www.naukri.com/${slugRole}-jobs?k=${roleQuery}`,
        badge: 'Top in India',
        accentColor: 'hover:border-[#4a90e2] group-hover:text-[#4a90e2]',
        tag: 'Naukri',
      },
      {
        platform: 'Indeed India',
        description: 'Comprehensive job index across startups, MNCs, and enterprise teams.',
        url: `https://in.indeed.com/jobs?q=${companyRoleQuery}&l=India`,
        badge: 'High Volume',
        accentColor: 'hover:border-[#2164f3] group-hover:text-[#2164f3]',
        tag: 'Indeed',
      },
      {
        platform: 'Instahyre',
        description: 'AI-driven curated tech hiring for product companies and unicorns.',
        url: `https://www.instahyre.com/search-jobs/?query=${roleQuery}`,
        badge: 'Product Unicorns',
        accentColor: 'hover:border-[#10b981] group-hover:text-[#10b981]',
        tag: 'Instahyre',
      },
      {
        platform: 'Wellfound (AngelList)',
        description: 'High-growth early-stage startups and founding engineer positions.',
        url: `https://wellfound.com/jobs?query=${roleQuery}`,
        badge: 'Startups & Equity',
        accentColor: 'hover:border-[#ff4a00] group-hover:text-[#ff4a00]',
        tag: 'Wellfound',
      },
      {
        platform: 'Glassdoor India',
        description: 'Verified salary benchmarks, company reviews, and direct openings.',
        url: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${companyRoleQuery}`,
        badge: 'Salary Insights',
        accentColor: 'hover:border-[#0caa41] group-hover:text-[#0caa41]',
        tag: 'Glassdoor',
      },
      {
        platform: 'Internshala Tech Jobs',
        description: 'Fast-track fresher and early career opportunities for new graduates.',
        url: `https://internshala.com/jobs/${slugRole}-jobs/`,
        badge: 'Freshers & Switchers',
        accentColor: 'hover:border-[#008bd3] group-hover:text-[#008bd3]',
        tag: 'Internshala',
      },
      {
        platform: 'Foundit (Monster)',
        description: 'Direct recruiter search and rapid application delivery pipelines.',
        url: `https://www.foundit.in/srp/results?query=${roleQuery}`,
        badge: 'Direct Recruiter',
        accentColor: 'hover:border-[#6c5ce7] group-hover:text-[#6c5ce7]',
        tag: 'Foundit',
      },
    ];
  };

  const platforms = getPersonalizedPlatformLinks(selectedApp.role, selectedApp.company);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-28 pb-16 space-y-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Badge variant="coral" size="sm" className="mb-2">Job Fit &amp; Opportunity Hub</Badge>
          <h1 className="font-display text-3xl sm:text-4xl text-[#faf9f5]">Personalized Job Fit &amp; Direct Search</h1>
          <p className="text-sm text-[#6c6a64]">
            Discover high-probability opportunities calibrated with your Career DNA and apply directly across top hiring portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/resume">
            <Button variant="outline" size="sm" icon={<FileText className="w-4 h-4" />}>
              Resume ATS Studio
            </Button>
          </Link>
          <Link href="/tracker">
            <Button variant="secondary" size="sm" icon={<Briefcase className="w-4 h-4" />}>
              Application Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* PERSONALIZED CAREER DNA SUMMARY BANNER */}
      <div className="p-6 rounded-xl bg-[#252320] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#cc785c] uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Active Career DNA Search Vector:</span>
          </div>
          <h3 className="font-display text-2xl text-[#faf9f5]">{userTargetRole}</h3>
          <p className="text-xs text-[#a09d96] font-mono">
            Calibrated Skills: <span className="text-[#5db872]">{userSkills}</span> • Location: <span className="text-white">{userLocation}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#6c6a64]">
          <span className="px-3 py-1.5 rounded-lg bg-[#1f1e1b] border border-white/10 text-[#faf9f5]">
            8 Direct Job Engines Connected
          </span>
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

            {/* DIRECT 1-CLICK JOB SEARCH PLATFORMS */}
            <div className="space-y-3 bg-[#181715] p-5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Direct 1-Click Search &amp; Apply Portals for {selectedApp.company} ({selectedApp.role})</span>
                </h4>
                <span className="text-[11px] text-[#6c6a64] font-mono">India &amp; Global</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {platforms.map((plat) => (
                  <a
                    key={plat.platform}
                    href={plat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3.5 rounded-xl bg-[#1f1e1b] border border-white/10 transition-all flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md ${plat.accentColor}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#faf9f5] group-hover:text-inherit transition-colors font-display">
                          {plat.platform}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-[#6c6a64] leading-relaxed">
                        {plat.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-[#a09d96]">{plat.badge}</span>
                      <span className="text-[10px] font-mono text-[#cc785c] font-bold group-hover:underline">
                        Explore Openings ↗
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
