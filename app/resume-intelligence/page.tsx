'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, KeyRound, Copy, Check } from 'lucide-react';

export default function ResumeIntelligencePage() {
  const [userName, setUserName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [targetJd, setTargetJd] = useState(`Linear - Frontend Engineer (Product Systems)
Requirements:
- 2+ years experience crafting web applications with React, Next.js (App Router), and TypeScript.
- Strong mastery of design systems, CSS micro-animations, and fluid layout responsiveness.
- Passion for performance profiling, Core Web Vitals, and responsive UI craft.
- Experience with real-time state management and optimized API client caching.`);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch User Profile Name & Stored Resume from Career DNA
        const [{ data: profile }, { data: dna }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
          supabase.from('career_dna').select('raw_resume_text').eq('user_id', user.id).maybeSingle(),
        ]);

        if (profile?.full_name) setUserName(profile.full_name);
        if (dna?.raw_resume_text) setResumeText(dna.raw_resume_text);
      } catch (err) {
        console.error('Error fetching resume data:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadUserData();
  }, []);

  const handleAnalyzeFit = async () => {
    if (!resumeText.trim() || !targetJd.trim()) {
      alert('Please provide both resume text and a job description.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription: targetJd }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAnalysis(json.data || json.analysis);
    } catch (err: any) {
      alert(err.message || 'Failed to analyze resume fit');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <main className="min-h-screen bg-[#141413] text-[#faf9f5] pt-28 pb-16 px-4 sm:px-8 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#252320] pb-6 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#cc785c] font-semibold">
              Resume Intelligence Studio
            </span>
            <h1 className="font-serif text-3xl md:text-5xl font-normal text-white mt-1">
              Resume Intelligence &amp; ATS Match
            </h1>
            <p className="text-sm text-[#8e8b82] mt-1">
              Evaluating stored resume against target role requirements with Claude 3.5 Sonnet.
            </p>
          </div>
          <button
            onClick={handleAnalyzeFit}
            disabled={loading || initialLoading}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-6 py-3 rounded-md font-medium text-sm transition-all flex items-center gap-2 self-start md:self-auto disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing with AI...' : 'Analyze Fit with AI Agent'}
          </button>
        </div>

        {/* Input Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Active Resume */}
          <div className="bg-[#181715] border border-[#252320] rounded-xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-white">
                Active Resume Content {userName ? `(${userName})` : ''}
              </h3>
              <span className="text-xs font-mono text-[#8e8b82]">Editable Source Text</span>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={initialLoading ? "Loading candidate resume from database..." : "Paste or review your resume plain text here..."}
              className="w-full h-80 bg-[#1f1e1b] border border-[#3d3d3a] rounded-md p-4 text-xs font-mono text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* Right: Target JD */}
          <div className="bg-[#181715] border border-[#252320] rounded-xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-white">Target Job Description (JD)</h3>
              <span className="text-xs font-mono text-[#8e8b82]">Target Benchmark</span>
            </div>
            <textarea
              value={targetJd}
              onChange={(e) => setTargetJd(e.target.value)}
              placeholder="Paste target job description or requirements here..."
              className="w-full h-80 bg-[#1f1e1b] border border-[#3d3d3a] rounded-md p-4 text-xs font-mono text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-none leading-relaxed shadow-inner"
            />
          </div>
        </div>

        {/* Output Section */}
        {analysis && (
          <div className="space-y-6 pt-4 border-t border-[#252320]">
            {/* Top Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase font-mono text-[#8e8b82]">Overall ATS Score</span>
                  <div className="text-4xl font-serif text-white mt-1">{analysis.atsScore}/100</div>
                  <p className="text-xs text-[#8e8b82] mt-1">Single-column parse rate and structure alignment.</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-[#cc785c] flex items-center justify-center font-bold text-lg text-[#cc785c]">
                  {analysis.atsScore}%
                </div>
              </div>

              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase font-mono text-[#8e8b82]">JD Match Percentage</span>
                  <div className="text-4xl font-serif text-emerald-400 mt-1">{analysis.matchPercentage}%</div>
                  <p className="text-xs text-[#8e8b82] mt-1">Direct hard skill and experience relevance.</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-lg text-emerald-400">
                  {analysis.matchPercentage}%
                </div>
              </div>
            </div>

            {/* Strengths & Missing Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Strengths */}
              <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Resume Strengths
                </div>
                <ul className="space-y-2 text-xs text-[#dcd7cb]">
                  {(analysis.resumeStrengths || analysis.matchingStrengths || []).map((s: string, idx: number) => (
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
                  {(analysis.areasOfImprovement || analysis.resumeWeaknesses || []).map((imp: string, idx: number) => (
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
                  {(analysis.missingKeywords || analysis.missingSkills || []).map((kw: string, idx: number) => (
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
                {(analysis.starOptimizations || analysis.tailoredBulletPoints || []).map((opt: any, idx: number) => (
                  <div key={idx} className="bg-[#1f1e1b] border border-[#2e2d29] p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-[#8e8b82]">Original Bullet</span>
                      <span className="text-[10px] font-mono text-[#5db872]">{opt.metricImpact || '+24% ATS Match'}</span>
                    </div>
                    <p className="text-xs text-[#8e8b82] line-through">
                      {opt.originalBullet || opt.originalText || opt.original}
                    </p>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-0.5">AI STAR Optimized</span>
                      <p className="text-sm text-white font-medium">
                        {opt.starOptimizedBullet || opt.suggestedText || opt.suggested}
                      </p>
                    </div>

                    <div className="text-xs text-[#8e8b82] bg-[#181715] p-2.5 rounded border border-[#252320] flex items-center justify-between">
                      <div>
                        💡 <strong className="text-[#dcd7cb]">Impact Rationale:</strong> {opt.rationale || opt.reasoning || opt.reason}
                      </div>
                      <button
                        onClick={() => handleCopy(opt.starOptimizedBullet || opt.suggestedText || opt.suggested, idx)}
                        className="ml-3 px-2 py-1 bg-[#252320] hover:bg-[#3d3d3a] text-white text-[11px] font-mono rounded flex items-center gap-1 shrink-0 transition-colors"
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
