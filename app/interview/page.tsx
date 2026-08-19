'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Send,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Briefcase,
  Trophy,
  BarChart2,
  Clock,
  Volume2,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  feedback?: string;
  timestamp?: string;
}

function InterviewStudioContent() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get('scanId');

  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [targetJd, setTargetJd] = useState('Linear - Frontend Systems (React, Next.js App Router, TypeScript)');
  const [candidateResume, setCandidateResume] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [targetRoleTitle, setTargetRoleTitle] = useState('Frontend Systems');
  const [isStarted, setIsStarted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showScorecard, setShowScorecard] = useState(false);

  // Strict Evaluation State (Starts Null)
  const [currentScores, setCurrentScores] = useState<{
    confidence: number;
    technical: number;
    structure: number;
    overall: number;
  } | null>(null);
  const [turnHistory, setTurnHistory] = useState<Array<{ confidence: number; technical: number; structure: number }>>([]);
  const [finalScorecardData, setFinalScorecardData] = useState<{
    confidence: number;
    technical: number;
    structure: number;
    overall: number;
    takeaways: string[];
  } | null>(null);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load candidate info, scan context, and resume text immediately from local state + Supabase
  useEffect(() => {
    let nameToUse = '';
    let resumeToUse = '';
    let roleToUse = 'Frontend Systems';
    let jdToUse = 'Linear - Frontend Systems (React, Next.js App Router, TypeScript)';

    if (typeof window !== 'undefined') {
      try {
        const storedRole = localStorage.getItem('careerpilot_target_role');
        const storedJd = localStorage.getItem('careerpilot_target_jd');
        if (storedRole && storedRole.trim()) roleToUse = storedRole.trim();
        if (storedJd && storedJd.trim()) jdToUse = storedJd.trim();

        const draft = localStorage.getItem('careerpilot_onboarding_draft');
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          if (parsedDraft.fullName?.trim()) nameToUse = parsedDraft.fullName.trim();
        }

        const savedDna = localStorage.getItem('careerpilot_career_dna');
        if (savedDna) {
          const parsedDna = JSON.parse(savedDna);
          if (!nameToUse && parsedDna.fullName?.trim()) nameToUse = parsedDna.fullName.trim();
          if (parsedDna.raw_resume_text) resumeToUse = parsedDna.raw_resume_text;
          if (!storedRole && parsedDna.targetRoles?.[0]) roleToUse = parsedDna.targetRoles[0];
        }
      } catch (e) {}
    }

    if (nameToUse) setCandidateName(nameToUse);
    if (resumeToUse) setCandidateResume(resumeToUse);
    if (roleToUse) setTargetRoleTitle(roleToUse);
    if (jdToUse) setTargetJd(jdToUse);

    async function loadSupabaseContext() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const [{ data: profile }, { data: dna }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
          supabase.from('career_dna').select('raw_resume_text, target_roles').eq('user_id', user.id).maybeSingle(),
        ]);

        if (profile?.full_name && !nameToUse) {
          setCandidateName(profile.full_name);
        }
        if (dna?.raw_resume_text && !resumeToUse) {
          setCandidateResume(dna.raw_resume_text);
        }
        if (dna?.target_roles?.[0] && roleToUse === 'Frontend Systems') {
          setTargetRoleTitle(dna.target_roles[0]);
        }

        if (scanId) {
          const { data: scan } = await supabase
            .from('resume_scans')
            .select('*')
            .eq('id', scanId)
            .maybeSingle();

          if (scan?.target_jd) {
            setTargetJd(scan.target_jd);
            const firstLine = scan.target_jd.split('\n')[0].replace(/^(Requirements|Description|About the role):?/gi, '').trim();
            if (firstLine && firstLine.length <= 45) setTargetRoleTitle(firstLine);
          }
        }
      } catch (e) {
        console.warn('Supabase interview fetch note:', e);
      }
    }

    loadSupabaseContext();
  }, [scanId]);

  // Session timer
  useEffect(() => {
    let timer: any;
    if (isStarted && !showScorecard) {
      timer = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, showScorecard]);

  // Smooth auto-scroll inside chat bubble stream ONLY, never scrolling the browser window
  useEffect(() => {
    if (isStarted && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, loading, isStarted]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayName = candidateName || 'Candidate';
  const displayRole = targetRoleTitle.length > 45 ? targetRoleTitle.slice(0, 42) + '...' : targetRoleTitle;

  const handleStartInterview = async () => {
    setIsStarted(true);
    setLoading(true);
    setInterviewError(null);
    setCurrentScores(null);
    setTurnHistory([]);
    setFinalScorecardData(null);

    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobDescription: targetJd,
          resumeText: candidateResume,
          conversationHistory: [],
          userResponse: 'Start session',
          role: targetRoleTitle,
          candidateName: displayName,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        data = { error: text || 'Interview turn could not be generated. Please retry.' };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start interview turn with AI Intelligence Engine');
      }

      setMessages([
        {
          id: `msg-start-${Date.now()}`,
          role: 'interviewer',
          content: data.nextQuestion,
          timestamp: '00:01',
        },
      ]);
      // Do not record scores for the opening question
    } catch (err: any) {
      setInterviewError(err.message || 'Failed to connect with AI Intelligence Engine interviewer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setInterviewError(null);

    const userMsg: InterviewMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'candidate',
      content: userText,
      timestamp: formatTimer(secondsElapsed),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobDescription: targetJd,
          resumeText: candidateResume,
          conversationHistory: updatedMessages,
          userResponse: userText,
          role: targetRoleTitle,
          candidateName: displayName,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        data = { error: text || 'Interview feedback could not be processed. Please retry.' };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate interviewer turn with AI Intelligence Engine');
      }

      setMessages([
        ...updatedMessages,
        {
          id: `msg-reply-${Date.now()}`,
          role: 'interviewer',
          content: data.nextQuestion,
          feedback: data.feedbackOnPreviousAnswer,
          timestamp: formatTimer(secondsElapsed),
        },
      ]);

      if (data.scores) {
        const turnConf = Number(data.scores.confidenceScore) || 0;
        const turnTech = Number(data.scores.technicalAccuracy) || 0;
        const turnStruct = Number(data.scores.structureScore) || 0;
        const turnOverall = Math.round(turnConf * 0.3 + turnTech * 0.4 + turnStruct * 0.3);

        setTurnHistory((prev) => [...prev, { confidence: turnConf, technical: turnTech, structure: turnStruct }]);

        setCurrentScores({
          confidence: turnConf,
          technical: turnTech,
          structure: turnStruct,
          overall: turnOverall,
        });
      }
    } catch (err: any) {
      setInterviewError(err.message || 'Failed to receive interview evaluation from AI Intelligence Engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setLoading(true);
    try {
      let finalConfidence = 0;
      let finalTechnical = 0;
      let finalStructure = 0;
      let finalComposite = 0;
      let takeaways: string[] = [];

      if (turnHistory.length === 0) {
        finalConfidence = 0;
        finalTechnical = 0;
        finalStructure = 0;
        finalComposite = 0;
        takeaways = [
          'No candidate answers were submitted during this drill.',
          'Start a new session and respond to technical questions using the STAR framework to receive a calibrated scorecard.',
        ];
      } else {
        const sumConf = turnHistory.reduce((a, b) => a + b.confidence, 0);
        const sumTech = turnHistory.reduce((a, b) => a + b.technical, 0);
        const sumStruct = turnHistory.reduce((a, b) => a + b.structure, 0);

        finalConfidence = Math.round(sumConf / turnHistory.length);
        finalTechnical = Math.round(sumTech / turnHistory.length);
        finalStructure = Math.round(sumStruct / turnHistory.length);
        finalComposite = Math.round(finalConfidence * 0.3 + finalTechnical * 0.4 + finalStructure * 0.3);

        if (finalComposite < 40) {
          takeaways = [
            'Avoid single-word or ultra-brief replies; elaborate on technical decisions using the STAR framework (Situation, Task, Action, Result).',
            'Cite concrete technologies, system constraints, and measurable metrics from your resume projects.',
          ];
        } else if (finalComposite < 75) {
          takeaways = [
            'Solid technical baseline. Lead with measurable business impact and latency improvements earlier in your answers.',
            'Explain the specific architectural trade-offs that guided your choice of tools over alternatives.',
          ];
        } else {
          takeaways = [
            'Strong architectural depth and structured STAR delivery demonstrated across all responses.',
            'Continue emphasizing edge cases, distributed failure modes, and observability metrics in live hiring rounds.',
          ];
        }
      }

      setFinalScorecardData({
        confidence: finalConfidence,
        technical: finalTechnical,
        structure: finalStructure,
        overall: finalComposite,
        takeaways,
      });

      setCurrentScores({
        confidence: finalConfidence,
        technical: finalTechnical,
        structure: finalStructure,
        overall: finalComposite,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('interview_sessions').insert({
          user_id: user.id,
          target_role: targetRoleTitle,
          transcript: messages,
          completed: true,
          evaluation_report: {
            deliveryConfidence: finalConfidence,
            technicalAccuracy: finalTechnical,
            starStructure: finalStructure,
            compositeScore: finalComposite,
            turnCount: messages.filter((m) => m.role === 'candidate').length,
            takeaways,
          },
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Session save note:', err);
    } finally {
      setLoading(false);
      setShowScorecard(true);
      if (turnHistory.length > 0) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    }
  };

  const handleRestart = () => {
    setIsStarted(false);
    setMessages([]);
    setTurnHistory([]);
    setCurrentScores(null);
    setFinalScorecardData(null);
    setSecondsElapsed(0);
    setShowScorecard(false);
    setInterviewError(null);
  };

  return (
    <main className="min-h-screen bg-[#f6f4ee] dark:bg-[#121110] text-[#121110] dark:text-[#faf9f5] pt-28 pb-20 px-4 sm:px-8 md:px-10 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Studio Top Control Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#ded7cb] dark:border-white/[0.08] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="text-xs uppercase tracking-widest text-[#cc785c] font-bold flex items-center gap-1.5 font-mono">
                <Briefcase className="w-3.5 h-3.5" /> Interview Intelligence Studio
              </span>
              <span className="text-[11px] font-mono bg-[#2e8544]/15 text-[#2e8544] dark:text-[#5db872] px-2.5 py-0.5 rounded-full border border-[#2e8544]/30 flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Live AI Engine Grounded
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[#121110] dark:text-[#faf9f5]">
              Mock Interview Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#57534e] dark:text-[#a09d96] mt-1.5 flex flex-wrap items-center gap-2 font-medium">
              <span>Target Role: <strong className="text-[#cc785c] font-mono font-bold" title={targetRoleTitle}>{displayRole}</strong></span>
              <span>•</span>
              <span>Candidate: <strong className="text-[#121110] dark:text-white font-bold">{displayName}</strong></span>
              <span>•</span>
              <span>Mode: Live STAR Project Cross-Examination</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#3b3834] dark:text-[#a09d96] bg-[#ffffff] dark:bg-[#181716] px-4 py-2.5 rounded-xl border border-[#ded7cb] dark:border-white/10 shadow-sm font-semibold">
              <Clock className="w-4 h-4 text-[#cc785c]" />
              <span className="font-bold">{formatTimer(secondsElapsed)}</span>
            </div>

            {!isStarted ? (
              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider font-mono transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] coral-glow-subtle"
              >
                <Sparkles className="w-4 h-4" /> Begin Live Interview
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEndInterview}
                  disabled={loading}
                  className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider font-mono transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
                >
                  <Trophy className="w-4 h-4" /> End &amp; Scorecard ↗
                </button>

                <button
                  onClick={handleRestart}
                  className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/10 text-[#57534e] dark:text-[#a09d96] hover:text-[#121110] dark:hover:text-white px-3.5 py-3 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 font-bold"
                  title="Reset Session"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Live AI Engine Status Notification */}
        {interviewError && (
          <div className="p-4 bg-[#cc785c]/10 border border-[#cc785c]/30 rounded-xl text-[#121110] dark:text-[#faf9f5] text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#cc785c]" />
              <span className="text-[#2d2a26] dark:text-[#e6dfd8] font-medium">{interviewError}</span>
            </div>
            <button
              onClick={() => setInterviewError(null)}
              className="text-[#57534e] dark:text-[#a09d96] hover:text-[#121110] dark:hover:text-white text-xs font-mono cursor-pointer font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Conversation Chat Interface */}
          <div className="lg:col-span-2 bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] rounded-2xl flex flex-col h-[560px] sm:h-[660px] overflow-hidden shadow-md">
            
            {/* Acoustic Live Status Bar */}
            <div className="bg-[#f6f4ee] dark:bg-[#201e1c] px-6 py-3 border-b border-[#ded7cb] dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-[#2d2a26] dark:text-[#a09d96] font-semibold">
                <Volume2 className="w-4 h-4 text-[#cc785c]" />
                <span>Interviewer: Alex (Lead Technical Hiring Manager)</span>
              </div>
              
              {/* Audio Waveform Simulation */}
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-3 bg-[#cc785c] rounded-full ${isStarted ? 'animate-pulse' : 'opacity-40'}`} />
                <span className={`w-1.5 h-5 bg-[#cc785c] rounded-full ${isStarted ? 'animate-pulse' : 'opacity-40'}`} style={{ animationDelay: '150ms' }} />
                <span className={`w-1.5 h-2 bg-[#cc785c] rounded-full ${isStarted ? 'animate-pulse' : 'opacity-40'}`} style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] font-mono text-[#2e8544] dark:text-[#5db872] font-bold ml-1.5">
                  {isStarted ? (loading ? 'Alex Speaking...' : 'Acoustic Studio Active') : 'Ready'}
                </span>
              </div>
            </div>

            {/* Message Stream */}
            <div ref={messagesScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {!isStarted && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3.5 p-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#cc785c]/10 border border-[#cc785c]/40 flex items-center justify-center text-[#cc785c] mb-1 coral-glow-subtle">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#121110] dark:text-white">Ready for your practice round?</h3>
                  <p className="text-xs text-[#57534e] dark:text-[#8e8b82] max-w-md leading-relaxed font-medium">
                    AI Intelligence Engine will cross-examine your actual resume projects against the requirements for {displayRole} and score your answers in real time.
                  </p>
                  <button
                    onClick={handleStartInterview}
                    className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-wider font-mono transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    Begin Live Interview
                  </button>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'candidate' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-2 ${
                      m.role === 'candidate'
                        ? 'bg-[#cc785c] text-white rounded-br-none shadow-md'
                        : 'bg-[#f6f4ee] dark:bg-[#201e1c] text-[#121110] dark:text-[#faf9f5] border border-[#ded7cb] dark:border-white/10 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-wider opacity-80 font-mono border-b border-black/10 dark:border-white/10 pb-1.5">
                      <span className="flex items-center gap-1.5 font-bold">
                        {m.role === 'candidate' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-[#cc785c]" />}
                        <span>{m.role === 'candidate' ? `You (${displayName})` : 'Alex (Hiring Manager)'}</span>
                      </span>
                      <span>{m.timestamp || ''}</span>
                    </div>
                    <p className="whitespace-pre-line font-sans text-xs sm:text-[13px] leading-relaxed font-normal">{m.content}</p>
                  </div>

                  {m.feedback && (
                    <div className="mt-2 text-xs bg-[#f0ebe1] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 text-[#2d2a26] dark:text-[#a09d96] p-3 rounded-xl max-w-[85%] shadow-sm leading-relaxed font-medium">
                      💡 <strong className="text-[#121110] dark:text-white font-bold">Coach Note:</strong> {m.feedback}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2.5 text-xs text-[#3b3834] dark:text-[#8e8b82] bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 px-4 py-2.5 rounded-xl w-fit shadow-sm font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#cc785c] animate-pulse" />
                  <span>Alex is evaluating your answer with AI Intelligence Engine...</span>
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 sm:p-5 border-t border-[#ded7cb] dark:border-white/10 bg-[#ffffff] dark:bg-[#181716] flex gap-3">
              <input
                type="text"
                placeholder={isStarted ? "Type your STAR response (Situation, Task, Action, Result)..." : "Click 'Begin Live Interview' to start"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isStarted || loading}
                className="flex-1 bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#121110] dark:text-white focus:outline-none focus:border-[#cc785c] disabled:opacity-50 shadow-inner font-sans font-medium"
              />
              <button
                type="submit"
                disabled={!isStarted || !input.trim() || loading}
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-6 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Live Assessment Gauges & Criteria */}
          <div className="space-y-6">
            
            {/* Live Evaluation Meters */}
            <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] p-6 rounded-2xl space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-[#ded7cb] dark:border-white/10 pb-3.5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#cc785c]" />
                  <h3 className="font-display text-xl font-bold text-[#121110] dark:text-white">Live Evaluation Meters</h3>
                </div>
                <span className="text-xs font-mono text-[#cc785c] bg-[#cc785c]/10 px-2.5 py-0.5 rounded-md font-bold">
                  {currentScores ? 'Active Turn' : 'Awaiting Turn'}
                </span>
              </div>

              {/* Confidence */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#57534e] dark:text-[#8e8b82] font-bold">DELIVERY CONFIDENCE</span>
                  <span className={`font-bold ${currentScores ? 'text-[#2e8544] dark:text-emerald-400' : 'text-[#8e8b82] dark:text-[#6c6a64]'}`}>
                    {currentScores ? `${currentScores.confidence}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#f0ebe1] dark:bg-[#201e1c] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#2e8544] dark:bg-emerald-500 rounded-full"
                    animate={{ width: `${currentScores?.confidence || 0}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Technical Accuracy */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#57534e] dark:text-[#8e8b82] font-bold">TECHNICAL ACCURACY</span>
                  <span className={`font-bold ${currentScores ? 'text-[#cc785c]' : 'text-[#8e8b82] dark:text-[#6c6a64]'}`}>
                    {currentScores ? `${currentScores.technical}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#f0ebe1] dark:bg-[#201e1c] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#cc785c] rounded-full"
                    animate={{ width: `${currentScores?.technical || 0}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* STAR Answer Structure */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#57534e] dark:text-[#8e8b82] font-bold">STAR STRUCTURE</span>
                  <span className={`font-bold ${currentScores ? 'text-sky-700 dark:text-sky-400' : 'text-[#8e8b82] dark:text-[#6c6a64]'}`}>
                    {currentScores ? `${currentScores.structure}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#f0ebe1] dark:bg-[#201e1c] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-sky-500 rounded-full"
                    animate={{ width: `${currentScores?.structure || 0}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Overall Composite Score */}
              <div className="p-4 rounded-xl bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#57534e] dark:text-[#8e8b82] block font-bold">Composite Drill Score</span>
                  <span className="text-3xl font-display font-bold text-[#121110] dark:text-white">
                    {currentScores ? `${currentScores.overall}/100` : '--/100'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#57534e] dark:text-[#a09d96] font-bold">
                  {currentScores ? 'Dynamic Calibrated' : 'Awaiting Responses'}
                </span>
              </div>
            </div>

            {/* Assessment Criteria */}
            <div className="bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/[0.08] p-6 rounded-2xl space-y-3.5 shadow-md">
              <h4 className="text-xs uppercase font-mono tracking-widest text-[#57534e] dark:text-[#8e8b82] font-bold">Assessment Criteria</h4>
              <ul className="text-xs text-[#2d2a26] dark:text-[#a09d96] space-y-3 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#cc785c] shrink-0 mt-0.5" />
                  <span>Ground your answers in the real projects listed in your resume.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#cc785c] shrink-0 mt-0.5" />
                  <span>State the exact trade-offs, metrics, and outcomes of your architectural choices.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2e8544] dark:text-[#5db872] shrink-0 mt-0.5" />
                  <span>Use Google STAR method: Situation, Task, Action, and Measurable Result.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* Final Scorecard Modal */}
      <AnimatePresence>
        {showScorecard && finalScorecardData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#ffffff] dark:bg-[#181716] border border-[#ded7cb] dark:border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-[#121110] dark:text-[#faf9f5]"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-[#cc785c]/15 border border-[#cc785c]/50 text-[#cc785c] flex items-center justify-center mx-auto mb-2 coral-glow-subtle">
                  <Trophy className="w-8 h-8" />
                </div>
                <h2 className="font-display text-3xl font-bold text-[#121110] dark:text-white">Interview Drill Scorecard</h2>
                <p className="text-xs font-mono text-[#57534e] dark:text-[#8e8b82] font-semibold">{displayRole} Simulation ({displayName})</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-[#f6f4ee] dark:bg-[#201e1c] rounded-2xl border border-[#ded7cb] dark:border-white/10 shadow-inner">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-[#2e8544] dark:text-emerald-400">{finalScorecardData.confidence}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#57534e] dark:text-[#8e8b82] block mt-1 font-bold">Confidence</span>
                </div>
                <div className="p-4 bg-[#f6f4ee] dark:bg-[#201e1c] rounded-2xl border border-[#ded7cb] dark:border-white/10 shadow-inner">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-[#cc785c]">{finalScorecardData.technical}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#57534e] dark:text-[#8e8b82] block mt-1 font-bold">Technical</span>
                </div>
                <div className="p-4 bg-[#f6f4ee] dark:bg-[#201e1c] rounded-2xl border border-[#ded7cb] dark:border-white/10 shadow-inner">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-sky-700 dark:text-sky-400">{finalScorecardData.structure}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#57534e] dark:text-[#8e8b82] block mt-1 font-bold">STAR Format</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#f6f4ee] dark:bg-[#201e1c] border border-[#ded7cb] dark:border-white/10 space-y-2.5 text-xs shadow-inner">
                <h4 className="font-bold text-[#121110] dark:text-white flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-[#cc785c]" />
                  <span>Actionable Takeaways</span>
                </h4>
                <div className="text-[#2d2a26] dark:text-[#a09d96] leading-relaxed space-y-2 font-medium">
                  {finalScorecardData.takeaways.map((takeaway, idx) => (
                    <p key={idx}>
                      <strong className="text-[#121110] dark:text-white font-mono font-bold">{idx + 1}. </strong>
                      {takeaway}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-transparent border border-[#ded7cb] dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[#121110] dark:text-white py-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  Start New Session
                </button>
                <button
                  onClick={() => setShowScorecard(false)}
                  className="flex-1 bg-[#cc785c] hover:bg-[#a9583e] text-white py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Back to Studio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function MockInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f4ee] dark:bg-[#121110] text-[#121110] dark:text-[#faf9f5] flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-xs font-mono text-[#cc785c]">
            <span className="w-4 h-4 border-2 border-[#cc785c] border-t-transparent rounded-full animate-spin" />
            <span>Loading Interview Studio Context...</span>
          </div>
        </div>
      }
    >
      <InterviewStudioContent />
    </Suspense>
  );
}
