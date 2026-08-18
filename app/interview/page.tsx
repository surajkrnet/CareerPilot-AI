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

function InterviewStudioContent() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get('scanId');

  const [messages, setMessages] = useState<
    Array<{
      role: 'interviewer' | 'candidate';
      content: string;
      feedback?: string;
      timestamp?: string;
    }>
  >([]);
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
  const supabase = createClient();

  // Load candidate info, scan context, and resume text
  useEffect(() => {
    async function fetchCandidateInfo() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: dna }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('career_dna').select('raw_resume_text, target_roles').eq('user_id', user.id).maybeSingle(),
      ]);

      let nameToUse = profile?.full_name || '';

      if (!nameToUse && typeof window !== 'undefined') {
        try {
          const draft = localStorage.getItem('careerpilot_onboarding_draft');
          if (draft) {
            const parsed = JSON.parse(draft);
            if (parsed.fullName && parsed.fullName.trim().length > 0) {
              nameToUse = parsed.fullName.trim();
            }
          }
          if (!nameToUse) {
            const savedDna = localStorage.getItem('careerpilot_career_dna');
            if (savedDna) {
              const parsedDna = JSON.parse(savedDna);
              if (parsedDna.fullName && parsedDna.fullName.trim().length > 0) {
                nameToUse = parsedDna.fullName.trim();
              }
            }
          }
        } catch {}
      }

      if (!nameToUse && user.user_metadata?.full_name) {
        nameToUse = user.user_metadata.full_name;
      }
      if (!nameToUse && user.email) {
        nameToUse = user.email.split('@')[0];
      }

      if (nameToUse) {
        setCandidateName(nameToUse);
      }

      if (dna?.raw_resume_text) setCandidateResume(dna.raw_resume_text);
      if (dna?.target_roles?.[0]) setTargetRoleTitle(dna.target_roles[0]);

      const extractCleanRole = (jd: string, defaultRole = 'Frontend Systems') => {
        if (!jd) return defaultRole;
        const firstLine = jd.split('\n')[0].replace(/^(Requirements|Description|About the role|Job Summary):?/gi, '').trim();
        if (firstLine.includes(' - ')) {
          const parts = firstLine.split(' - ');
          const title = parts[parts.length - 1].trim();
          if (title.length > 3 && title.length <= 40) return title;
        }
        const match = jd.slice(0, 400).match(/\b(Frontend Engineer|Backend Engineer|Full-Stack (?:Engineer|Developer)|Software Engineer|DevOps Engineer|Cloud Infrastructure Engineer|Cloud Architect|Product Manager|Data Engineer|Machine Learning Engineer|System Architect|Security Engineer|Infrastructure Engineer|SRE)\b/i);
        if (match) return match[0];
        if (firstLine.length >= 3 && firstLine.length <= 35 && !firstLine.includes('.')) return firstLine;
        return defaultRole;
      };

      // If scanId was passed from Resume Intelligence, fetch the exact JD analyzed
      if (scanId) {
        const { data: scan } = await supabase
          .from('resume_scans')
          .select('*')
          .eq('id', scanId)
          .maybeSingle();

        if (scan?.target_jd) {
          setTargetJd(scan.target_jd);
          setTargetRoleTitle(extractCleanRole(scan.target_jd, dna?.target_roles?.[0] || 'Frontend Systems'));
        }
      } else {
        // Fetch latest scan as default
        const { data: latestScan } = await supabase
          .from('resume_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestScan?.target_jd) {
          setTargetJd(latestScan.target_jd);
          setTargetRoleTitle(extractCleanRole(latestScan.target_jd, dna?.target_roles?.[0] || 'Frontend Systems'));
        }
      }

      if (typeof window !== 'undefined' && !scanId) {
        const storedJd = localStorage.getItem('careerpilot_target_jd');
        const storedRole = localStorage.getItem('careerpilot_target_role');
        if (storedJd && storedJd.trim().length > 0) {
          setTargetJd(storedJd);
          if (storedRole) {
            setTargetRoleTitle(storedRole);
          }
        }
      }
    }

    fetchCandidateInfo();
  }, [scanId, supabase]);

  // Session timer
  useEffect(() => {
    let timer: any;
    if (isStarted && !showScorecard) {
      timer = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, showScorecard]);

  // Auto-scroll inside chat bubble stream ONLY, never scrolling the browser window
  useEffect(() => {
    if (isStarted && messages.length > 0 && messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  }, [messages, loading, isStarted]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
        throw new Error(data.error || 'Failed to start interview turn with AI Intelligence Engine (Gemma)');
      }

      setMessages([
        {
          role: 'interviewer',
          content: data.nextQuestion,
          timestamp: '00:01',
        },
      ]);
      // Do not record scores for the opening question
    } catch (err: any) {
      setInterviewError(err.message || 'Failed to connect with AI Intelligence Engine (Gemma) interviewer.');
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

    const userMsg = {
      role: 'candidate' as const,
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
        throw new Error(data.error || 'Failed to generate interviewer turn with AI Intelligence Engine (Gemma)');
      }

      setMessages([
        ...updatedMessages,
        {
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
      setInterviewError(err.message || 'Failed to receive interview evaluation from AI Intelligence Engine (Gemma).');
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

  const displayName = candidateName || 'Candidate';
  const displayRole = targetRoleTitle.length > 45 ? targetRoleTitle.slice(0, 42) + '...' : targetRoleTitle;

  return (
    <main className="min-h-screen bg-[#141413] text-[#faf9f5] pt-32 sm:pt-36 pb-16 px-4 sm:px-8 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Studio Top Control Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#252320] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs uppercase tracking-widest text-[#cc785c] font-semibold flex items-center gap-1.5 font-mono">
                <Briefcase className="w-3.5 h-3.5" /> Interview Intelligence Studio
              </span>
              <span className="text-[11px] font-mono bg-[#5db872]/15 text-[#5db872] px-2.5 py-0.5 rounded border border-[#5db872]/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Live AI Engine (Gemma) Grounded
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl text-white">
              Mock Interview Studio
            </h1>
            <p className="text-xs text-[#8e8b82] mt-1.5 flex flex-wrap items-center gap-2">
              <span>Target Role: <strong className="text-[#cc785c] font-mono" title={targetRoleTitle}>{displayRole}</strong></span>
              <span>•</span>
              <span>Candidate: <strong className="text-white">{displayName}</strong></span>
              <span>•</span>
              <span>Mode: Live STAR Project Cross-Examination</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#a09d96] bg-[#181715] px-3 py-2 rounded-md border border-[#3d3d3a]">
              <Clock className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>

            {!isStarted ? (
              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-5 py-2.5 rounded-md font-medium text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" /> Begin Live Interview
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEndInterview}
                  disabled={loading}
                  className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-4 py-2.5 rounded-md font-medium text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Trophy className="w-3.5 h-3.5" /> End &amp; Scorecard ↗
                </button>

                <button
                  onClick={handleRestart}
                  className="bg-transparent border border-[#3d3d3a] text-[#8e8b82] hover:text-white px-3 py-2.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
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
          <div className="p-3.5 bg-[#cc785c]/10 border border-[#cc785c]/30 rounded-lg text-[#faf9f5] text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#cc785c]" />
              <span className="text-[#e6dfd8]">{interviewError}</span>
            </div>
            <button
              onClick={() => setInterviewError(null)}
              className="text-[#a09d96] hover:text-white text-xs font-mono cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Conversation Chat Interface */}
          <div className="lg:col-span-2 bg-[#181715] border border-[#252320] rounded-xl flex flex-col h-[640px] overflow-hidden shadow-lg">
            
            {/* Live Status Bar */}
            <div className="bg-[#1f1e1b] px-5 py-2.5 border-b border-[#252320] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#a09d96]">
                <Volume2 className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>Interviewer: Alex (Lead Technical Hiring Manager)</span>
              </div>
              <span className="text-[11px] font-mono text-[#5db872] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#5db872] animate-pulse" />
                Live Session Active
              </span>
            </div>

            {/* Message Stream */}
            <div ref={messagesScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {!isStarted && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
                  <div className="w-14 h-14 rounded-full bg-[#cc785c]/20 border border-[#cc785c] flex items-center justify-center text-[#cc785c] mb-1">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-2xl text-white">Ready for your practice round?</h3>
                  <p className="text-xs text-[#8e8b82] max-w-md leading-relaxed">
                    AI Intelligence Engine (Gemma) will cross-examine your actual resume projects against the requirements for {displayRole} and score your answers in real time.
                  </p>
                  <button
                    onClick={handleStartInterview}
                    className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-6 py-2.5 rounded-md font-medium text-xs font-mono transition-all cursor-pointer shadow-md"
                  >
                    Begin Live Interview
                  </button>
                </div>
              )}

              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${m.role === 'candidate' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-4 text-xs leading-relaxed space-y-1.5 ${
                      m.role === 'candidate'
                        ? 'bg-[#cc785c] text-white rounded-br-none shadow-md'
                        : 'bg-[#252320] text-[#faf9f5] border border-[#3d3d3a] rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-wider opacity-75 font-mono border-b border-white/10 pb-1">
                      <span className="flex items-center gap-1 font-bold">
                        {m.role === 'candidate' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-[#cc785c]" />}
                        <span>{m.role === 'candidate' ? `You (${displayName})` : 'Alex (Hiring Manager)'}</span>
                      </span>
                      <span>{m.timestamp || ''}</span>
                    </div>
                    <p className="whitespace-pre-line font-sans text-xs sm:text-[13px]">{m.content}</p>
                  </div>

                  {m.feedback && (
                    <div className="mt-1.5 text-xs bg-[#1f1e1b] border border-[#3d3d3a] text-[#a09d96] p-2.5 rounded-md max-w-[85%] shadow-sm">
                      💡 <strong className="text-white">Coach Note:</strong> {m.feedback}
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-[#8e8b82] bg-[#1f1e1b] border border-[#252320] px-4 py-2 rounded-md w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse" />
                  Alex is evaluating your answer with AI Intelligence Engine (Gemma)...
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#252320] bg-[#181715] flex gap-3">
              <input
                type="text"
                placeholder={isStarted ? "Type your STAR response (Situation, Task, Action, Result)..." : "Click 'Begin Live Interview' to start"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isStarted || loading}
                className="flex-1 bg-[#1f1e1b] border border-[#3d3d3a] rounded-md px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#cc785c] disabled:opacity-50 shadow-inner"
              />
              <button
                type="submit"
                disabled={!isStarted || !input.trim() || loading}
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-5 rounded-md flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Live Assessment Gauges & Criteria */}
          <div className="space-y-6">
            
            {/* Live Evaluation Meters */}
            <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-6 shadow-md">
              <div className="flex items-center justify-between border-b border-[#252320] pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#cc785c]" />
                  <h3 className="font-serif text-lg text-white">Live Evaluation Meters</h3>
                </div>
                <span className="text-xs font-mono text-[#cc785c] bg-[#252320] px-2 py-0.5 rounded">
                  {currentScores ? 'Active Turn' : 'Awaiting Turn'}
                </span>
              </div>

              {/* Confidence */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8e8b82]">DELIVERY CONFIDENCE</span>
                  <span className={`font-bold ${currentScores ? 'text-emerald-400' : 'text-[#6c6a64]'}`}>
                    {currentScores ? `${currentScores.confidence}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    animate={{ width: `${currentScores?.confidence || 0}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Technical Accuracy */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8e8b82]">TECHNICAL ACCURACY</span>
                  <span className={`font-bold ${currentScores ? 'text-[#cc785c]' : 'text-[#6c6a64]'}`}>
                    {currentScores ? `${currentScores.technical}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
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
                  <span className="text-[#8e8b82]">STAR STRUCTURE</span>
                  <span className={`font-bold ${currentScores ? 'text-sky-400' : 'text-[#6c6a64]'}`}>
                    {currentScores ? `${currentScores.structure}%` : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-sky-500 rounded-full"
                    animate={{ width: `${currentScores?.structure || 0}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Overall Composite Score */}
              <div className="p-4 rounded-lg bg-[#1f1e1b] border border-[#2e2d29] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8e8b82] block">Composite Drill Score</span>
                  <span className="text-2xl font-serif text-white">
                    {currentScores ? `${currentScores.overall}/100` : '--/100'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#a09d96]">
                  {currentScores ? 'Dynamic Calibrated' : 'Awaiting Responses'}
                </span>
              </div>
            </div>

            {/* Assessment Criteria */}
            <div className="bg-[#181715] border border-[#252320] p-5 rounded-xl space-y-3 shadow-md">
              <h4 className="text-xs uppercase font-mono tracking-widest text-[#8e8b82]">Assessment Criteria</h4>
              <ul className="text-xs text-[#a09d96] space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#cc785c] shrink-0 mt-0.5" />
                  <span>Ground your answers in the real projects listed in your resume.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#cc785c] shrink-0 mt-0.5" />
                  <span>State the exact trade-offs, metrics, and outcomes of your architectural choices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5db872] shrink-0 mt-0.5" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#181715] border border-[#2e2d29] rounded-2xl p-8 shadow-2xl space-y-6 text-[#faf9f5]"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-[#cc785c]/20 border border-[#cc785c] text-[#cc785c] flex items-center justify-center mx-auto mb-1">
                  <Trophy className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-3xl text-white">Interview Drill Scorecard</h2>
                <p className="text-xs font-mono text-[#8e8b82]">{displayRole} Simulation ({displayName})</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#1f1e1b] rounded-xl border border-[#2e2d29]">
                  <span className="text-2xl font-serif text-emerald-400">{finalScorecardData.confidence}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#8e8b82] block mt-0.5">Confidence</span>
                </div>
                <div className="p-3 bg-[#1f1e1b] rounded-xl border border-[#2e2d29]">
                  <span className="text-2xl font-serif text-[#cc785c]">{finalScorecardData.technical}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#8e8b82] block mt-0.5">Technical</span>
                </div>
                <div className="p-3 bg-[#1f1e1b] rounded-xl border border-[#2e2d29]">
                  <span className="text-2xl font-serif text-sky-400">{finalScorecardData.structure}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#8e8b82] block mt-0.5">STAR Format</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1f1e1b] border border-[#2e2d29] space-y-2 text-xs">
                <h4 className="font-semibold text-white flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-[#cc785c]" />
                  <span>Actionable Takeaways</span>
                </h4>
                <div className="text-[#a09d96] leading-relaxed space-y-1.5">
                  {finalScorecardData.takeaways.map((takeaway, idx) => (
                    <p key={idx}>
                      <strong className="text-white font-mono">{idx + 1}. </strong>
                      {takeaway}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-transparent border border-[#3d3d3a] hover:bg-[#1f1e1b] text-white py-2.5 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  Start New Session
                </button>
                <button
                  onClick={() => setShowScorecard(false)}
                  className="flex-1 bg-[#cc785c] hover:bg-[#a9583e] text-white py-2.5 rounded-lg text-xs font-mono transition-colors cursor-pointer"
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
        <div className="min-h-screen bg-[#141413] text-[#faf9f5] flex items-center justify-center p-8">
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
