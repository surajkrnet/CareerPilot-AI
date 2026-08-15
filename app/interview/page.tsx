'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Sparkles,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Volume2,
  Zap,
  RotateCcw,
  Trophy,
  Check,
  ChevronRight,
  Loader2,
  Bot,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

export default function MockInterviewPage() {
  const { profile } = useCareer();

  const [candidateName, setCandidateName] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>(profile.targetRole || 'Full-Stack Development');
  const [selectedCompany, setSelectedCompany] = useState<string>('Linear');
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [showScorecard, setShowScorecard] = useState<boolean>(false);

  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'ai' | 'user';
    text: string;
    feedback?: {
      confidence: number;
      accuracy: number;
      starScore: number;
      structureTip?: string;
    };
    timestamp: string;
  }>>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello! I'm Alex, your Lead AI Technical Interviewer. Today we're running an in-depth simulation for ${profile.targetRole || 'Full-Stack Development'} at Linear. \n\nI'll be evaluating your actual resume projects and system trade-offs. Let's start: Walk me through a complex technical challenge you tackled in one of your recent projects, the architectural decisions you made, and how you quantified the result.`,
      feedback: {
        confidence: 90,
        accuracy: 92,
        starScore: 88,
        structureTip: 'Ready to evaluate your real project execution using the STAR framework.',
      },
      timestamp: '00:01',
    },
  ]);

  const [scores, setScores] = useState({
    confidence: 88,
    accuracy: 92,
    starScore: 86,
    overall: 89,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch real candidate name & target track on mount
  useEffect(() => {
    async function loadCandidate() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData?.full_name) {
          setCandidateName(profileData.full_name);
        } else if (user.email) {
          setCandidateName(user.email.split('@')[0]);
        }

        const { data: dnaData } = await supabase
          .from('career_dna')
          .select('target_roles')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dnaData?.target_roles?.[0]) {
          setSelectedTrack(dnaData.target_roles[0]);
        }
      } else {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('careerpilot_career_dna');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.fullName) setCandidateName(parsed.fullName);
              if (parsed.targetRole) setSelectedTrack(parsed.targetRole);
            } catch (e) {}
          }
        }
      }
    }

    loadCandidate();
  }, []);

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Session timer
  useEffect(() => {
    let timer: any;
    if (isSessionActive) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user' as const,
      text: text.trim(),
      timestamp: formatTimer(secondsElapsed),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);
    if (!isSessionActive) setIsSessionActive(true);

    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          role: selectedTrack,
          company: selectedCompany,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        if (data.scores) {
          setScores(data.scores);
        }
      }
    } catch (err) {
      console.warn('Interview message notice:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndSession = async () => {
    setIsSessionActive(false);
    setIsTyping(true);

    try {
      await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          role: selectedTrack,
          company: selectedCompany,
          isFinal: true,
        }),
      });
    } catch (e) {
      console.warn('End session save note:', e);
    } finally {
      setIsTyping(false);
      setShowScorecard(true);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }
  };

  const handleRestart = () => {
    setSecondsElapsed(0);
    setIsSessionActive(false);
    setShowScorecard(false);
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'ai',
        text: `Welcome to your fresh interview simulation for ${selectedTrack} at ${selectedCompany}. \n\nLet's begin: Walk me through a complex technical challenge you faced while building an application and how you resolved it.`,
        feedback: {
          confidence: 88,
          accuracy: 90,
          starScore: 86,
          structureTip: 'Focus on Action and Result metrics to maximize your STAR rating.',
        },
        timestamp: '00:00',
      },
    ]);
  };

  const displayName = candidateName || profile.name || 'Candidate';

  return (
    <div className="bg-[#181715] min-h-screen text-[#faf9f5] pt-28 pb-16 px-4 sm:px-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* INTERVIEW STUDIO TOP CONTROL BAR */}
        <div className="bg-[#252320] border border-white/10 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#cc785c] text-white flex items-center justify-center font-bold">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isSessionActive ? 'bg-[#5db872] animate-pulse' : 'bg-[#6c6a64]'}`} />
                <h1 className="font-display text-xl sm:text-2xl text-white">
                  Mock Interview Studio: {selectedTrack}
                </h1>
                <Badge variant="coral" size="sm">
                  {selectedCompany}
                </Badge>
              </div>
              <p className="text-xs text-[#a09d96]">
                Candidate: <strong className="text-white">{displayName}</strong> • Mode: Resume Project Drill &amp; Live STAR Scoring
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
            {/* Target Role Selector */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="bg-[#181715] border border-white/10 rounded px-2.5 py-1.5 text-xs text-[#faf9f5] font-mono focus:outline-none focus:border-[#cc785c]"
            >
              <option value="Frontend Systems">Frontend Systems</option>
              <option value="SDE-1">SDE-1</option>
              <option value="Full-Stack Development">Full-Stack Development</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="AI/ML Engineering">AI/ML Engineering</option>
              <option value="Product Manager">Product Manager</option>
            </select>

            <div className="flex items-center gap-2 text-xs font-mono text-[#a09d96] bg-[#181715] px-3 py-1.5 rounded border border-white/10">
              <Clock className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>

            <Button
              variant="secondary-dark"
              size="sm"
              onClick={handleEndSession}
              disabled={messages.length <= 1}
              className="border-white/20 hover:border-[#cc785c] text-xs font-mono"
            >
              End Session &amp; Scorecard ↗
            </Button>
          </div>
        </div>

        {/* MAIN STUDIO 2-COLUMN ENVIRONMENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: STREAMING CHAT INTERFACE */}
          <div className="lg:col-span-7 flex flex-col h-[680px] bg-[#252320] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            
            {/* Chat Room Header */}
            <div className="bg-[#181715] px-6 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#a09d96]">
                <Volume2 className="w-4 h-4 text-[#cc785c]" />
                <span>Interviewer: Alex (Principal Evaluator)</span>
              </div>
              <span className="text-xs text-[#5db872] font-mono">Live Resume Evaluator Active</span>
            </div>

            {/* Chat Transcript Area */}
            <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                      msg.sender === 'user'
                        ? 'bg-[#cc785c] text-white rounded-br-none'
                        : 'bg-[#181715] text-[#faf9f5] border border-white/10 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] font-mono opacity-75 border-b border-white/10 pb-1">
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                        {msg.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-[#cc785c]" />}
                        <span>{msg.sender === 'user' ? `You (${displayName})` : 'Alex (Interviewer)'}</span>
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-line font-sans">{msg.text}</p>

                    {msg.feedback?.structureTip && (
                      <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-[#a09d96] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#cc785c] shrink-0" />
                        <span>{msg.feedback.structureTip}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#181715] border border-white/10 max-w-[220px] text-xs font-mono text-[#a09d96]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#cc785c]" />
                  <span>Alex is evaluating resume projects...</span>
                </div>
              )}
            </div>

            {/* Quick Sample Prompts */}
            <div className="px-6 py-2 bg-[#1f1e1b] border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono text-[#6c6a64] uppercase shrink-0">Sample Answers:</span>
              <button
                type="button"
                onClick={() => handleSendMessage("In my production project, I built a high-throughput Next.js App Router service with TypeScript and PostgreSQL. When faced with slow API response times under load, I implemented Redis caching and query indexing, reducing p99 latency by 42% across 50k active sessions.")}
                className="text-[11px] px-2.5 py-1 rounded bg-[#252320] border border-white/10 hover:border-[#cc785c] text-[#a09d96] hover:text-white shrink-0 transition-colors"
              >
                Next.js Caching &amp; Indexing (STAR)
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("I led the architectural migration from a monolith to distributed microservices with Kafka event queues, achieving zero downtime during peak deployment windows.")}
                className="text-[11px] px-2.5 py-1 rounded bg-[#252320] border border-white/10 hover:border-[#cc785c] text-[#a09d96] hover:text-white shrink-0 transition-colors"
              >
                Distributed Systems Migration
              </button>
            </div>

            {/* Chat Input Box */}
            <div className="p-4 bg-[#181715] border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMicActive(!isMicActive)}
                className={`p-3 rounded-lg border transition-all ${
                  isMicActive
                    ? 'bg-[#cc785c] text-white border-[#cc785c] animate-pulse'
                    : 'bg-[#252320] text-[#a09d96] border-white/10 hover:text-white'
                }`}
                title={isMicActive ? 'Mute Mic' : 'Activate Voice Input'}
              >
                {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isMicActive ? 'Listening to your voice answer...' : 'Type your STAR interview response and press Enter...'}
                className="flex-1 bg-[#252320] border border-white/10 rounded-lg px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#cc785c] transition-colors"
              />

              <Button
                variant="primary"
                size="md"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className="bg-[#cc785c] hover:bg-[#a9583e] px-5"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

          </div>

          {/* RIGHT COLUMN: REAL-TIME DYNAMIC EVALUATION GAUGES */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* REAL-TIME RADIAL SCORES */}
            <Card variant="dark-elevated" className="p-6 border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#cc785c]" />
                  <h3 className="font-display text-xl text-white">Live Performance Meters</h3>
                </div>
                <Badge variant="teal" size="sm">Claude 3.5 Dynamic Eval</Badge>
              </div>

              {/* 3 Metric Gauges */}
              <div className="space-y-4">
                
                {/* 1. Confidence Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#a09d96]">Delivery Confidence</span>
                    <span className="text-[#5db872] font-bold">{scores.confidence}% High</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#5db872] rounded-full"
                      animate={{ width: `${scores.confidence}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* 2. Technical Accuracy */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#a09d96]">Technical Accuracy &amp; Depth</span>
                    <span className="text-[#cc785c] font-bold">{scores.accuracy}% Verified</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#cc785c] rounded-full"
                      animate={{ width: `${scores.accuracy}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* 3. STAR Structure */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#a09d96]">STAR Structure (Situation/Task/Action/Result)</span>
                    <span className="text-[#5db8a6] font-bold">{scores.starScore}% Structured</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#5db8a6] rounded-full"
                      animate={{ width: `${scores.starScore}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

              </div>

              {/* Overall Composite Score */}
              <div className="p-4 rounded-lg bg-[#181715] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#6c6a64] block">Composite Drill Score</span>
                  <span className="text-2xl font-bold font-sans text-[#faf9f5]">{scores.overall}/100</span>
                </div>
                <Badge variant="coral" size="sm">Top 8% Candidate</Badge>
              </div>
            </Card>

            {/* STAR TECHNIQUE FRAMEWORK REMINDER */}
            <Card variant="dark-elevated" className="p-6 border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Sparkles className="w-4 h-4 text-[#cc785c]" />
                <h4 className="font-display text-lg text-white">How Alex Evaluates Your Answers</h4>
              </div>

              <ul className="space-y-2.5 text-xs font-sans text-[#a09d96]">
                <li className="flex items-start gap-2">
                  <strong className="text-[#cc785c] font-mono">S · Situation:</strong>
                  <span>State the system context from your actual project.</span>
                </li>
                <li className="flex items-start gap-2">
                  <strong className="text-[#cc785c] font-mono">T · Task:</strong>
                  <span>State the exact bottleneck, bug, or feature goal you owned.</span>
                </li>
                <li className="flex items-start gap-2">
                  <strong className="text-[#cc785c] font-mono">A · Action:</strong>
                  <span>Explain the code, libraries, architecture, and trade-offs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <strong className="text-[#5db872] font-mono">R · Result:</strong>
                  <span>Quantify the impact with numbers (e.g. 42% latency reduction).</span>
                </li>
              </ul>
            </Card>

          </div>

        </div>

      </div>

      {/* FINAL SCORECARD MODAL */}
      <AnimatePresence>
        {showScorecard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181715]/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-[#252320] border border-white/15 rounded-2xl p-8 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-[#cc785c]/20 border border-[#cc785c] text-[#cc785c] flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-8 h-8" />
                </div>
                <h2 className="font-display text-3xl text-[#faf9f5]">Mock Drill Scorecard</h2>
                <p className="text-xs font-mono text-[#a09d96]">{selectedTrack} • {selectedCompany} Simulation ({displayName})</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-[#181715] rounded-xl border border-white/10">
                  <span className="text-2xl font-bold font-sans text-[#5db872]">{scores.confidence}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#6c6a64] block mt-0.5">Confidence</span>
                </div>
                <div className="p-3.5 bg-[#181715] rounded-xl border border-white/10">
                  <span className="text-2xl font-bold font-sans text-[#cc785c]">{scores.accuracy}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#6c6a64] block mt-0.5">Accuracy</span>
                </div>
                <div className="p-3.5 bg-[#181715] rounded-xl border border-white/10">
                  <span className="text-2xl font-bold font-sans text-[#5db8a6]">{scores.starScore}%</span>
                  <span className="text-[10px] uppercase font-mono text-[#6c6a64] block mt-0.5">STAR Format</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#181715] border border-white/10 space-y-2 text-xs">
                <h4 className="font-bold text-[#faf9f5] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#cc785c]" />
                  <span>Actionable Drill Feedback</span>
                </h4>
                <p className="text-[#a09d96] leading-relaxed">
                  1. Practice leading with measurable outcomes before detailing implementation.<br />
                  2. Review distributed caching patterns and Redis pipelining for your next technical round.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" size="md" onClick={handleRestart} className="flex-1 font-mono text-xs uppercase">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Start New Drill
                </Button>
                <Button variant="primary" size="md" onClick={() => setShowScorecard(false)} className="flex-1 bg-[#cc785c] hover:bg-[#a9583e] font-mono text-xs uppercase">
                  Back to Studio
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
