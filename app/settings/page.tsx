'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  CreditCard,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  ArrowRight,
  Clock,
  Briefcase,
  FileText,
  MessageSquare,
  Lock,
  ExternalLink,
  ChevronRight,
  X,
  IndianRupee,
  Edit2,
  Save,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/providers/theme-provider';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [careerDna, setCareerDna] = useState<any>(null);
  const [resolvedName, setResolvedName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const [resumeScansCount, setResumeScansCount] = useState(1);
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(3);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'pass'>('free');

  // Upgrade Modal State
  const [upgradeModalTier, setUpgradeModalTier] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Danger Zone Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);

  useEffect(() => {
    async function loadAccountData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth');
          return;
        }

        setUser(user);

        // Fetch user profile, career_dna, scans count, interview count, and applications count in parallel
        const [
          { data: profData },
          { data: dnaData },
          { count: scansCount },
          { count: intCount },
          { count: appCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('resume_scans').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('interview_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);

        setProfile(profData);
        setCareerDna(dnaData);

        if (typeof scansCount === 'number') setResumeScansCount(scansCount);
        if (typeof intCount === 'number') setInterviewsCount(intCount);
        if (typeof appCount === 'number') setApplicationsCount(appCount);

        // Determine user's real name across database and local caches
        let nameFound = profData?.full_name || profData?.name || user?.user_metadata?.full_name || user?.user_metadata?.name;

        if (!nameFound && typeof window !== 'undefined') {
          try {
            const draft = localStorage.getItem('careerpilot_onboarding_draft');
            if (draft) {
              const parsedDraft = JSON.parse(draft);
              if (parsedDraft.fullName && parsedDraft.fullName.trim().length > 0) {
                nameFound = parsedDraft.fullName.trim();
              }
            }
            if (!nameFound) {
              const savedDna = localStorage.getItem('careerpilot_career_dna');
              if (savedDna) {
                const parsedDna = JSON.parse(savedDna);
                if (parsedDna.fullName && parsedDna.fullName.trim().length > 0) {
                  nameFound = parsedDna.fullName.trim();
                }
              }
            }
          } catch (e) {
            console.warn('Cache name read notice:', e);
          }
        }

        if (!nameFound && user?.email) {
          nameFound = user.email.split('@')[0];
        }

        const finalName = nameFound || 'Candidate';
        setResolvedName(finalName);
        setNewNameInput(finalName);

        // Check local saved plan
        const savedPlan = localStorage.getItem('careerpilot_subscription_plan');
        if (savedPlan === 'pro' || savedPlan === 'pass') {
          setCurrentPlan(savedPlan);
        }
      } catch (err) {
        console.error('Settings load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, []);

  const handleSaveName = async () => {
    if (!newNameInput.trim() || !user) return;
    setIsSavingName(true);

    try {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: newNameInput.trim(),
          updated_at: new Date().toISOString(),
        });

      setResolvedName(newNameInput.trim());
      setIsEditingName(false);

      if (typeof window !== 'undefined') {
        const draft = localStorage.getItem('careerpilot_onboarding_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          parsed.fullName = newNameInput.trim();
          localStorage.setItem('careerpilot_onboarding_draft', JSON.stringify(parsed));
        }
      }

      setToastMsg('✓ Candidate full name updated successfully!');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      console.error('Save name error:', err);
      setToastMsg('Failed to update name. Please retry.');
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSimulateUpgrade = async (tier: 'pro' | 'pass') => {
    setIsUpgrading(true);
    await new Promise((r) => setTimeout(r, 1200));

    setCurrentPlan(tier);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerpilot_subscription_plan', tier);
    }

    setIsUpgrading(false);
    setUpgradeModalTier(null);
    setToastMsg(
      tier === 'pro'
        ? '🎉 Successfully upgraded to Placement Pro (₹399/mo)! Unlimited scans & 15 mock drills active.'
        : '⚡ 7-Day Placement Drive Pass activated (₹199)! 5 extra mock drills & 10 tailorings unlocked.'
    );
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    setIsDeletingData(true);

    try {
      // Delete user's career DNA, resume scans, and interview sessions from Supabase
      await Promise.all([
        supabase.from('career_dna').delete().eq('user_id', user.id),
        supabase.from('resume_scans').delete().eq('user_id', user.id),
        supabase.from('interview_sessions').delete().eq('user_id', user.id),
        supabase.from('profiles').update({ onboarding_completed: false }).eq('id', user.id),
      ]);

      // Clear local storage keys
      localStorage.removeItem('careerpilot_career_dna');
      localStorage.removeItem('careerpilot_onboarding_draft');
      localStorage.removeItem('onboarding_completed');
      localStorage.removeItem('careerpilot_target_jd');

      setIsDeletingData(false);
      setIsDeleteModalOpen(false);
      setToastMsg('✓ All Career DNA, Resume Scans, and Mock Transcripts permanently erased from database.');
      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
    } catch (err: any) {
      console.error('Delete data error:', err);
      setIsDeletingData(false);
      setToastMsg('Failed to delete data. Please retry or contact support.');
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] pt-36 pb-16 px-4 flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs font-mono text-[#cc785c]">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading Account &amp; Subscription Settings...</span>
        </div>
      </div>
    );
  }

  const scanLimit = currentPlan === 'pro' ? 999 : currentPlan === 'pass' ? 13 : 3;
  const interviewLimit = currentPlan === 'pro' ? 15 : currentPlan === 'pass' ? 6 : 1;

  const scansPercentage = Math.min(100, Math.round((resumeScansCount / (scanLimit === 999 ? 50 : scanLimit)) * 100));
  const interviewPercentage = Math.min(100, Math.round((interviewsCount / interviewLimit) * 100));

  const targetRole = profile?.target_role || careerDna?.target_roles?.[0] || 'Software Engineer';
  const experienceLevel = profile?.experience_level || careerDna?.experience_level || '0–2 Years';

  return (
    <main className="min-h-screen bg-[#f6f4ee] dark:bg-[#121110] text-[#121110] dark:text-[#faf9f5] pt-32 sm:pt-36 pb-20 px-4 sm:px-8 md:px-10 font-sans transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-6 z-50 p-4 rounded-xl bg-[#ffffff] dark:bg-[#1f1e1b] border border-[#cc785c] text-[#121110] dark:text-[#faf9f5] text-xs font-mono shadow-2xl flex items-center gap-3 max-w-md font-bold"
            >
              <Sparkles className="w-4 h-4 text-[#cc785c] shrink-0" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="border-b border-[#ded7cb] dark:border-white/10 pb-6 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="coral" size="sm">Account &amp; Billing</Badge>
            <Badge variant="teal" size="sm">Supabase Secured</Badge>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#121110] dark:text-[#faf9f5]">
            User Settings &amp; Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#57534e] dark:text-[#8e8b82] font-medium">
            Manage your candidate identity, theme preferences, monthly AI usage quotas, plan upgrades, and privacy compliance.
          </p>
        </div>

        {/* 1. CANDIDATE PROFILE IDENTITY CARD */}
        <Card variant="dark-elevated" className="p-6 sm:p-8 bg-[#ffffff] dark:bg-[#181716] border-[#ded7cb] dark:border-white/10 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ded7cb] dark:border-white/10 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#f0ebe1] dark:bg-[#252320] border-2 border-[#cc785c] flex items-center justify-center font-display text-xl font-bold text-[#cc785c] dark:text-[#faf9f5] shrink-0 shadow-md">
                {resolvedName.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newNameInput}
                      onChange={(e) => setNewNameInput(e.target.value)}
                      className="bg-[#f6f4ee] dark:bg-[#181715] text-[#121110] dark:text-[#faf9f5] font-display text-lg px-3 py-1 rounded-lg border border-[#cc785c] focus:outline-none font-bold"
                      placeholder="Your Full Name"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="p-1.5 rounded-lg bg-[#cc785c] text-white hover:bg-[#a9583e] transition-colors cursor-pointer"
                      title="Save Name"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setNewNameInput(resolvedName);
                      }}
                      className="p-1.5 rounded-lg bg-[#f0ebe1] dark:bg-[#252320] text-[#57534e] dark:text-[#a09d96] hover:text-[#121110] dark:hover:text-white transition-colors cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-2xl font-bold text-[#121110] dark:text-[#faf9f5]">{resolvedName}</h3>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-[#57534e] hover:text-[#cc785c] rounded transition-colors cursor-pointer"
                      title="Edit Full Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs font-mono text-[#57534e] dark:text-[#a09d96] font-medium">{user?.email}</p>
                <p className="text-[11px] text-[#57534e] dark:text-[#6c6a64] font-mono">User ID: {user?.id?.slice(0, 18)}...</p>
              </div>
            </div>

            <Link href="/onboarding?edit=true">
              <Button variant="outline" size="sm" className="text-xs font-mono border-[#ded7cb] dark:border-white/15 hover:border-[#cc785c] font-bold">
                Edit Career DNA ↗
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-[#ded7cb] dark:border-white/5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase text-[#57534e] font-bold">Target Career Track</span>
              <p className="font-bold text-[#121110] dark:text-[#faf9f5]">{targetRole}</p>
            </div>
            <div className="p-3.5 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-[#ded7cb] dark:border-white/5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase text-[#57534e] font-bold">Experience Level</span>
              <p className="font-bold text-[#121110] dark:text-[#faf9f5]">{experienceLevel}</p>
            </div>
            <div className="p-3.5 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-[#ded7cb] dark:border-white/5 space-y-1 shadow-sm">
              <span className="text-[10px] uppercase text-[#57534e] font-bold">Account Status</span>
              <p className="font-bold text-[#2e8544] dark:text-[#5db872] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Candidate
              </p>
            </div>
          </div>
        </Card>

        {/* 2. THEME & DISPLAY PREFERENCES */}
        <Card variant="dark-elevated" className="p-6 sm:p-8 bg-[#ffffff] dark:bg-[#181716] border-[#ded7cb] dark:border-white/10 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-[#ded7cb] dark:border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#cc785c]" />
                <h3 className="font-display text-2xl font-bold text-[#121110] dark:text-[#faf9f5]">Appearance &amp; Theme</h3>
              </div>
              <p className="text-xs text-[#57534e] dark:text-[#8e8b82] mt-0.5 font-medium">
                Customize your visual experience across light editorial and dark obsidian themes.
              </p>
            </div>
            <Badge variant="coral" size="sm">
              {resolvedTheme === 'dark' ? 'Dark Active' : 'Light Active'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Dark Mode Choice */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                theme === 'dark'
                  ? 'bg-[#252320] border-[#cc785c] text-white shadow-lg ring-2 ring-[#cc785c]/30'
                  : 'bg-[#f6f4ee] dark:bg-[#181715] border-[#ded7cb] dark:border-white/10 hover:border-[#cc785c]/40 text-[#121110] dark:text-[#faf9f5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#181715] text-[#cc785c] flex items-center justify-center border border-white/10">
                  <Moon className="w-4 h-4" />
                </div>
                {theme === 'dark' && (
                  <span className="text-[10px] font-mono font-bold text-[#cc785c] bg-[#cc785c]/15 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-display text-lg font-bold">Midnight Obsidian</h4>
                <p className="text-xs text-[#8e8b82] mt-0.5 font-sans">Velvet dark theme optimized for long coding drills.</p>
              </div>
            </button>

            {/* Light Mode Choice */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                theme === 'light'
                  ? 'bg-[#ffffff] border-[#cc785c] text-[#121110] shadow-lg ring-2 ring-[#cc785c]/30'
                  : 'bg-[#f6f4ee] dark:bg-[#181715] border-[#ded7cb] dark:border-white/10 hover:border-[#cc785c]/40 text-[#121110] dark:text-[#faf9f5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#f0ebe1] text-[#cc785c] flex items-center justify-center border border-[#ded7cb]">
                  <Sun className="w-4 h-4" />
                </div>
                {theme === 'light' && (
                  <span className="text-[10px] font-mono font-bold text-[#cc785c] bg-[#cc785c]/15 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-display text-lg font-bold">Warm Alabaster</h4>
                <p className="text-xs text-[#57534e] mt-0.5 font-sans font-medium">Warm linen &amp; terracotta anti-glare light canvas.</p>
              </div>
            </button>

            {/* System Sync Choice */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                theme === 'system'
                  ? 'bg-[#ffffff] dark:bg-[#252320] border-[#cc785c] text-[#121110] dark:text-white shadow-lg ring-2 ring-[#cc785c]/30'
                  : 'bg-[#f6f4ee] dark:bg-[#181715] border-[#ded7cb] dark:border-white/10 hover:border-[#cc785c]/40 text-[#121110] dark:text-[#faf9f5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#f0ebe1] dark:bg-[#181715] text-[#2e8544] dark:text-[#5db872] flex items-center justify-center border border-[#ded7cb] dark:border-white/10">
                  <Laptop className="w-4 h-4" />
                </div>
                {theme === 'system' && (
                  <span className="text-[10px] font-mono font-bold text-[#cc785c] bg-[#cc785c]/15 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-display text-lg font-bold">System Preference</h4>
                <p className="text-xs text-[#57534e] dark:text-[#8e8b82] mt-0.5 font-sans font-medium">Automatically sync with operating system.</p>
              </div>
            </button>

          </div>
        </Card>

        {/* 3. SUBSCRIPTION & USAGE QUOTA TRACKER */}
        <Card variant="dark-elevated" className="p-6 sm:p-8 bg-[#ffffff] dark:bg-[#181716] border-[#ded7cb] dark:border-white/10 space-y-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ded7cb] dark:border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#cc785c]" />
                <h3 className="font-display text-2xl font-bold text-[#121110] dark:text-[#faf9f5]">Subscription &amp; Usage Quota</h3>
              </div>
              <p className="text-xs text-[#57534e] dark:text-[#8e8b82] mt-0.5 font-medium">
                Current Active Plan: <strong className="text-[#121110] dark:text-[#faf9f5] uppercase font-mono">
                  {currentPlan === 'pro' ? 'Placement Pro (₹399/mo)' : currentPlan === 'pass' ? '7-Day Drive Pass (Active)' : 'Starter Copilot (Free Forever)'}
                </strong>
              </p>
            </div>

            <Badge variant={currentPlan === 'pro' ? 'coral' : currentPlan === 'pass' ? 'amber' : 'cream'} size="md">
              {currentPlan === 'pro' ? '★ Pro Active' : currentPlan === 'pass' ? '⚡ Pass Active' : 'Free Tier'}
            </Badge>
          </div>

          {/* Usage Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Resume Scan Quota Gauge */}
            <div className="p-5 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-[#ded7cb] dark:border-white/10 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#cc785c]" />
                  <span className="text-xs font-bold text-[#121110] dark:text-[#faf9f5] font-mono">Resume Intelligence Scans</span>
                </div>
                <span className="text-xs font-mono text-[#cc785c] font-bold">
                  {currentPlan === 'pro' ? `${resumeScansCount} (Unlimited)` : `${resumeScansCount} / ${scanLimit} used`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[#f0ebe1] dark:bg-[#252320] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentPlan === 'pro' ? 'bg-[#2e8544] dark:bg-[#5db872] w-full' : scansPercentage > 80 ? 'bg-amber-500' : 'bg-[#cc785c]'
                  }`}
                  style={{ width: currentPlan === 'pro' ? '100%' : `${scansPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-[#57534e] font-mono font-medium">
                {currentPlan === 'pro' ? '✓ Unlimited monthly resume ATS analyses active' : `${Math.max(0, scanLimit - resumeScansCount)} scans remaining this cycle`}
              </p>
            </div>

            {/* AI Mock Interview Quota Gauge */}
            <div className="p-5 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-[#ded7cb] dark:border-white/10 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2e8544] dark:text-[#5db872]" />
                  <span className="text-xs font-bold text-[#121110] dark:text-[#faf9f5] font-mono">AI Mock Interview Drills</span>
                </div>
                <span className="text-xs font-mono text-[#2e8544] dark:text-[#5db872] font-bold">
                  {interviewsCount} / {interviewLimit} used
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[#f0ebe1] dark:bg-[#252320] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    interviewPercentage >= 100 ? 'bg-amber-500' : 'bg-[#2e8544] dark:bg-[#5db872]'
                  }`}
                  style={{ width: `${interviewPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-[#57534e] font-mono font-medium">
                {Math.max(0, interviewLimit - interviewsCount)} full STAR evaluated drills remaining
              </p>
            </div>

          </div>

          {/* Upgrade CTAs */}
          <div className="pt-2">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#121110] dark:text-[#faf9f5] mb-4 font-bold">
              Upgrade Your Placement Arsenal:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tier 2: Placement Pro Card */}
              <div className="p-5 rounded-xl bg-[#ffffff] dark:bg-gradient-to-br dark:from-[#252320] dark:to-[#1f1e1b] border-2 border-[#cc785c] space-y-4 shadow-lg relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#cc785c]/10 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-[#cc785c] text-white px-2 py-0.5 rounded font-bold">
                      ★ Recommended
                    </span>
                    <h4 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5] mt-1.5">Placement Pro</h4>
                    <p className="text-xs text-[#57534e] dark:text-[#a09d96] font-medium">Complete preparation engine for active job hunts.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-sans text-[#121110] dark:text-white">₹399</span>
                    <span className="text-[10px] text-[#57534e] dark:text-[#8e8b82] block font-mono font-medium">/ month</span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-xs text-[#2d2a26] dark:text-[#dcd7cb] font-mono font-medium">
                  <li className="flex items-center gap-1.5 text-[#2e8544] dark:text-emerald-400 font-bold">✓ Unlimited Resume Scans &amp; Tailoring</li>
                  <li className="flex items-center gap-1.5 text-[#2e8544] dark:text-emerald-400 font-bold">✓ 15 AI Mock Interviews / month</li>
                  <li className="flex items-center gap-1.5 text-[#2e8544] dark:text-emerald-400 font-bold">✓ Cold LinkedIn &amp; HR Outreach Generator</li>
                  <li className="flex items-center gap-1.5 text-[#2e8544] dark:text-emerald-400 font-bold">✓ Priority AI Inference (&lt;15s)</li>
                </ul>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setUpgradeModalTier('pro')}
                  disabled={currentPlan === 'pro'}
                  className="w-full bg-[#cc785c] hover:bg-[#a9583e] font-mono uppercase text-xs text-white font-bold"
                >
                  {currentPlan === 'pro' ? '✓ Current Active Plan' : 'Upgrade to Placement Pro (₹399/mo) ↗'}
                </Button>
              </div>

              {/* Tier 3: 7-Day Drive Pass Card */}
              <div className="p-5 rounded-xl bg-[#f6f4ee] dark:bg-[#181715] border border-[#ded7cb] dark:border-white/10 space-y-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-[#f0ebe1] dark:bg-white/10 text-[#121110] dark:text-[#dcd7cb] px-2 py-0.5 rounded font-bold">
                      ⚡ 7-Day Sprint
                    </span>
                    <h4 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5] mt-1.5">Placement Drive Pass</h4>
                    <p className="text-xs text-[#57534e] dark:text-[#a09d96] font-medium">Intensive boost during active campus &amp; off-campus drives.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-sans text-[#121110] dark:text-white">₹199</span>
                    <span className="text-[10px] text-[#57534e] dark:text-[#8e8b82] block font-mono font-medium">one-time (7 days)</span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-xs text-[#57534e] dark:text-[#a09d96] font-mono font-medium">
                  <li className="flex items-center gap-1.5 text-[#121110] dark:text-[#faf9f5]">• 5 Extra Full Mock Interviews</li>
                  <li className="flex items-center gap-1.5 text-[#121110] dark:text-[#faf9f5]">• 10 JD-Specific Bullet Tailorings</li>
                  <li className="flex items-center gap-1.5 text-[#121110] dark:text-[#faf9f5]">• Valid for 7 days during interview week</li>
                </ul>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUpgradeModalTier('pass')}
                  disabled={currentPlan === 'pass'}
                  className="w-full font-mono uppercase text-xs font-bold"
                >
                  {currentPlan === 'pass' ? '✓ Drive Pass Active' : 'Buy 7-Day Drive Pass (₹199) ↗'}
                </Button>
              </div>

            </div>
          </div>
        </Card>

        {/* 4. DANGER ZONE (RESPONSIBLE AI PRIVACY COMPLIANCE) */}
        <Card variant="dark-elevated" className="p-6 sm:p-8 bg-[#ffffff] dark:bg-[#1f1e1b] border border-red-500/30 space-y-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-red-600">
                Danger Zone &amp; Privacy Compliance
              </h3>
              <p className="text-xs text-[#57534e] dark:text-[#8e8b82] font-medium">
                Permanent erasure of all candidate resume data, Career DNA vectors, and interview records.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-red-500/20 text-xs font-mono text-[#2d2a26] dark:text-[#dcd7cb] space-y-2 font-medium">
            <p>
              In accordance with responsible AI data privacy policies, clicking the button below will immediately and irreversibly delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#57534e] dark:text-[#8e8b82]">
              <li>Your extracted resume plain text and uploaded document storage files</li>
              <li>Synthesized Career DNA strengths, skill vectors, and gap roadmaps</li>
              <li>All historical ATS scan results and STAR bullet optimizations</li>
              <li>Live mock interview transcripts and evaluation scorecards</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="border-red-500/40 text-red-600 hover:bg-red-500/10 hover:border-red-600 font-mono text-xs font-bold"
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Career DNA &amp; Resume Data
            </Button>
          </div>
        </Card>

      </div>

      {/* UPGRADE CONFIRMATION MODAL */}
      {upgradeModalTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#ffffff] dark:bg-[#1f1e1b] border border-[#ded7cb] dark:border-[#cc785c]/40 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#ded7cb] dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#cc785c]" />
                <h3 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5]">
                  {upgradeModalTier === 'pro' ? 'Upgrade to Placement Pro' : 'Activate 7-Day Drive Pass'}
                </h3>
              </div>
              <button
                onClick={() => setUpgradeModalTier(null)}
                className="text-[#57534e] hover:text-[#121110] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-4 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-[#ded7cb] dark:border-white/10 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-[#121110] dark:text-white">
                  <span>{upgradeModalTier === 'pro' ? 'Placement Pro (Monthly)' : '7-Day Drive Pass (One-Time)'}</span>
                  <span className="text-[#cc785c]">{upgradeModalTier === 'pro' ? '₹399 / mo' : '₹199'}</span>
                </div>
                <p className="text-[11px] text-[#57534e] dark:text-[#8e8b82] font-medium">
                  Instant access to unlimited resume scans, high-frequency mock interviews, and priority AI latency.
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[#2e8544] dark:text-emerald-300 text-[11px] flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Instant 1-Click Sandbox Activation for Evaluation</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#ded7cb] dark:border-white/10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setUpgradeModalTier(null)}
                disabled={isUpgrading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSimulateUpgrade(upgradeModalTier as any)}
                disabled={isUpgrading}
                className="bg-[#cc785c] hover:bg-[#a9583e] font-mono uppercase text-xs text-white font-bold"
              >
                {isUpgrading ? 'Activating Plan...' : 'Confirm & Unlock Plan ↗'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DANGER ZONE DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#ffffff] dark:bg-[#1f1e1b] border-2 border-red-500/40 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#121110] dark:text-[#faf9f5]">Delete Career DNA &amp; Data?</h3>
                <p className="text-xs text-[#57534e] dark:text-[#8e8b82]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#f6f4ee] dark:bg-[#181715] rounded-xl border border-[#ded7cb] dark:border-white/5 text-xs text-[#2d2a26] dark:text-[#dcd7cb] font-mono leading-relaxed">
              Are you sure you want to permanently delete all your resume files, verified competency records, ATS scans, and interview transcripts for <strong>{user?.email}</strong>?
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingData}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteAllData}
                disabled={isDeletingData}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase font-bold"
              >
                {isDeletingData ? 'Erasing Data...' : 'Permanently Delete Data'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </main>
  );
}
