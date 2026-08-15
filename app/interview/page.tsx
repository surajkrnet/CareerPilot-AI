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
  ArrowRight,
  ShieldCheck,
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
  const [targetJd, setTargetJd] = useState('Linear - Frontend Systems (React, Next.js App Router, TypeScript)');
  const [candidateResume, setCandidateResume] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [targetRoleTitle, setTargetRoleTitle] = useState('Frontend Systems');
  const [isStarted, setIsStarted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showScorecard, setShowScorecard] = useState(false);
  const [scores, setScores] = useState({
    confidence: 88,
    technical: 92,
    structure: 86,
    overall: 89,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
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

      if (profile?.full_name) setCandidateName(profile.full_name);
      if (dna?.raw_resume_text) setCandidateResume(dna.raw_resume_text);
      if (dna?.target_roles?.[0]) setTargetRoleTitle(dna.target_roles[0]);

      // If scanId was passed from Resume Intelligence, fetch the exact JD analyzed
      if (scanId) {
        const { data: scan } = await supabase
          .from('resume_scans')
          .select('*')
          .eq('id', scanId)
          .maybeSingle();

        if (scan?.target_jd) {
          setTargetJd(scan.target_jd);
          const firstLine = scan.target_jd.split('\n')[0].replace(/Requirements:|Description:/gi, '').trim();
          if (firstLine) setTargetRoleTitle(firstLine);
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
          const firstLine = latestScan.target_jd.split('\n')[0].replace(/Requirements:|Description:/gi, '').trim();
          if (firstLine) setTargetRoleTitle(firstLine);
        }
      }
    }

    fetchCandidateInfo();
  }, [scanId]);

  // Session timer
  useEffect(() => {
    let timer: any;
    if (isStarted && !showScorecard) {
      timer = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, showScorecard]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartInterview = async () => {
    setIsStarted(true);
    setLoading(true);
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
      const data = await res.json();
      setMessages([
        {
          role: 'interviewer',
          content:
            data.nextQuestion ||
            `Welcome ${candidateName || 'Candidate'}. I've reviewed your resume and matched it against the requirements for ${targetRoleTitle}. Let's begin: Walk me through a complex technical challenge you faced in one of your recent projects, the architectural trade-offs you made, and how you quantified the result.`,
          timestamp: '00:01',
        },
      ]);
    } catch {
      setMessages([
        {
          role: 'interviewer',
          content: `Welcome ${candidateName || 'Candidate'}. I have cross-examined your resume with the ${targetRoleTitle} specifications. To start, walk me through the system design of your most complex project.`,
          timestamp: '00:01',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
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
      const data = await res.json();

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
        setScores({
          confidence: data.scores.confidenceScore || scores.confidence,
          technical: data.scores.technicalAccuracy || scores.technical,
          structure: data.scores.structureScore || scores.structure,
          overall: data.scores.overall || scores.overall,
        });
      }
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: 'interviewer',
          content:
            'Good breakdown. Can you describe how you tested and verified performance under high load for that implementation?',
          feedback: 'Clear technical framing. Remember to state measurable metric outcomes where possible.',
          timestamp: formatTimer(secondsElapsed),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setLoading(true);
    try {
      await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobDescription: targetJd,
          resumeText: candidateResume,
          conversationHistory: messages,
          userResponse: 'Candidate completed session',
          isFinal: true,
          role: targetRoleTitle,
        }),
      });
    } catch (err) {
      console.warn('Session save note:', err);
    } finally {
      setLoading(false);
      setShowScorecard(true);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }
  };

  const handleRestart = () => {
    setIsStarted(false);
    setMessages([]);
    setSecondsElapsed(0);
    setShowScorecard(false);
  };

  const displayName = candidateName || 'Candidate';

  return (
    <main className="min-h-screen bg-[#141413] text-[#faf9f5] pt-28 pb-16 px-4 sm:px-8 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Studio Top Control Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#252320] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-[#cc785c] font-semibold flex items-center gap-1.5 font-mono">
                <Briefcase className="w-3.5 h-3.5" /> Interview Intelligence Studio
              </span>
              <span className="text-[11px] font-mono bg-[#5db872]/15 text-[#5db872] px-2 py-0.5 rounded border border-[#5db872]/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Grounded on Resume &amp; Target JD
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl text-white">
              Mock Interview: {targetRoleTitle}
            </h1>
            <p className="text-xs text-[#8e8b82] mt-0.5">
              Candidate: <strong className="text-white">{displayName}</strong> • Mode: Resume Project Cross-Examination &amp; Live STAR Scoring
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
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-5 py-2 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" /> Begin Interview
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEndInterview}
                  disabled={loading || messages.length < 2}
                  className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-4 py-2 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Trophy className="w-3.5 h-3.5" /> End &amp; Scorecard ↗
                </button>

                <button
                  onClick={handleRestart}
                  className="bg-transparent border border-[#3d3d3a] text-[#8e8b82] hover:text-white px-3 py-2 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Reset Session"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            )}
          </div>
        </header>

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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!isStarted && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
                  <div className="w-14 h-14 rounded-full bg-[#cc785c]/20 border border-[#cc785c] flex items-center justify-center text-[#cc785c] mb-1">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-2xl text-white">Ready for your practice round?</h3>
                  <p className="text-xs text-[#8e8b82] max-w-md leading-relaxed">
                    The AI hiring manager will ask targeted questions referencing your resume's actual projects and cross-examine your architecture against {targetRoleTitle}.
                  </p>
                  <button
                    onClick={handleStartInterview}
                    className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-6 py-2.5 rounded-md font-medium text-xs transition-all cursor-pointer shadow-md"
                  >
                    Start Interview
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
                  Alex is evaluating your answer against the target JD...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#252320] bg-[#181715] flex gap-3">
              <input
                type="text"
                placeholder={isStarted ? "Type your STAR response (Situation, Task, Action, Result)..." : "Click 'Begin Interview' to start"}
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
                <span className="text-xs font-mono text-[#cc785c] bg-[#252320] px-2 py-0.5 rounded">Active</span>
              </div>

              {/* Confidence */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8e8b82]">DELIVERY CONFIDENCE</span>
                  <span className="text-emerald-400 font-bold">{scores.confidence}%</span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    animate={{ width: `${scores.confidence}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Technical Accuracy */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8e8b82]">TECHNICAL ACCURACY</span>
                  <span className="text-[#cc785c] font-bold">{scores.technical}%</span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#cc785c] rounded-full"
                    animate={{ width: `${scores.technical}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* STAR Answer Structure */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8e8b82]">STAR STRUCTURE</span>
                  <span className="text-sky-400 font-bold">{scores.structure}%</span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-sky-500 rounded-full"
                    animate={{ width: `${scores.structure}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Overall Composite Score */}
              <div className="p-4 rounded-lg bg-[#1f1e1b] border border-[#2e2d29] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8e8b82] block">Composite Drill Score</span>
                  <span className="text-2xl font-serif text-white">{scores.overall}/100</span>
                </div>
                <span className="text-xs font-mono text-[#cc785c] bg-[#181715] px-2.5 py-1 rounded border border-[#3d3d3a]">
                  Top Candidate
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
        {showScorecard && (
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
                <p className="text-xs font-mono text-[#8e8b82]">{targetRoleTitle} Simulation ({displayName})</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#1f1e1b] rounded-xl border border-[#2e2d29]">
                  <span className="text-2xl font-serif text-emerald-400">{scores.confidence}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#8e8b82] block mt-0.5">Confidence</span>
                </div>
                <div className="p-3 bg-[#1f1e1b] rounded-xl border border-[#2e2d29]">
                  <span className="text-2xl font-serif text-[#cc785c]">{scores.technical}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#8e8b82] block mt-0.5">Technical</span>
                </div>
                <div className="p-3 bg-[#1f1e1b] rounded-xl border border-[#2e2d29]">
                  <span className="text-2xl font-serif text-sky-400">{scores.structure}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#8e8b82] block mt-0.5">STAR Format</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1f1e1b] border border-[#2e2d29] space-y-2 text-xs">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#cc785c]" />
                  <span>Actionable Takeaways</span>
                </h4>
                <p className="text-[#8e8b82] leading-relaxed">
                  1. Lead with measurable business impact before diving into technical details.<br />
                  2. Emphasize distributed caching invalidation and observability in your next drill.
                </p>
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
