'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Copy,
  Check,
  UploadCloud,
  FileText,
  Database,
  Briefcase,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface SuggestedJdItem {
  label: string;
  roleTitle: string;
  companyType: string;
  fullJobDescription: string;
}

const DEFAULT_SUGGESTED_JDS: SuggestedJdItem[] = [
  {
    label: 'Full-Stack Systems',
    roleTitle: 'Software Engineer (Full-Stack Systems)',
    companyType: 'High-Growth Tech SaaS',
    fullJobDescription: `Role: Software Engineer (Full-Stack Systems)
Company: High-Growth Product SaaS
Location: Bengaluru / Hybrid (Remote Eligible)
Experience: 0-3 Years

Overview:
We are looking for a Software Engineer to design, build, and scale interactive web applications and microservices.

Key Requirements:
- Hands-on proficiency in React, TypeScript, and modern component state architectures.
- Experience developing RESTful APIs and connecting backend services with Node.js, Java, or Python.
- Working knowledge of SQL database modeling (PostgreSQL / MySQL) and schema optimization.
- Familiarity with Git version control, CI/CD pipelines, and writing maintainable unit tests.`,
  },
  {
    label: 'Java Backend Engineer',
    roleTitle: 'Software Engineer (Java Backend & Distributed Systems)',
    companyType: 'Fintech & Scale-Up Platforms',
    fullJobDescription: `Role: Software Engineer (Java Backend)
Company: Fintech & Enterprise Scale-Up
Location: Bengaluru / Remote
Experience: 0-3 Years

Overview:
Join our platform infrastructure team building low-latency, resilient transaction and data handling engines.

Key Requirements:
- Strong core foundation in Java (Spring Boot / Core Java) and OOP architecture patterns.
- Strong SQL proficiency for designing relational schemas, indexing, and query optimization.
- Solid understanding of data structures, algorithms, concurrency, and REST API design.
- Passion for reliability metrics, system design principles, and automated testing.`,
  },
  {
    label: 'Frontend React / Next.js',
    roleTitle: 'Frontend Engineer (React & Web Systems)',
    companyType: 'Product Craft & Consumer Web',
    fullJobDescription: `Role: Frontend Engineer (React & Web Systems)
Company: Product Craft & Consumer Web
Location: Bengaluru / Remote
Experience: 0-2 Years

Overview:
Help craft responsive, accessible, and ultra-fast user interfaces across modern web browsers.

Key Requirements:
- Strong foundation in HTML5, modern CSS / Tailwind CSS, JavaScript (ES6+), and TypeScript.
- Demonstrated experience building interactive web applications with React or Next.js.
- Focus on Core Web Vitals, responsive layouts, client-side state, and clean component boundaries.
- Ability to collaborate with product managers and designers on rapid prototyping.`,
  },
  {
    label: 'IoT & Systems Software',
    roleTitle: 'IoT & Systems Software Engineer',
    companyType: 'Deep Tech & Connected Devices',
    fullJobDescription: `Role: IoT & Systems Software Engineer
Company: Smart Devices & Cloud Connected Systems
Location: Bengaluru / On-Site
Experience: 0-2 Years

Overview:
Bridge hardware/data streams with cloud web platforms and automated data handling pipelines.

Key Requirements:
- Familiarity with IoT protocols (MQTT, HTTP), sensor data acquisition, and embedded fundamentals.
- Python or C++ scripting for automated telemetry acquisition and backend services.
- Strong problem-solving aptitude, debugging capabilities, and SQL querying fundamentals.
- Understanding of distributed computing, telemetry logging, and secure data transmission.`,
  },
];

export default function ResumeIntelligencePage() {
  const [userName, setUserName] = useState('');
  const [storedResumeText, setStoredResumeText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [inputMode, setInputMode] = useState<'stored' | 'upload'>('stored');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Dynamic Suggested JDs State
  const [suggestedJds, setSuggestedJds] = useState<SuggestedJdItem[]>(DEFAULT_SUGGESTED_JDS);
  const [isSuggestingJds, setIsSuggestingJds] = useState(false);
  const [selectedJdLabel, setSelectedJdLabel] = useState<string | null>(DEFAULT_SUGGESTED_JDS[0].label);

  const [targetJd, setTargetJd] = useState(DEFAULT_SUGGESTED_JDS[0].fullJobDescription);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [latestScanId, setLatestScanId] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user profile and stored resume from Supabase
        const [{ data: profile }, { data: dna }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
          supabase.from('career_dna').select('raw_resume_text, target_roles, current_skills').eq('user_id', user.id).maybeSingle(),
        ]);

        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (user.email) {
          setUserName(user.email.split('@')[0]);
        }

        if (dna?.raw_resume_text) {
          setStoredResumeText(dna.raw_resume_text);
          setResumeText(dna.raw_resume_text);
        }

        if (typeof window !== 'undefined') {
          const preloadedJd = localStorage.getItem('careerpilot_target_jd');
          const preloadedRole = localStorage.getItem('careerpilot_target_role');
          if (preloadedJd && preloadedJd.trim().length > 0) {
            setTargetJd(preloadedJd);
            if (preloadedRole) {
              setSelectedJdLabel(preloadedRole);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadUserData();
  }, []);

  const handleModeSwitch = (mode: 'stored' | 'upload') => {
    setInputMode(mode);
    setUploadError(null);
    if (mode === 'stored' && storedResumeText) {
      setResumeText(storedResumeText);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.txt', '.md'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setUploadError('Please upload a PDF or plain text resume.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploadedFileName(file.name);
    setIsParsingFile(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/career-dna/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract text from PDF');

      if (data.text) {
        setResumeText(data.text);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Unable to parse PDF. You can paste your resume text directly below.');
    } finally {
      setIsParsingFile(false);
    }
  };

  // Dynamic Suggest JDs API call based on active resume text
  const handleSuggestJds = async () => {
    if (!resumeText.trim() || isSuggestingJds) return;

    setIsSuggestingJds(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/resume/suggest-jds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate tailored job descriptions.');
      }

      const roles = json.data || json.suggestedRoles;
      if (Array.isArray(roles) && roles.length > 0) {
        setSuggestedJds(roles);
        // Auto-select the first suggested JD
        setTargetJd(roles[0].fullJobDescription);
        setSelectedJdLabel(roles[0].label);
        if (typeof window !== 'undefined') {
          localStorage.setItem('careerpilot_target_jd', roles[0].fullJobDescription);
          localStorage.setItem('careerpilot_target_role', roles[0].roleTitle);
        }
      }
    } catch (err: any) {
      console.warn('Suggest JDs error note:', err?.message);
    } finally {
      setIsSuggestingJds(false);
    }
  };

  const handleSelectSuggestedJd = (item: SuggestedJdItem) => {
    setTargetJd(item.fullJobDescription);
    setSelectedJdLabel(item.label);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerpilot_target_jd', item.fullJobDescription);
      localStorage.setItem('careerpilot_target_role', item.roleTitle);
    }
  };

  const handleAnalyzeFit = async () => {
    if (!resumeText.trim() || !targetJd.trim()) {
      setAnalysisError('Please provide both candidate resume text and a target job description.');
      return;
    }

    setLoading(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription: targetJd }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        json = { error: text || 'Resume analysis response could not be parsed. Please retry.' };
      }

      if (!res.ok) {
        throw new Error(json.error || 'AI Intelligence Engine (Gemma) analysis request failed');
      }

      setAnalysis(json.data || json.analysis);
      if (json.scanId) {
        setLatestScanId(json.scanId);
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to analyze resume fit with AI Intelligence Engine (Gemma).');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const candidateDisplayName = userName || 'Candidate';

  return (
    <main className="min-h-screen bg-[#141413] text-[#faf9f5] pt-32 pb-16 px-4 sm:px-8 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#252320] pb-6 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#cc785c] font-semibold flex items-center gap-1.5 font-mono">
              <Briefcase className="w-3.5 h-3.5" /> Resume Intelligence Studio
            </span>
            <h1 className="font-serif text-3xl md:text-5xl font-normal text-white mt-1">
              Resume Intelligence &amp; ATS Match
            </h1>
            <p className="text-sm text-[#8e8b82] mt-1">
              Evaluating candidate resume against target role requirements with AI Intelligence Engine (Gemma).
            </p>
          </div>

          <button
            onClick={handleAnalyzeFit}
            disabled={loading || initialLoading || isParsingFile}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-6 py-3 rounded-md font-medium text-sm transition-all flex items-center gap-2 self-start md:self-auto disabled:opacity-50 cursor-pointer shadow-lg font-mono"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing with Gemma...' : 'Analyze Fit with AI Agent'}
          </button>
        </div>

        {/* Upload Parsing Error Banner */}
        {uploadError && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Real Live Analysis Status Notification */}
        {analysisError && (
          <div className="p-3.5 bg-[#cc785c]/10 border border-[#cc785c]/30 rounded-lg text-[#faf9f5] text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#cc785c]" />
              <span className="text-[#e6dfd8]">{analysisError}</span>
            </div>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-[#a09d96] hover:text-white text-xs font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Candidate Resume (Dual Source Toggle) */}
          <div className="bg-[#181715] border border-[#252320] rounded-xl p-5 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#252320] pb-3">
              <div>
                <h3 className="font-serif text-lg text-white">
                  Candidate Resume ({candidateDisplayName})
                </h3>
                <span className="text-xs text-[#8e8b82]">Select source or edit directly</span>
              </div>

              {/* Source Toggle */}
              <div className="flex items-center bg-[#1f1e1b] p-1 rounded-lg border border-[#3d3d3a]">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('stored')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'stored'
                      ? 'bg-[#cc785c] text-white shadow-sm'
                      : 'text-[#8e8b82] hover:text-white'
                  }`}
                >
                  <Database className="w-3 h-3" /> Stored Resume
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('upload')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-[#cc785c] text-white shadow-sm'
                      : 'text-[#8e8b82] hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3 h-3" /> Upload PDF
                </button>
              </div>
            </div>

            {inputMode === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 bg-[#1f1e1b] border border-dashed border-[#3d3d3a] hover:border-[#cc785c] rounded-lg flex items-center justify-between cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-[#181715] flex items-center justify-center text-[#cc785c]">
                    {isParsingFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Click to Upload Resume (PDF / TXT)'}
                    </p>
                    <p className="text-[10px] text-[#8e8b82]">Parses plain text server-side without binary corruption</p>
                  </div>
                </div>
                <span className="text-xs text-[#cc785c] font-mono hover:underline">Choose File ↗</span>
              </div>
            )}

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={initialLoading ? "Loading candidate resume from database..." : "Paste or review your resume plain text here..."}
              className="w-full h-72 bg-[#1f1e1b] border border-[#3d3d3a] rounded-md p-4 text-xs font-mono text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* Right: Target Job Description (Dynamic AI Suggestions & Chips) */}
          <div className="bg-[#181715] border border-[#252320] rounded-xl p-5 space-y-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#252320] pb-3">
                <div>
                  <h3 className="font-serif text-lg text-white">Target Job Description (JD)</h3>
                  <span className="text-xs text-[#8e8b82]">Select tailored role or custom paste</span>
                </div>

                {/* AI Match Button */}
                <button
                  type="button"
                  onClick={handleSuggestJds}
                  disabled={isSuggestingJds || !resumeText.trim()}
                  className="bg-[#cc785c]/15 hover:bg-[#cc785c]/25 border border-[#cc785c]/40 text-[#cc785c] px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  title="Generate tailored job descriptions matching your active resume stack"
                >
                  {isSuggestingJds ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isSuggestingJds ? 'Matching Roles...' : '✨ Match JDs to My Resume'}</span>
                </button>
              </div>

              {/* Dynamic AI Suggested Role Chips */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#a09d96] flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#cc785c]" /> Tailored Roles for Your Stack:
                  </span>
                  <span className="text-[10px] font-mono text-[#8e8b82]">Click chip to load JD</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {suggestedJds.map((item, idx) => {
                    const isSelected = selectedJdLabel === item.label;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestedJd(item)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 cursor-pointer font-mono ${
                          isSelected
                            ? 'bg-[#cc785c] text-white border-[#cc785c] font-semibold shadow-md'
                            : 'bg-[#1f1e1b] text-[#dcd7cb] border-[#3d3d3a] hover:border-[#cc785c]'
                        }`}
                        title={`${item.roleTitle} (${item.companyType})`}
                      >
                        <Briefcase className="w-3 h-3 opacity-75 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <textarea
              value={targetJd}
              onChange={(e) => {
                setTargetJd(e.target.value);
                setSelectedJdLabel(null);
              }}
              placeholder="Paste target job description or pick an AI-tailored role chip above..."
              className="w-full h-64 bg-[#1f1e1b] border border-[#3d3d3a] rounded-md p-4 text-xs font-mono text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-none leading-relaxed shadow-inner mt-2"
            />
          </div>

        </div>

        {/* Dynamic Output Section (Renders only when live analysis is present) */}
        {analysis && (
          <div className="space-y-6 pt-4 border-t border-[#252320]">
            
            {/* Top Metrics Banner & Launch Mock Interview CTA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* ATS Score Gauge */}
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase font-mono text-[#8e8b82]">Overall ATS Score</span>
                  <div className="text-4xl font-serif text-white mt-1">{analysis.atsScore}/100</div>
                  <p className="text-xs text-[#8e8b82] mt-1">Single-column parse rate and hard skill alignment.</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-[#cc785c] flex items-center justify-center font-bold text-lg text-[#cc785c] shadow-md">
                  {analysis.atsScore}%
                </div>
              </div>

              {/* Match Percentage Gauge */}
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase font-mono text-[#8e8b82]">JD Match Percentage</span>
                  <div className="text-4xl font-serif text-emerald-400 mt-1">{analysis.matchPercentage}%</div>
                  <p className="text-xs text-[#8e8b82] mt-1">Semantic domain and experience relevance.</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-lg text-emerald-400 shadow-md">
                  {analysis.matchPercentage}%
                </div>
              </div>

              {/* Primary Warm Coral Action Transition CTA */}
              <div className="bg-[#cc785c] text-white p-6 rounded-xl flex flex-col justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-black/20 px-2 py-0.5 rounded inline-block font-mono">
                    ⚡ Tailored Interview Ready
                  </span>
                  <h3 className="font-serif text-xl font-medium text-white">Practice Role-Grounded Drills</h3>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Test your actual project trade-offs in live multi-turn technical rounds tailored to this JD.
                  </p>
                </div>

                <Link
                  href={`/interview${latestScanId ? `?scanId=${latestScanId}` : ''}`}
                  className="mt-4 inline-flex items-center justify-center gap-2 bg-[#181715] hover:bg-[#1f1e1b] text-white px-4 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all shadow-md"
                >
                  <span>Launch Interview Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* Keyword Match & Skill Gaps Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Strengths & Matching Signals */}
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-4 shadow-md">
                <div className="flex items-center gap-2 border-b border-[#252320] pb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-serif text-lg text-white">Resume Strengths &amp; Alignment</h3>
                </div>

                <ul className="space-y-2.5 text-xs text-[#dcd7cb]">
                  {analysis.resumeStrengths?.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Critical Missing Keywords & ATS Gaps */}
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#252320] pb-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#cc785c]" />
                    <h3 className="font-serif text-lg text-white">Missing Keywords in JD</h3>
                  </div>
                  <span className="text-xs font-mono text-[#cc785c] bg-[#cc785c]/10 px-2 py-0.5 rounded">
                    {analysis.missingKeywords?.length || 0} Gaps Detected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords?.map((kw: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#1f1e1b] border border-[#cc785c]/30 text-[#cc785c] text-xs font-mono"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* STAR-Method Bullet Point Optimization Workbench */}
            <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-[#252320] pb-3">
                <div>
                  <h3 className="font-serif text-xl text-white">
                    STAR-Method Bullet Point Optimization Workbench
                  </h3>
                  <p className="text-xs text-[#8e8b82] mt-0.5">
                    Transform weak project descriptions into metric-driven achievements (Situation/Task, Action, Result).
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  Gemma Evaluated
                </span>
              </div>

              <div className="space-y-4">
                {analysis.starOptimizations?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-5 rounded-lg bg-[#1f1e1b] border border-[#2e2d29] space-y-3 shadow-inner"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#8e8b82]">
                        Original Bullet (Weak / Unquantified)
                      </span>
                      <p className="text-xs font-mono text-[#8e8b82] bg-[#181715] p-2.5 rounded border border-[#252320]">
                        &quot;{item.originalBullet}&quot;
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                          ✨ AI STAR-Optimized Version (Ready to paste)
                        </span>
                        <button
                          onClick={() => handleCopy(item.starOptimizedBullet, idx)}
                          className="text-xs font-mono text-[#cc785c] hover:text-[#a9583e] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIdx === idx ? 'Copied!' : 'Copy Bullet'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-white bg-[#181715] p-3 rounded border border-emerald-500/30 leading-relaxed font-medium">
                        {item.starOptimizedBullet}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="text-emerald-400 font-mono font-semibold">
                        Impact Metric: {item.metricImpact}
                      </span>
                      <span className="text-[#8e8b82] italic">
                        Rationale: {item.rationale}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Actionable Next Steps */}
            <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-4 shadow-md">
              <h3 className="font-serif text-lg text-white">Actionable Next Steps for this Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.actionableRecommendations?.map((rec: string, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg bg-[#1f1e1b] border border-[#2e2d29] space-y-1.5">
                    <span className="text-xs font-bold text-[#cc785c] font-mono">0{idx + 1}.</span>
                    <p className="text-xs text-[#dcd7cb] leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
