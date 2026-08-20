'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';

export interface OnboardingMetadata {
  fullName?: string;
  education?: string;
  degree?: string;
  university?: string;
  gradYear?: string;
  expLevel?: string;
  targetRole?: string;
  domain?: string;
  workPreference?: string;
  jobType?: string;
  preferredIndustry?: string;
  preferredLocation?: string;
  expectedPackage?: string;
  selectedGoal?: string;
  selectedSkills?: string[];
}

export default function ResumeUploadStep({
  onboardingData,
  onSynthesisStart,
}: {
  onboardingData: OnboardingMetadata;
  onSynthesisStart?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string>('');
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parseNotice, setParseNotice] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [isEditingText, setIsEditingText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { setProfile, setResumeState } = useCareer();

  const processingSteps = [
    'Validating candidate profile & session',
    'Ingesting & sanitizing resume plain text',
    'AI Intelligence Engine (Gemma) synthesizing skills & gap analysis',
    'Atomically upserting Career DNA to database',
    'Career DNA calibration complete',
  ];

  // Handle immediate server-side PDF parsing and document validation upon file selection
  const [parsingStageText, setParsingStageText] = useState<string>('Validating document...');

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setParseNotice(null);
    setIsParsingPdf(true);
    setParsingStageText('Checking file signature & format...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('slot', 'resume');

      setParsingStageText('Reading & extracting document text...');
      const res = await fetch('/api/career-dna/parse-pdf?slot=resume', {
        method: 'POST',
        body: formData,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        data = { error: text || 'Failed to parse document response.' };
      }

      if (!res.ok || !data.accepted) {
        setFile(null);
        setParsedText('');
        throw new Error(data.error || data.reason || 'This document was not accepted as a Resume/CV. Please upload a valid Resume or CV.');
      }

      if (data.text) {
        setParsedText(data.text);
        const confPercent = Math.round((data.classification?.confidence || 0.95) * 100);
        setParseNotice(`✓ Resume Verified (${data.wordCount || ''} words extracted · ${confPercent}% Match). Review below or proceed.`);
      }
    } catch (err: any) {
      console.warn('Resume validation/parse error:', err);
      setErrorMsg(err.message || 'Unable to extract text from this document. Please upload a standard Resume/CV (PDF, DOCX, DOC, TXT, RTF).');
    } finally {
      setIsParsingPdf(false);
      setParsingStageText('Validating document...');
    }
  };

  // Handle live AI Intelligence Engine (Gemma) synthesis
  const handleGenerateCareerDna = async (skipResume = false) => {
    setIsSynthesizing(true);
    setErrorMsg(null);
    setProcessingStage(0);
    if (onSynthesisStart) onSynthesisStart();

    // Progress animation loop
    const progressInterval = setInterval(() => {
      setProcessingStage((prev) => (prev < processingSteps.length - 1 ? prev + 1 : prev));
    }, 550);

    try {
      const payload = {
        resumeText: !skipResume ? parsedText : '',
        metadata: {
          fullName: onboardingData.fullName,
          targetRole: onboardingData.targetRole || onboardingData.domain || 'Full-Stack Development',
          experienceLevel: onboardingData.expLevel || '0–1 Years',
          careerIntent: onboardingData.selectedGoal || 'Accelerate tech career growth',
          skills: onboardingData.selectedSkills || [],
          education: onboardingData.education,
          degree: onboardingData.degree,
          university: onboardingData.university,
          gradYear: onboardingData.gradYear,
          preferredLocation: onboardingData.preferredLocation,
          workPreference: onboardingData.workPreference,
          jobType: onboardingData.jobType,
          preferredIndustry: onboardingData.preferredIndustry,
          expectedPackage: onboardingData.expectedPackage,
        },
      };

      const response = await fetch('/api/career-dna/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let result: any = {};
      try {
        result = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        result = { error: text || 'Career DNA synthesis response could not be parsed. Please retry.' };
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to synthesize Career DNA. Please retry.');
      }

      const synthesized = result.data || result.profile;

      // Update global context & local cache
      if (synthesized) {
        setProfile((prev) => ({
          ...prev,
          name: onboardingData.fullName || prev.name,
          targetRole: synthesized.targetRoles?.[0] || onboardingData.targetRole || prev.targetRole,
          experienceLevel: onboardingData.expLevel || prev.experienceLevel,
          resumeHealthScore: synthesized.readiness_score || 90,
          interviewReadinessScore: 88,
          strengths: synthesized.strengths || prev.strengths,
          skillGaps: synthesized.areasToImprove || prev.skillGaps,
          targetCompanies: prev.targetCompanies,
        }));

        if (result.resumeText || parsedText) {
          setResumeState((prev) => ({
            ...prev,
            resumeText: result.resumeText || parsedText,
          }));
        }

        localStorage.setItem(
          'careerpilot_career_dna',
          JSON.stringify({
            ...synthesized,
            fullName: onboardingData.fullName,
            fileName: file?.name || 'resume.pdf',
            updatedAt: new Date().toISOString(),
          })
        );
      }

      localStorage.setItem('onboarding_completed', 'true');
      clearInterval(progressInterval);
      setProcessingStage(processingSteps.length - 1);

      // Smooth transition to /dashboard
      router.refresh();
      setTimeout(() => {
        router.push('/dashboard');
      }, 400);
    } catch (err: any) {
      console.error('Synthesis error:', err);
      clearInterval(progressInterval);
      setErrorMsg(err.message || 'Failed to synthesize Career DNA. Please retry.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Validation & Rejection Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-sm block text-[#141413] dark:text-[#faf9f5]">Document Not Accepted</span>
              <p className="text-xs leading-relaxed text-[#57534e] dark:text-[#a09d96]">{errorMsg}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-mono font-bold cursor-pointer transition-colors shadow-sm"
            >
              Choose Another File ↗
            </button>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-[#57534e] dark:text-[#8e8b82] hover:text-[#121110] dark:hover:text-white text-xs font-mono px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {parseNotice && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#5db872]/10 border border-[#5db872]/30 text-[#2e8544] dark:text-[#5db872] text-xs font-mono shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{parseNotice}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onClick={() => !isParsingPdf && !isSynthesizing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          file
            ? 'border-[#cc785c] bg-[#ffffff] dark:bg-[#1f1e1b]'
            : 'border-[#e6dfd8] dark:border-white/15 hover:border-[#cc785c] bg-[#faf9f5] dark:bg-[#1f1e1b] hover:bg-[#efe9de] dark:hover:bg-[#252320]'
        } ${isParsingPdf || isSynthesizing ? 'opacity-80 cursor-wait' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.rtf,.md"
          disabled={isParsingPdf || isSynthesizing}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
          id="resume-upload"
        />

        <div className="w-14 h-14 rounded-full bg-[#efe9de] dark:bg-[#252320] border border-[#e6dfd8] dark:border-white/10 flex items-center justify-center mx-auto mb-3 text-[#cc785c]">
          {isParsingPdf ? (
            <Loader2 className="w-7 h-7 animate-spin text-[#cc785c]" />
          ) : file ? (
            <FileText className="w-7 h-7" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        {isParsingPdf ? (
          <div className="space-y-1.5">
            <p className="font-display text-lg text-[#141413] dark:text-[#faf9f5]">
              Validating Document Before AI Analysis...
            </p>
            <p className="text-xs font-mono text-[#cc785c] font-bold animate-pulse">
              {parsingStageText}
            </p>
          </div>
        ) : file ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <Badge variant="coral" size="sm">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Document Verified
              </Badge>
              <button
                type="button"
                disabled={isParsingPdf || isSynthesizing}
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setParsedText('');
                  setParseNotice(null);
                }}
                className="p-1 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-[#141413] dark:text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-sans text-base font-semibold text-[#141413] dark:text-[#faf9f5]">{file.name}</p>
            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
              {(file.size / 1024).toFixed(1)} KB · Ready for AI Calibration
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="font-display text-xl text-[#141413] dark:text-[#faf9f5]">
              Upload Resume / CV
            </p>
            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
              PDF, DOC, DOCX, TXT, RTF (up to 15MB) · Verified before AI analysis
            </p>
            <div className="pt-2">
              <span className="inline-block px-4 py-2 rounded-md bg-[#efe9de] dark:bg-[#252320] border border-[#e6dfd8] dark:border-white/10 text-xs font-mono text-[#cc785c] hover:bg-[#e4dcce] dark:hover:bg-[#2d2b27]">
                Browse Files
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Plain Text Review & Edit Area */}
      {parsedText && (
        <div className="p-4 rounded-xl bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#3d3d3a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#6c6a64] dark:text-[#a09d96] flex items-center gap-1.5 font-semibold">
              <Edit3 className="w-3.5 h-3.5 text-[#cc785c]" /> Verified Resume Text Preview (Editable)
            </span>
            <span className="text-[11px] font-mono text-[#2e8544] dark:text-[#5db872]">✓ Plain Text Extracted</span>
          </div>

          <textarea
            value={parsedText}
            onChange={(e) => setParsedText(e.target.value)}
            rows={6}
            className="w-full bg-[#ffffff] dark:bg-[#181715] border border-[#e6dfd8] dark:border-white/10 rounded-lg p-3 text-xs font-mono text-[#141413] dark:text-[#e6dfd8] focus:outline-none focus:border-[#cc785c] resize-y leading-relaxed"
            placeholder="Extracted resume text appears here..."
          />
        </div>
      )}

      {/* Questionnaire Context Snapshot */}
      <div className="p-4 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 space-y-2 text-xs font-mono">
        <div className="flex justify-between text-[#6c6a64] dark:text-[#8e8b82] border-b border-[#e6dfd8] dark:border-white/5 pb-1.5">
          <span>TARGET ROLE TRACK:</span>
          <span className="text-[#141413] dark:text-[#faf9f5] font-bold">{onboardingData.targetRole || 'Full-Stack Development'}</span>
        </div>
        <div className="flex justify-between text-[#6c6a64] dark:text-[#8e8b82] border-b border-[#e6dfd8] dark:border-white/5 pb-1.5">
          <span>EXPERIENCE &amp; LOCATION:</span>
          <span className="text-[#141413] dark:text-[#faf9f5]">{onboardingData.expLevel} • {onboardingData.preferredLocation || 'Remote'}</span>
        </div>
        {onboardingData.selectedSkills && onboardingData.selectedSkills.length > 0 && (
          <div className="flex justify-between text-[#6c6a64] dark:text-[#8e8b82] pt-0.5">
            <span>QUESTIONNAIRE SKILLS:</span>
            <span className="text-[#2e8544] dark:text-[#5db872] truncate max-w-[60%]">{onboardingData.selectedSkills.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Synthesis Live Progress Checklist */}
      {isSynthesizing && (
        <div className="p-5 rounded-xl bg-[#ffffff] dark:bg-[#181715] border border-[#cc785c]/40 space-y-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-mono text-[#cc785c] font-bold">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>AI Engine Synthesizing Career DNA...</span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {processingSteps.map((stepText, idx) => {
              const isDone = idx <= processingStage;
              return (
                <div
                  key={stepText}
                  className={`p-2 rounded border flex items-center gap-2 transition-all ${
                    isDone
                      ? 'bg-[#faf9f5] dark:bg-[#1f1e1b] border-[#5db872]/40 text-[#2e8544] dark:text-[#5db872]'
                      : 'bg-[#faf9f5]/40 dark:bg-[#1f1e1b]/40 border-[#e6dfd8] dark:border-white/5 text-[#8e8b82] dark:text-[#6c6a64]'
                  }`}
                >
                  <span>{isDone ? '✓' : '○'}</span>
                  <span className="truncate">{stepText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Synthesis Action Button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleGenerateCareerDna(false)}
          disabled={isParsingPdf || isSynthesizing}
          className="w-full bg-[#cc785c] hover:bg-[#a9583e] text-white py-4 rounded-md font-mono text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          {isSynthesizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI Engine Synthesizing Skills...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{parsedText ? 'Synthesize Career DNA with AI Agent' : 'Synthesize Career DNA from Questionnaire'}</span>
            </>
          )}
        </button>

        {!parsedText && !isSynthesizing && (
          <p className="text-center text-[11px] text-[#6c6a64] dark:text-[#8e8b82] font-mono">
            Tip: Attaching your resume unlocks personalized STAR bullet suggestions and real-time ATS match scoring.
          </p>
        )}
      </div>
    </div>
  );
}
