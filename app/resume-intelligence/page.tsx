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
} from 'lucide-react';

const PRESET_JDS = [
  {
    name: 'Linear — Frontend Systems',
    text: `Linear - Frontend Engineer (Product Systems)
Requirements:
- 2+ years experience crafting web applications with React, Next.js (App Router), and TypeScript.
- Strong mastery of design systems, CSS micro-animations, and fluid layout responsiveness.
- Passion for performance profiling, Core Web Vitals, and responsive UI craft.
- Experience with real-time state management and optimized API client caching.`,
  },
  {
    name: 'Stripe — Software Engineer',
    text: `Stripe - Software Engineer (Dashboard & Billing)
Requirements:
- Strong experience in React, TypeScript, and micro-frontend architecture.
- Demonstrated background in reliability metrics, error boundaries, and telemetry.
- Experience building financial web applications with high security and accessibility standard.`,
  },
  {
    name: 'Notion — Product Manager',
    text: `Notion - Product Manager (AI Capabilities)
Requirements:
- 3+ years experience defining product requirements, writing detailed PRDs, and leading cross-functional design & engineering sprints.
- Strong background in AI feature integration, user research synthesis, and data-driven A/B experimentation.`,
  },
  {
    name: 'Anthropic — AI Systems Engineer',
    text: `Anthropic - AI Systems Engineer (Prompt & Agent Systems)
Requirements:
- Strong Python, PyTorch, and LLM evaluation benchmarks experience.
- Experience building autonomous agent tool-calling loops and RAG vector search pipelines.
- Deep focus on AI safety, latency optimization, and scalable inference APIs.`,
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

  const [targetJd, setTargetJd] = useState(PRESET_JDS[0].text);
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user profile and stored resume from Supabase
        const [{ data: profile }, { data: dna }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
          supabase.from('career_dna').select('raw_resume_text').eq('user_id', user.id).maybeSingle(),
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

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Claude 4.5 Sonnet analysis request failed');
      }

      setAnalysis(json.data || json.analysis);
      if (json.scanId) {
        setLatestScanId(json.scanId);
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to analyze resume fit with Claude 4.5 Sonnet.');
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
    <main className="min-h-screen bg-[#141413] text-[#faf9f5] pt-28 pb-16 px-4 sm:px-8 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#252320] pb-6 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#cc785c] font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Resume Intelligence Studio
            </span>
            <h1 className="font-serif text-3xl md:text-5xl font-normal text-white mt-1">
              Resume Intelligence &amp; ATS Match
            </h1>
            <p className="text-sm text-[#8e8b82] mt-1">
              Evaluating candidate resume against target role requirements with live Claude 4.5 Sonnet.
            </p>
          </div>

          <button
            onClick={handleAnalyzeFit}
            disabled={loading || initialLoading || isParsingFile}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-6 py-3 rounded-md font-medium text-sm transition-all flex items-center gap-2 self-start md:self-auto disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing with Claude 4.5...' : 'Analyze Fit with AI Agent'}
          </button>
        </div>

        {/* Upload Parsing Error Banner */}
        {uploadError && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Real Live Analysis Error Banner (Red) */}
        {analysisError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-start gap-2.5 shadow-md">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-red-200">Claude 4.5 Sonnet Analysis Notice:</strong>
              <span>{analysisError}</span>
            </div>
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

          {/* Right: Target Job Description */}
          <div className="bg-[#181715] border border-[#252320] rounded-xl p-5 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#252320] pb-3">
              <div>
                <h3 className="font-serif text-lg text-white">Target Job Description (JD)</h3>
                <span className="text-xs text-[#8e8b82]">Custom paste or pick role preset</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_JDS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setTargetJd(preset.text)}
                    className="text-[11px] px-2 py-0.5 rounded bg-[#1f1e1b] border border-[#3d3d3a] hover:border-[#cc785c] text-[#dcd7cb] transition-colors cursor-pointer"
                  >
                    {preset.name.split('—')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={targetJd}
              onChange={(e) => setTargetJd(e.target.value)}
              placeholder="Paste target job description or requirements here..."
              className="w-full h-80 bg-[#1f1e1b] border border-[#3d3d3a] rounded-md p-4 text-xs font-mono text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-none leading-relaxed shadow-inner"
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
                  <span>Launch Tailored Mock Interview for this JD</span>
                  <ArrowRight className="w-4 h-4 text-[#cc785c]" />
                </Link>
              </div>

            </div>

            {/* Strengths, Improvements & Missing Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Strengths */}
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Resume Strengths
                </div>
                <ul className="space-y-2 text-xs text-[#dcd7cb]">
                  {(analysis.resumeStrengths || []).map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#cc785c]">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas of Improvement */}
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" /> Areas for Improvement
                </div>
                <ul className="space-y-2 text-xs text-[#dcd7cb]">
                  {(analysis.areasOfImprovement || []).map((imp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400">•</span> {imp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Keywords */}
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-[#cc785c] text-sm font-semibold">
                  <KeyRound className="w-4 h-4" /> Missing Keywords
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(analysis.missingKeywords || []).map((kw: string, idx: number) => (
                    <span key={idx} className="bg-[#252320] border border-[#3d3d3a] text-xs text-[#faf9f5] px-2.5 py-1 rounded-md">
                      +{kw}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* STAR Technical Optimization */}
            <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-white">STAR Technical Bullet Rewrites</h3>
                <span className="text-xs font-mono text-[#cc785c]">Action + Metric + Impact</span>
              </div>

              <div className="space-y-4">
                {(analysis.starOptimizations || []).map((opt: any, idx: number) => (
                  <div key={idx} className="bg-[#1f1e1b] border border-[#2e2d29] p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-[#8e8b82]">Original Bullet</span>
                      <span className="text-[10px] font-mono text-[#5db872]">{opt.metricImpact || '+24% ATS Match'}</span>
                    </div>
                    <p className="text-xs text-[#8e8b82] line-through">
                      {opt.originalBullet}
                    </p>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-0.5">AI STAR Optimized</span>
                      <p className="text-sm text-white font-medium">
                        {opt.starOptimizedBullet}
                      </p>
                    </div>

                    <div className="text-xs text-[#8e8b82] bg-[#181715] p-2.5 rounded border border-[#252320] flex items-center justify-between">
                      <div>
                        💡 <strong className="text-[#dcd7cb]">Impact Rationale:</strong> {opt.rationale}
                      </div>
                      <button
                        onClick={() => handleCopy(opt.starOptimizedBullet, idx)}
                        className="ml-3 px-2 py-1 bg-[#252320] hover:bg-[#3d3d3a] text-white text-[11px] font-mono rounded flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-[#5db872]" /> : <Copy className="w-3 h-3" />}
                        {copiedIdx === idx ? 'Copied' : 'Copy'}
                      </button>
                    </div>
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
