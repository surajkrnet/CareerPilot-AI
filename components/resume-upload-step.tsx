'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, X, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';

export interface OnboardingMetadata {
  goalIntent?: string;
  targetRole?: string;
  domain?: string;
  selectedSkills?: string[];
  degree?: string;
  university?: string;
  gradYear?: string;
  expLevel?: string;
  preferredStacks?: string[];
  targetTiers?: string[];
  timeline?: string;
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
  const [statusText, setStatusText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const router = useRouter();
  const { setProfile } = useCareer();

  const handleGenerateCareerDna = async (skipResume = false) => {
    setUploading(true);
    setErrorMsg(null);
    if (onSynthesisStart) onSynthesisStart();

    setStatusText(file ? 'Uploading resume to secure vault...' : 'Synthesizing Career DNA from questionnaire...');

    try {
      // 1. Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Upload file to Supabase Storage bucket 'resumes' if authenticated & file present
      if (user && file && !skipResume) {
        const fileExt = file.name.split('.').pop() || 'pdf';
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.warn('Storage upload notice (continuing to AI extraction):', uploadError.message);
        }
      }

      // 3. Send file + onboarding context to Backend AI route for processing
      setStatusText('Calibrating competencies & generating Career DNA vector...');
      const formData = new FormData();
      if (file && !skipResume) {
        formData.append('file', file);
      }
      formData.append('metadata', JSON.stringify(onboardingData));

      const response = await fetch('/api/career-dna/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('AI Processing failed. Falling back to structured profile.');
      }

      const result = await response.json();

      // 4. Update career store with real AI synthesized profile
      if (result.profile) {
        setProfile((prev) => ({
          ...prev,
          targetRole: result.profile.targetRole || onboardingData.targetRole || prev.targetRole,
          experienceLevel: result.profile.experienceLevel || onboardingData.expLevel || prev.experienceLevel,
          resumeHealthScore: result.profile.resumeHealthScore || 88,
          interviewReadinessScore: result.profile.interviewReadinessScore || 85,
          strengths: result.profile.strengths || prev.strengths,
          skillGaps: result.profile.skillGaps || prev.skillGaps,
          targetCompanies: result.profile.targetCompanies || prev.targetCompanies,
        }));
      }

      setStatusText('Career DNA Synthesized! Launching Resume Intelligence...');
      setTimeout(() => {
        router.push('/resume');
      }, 900);
    } catch (err: any) {
      console.warn('Generation notice, activating client fallback:', err);
      // Ensure candidate can always progress to next stage
      setProfile((prev) => ({
        ...prev,
        targetRole: onboardingData.targetRole || prev.targetRole,
        experienceLevel: onboardingData.expLevel || prev.experienceLevel,
        strengths: onboardingData.selectedSkills && onboardingData.selectedSkills.length > 0
          ? onboardingData.selectedSkills
          : prev.strengths,
      }));
      setTimeout(() => {
        router.push('/resume');
      }, 700);
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
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          file
            ? 'border-[#cc785c] bg-[#1f1e1b]'
            : 'border-white/15 hover:border-[#cc785c] bg-[#1f1e1b] hover:bg-[#252320]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
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
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-sans text-base font-semibold text-[#faf9f5]">{file.name}</p>
            <p className="text-xs text-[#a09d96]">{(file.size / 1024).toFixed(1)} KB · Ready to synthesize</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-display text-2xl text-[#faf9f5]">Drag &amp; drop your resume PDF here</p>
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
          <span className="text-[#faf9f5] font-bold">{onboardingData.targetRole || 'Full-Stack Engineer'}</span>
        </div>
        <div className="flex justify-between text-[#6c6a64] border-b border-white/5 pb-1.5">
          <span>EXPERIENCE LEVEL:</span>
          <span className="text-[#faf9f5]">{onboardingData.expLevel || '0-1 Yrs'}</span>
        </div>
        {onboardingData.selectedSkills && onboardingData.selectedSkills.length > 0 && (
          <div className="flex justify-between text-[#6c6a64] pt-0.5">
            <span>SELECTED SKILLS:</span>
            <span className="text-[#5db872] truncate max-w-[60%]">{onboardingData.selectedSkills.join(', ')}</span>
          </div>
        )}
      </div>

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
              <span>{statusText || 'Synthesizing Career DNA...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{file ? 'Generate My Career DNA with Resume' : 'Synthesize Career DNA from Questionnaire'}</span>
            </>
          )}
        </button>

        {!file && !uploading && (
          <p className="text-center text-[11px] text-[#6c6a64] font-mono">
            Optional: You can upload your PDF now, or synthesize immediately using your selected questionnaire profile.
          </p>
        )}
      </div>
    </div>
  );
}
