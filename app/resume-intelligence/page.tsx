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

export default function ResumeIntelligencePage() {
  const [userName, setUserName] = useState('');
  const [storedResumeText, setStoredResumeText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [inputMode, setInputMode] = useState<'stored' | 'upload'>('stored');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Target JD input modes & upload states
  const [jdInputMode, setJdInputMode] = useState<'paste' | 'upload'>('paste');
  const [uploadedJdFileName, setUploadedJdFileName] = useState<string | null>(null);
  const [isParsingJdFile, setIsParsingJdFile] = useState(false);
  const [jdUploadError, setJdUploadError] = useState<string | null>(null);

  // Dynamic Suggested JDs State (starts clean and empty)
  const [suggestedJds, setSuggestedJds] = useState<SuggestedJdItem[]>([]);
  const [isSuggestingJds, setIsSuggestingJds] = useState(false);
  const [selectedJdLabel, setSelectedJdLabel] = useState<string | null>(null);

  // Target JD starts empty
  const [targetJd, setTargetJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [latestScanId, setLatestScanId] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);
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
        } else if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
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

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Handle Target Job Description file upload (PDF / TXT / MD)
  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.txt', '.md'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setJdUploadError('Please upload a PDF or plain text Job Description.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setJdUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploadedJdFileName(file.name);
    setIsParsingJdFile(true);
    setJdUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/career-dna/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract text from JD file');

      if (data.text) {
        setTargetJd(data.text);
        setSelectedJdLabel(null);
      }
    } catch (err: any) {
      setJdUploadError(err.message || 'Unable to parse JD file. You can paste the job description directly.');
    } finally {
      setIsParsingJdFile(false);
    }
  };

  // Dynamic Suggest JDs API call based on active resume text
  const handleSuggestJds = async (textToUse?: string) => {
    const resume = (textToUse || resumeText).trim();
    if (!resume) {
      setAnalysisError('Please upload or paste your resume on the left first to match target job descriptions.');
      return;
    }

    setIsSuggestingJds(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/resume/suggest-jds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume }),
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
    const resume = resumeText.trim();
    let currentJd = targetJd.trim();

    if (!resume) {
      setAnalysisError('Please provide or upload a candidate resume on the left first.');
      return;
    }

    // If target JD is empty, auto-generate and populate the best matched JD on the fly
    if (!currentJd) {
      setIsSuggestingJds(true);
      try {
        const res = await fetch('/api/resume/suggest-jds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText: resume }),
        });
        const json = await res.json();
        const roles = json.data || json.suggestedRoles;
        if (Array.isArray(roles) && roles.length > 0) {
          setSuggestedJds(roles);
          currentJd = roles[0].fullJobDescription;
          setTargetJd(currentJd);
          setSelectedJdLabel(roles[0].label);
        }
      } catch (err) {
        console.warn('Auto-JD suggest note:', err);
      } finally {
        setIsSuggestingJds(false);
      }
    }

    if (!currentJd) {
      setAnalysisError('Please upload a target Job Description or click "Refresh Roles" to match your stack.');
      return;
    }

    setLoading(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume, jobDescription: currentJd }),
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
    <main className="min-h-screen bg-[#f6f4ee] dark:bg-[#121110] text-[#121110] dark:text-[#faf9f5] pt-28 pb-20 px-4 sm:px-8 md:px-10 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Studio Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#ded7cb] dark:border-white/[0.08] pb-6 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#cc785c] font-bold flex items-center gap-2 font-mono">
              <Briefcase className="w-3.5 h-3.5" /> Resume Intelligence &amp; ATS Studio
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[#121110] dark:text-[#faf9f5] mt-1.5">
              Resume Intelligence &amp; ATS Match
            </h1>
            <p className="text-xs sm:text-sm text-[#57534e] dark:text-[#a09d96] mt-1 font-medium">
              Cross-evaluating candidate resume against target role requirements with AI Intelligence Engine.
            </p>
          </div>

          <button
            onClick={handleAnalyzeFit}
            disabled={loading || initialLoading || isParsingFile || isParsingJdFile}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 self-start md:self-auto disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-mono coral-glow-subtle"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Analyzing with AI...' : 'Analyze Fit with AI'}</span>
          </button>
        </div>

        {/* Upload Parsing Error Banners */}
        {uploadError && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2.5 shadow-sm font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{uploadError}</span>
          </div>
        )}

        {jdUploadError && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2.5 shadow-sm font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{jdUploadError}</span>
          </div>
        )}

        {/* Analysis Status Notification */}
        {analysisError && (
          <div className="p-4 bg-[#cc785c]/10 border border-[#cc785c]/30 rounded-xl text-[#121110] dark:text-[#faf9f5] text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#cc785c]" />
              <span className="text-[#2d2a26] dark:text-[#e6dfd8] font-medium">{analysisError}</span>
            </div>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-[#57534e] dark:text-[#a09d96] hover:text-[#121110] dark:hover:text-white text-xs font-mono cursor-pointer font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Candidate Resume (Dual Source Toggle) */}
          <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ded7cb] dark:border-white/10 pb-3.5">
              <div>
                <h3 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5]">
                  Candidate Resume ({candidateDisplayName})
                </h3>
                <span className="text-xs text-[#57534e] dark:text-[#8e8b82] font-medium">Select source or upload PDF</span>
              </div>

              {/* Source Toggle */}
              <div className="flex items-center bg-[#f0ebe1] dark:bg-[#201e1c] p-1 rounded-xl border border-[#ded7cb] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('stored')}
                  className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'stored'
                      ? 'bg-[#cc785c] text-white shadow-sm font-bold'
                      : 'text-[#3b3834] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-white'
                  }`}
                >
                  <Database className="w-3 h-3" /> Stored Resume
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('upload')}
                  className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-[#cc785c] text-white shadow-sm font-bold'
                      : 'text-[#3b3834] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3 h-3" /> Upload PDF
                </button>
              </div>
            </div>

            {inputMode === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-[#f6f4ee] dark:bg-[#201e1c] border border-dashed border-[#ded7cb] dark:border-white/15 hover:border-[#cc785c] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleResumeFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f0ebe1] dark:bg-[#181716] flex items-center justify-center text-[#cc785c] shadow-sm">
                    {isParsingFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#121110] dark:text-white">
                      {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Click to Upload Resume (PDF / TXT)'}
                    </p>
                    <p className="text-[10px] text-[#57534e] dark:text-[#8e8b82]">Parses plain text server-side without binary corruption</p>
                  </div>
                </div>
                <span className="text-xs text-[#cc785c] font-mono font-bold hover:underline">Choose File ↗</span>
              </div>
            )}

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={initialLoading ? "Loading candidate resume from database..." : "Paste or review your resume plain text here..."}
              className="w-full h-72 bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 rounded-xl p-4 text-xs font-mono text-[#121110] dark:text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* Right: Target Job Description (Upload JD / Paste / AI Match) */}
          <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ded7cb] dark:border-white/10 pb-3.5">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5]">Target Job Description (JD)</h3>
                  <span className="text-xs text-[#57534e] dark:text-[#8e8b82] font-medium">Upload JD document or paste requirements</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* JD Input Mode Toggle */}
                  <div className="flex items-center bg-[#f0ebe1] dark:bg-[#201e1c] p-1 rounded-xl border border-[#ded7cb] dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setJdInputMode('paste')}
                      className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                        jdInputMode === 'paste'
                          ? 'bg-[#cc785c] text-white shadow-sm font-bold'
                          : 'text-[#3b3834] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-white'
                      }`}
                    >
                      <FileText className="w-3 h-3" /> Paste JD
                    </button>
                    <button
                      type="button"
                      onClick={() => setJdInputMode('upload')}
                      className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                        jdInputMode === 'upload'
                          ? 'bg-[#cc785c] text-white shadow-sm font-bold'
                          : 'text-[#3b3834] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" /> Upload JD
                    </button>
                  </div>

                  {/* Refresh Roles Button */}
                  <button
                    type="button"
                    onClick={() => handleSuggestJds()}
                    disabled={isSuggestingJds || !resumeText.trim()}
                    className="bg-[#f6f4ee] dark:bg-[#201e1c] hover:bg-[#ede8df] dark:hover:bg-[#282624] border border-[#ded7cb] dark:border-white/10 hover:border-[#cc785c] text-[#121110] dark:text-[#faf9f5] px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 shadow-sm"
                    title="Generate tailored role descriptions based on active resume"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#cc785c] ${isSuggestingJds ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline font-medium">{isSuggestingJds ? 'Matching...' : 'Auto-Match'}</span>
                  </button>
                </div>
              </div>

              {/* Upload JD File Dropzone (Shown in upload mode) */}
              {jdInputMode === 'upload' && (
                <div
                  onClick={() => jdFileInputRef.current?.click()}
                  className="mt-3 p-4 bg-[#f6f4ee] dark:bg-[#201e1c] border border-dashed border-[#ded7cb] dark:border-white/15 hover:border-[#cc785c] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <input
                    ref={jdFileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={handleJdFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#f0ebe1] dark:bg-[#181716] flex items-center justify-center text-[#cc785c] shadow-sm">
                      {isParsingJdFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#121110] dark:text-white">
                        {uploadedJdFileName ? `Loaded: ${uploadedJdFileName}` : 'Click to Upload Target JD (PDF / TXT)'}
                      </p>
                      <p className="text-[10px] text-[#57534e] dark:text-[#8e8b82]">Extracts job requirements and role stack automatically</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#cc785c] font-mono font-bold hover:underline">Choose File ↗</span>
                </div>
              )}

              {/* Dynamic AI Suggested Role Chips */}
              {suggestedJds.length > 0 && (
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#57534e] dark:text-[#a09d96] flex items-center gap-1.5 font-bold">
                      <Layers className="w-3.5 h-3.5 text-[#cc785c]" /> Tailored Roles for Your Stack:
                    </span>
                    <span className="text-[10px] font-mono text-[#57534e] dark:text-[#8e8b82]">Click chip to load JD</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {suggestedJds.map((item, idx) => {
                      const isSelected = selectedJdLabel === item.label;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestedJd(item)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer font-mono ${
                            isSelected
                              ? 'bg-[#cc785c] text-white border-[#cc785c] font-bold shadow-md'
                              : 'bg-[#f6f4ee] dark:bg-[#201e1c] text-[#121110] dark:text-[#dcd7cb] border-[#ded7cb] dark:border-white/10 hover:border-[#cc785c]'
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
              )}
            </div>

            <textarea
              value={targetJd}
              onChange={(e) => {
                setTargetJd(e.target.value);
                setSelectedJdLabel(null);
              }}
              placeholder="Target Job Description will appear here. Upload a JD file above, paste text directly, or click 'Auto-Match'..."
              className="w-full h-64 bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 rounded-xl p-4 text-xs font-mono text-[#121110] dark:text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-none leading-relaxed shadow-inner mt-3"
            />
          </div>

        </div>

        {/* Dynamic Output Section */}
        {analysis && (
          <div className="space-y-8 pt-6 border-t border-[#ded7cb] dark:border-white/[0.08]">
            
            {/* Top Metrics Banner & Launch Mock Interview CTA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* ATS Score Gauge */}
              <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] p-6 rounded-2xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase font-mono text-[#57534e] dark:text-[#8e8b82] font-semibold">Overall ATS Score</span>
                  <div className="text-4xl font-display font-bold text-[#121110] dark:text-white mt-1">{analysis.atsScore}/100</div>
                  <p className="text-xs text-[#57534e] dark:text-[#8e8b82] mt-1 font-medium">Single-column parse rate &amp; skill alignment.</p>
                </div>
                <div className="w-16 h-16 rounded-2xl border-2 border-[#cc785c] bg-[#cc785c]/10 flex items-center justify-center font-bold text-xl text-[#cc785c] shadow-inner font-mono">
                  {analysis.atsScore}%
                </div>
              </div>

              {/* Match Percentage Gauge */}
              <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] p-6 rounded-2xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase font-mono text-[#57534e] dark:text-[#8e8b82] font-semibold">JD Match Percentage</span>
                  <div className="text-4xl font-display font-bold text-[#2e8544] dark:text-emerald-400 mt-1">{analysis.matchPercentage}%</div>
                  <p className="text-xs text-[#57534e] dark:text-[#8e8b82] mt-1 font-medium">Semantic domain and experience relevance.</p>
                </div>
                <div className="w-16 h-16 rounded-2xl border-2 border-[#2e8544] dark:border-emerald-500 bg-emerald-500/10 flex items-center justify-center font-bold text-xl text-[#2e8544] dark:text-emerald-400 shadow-inner font-mono">
                  {analysis.matchPercentage}%
                </div>
              </div>

              {/* Primary Warm Coral Action Transition CTA */}
              <div className="bg-gradient-to-br from-[#cc785c] to-[#b86247] text-white p-6 rounded-2xl flex flex-col justify-between shadow-xl coral-glow-subtle border border-white/20">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-black/25 px-2.5 py-0.5 rounded-full inline-block font-mono border border-white/20">
                    ⚡ Tailored Interview Ready
                  </span>
                  <h3 className="font-display text-2xl font-bold text-white tracking-tight">Practice Role-Grounded Drills</h3>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Test your actual project trade-offs in live multi-turn technical rounds tailored to this JD.
                  </p>
                </div>

                <Link
                  href={`/interview${latestScanId ? `?scanId=${latestScanId}` : ''}`}
                  className="mt-4 inline-flex items-center justify-center gap-2 bg-[#121110] hover:bg-[#201e1c] text-white px-5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md active:scale-98"
                >
                  <span>Launch Interview Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* Keyword Match & Skill Gaps Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Strengths & Matching Signals */}
              <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] p-6 sm:p-7 rounded-2xl space-y-4 shadow-md">
                <div className="flex items-center gap-2.5 border-b border-[#ded7cb] dark:border-white/10 pb-3.5">
                  <CheckCircle2 className="w-5 h-5 text-[#2e8544] dark:text-emerald-400" />
                  <h3 className="font-display text-xl font-bold text-[#121110] dark:text-white">Resume Strengths &amp; Alignment</h3>
                </div>

                <ul className="space-y-2.5 text-xs text-[#2d2a26] dark:text-[#dcd7cb] font-medium">
                  {analysis.resumeStrengths?.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-[#2e8544] dark:text-[#5db872] font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Critical Missing Keywords & ATS Gaps */}
              <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] p-6 sm:p-7 rounded-2xl space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-[#ded7cb] dark:border-white/10 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-5 h-5 text-[#cc785c]" />
                    <h3 className="font-display text-xl font-bold text-[#121110] dark:text-white">Missing Keywords in JD</h3>
                  </div>
                  <span className="text-xs font-mono text-[#cc785c] bg-[#cc785c]/10 px-2.5 py-0.5 rounded-md font-bold">
                    {analysis.missingKeywords?.length || 0} Gaps Detected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords?.map((kw: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#cc785c]/30 text-[#cc785c] text-xs font-mono font-bold shadow-sm"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* STAR-Method Bullet Point Optimization Workbench */}
            <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] p-6 sm:p-8 rounded-2xl space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-[#ded7cb] dark:border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#121110] dark:text-white">
                    STAR-Method Bullet Point Optimization Workbench
                  </h3>
                  <p className="text-xs sm:text-sm text-[#57534e] dark:text-[#8e8b82] mt-0.5 font-medium">
                    Transform weak project descriptions into metric-driven achievements (Situation/Task, Action, Result).
                  </p>
                </div>
                <span className="text-xs font-mono text-[#2e8544] dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold">
                  AI Evaluated
                </span>
              </div>

              <div className="space-y-4">
                {analysis.starOptimizations?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-5 sm:p-6 rounded-xl bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 space-y-3.5 shadow-sm"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#57534e] dark:text-[#8e8b82] font-bold">
                        Original Bullet (Weak / Unquantified)
                      </span>
                      <p className="text-xs font-mono text-[#57534e] dark:text-[#8e8b82] bg-[#ffffff] dark:bg-[#181716] p-3 rounded-lg border border-[#ded7cb] dark:border-white/5 line-through opacity-80 font-medium">
                        &quot;{item.originalBullet}&quot;
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#2e8544] dark:text-emerald-400 font-bold flex items-center gap-1.5">
                          ✨ AI STAR-Optimized Version (Ready to paste)
                        </span>
                        <button
                          onClick={() => handleCopy(item.starOptimizedBullet, idx)}
                          className="text-xs font-mono text-[#cc785c] hover:text-[#a9583e] flex items-center gap-1.5 cursor-pointer transition-colors font-bold"
                        >
                          {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-[#2e8544] dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIdx === idx ? 'Copied!' : 'Copy Bullet'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-[#121110] dark:text-white bg-[#ffffff] dark:bg-[#181716] p-3.5 rounded-lg border border-emerald-500/30 leading-relaxed font-bold shadow-inner">
                        {item.starOptimizedBullet}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono">
                      <span className="text-[#2e8544] dark:text-emerald-400 font-bold">
                        Impact Metric: {item.metricImpact}
                      </span>
                      <span className="text-[#57534e] dark:text-[#8e8b82] italic font-medium">
                        Rationale: {item.rationale}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Actionable Next Steps */}
            <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] p-6 sm:p-8 rounded-2xl space-y-4 shadow-md">
              <h3 className="font-display text-xl font-bold text-[#121110] dark:text-white">Actionable Next Steps for this Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.actionableRecommendations?.map((rec: string, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 space-y-1.5">
                    <span className="text-xs font-bold text-[#cc785c] font-mono">0{idx + 1}.</span>
                    <p className="text-xs text-[#2d2a26] dark:text-[#dcd7cb] leading-relaxed font-medium">{rec}</p>
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
