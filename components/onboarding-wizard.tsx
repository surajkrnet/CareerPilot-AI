'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, FileText, Target, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';
import { useRouter } from 'next/navigation';

export function OnboardingWizard() {
  const router = useRouter();
  const { isOnboardingOpen, setIsOnboardingOpen, onboardingStep, setOnboardingStep, profile, setProfile } = useCareer();
  const [selectedRole, setSelectedRole] = useState(profile.targetRole || 'Software Engineer (Frontend / Full-Stack)');
  const [selectedExp, setSelectedExp] = useState(profile.experienceLevel || 'Early Career (1-3 Yrs)');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOnboardingOpen) return null;

  const roles = [
    'Software Engineer (Frontend / Full-Stack)',
    'Product Manager (AI / B2B SaaS)',
    'Data Scientist & ML Engineer',
    'UX Designer & Product Craft',
    'DevOps & Cloud Engineer',
  ];

  const experienceLevels = [
    'Student / New Grad (0-1 Yrs)',
    'Early Career (1-3 Yrs)',
    'Career Switcher (3+ Yrs Work Ex)',
    'Senior Specialist (5+ Yrs)',
  ];

  const handleRealUpload = async () => {
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }
      formData.append(
        'metadata',
        JSON.stringify({
          targetRole: selectedRole,
          experienceLevel: selectedExp,
          careerIntent: 'Accelerate tech career growth',
          skills: profile.strengths,
        })
      );

      const res = await fetch('/api/career-dna/generate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Career DNA generation failed. Please try again.');
      }

      const result = await res.json();
      if (result.success && result.profile) {
        setProfile((prev) => ({
          ...prev,
          targetRole: result.profile.targetRole || selectedRole,
          experienceLevel: result.profile.experienceLevel || selectedExp,
          resumeHealthScore: result.profile.healthScore || result.profile.resumeHealthScore || 92,
          interviewReadinessScore: result.profile.readinessScore || 86,
          strengths: result.profile.strengths || prev.strengths,
          skillGaps: result.profile.areasToImprove || result.profile.skillGaps || prev.skillGaps,
        }));
        
        localStorage.setItem('onboarding_completed', 'true');
        setOnboardingStep(3);
      }
    } catch (err: any) {
      console.warn('Upload error:', err);
      setErrorMessage(err.message || 'Failed to process resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddStrength = () => {
    if (!newTagInput.trim()) return;
    setProfile((prev) => ({
      ...prev,
      strengths: [...prev.strengths, newTagInput.trim()],
    }));
    setNewTagInput('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181715]/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-2xl bg-[#252320] border border-white/10 rounded-xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1f1e1b]/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#181715] flex items-center justify-center text-[#cc785c]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-display font-medium text-[#faf9f5]">Career DNA Onboarding</span>
            </div>

            <button
              onClick={() => setIsOnboardingOpen(false)}
              className="p-1 rounded-md text-[#a09d96] hover:text-[#faf9f5] hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Header */}
          <div className="px-6 py-3 border-b border-white/10 bg-[#252320] flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    onboardingStep === step
                      ? 'bg-[#cc785c] text-white'
                      : onboardingStep > step
                      ? 'bg-[#5db872] text-white'
                      : 'bg-[#2a2926] text-[#a09d96]'
                  }`}
                >
                  {onboardingStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                </div>
                <span className={`text-xs font-medium ${onboardingStep === step ? 'text-[#faf9f5]' : 'text-[#6c6a64]'}`}>
                  {step === 1 ? 'Career Intent' : step === 2 ? 'Resume Upload' : 'DNA Review'}
                </span>
                {step < 3 && <div className="w-12 h-px bg-white/10 mx-2 hidden sm:block" />}
              </div>
            ))}
          </div>

          {/* Modal Content Body */}
          <div className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: CAREER INTENT & TARGET ROLE */}
            {onboardingStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl text-[#faf9f5] mb-1">Select Your Target Career Track</h2>
                  <p className="text-sm text-[#6c6a64]">
                    CareerPilot AI uses your career intent to customize resume benchmarks and mock interview scenarios.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#faf9f5] uppercase tracking-wider">
                    Target Primary Role
                  </label>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`p-3.5 rounded-lg border text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${
                          selectedRole === role
                            ? 'bg-[#1f1e1b] border-[#cc785c] text-[#faf9f5] shadow-sm'
                            : 'bg-[#252320] border-white/10 text-[#a09d96] hover:border-[#cc785c]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Target className={`w-4 h-4 ${selectedRole === role ? 'text-[#cc785c]' : 'text-[#6c6a64]'}`} />
                          <span>{role}</span>
                        </div>
                        {selectedRole === role && <CheckCircle2 className="w-4 h-4 text-[#cc785c]" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#faf9f5] uppercase tracking-wider">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {experienceLevels.map((exp) => (
                      <div
                        key={exp}
                        onClick={() => setSelectedExp(exp)}
                        className={`p-3 rounded-lg border text-xs font-medium cursor-pointer text-center transition-all ${
                          selectedExp === exp
                            ? 'bg-[#1f1e1b] border-[#cc785c] text-[#faf9f5]'
                            : 'bg-[#252320] border-white/10 text-[#6c6a64] hover:bg-[#1f1e1b]/50'
                        }`}
                      >
                        {exp}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                  <Button
                    variant="primary"
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                    onClick={() => {
                      setProfile((prev) => ({ ...prev, targetRole: selectedRole, experienceLevel: selectedExp }));
                      setOnboardingStep(2);
                    }}
                  >
                    Continue to Resume Upload
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: REAL RESUME UPLOAD DROPZONE */}
            {onboardingStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl text-[#faf9f5] mb-1">Upload Your Resume (PDF or DOCX)</h2>
                  <p className="text-sm text-[#6c6a64]">
                    Our AI parser will construct your Career DNA matrix and map out missing skills for {selectedRole}.
                  </p>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadedFile(e.target.files[0]);
                      setErrorMessage(null);
                    }
                  }}
                  className="hidden"
                />

                {/* Drag and Drop Zone */}
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed ${
                    uploadedFile ? 'border-[#cc785c] bg-[#1f1e1b]' : 'border-[#cc785c]/40 hover:border-[#cc785c] bg-[#1f1e1b]/40 hover:bg-[#1f1e1b]'
                  } p-8 sm:p-10 rounded-lg text-center cursor-pointer transition-all group`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#252320] border border-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    {uploadedFile ? <FileText className="w-6 h-6 text-[#cc785c]" /> : <UploadCloud className="w-6 h-6 text-[#cc785c]" />}
                  </div>
                  {uploadedFile ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-[#faf9f5]">{uploadedFile.name}</p>
                      <p className="text-xs text-[#a09d96]">{(uploadedFile.size / 1024).toFixed(1)} KB • Click to replace file</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-medium text-[#faf9f5] text-base mb-1">Drag &amp; drop your resume PDF here</h3>
                      <p className="text-xs text-[#6c6a64] mb-3">Supports PDF, DOCX, or Plain Text up to 10MB</p>
                      <Badge variant="coral" size="sm">Browse Files</Badge>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <Button variant="secondary" disabled={isUploading} onClick={() => setOnboardingStep(1)}>
                    Back
                  </Button>

                  <Button
                    variant="primary"
                    disabled={isUploading}
                    onClick={handleRealUpload}
                    icon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    className="bg-[#cc785c] hover:bg-[#a9583e]"
                  >
                    {isUploading ? 'Synthesizing with AI Engine (Gemma)...' : 'Generate My Career DNA'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: GENERATED CAREER DNA REVIEW */}
            {onboardingStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="teal" size="sm" className="mb-2">Synthesis Complete</Badge>
                    <h2 className="font-display text-2xl text-[#faf9f5]">Your Synthesized Career DNA</h2>
                    <p className="text-xs text-[#6c6a64]">Target Track: {profile.targetRole}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#cc785c]">{profile.resumeHealthScore}%</div>
                    <div className="text-[11px] text-[#6c6a64]">ATS Fit Benchmark</div>
                  </div>
                </div>

                {/* Strengths Tags */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#faf9f5] uppercase tracking-wider">
                    Extracted Strengths &amp; Skills ({profile.strengths.length})
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-[#1f1e1b]/50 border border-white/10">
                    {profile.strengths.map((skill) => (
                      <Badge key={skill} variant="cream" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Add skill input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom skill (e.g. Docker, GraphQL)..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStrength()}
                      className="flex-1 px-3 py-1.5 text-xs bg-[#1f1e1b] border border-white/10 rounded-md text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                    />
                    <Button variant="secondary" size="sm" onClick={handleAddStrength}>
                      + Add
                    </Button>
                  </div>
                </div>

                {/* Skill Gaps to Acquire */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#faf9f5] uppercase tracking-wider">
                    Recommended Skill Gaps to Close
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-[#1f1e1b]/50 border border-white/10">
                    {profile.skillGaps.map((gap) => (
                      <Badge key={gap} variant="amber" className="text-xs">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <Button variant="secondary" onClick={() => setOnboardingStep(2)}>
                    Re-upload
                  </Button>

                  <Button
                    variant="primary"
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                    onClick={() => {
                      setIsOnboardingOpen(false);
                      router.push('/dashboard');
                    }}
                    className="bg-[#cc785c] hover:bg-[#a9583e]"
                  >
                    Open Dashboard ↗
                  </Button>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
