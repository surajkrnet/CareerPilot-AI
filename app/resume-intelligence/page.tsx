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

  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [docWarning, setDocWarning] = useState<string | null>(null);

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
    setDocWarning(null);
    if (mode === 'stored' && storedResumeText) {
      setResumeText(storedResumeText);
    }
  };

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.md'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setUploadError('Supported document formats: PDF, Word (DOCX/DOC), Text (TXT/RTF/MD).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds 15MB limit. Please upload a smaller Resume/CV.');
      return;
    }

    setUploadedFileName(file.name);
    setIsParsingFile(true);
    setUploadError(null);
    setDocWarning(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slot', 'resume');

      const res = await fetch('/api/career-dna/parse-pdf?slot=resume', {
        method: 'POST',
        body: formData,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: 'Failed to read document response.' };
      }

      if (!res.ok || !data.accepted) {
        setUploadedFileName(null);
        throw new Error(data.error || data.reason || 'This document does not appear to be a Resume or CV. Please upload a valid Resume or CV.');
      }

      if (data.text) {
        setResumeText(data.text);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Unable to parse document as a Resume/CV. Please upload a valid Resume or CV.');
    } finally {
      setIsParsingFile(false);
    }
  };

  // Handle Target Job Description file upload (PDF / DOCX / TXT / RTF / MD)
  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.md'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setJdUploadError('Supported document formats: PDF, Word (DOCX/DOC), Text (TXT/RTF/MD).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setJdUploadError('File size exceeds 15MB limit. Please upload a smaller Job Description.');
      return;
    }

    setUploadedJdFileName(file.name);
    setIsParsingJdFile(true);
    setJdUploadError(null);
    setDocWarning(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slot', 'job_description');

      const res = await fetch('/api/career-dna/parse-pdf?slot=job_description', {
        method: 'POST',
        body: formData,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: 'Failed to read JD document response.' };
      }

      if (!res.ok || !data.accepted) {
        setUploadedJdFileName(null);
        throw new Error(data.error || data.reason || 'This document does not appear to be a Job Description. Please upload a valid Job Description.');
      }

      if (data.text) {
        setTargetJd(data.text);
        setSelectedJdLabel(null);
      }
    } catch (err: any) {
      setJdUploadError(err.message || 'Unable to parse document as a Job Description. Please upload a valid Job Description.');
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
      setAnalysisError('Please upload a target Job Description or click "Auto-Match" to match your stack.');
      return;
    }

    setLoading(true);
    setAnalysisError(null);
    setAnalysisStage(1);

    const stageTimer1 = setTimeout(() => setAnalysisStage(2), 600);
    const stageTimer2 = setTimeout(() => setAnalysisStage(3), 1300);
    const stageTimer3 = setTimeout(() => setAnalysisStage(4), 2100);

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

      if (!res.ok || json.accepted === false) {
        setAnalysis(null);
        throw new Error(json.error || json.reason || 'Document validation failed. Upload a valid Resume and Job Description to continue.');
      }

      const finalData = json.data || json.analysis;
      setAnalysis(finalData);
      if (json.scanId) {
        setLatestScanId(json.scanId);
      }
    } catch (err: any) {
      setAnalysis(null);
      setAnalysisError(err.message || 'Failed to analyze resume fit with AI Intelligence Engine. Click "Retry" to try again.');
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setLoading(false);
      setAnalysisStage(0);
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
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#121110] dark:text-[#faf9f5] mt-1.5">
              Resume Intelligence &amp; ATS Match
            </h1>
            <p className="text-sm sm:text-base text-[#57534e] dark:text-[#a09d96] mt-1 font-medium leading-relaxed">
              Upload any document format (PDF, DOCX, DOC, TXT, RTF) to cross-evaluate resume fit against target requirements.
            </p>
          </div>

          <button
            onClick={handleAnalyzeFit}
            disabled={loading || initialLoading || isParsingFile || isParsingJdFile}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-7 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2.5 self-start md:self-auto disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-mono coral-glow-subtle"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Analyzing...' : 'Analyze Fit with AI'}</span>
          </button>
        </div>

        {/* Staged Progressive AI Progress Box */}
        {loading && (
          <div className="p-6 bg-[#ffffff] dark:bg-[#181716] border border-[#cc785c]/30 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-bold text-[#121110] dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#cc785c]" />
                Analyzing Candidate Resume &amp; Role Fit...
              </h4>
              <span className="text-xs font-mono text-[#cc785c] font-bold">Stage {analysisStage}/4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className={`p-3 rounded-xl border transition-all ${analysisStage >= 1 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-[#ded7cb] dark:border-white/10 opacity-50'}`}>
                {analysisStage > 1 ? '✓' : '○'} Reading document &amp; structure
              </div>
              <div className={`p-3 rounded-xl border transition-all ${analysisStage >= 2 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-[#ded7cb] dark:border-white/10 opacity-50'}`}>
                {analysisStage > 2 ? '✓' : '○'} Extracting verified stack &amp; skills
              </div>
              <div className={`p-3 rounded-xl border transition-all ${analysisStage >= 3 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-[#ded7cb] dark:border-white/10 opacity-50'}`}>
                {analysisStage > 3 ? '✓' : '○'} Evaluating ATS keyword gaps
              </div>
              <div className={`p-3 rounded-xl border transition-all ${analysisStage >= 4 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-[#ded7cb] dark:border-white/10 opacity-50'}`}>
                {analysisStage === 4 ? '⏳' : '○'} Synthesizing STAR metric rewrites
              </div>
            </div>
          </div>
        )}

        {/* Document Classification Warning */}
        {docWarning && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-sm flex items-center justify-between gap-3 shadow-sm font-medium">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{docWarning}</span>
            </div>
            <button
              onClick={() => setDocWarning(null)}
              className="text-xs font-mono font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload Parsing Error Banners with Action Buttons */}
        {uploadError && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold text-sm block text-[#141413] dark:text-[#faf9f5]">Resume Document Not Accepted</span>
                <p className="text-xs leading-relaxed text-[#57534e] dark:text-[#a09d96]">{uploadError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setUploadError(null);
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold cursor-pointer transition-colors shadow-sm"
              >
                Choose Another File ↗
              </button>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-[#57534e] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-white text-xs font-mono px-2 py-1 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {jdUploadError && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold text-sm block text-[#141413] dark:text-[#faf9f5]">Job Description Not Accepted</span>
                <p className="text-xs leading-relaxed text-[#57534e] dark:text-[#a09d96]">{jdUploadError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setJdUploadError(null);
                  jdFileInputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold cursor-pointer transition-colors shadow-sm"
              >
                Choose Another File ↗
              </button>
              <button
                type="button"
                onClick={() => setJdUploadError(null)}
                className="text-[#57534e] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-white text-xs font-mono px-2 py-1 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Analysis Status Notification with 1-Click Retry */}
        {analysisError && (
          <div className="p-4 bg-[#cc785c]/10 border border-[#cc785c]/30 rounded-xl text-[#121110] dark:text-[#faf9f5] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#cc785c] mt-0.5" />
              <div>
                <span className="font-bold text-sm block text-[#141413] dark:text-[#faf9f5]">Analysis Notice</span>
                <p className="text-xs text-[#2d2a26] dark:text-[#e6dfd8] leading-relaxed">{analysisError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={handleAnalyzeFit}
                className="bg-[#cc785c] text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold hover:bg-[#a9583e] cursor-pointer shadow-sm"
              >
                Retry Analysis
              </button>
              <button
                onClick={() => setAnalysisError(null)}
                className="text-[#57534e] dark:text-[#a09d96] hover:text-[#121110] dark:hover:text-white text-xs font-mono cursor-pointer font-bold px-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Input Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Candidate Resume (Dual Source Toggle) */}
          <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ded7cb] dark:border-white/10 pb-3.5">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5]">
                    Candidate Resume
                  </h3>
                  <span className="text-xs text-[#57534e] dark:text-[#8e8b82] font-medium">Select stored profile or upload document</span>
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
                    accept=".pdf,.docx,.doc,.txt,.rtf,.md"
                    onChange={handleResumeFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f0ebe1] dark:bg-[#181716] flex items-center justify-center text-[#cc785c] shadow-sm">
                      {isParsingFile ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#121110] dark:text-white">
                        {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Click to Upload Resume (PDF, DOCX, DOC, TXT, RTF)'}
                      </p>
                      <p className="text-xs text-[#57534e] dark:text-[#8e8b82]">Accepts any standard document format without binary leakage</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#cc785c] font-mono font-bold hover:underline">Choose File ↗</span>
                </div>
              )}
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={initialLoading ? "Loading candidate resume from database..." : "Paste or review your resume plain text here..."}
              className="w-full h-80 min-h-[300px] bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 rounded-xl p-4 text-xs sm:text-sm font-mono text-[#121110] dark:text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-y leading-relaxed shadow-inner mt-4"
            />
          </div>

          {/* Right: Target Job Description (Upload JD / Paste / AI Match) */}
          <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ded7cb] dark:border-white/10 pb-3.5">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5]">Target Job Description (JD)</h3>
                  <span className="text-xs text-[#57534e] dark:text-[#8e8b82] font-medium">Upload JD document (PDF/DOCX/TXT) or paste requirements</span>
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
                      <FileText className="w-3.5 h-3.5" /> Paste JD
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
                      <UploadCloud className="w-3.5 h-3.5" /> Upload JD
                    </button>
                  </div>

                  {/* Refresh Roles Button */}
                  <button
                    type="button"
                    onClick={() => handleSuggestJds()}
                    disabled={isSuggestingJds || !resumeText.trim()}
                    className="bg-[#f6f4ee] dark:bg-[#201e1c] hover:bg-[#ede8df] dark:hover:bg-[#282624] border border-[#ded7cb] dark:border-white/10 hover:border-[#cc785c] text-[#121110] dark:text-[#faf9f5] px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 shadow-sm"
                    title="Generate tailored role descriptions based on active resume"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#cc785c] ${isSuggestingJds ? 'animate-spin' : ''}`} />
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
                    accept=".pdf,.docx,.doc,.txt,.rtf,.md"
                    onChange={handleJdFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f0ebe1] dark:bg-[#181716] flex items-center justify-center text-[#cc785c] shadow-sm">
                      {isParsingJdFile ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#121110] dark:text-white">
                        {uploadedJdFileName ? `Loaded: ${uploadedJdFileName}` : 'Click to Upload Target JD (PDF, DOCX, DOC, TXT, RTF)'}
                      </p>
                      <p className="text-xs text-[#57534e] dark:text-[#8e8b82]">Extracts job requirements and role stack automatically</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#cc785c] font-mono font-bold hover:underline">Choose File ↗</span>
                </div>
              )}

              {/* Dynamic AI Suggested Role Chips */}
              {suggestedJds.length > 0 && (
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#57534e] dark:text-[#a09d96] flex items-center gap-1.5 font-bold">
                      <Layers className="w-3.5 h-3.5 text-[#cc785c]" /> Tailored Roles for Your Stack:
                    </span>
                    <span className="text-xs font-mono text-[#57534e] dark:text-[#8e8b82]">Click chip to load JD</span>
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
                          <Briefcase className="w-3.5 h-3.5 opacity-75 shrink-0" />
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
              className="w-full h-80 min-h-[300px] bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 rounded-xl p-4 text-xs sm:text-sm font-mono text-[#121110] dark:text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-y leading-relaxed shadow-inner mt-4"
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
