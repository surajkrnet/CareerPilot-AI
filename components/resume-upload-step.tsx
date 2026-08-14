'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  Bot,
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
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const router = useRouter();
  const { setProfile, setResumeState } = useCareer();

  const processingSteps = [
    'Profile & career preferences received',
    file ? 'Resume uploaded to secure cloud vault' : 'Questionnaire parameters parsed',
    'Career preferences & track analyzed',
    'Identifying core strengths & technical competencies',
    'Mapping targeted job opportunities & compensation benchmarks',
    'Generating actionable AI recommendations',
  ];

  const handleGenerateCareerDna = async (skipResume = false) => {
    setUploading(true);
    setErrorMsg(null);
    setProcessingStage(0);
    if (onSynthesisStart) onSynthesisStart();

    // Live progress simulation while server API & n8n agent execute
    const progressInterval = setInterval(() => {
      setProcessingStage((prev) => (prev < processingSteps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      let uploadedFileUrl = '';
      // 2. Upload file to Supabase Storage bucket 'resumes' if file present
      if (user && file && !skipResume) {
        try {
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;

          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, file, { upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(filePath);
            uploadedFileUrl = publicUrlData?.publicUrl || '';
          }
        } catch (storageErr: any) {
          console.warn('Storage notice (proceeding with direct API parsing):', storageErr);
        }
      }

      // 3. Send file + onboarding context to Backend AI / n8n Agent route
      const formData = new FormData();
      if (file && !skipResume) {
        formData.append('file', file);
      }
      formData.append(
        'metadata',
        JSON.stringify({
          ...onboardingData,
          fileUrl: uploadedFileUrl,
          fileName: file?.name || 'questionnaire-profile',
        })
      );

      const response = await fetch('/api/career-dna/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('AI Processing failed. Falling back to calibrated profile.');
      }

      const result = await response.json();

      // 4. Update career store with real AI synthesized profile
      if (result.profile) {
        const synthesized = result.profile;
        setProfile((prev) => ({
          ...prev,
          name: onboardingData.fullName || prev.name,
          targetRole: synthesized.targetRole || onboardingData.targetRole || prev.targetRole,
          experienceLevel: synthesized.experienceLevel || onboardingData.expLevel || prev.experienceLevel,
          resumeHealthScore: synthesized.resumeHealthScore || 88,
          interviewReadinessScore: synthesized.interviewReadinessScore || 85,
          strengths: synthesized.strengths || prev.strengths,
          skillGaps: synthesized.skillGaps || prev.skillGaps,
          targetCompanies: synthesized.targetCompanies || prev.targetCompanies,
        }));

        // Preload resume text in Resume Intelligence studio
        if (result.resumeText) {
          setResumeState((prev) => ({
            ...prev,
            resumeText: result.resumeText,
          }));
        }

        // Cache completed Career DNA in localStorage
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

      // Mark onboarding completed
      localStorage.setItem('onboarding_completed', 'true');

      // Update Supabase profile table if user is authenticated
      if (user) {
        await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            full_name: onboardingData.fullName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      clearInterval(progressInterval);
      setProcessingStage(processingSteps.length - 1);

      setTimeout(() => {
        router.push('/resume');
      }, 700);
    } catch (err: any) {
      console.warn('Generation notice, activating fallback:', err);
      clearInterval(progressInterval);
      
      // Still mark completed and advance so candidate is never trapped
      localStorage.setItem('onboarding_completed', 'true');
      setProfile((prev) => ({
        ...prev,
        name: onboardingData.fullName || prev.name,
        targetRole: onboardingData.targetRole || prev.targetRole,
        experienceLevel: onboardingData.expLevel || prev.experienceLevel,
        strengths:
          onboardingData.selectedSkills && onboardingData.selectedSkills.length > 0
            ? onboardingData.selectedSkills
            : prev.strengths,
      }));

      setTimeout(() => {
        router.push('/resume');
      }, 600);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          file
            ? 'border-[#cc785c] bg-[#1f1e1b]'
            : 'border-white/15 hover:border-[#cc785c] bg-[#1f1e1b] hover:bg-[#252320]'
        } ${uploading ? 'opacity-80 cursor-wait' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
              setErrorMsg(null);
            }
          }}
          className="hidden"
          id="resume-upload"
        />

        <div className="w-16 h-16 rounded-full bg-[#252320] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#cc785c]">
          {file ? <FileText className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
        </div>

        {file ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <Badge variant="coral" size="sm">File Attached</Badge>
              <button
                type="button"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-sans text-base font-semibold text-[#faf9f5]">{file.name}</p>
            <p className="text-xs text-[#a09d96]">{(file.size / 1024).toFixed(1)} KB · Ready to synthesize with n8n Agent</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-display text-2xl text-[#faf9f5]">Drag &amp; drop your resume (PDF/DOCX) here</p>
            <p className="text-xs text-[#6c6a64]">Supports PDF, DOCX, or Plain Text up to 10MB</p>
            <div className="pt-2">
              <span className="inline-block px-4 py-2 rounded-md bg-[#252320] border border-white/10 text-xs font-mono text-[#cc785c] hover:bg-[#2d2b27]">
                Browse Files
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Intent Summary Card */}
      <div className="p-4 rounded-lg bg-[#1f1e1b] border border-white/10 space-y-2 text-xs font-mono">
        <div className="flex justify-between text-[#6c6a64] border-b border-white/5 pb-1.5">
          <span>TARGET TRACK:</span>
          <span className="text-[#faf9f5] font-bold">{onboardingData.targetRole || 'Full-Stack Development'}</span>
        </div>
        <div className="flex justify-between text-[#6c6a64] border-b border-white/5 pb-1.5">
          <span>EDUCATION &amp; EXP:</span>
          <span className="text-[#faf9f5]">{onboardingData.education} • {onboardingData.expLevel}</span>
        </div>
        <div className="flex justify-between text-[#6c6a64] border-b border-white/5 pb-1.5">
          <span>LOCATION &amp; MODE:</span>
          <span className="text-[#faf9f5]">{onboardingData.preferredLocation} ({onboardingData.workPreference})</span>
        </div>
        {onboardingData.selectedSkills && onboardingData.selectedSkills.length > 0 && (
          <div className="flex justify-between text-[#6c6a64] pt-0.5">
            <span>SELECTED COMPETENCIES:</span>
            <span className="text-[#5db872] truncate max-w-[60%]">{onboardingData.selectedSkills.join(', ')}</span>
          </div>
        )}
      </div>

      {/* PROCESSING STATE CHECKLIST (DURING N8N SYNTHESIS) */}
      {uploading && (
        <div className="p-5 rounded-xl bg-[#181715] border border-[#cc785c]/40 space-y-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-mono text-[#cc785c] font-bold">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Analyzing Your Career DNA with n8n Agent...</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {processingSteps.map((stepText, idx) => {
              const isDone = idx <= processingStage;
              return (
                <div
                  key={stepText}
                  className={`p-2 rounded border flex items-center gap-2 ${
                    isDone
                      ? 'bg-[#1f1e1b] border-[#5db872]/40 text-[#5db872]'
                      : 'bg-[#1f1e1b]/40 border-white/5 text-[#6c6a64]'
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

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleGenerateCareerDna(false)}
          disabled={uploading}
          className="w-full bg-[#cc785c] hover:bg-[#a9583e] text-white py-4 rounded-md font-mono text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing with n8n Agent...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{file ? 'Synthesize Career DNA with Resume' : 'Synthesize Career DNA from Questionnaire'}</span>
            </>
          )}
        </button>

        {!file && !uploading && (
          <p className="text-center text-[11px] text-[#6c6a64] font-mono">
            Tip: Uploading your resume gives you an instant ATS compatibility score and custom bullet points.
          </p>
        )}
      </div>
    </div>
  );
}
