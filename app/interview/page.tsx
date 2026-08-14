'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoCard } from '@/components/ui/video-card';
import { useCareer } from '@/lib/career-store';

export default function MockInterviewPage() {
  const {
    interviewMessages,
    addInterviewMessage,
    activeInterviewRole,
    activeInterviewCompany,
    profile,
  } = useCareer();

  const [inputAnswer, setInputAnswer] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);

  const handleSend = () => {
    if (!inputAnswer.trim()) return;
    addInterviewMessage(inputAnswer.trim(), 'user');
    setInputAnswer('');
  };

  const handleQuickAnswer = (sampleText: string) => {
    addInterviewMessage(sampleText, 'user');
  };

  const latestFeedback = interviewMessages.slice().reverse().find((m) => m.sender === 'user')?.feedback || {
    confidence: 89,
    accuracy: 92,
    structureTip: 'STAR technique executed cleanly! Clear Situation & Action stated.',
  };

  return (
    <div className="bg-[#181715] min-h-screen text-[#faf9f5] pt-28 pb-16 px-4 sm:px-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* INTERVIEW STUDIO TOP HEADER */}
        <div className="bg-[#252320] border border-white/10 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#cc785c] text-white flex items-center justify-center font-bold">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5db872] animate-pulse" />
                <h1 className="font-display text-xl sm:text-2xl text-white">
                  Mock Interview Studio: {activeInterviewRole}
                </h1>
                <Badge variant="coral" size="sm">
                  {activeInterviewCompany}
                </Badge>
              </div>
              <p className="text-xs text-[#a09d96]">
                Target Candidate: <strong className="text-white">{profile.name}</strong> • Mode: Technical STAR & Performance Profiling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
            <div className="flex items-center gap-2 text-xs font-mono text-[#a09d96] bg-[#181715] px-3 py-1.5 rounded border border-white/10">
              <Clock className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>12:45 Elapsed</span>
            </div>

            <Button variant="secondary-dark" size="sm">
              End Session & Export PDF
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
                <span>Audio Synthesis Engine: Active (Alex - AI Lead)</span>
              </div>
              <span className="text-xs text-[#5db872] font-mono">Live Stream 60FPS</span>
            </div>

            {/* Chat Transcript Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
              {interviewMessages.map((msg) => (
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
                    <div className="flex items-center justify-between text-[11px] opacity-80 pb-1 border-b border-white/10 font-mono">
                      <span>{msg.sender === 'user' ? `${profile.name} (Candidate)` : 'Alex (AI Lead Interviewer)'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="font-sans">{msg.text}</p>
                  </div>

                  {/* Immediate Feedback Badge under candidate messages */}
                  {msg.sender === 'user' && msg.feedback && (
                    <div className="mt-1 text-[11px] text-[#5db872] bg-[#181715] px-2.5 py-1 rounded border border-[#5db872]/30 flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>STAR Confidence: {msg.feedback.confidence}% | Accuracy: {msg.feedback.accuracy}%</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Quick Answer Suggestion Shortcuts for Demo */}
            <div className="bg-[#181715] p-3 border-t border-white/10 space-y-1.5">
              <span className="text-[11px] text-[#a09d96] uppercase font-mono block">Quick Technical Response Templates:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickAnswer("I used Next.js 14 Server Components to reduce client JS bundle size by 40% and implemented optimistic UI updates for instant interaction feedback.")}
                  className="text-[11px] px-2.5 py-1 rounded bg-[#252320] border border-white/10 hover:border-[#cc785c] text-[#a09d96] hover:text-white transition-colors"
                >
                  + Next.js 14 Server Components
                </button>
                <button
                  onClick={() => handleQuickAnswer("For state synchronization, I leveraged React 18 useTransition with URL state parameters to maintain layout stability during heavy filtering.")}
                  className="text-[11px] px-2.5 py-1 rounded bg-[#252320] border border-white/10 hover:border-[#cc785c] text-[#a09d96] hover:text-white transition-colors"
                >
                  + React 18 Concurrency & URL State
                </button>
              </div>
            </div>

            {/* Input Bar & Mic Toggle */}
            <div className="p-4 bg-[#1f1e1b] border-t border-white/10 flex items-center gap-3">
              <button
                onClick={() => setIsMicActive(!isMicActive)}
                className={`p-2.5 rounded-lg border transition-colors ${
                  isMicActive
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : 'bg-[#252320] text-[#a09d96] border-white/10 hover:text-white'
                }`}
              >
                {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <input
                type="text"
                placeholder={isMicActive ? 'Listening to voice response...' : 'Type your answer or select a template...'}
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-[#181715] text-white px-4 py-2.5 rounded-lg border border-white/10 text-xs sm:text-sm focus:outline-none focus:border-[#cc785c] font-sans"
              />

              <Button
                variant="primary"
                size="md"
                onClick={handleSend}
              >
                Send
              </Button>
            </div>

          </div>

          {/* RIGHT COLUMN: VIDEO ASSET 2 & REAL-TIME METERS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* VIDEO ASSET 2 FRAME: mock-interview-session.mp4 */}
            <VideoCard
              src="/videos/mock-interview-session.mp4"
              title="Live AI Interviewer View"
              subtitle={`Simulating ${activeInterviewCompany} Interviewer Alex`}
              variant="dark"
              showMeters={false}
            />

            <Card variant="dark-elevated" className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <Badge variant="coral" size="sm" className="mb-1">Real-Time Evaluation</Badge>
                  <h3 className="font-display text-xl text-white">Live Candidate Metrics</h3>
                </div>
                <Zap className="w-5 h-5 text-[#cc785c]" />
              </div>

              {/* Meter 1: Confidence Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#a09d96] uppercase font-mono">Confidence Meter</span>
                  <span className="text-[#5db872] font-bold">{latestFeedback.confidence}% — Articulate</span>
                </div>
                <div className="w-full bg-[#181715] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="bg-[#5db872] h-full rounded-full"
                    animate={{ width: `${latestFeedback.confidence}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Meter 2: Technical Accuracy */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#a09d96] uppercase font-mono">Technical Accuracy</span>
                  <span className="text-[#5db8a6] font-bold">{latestFeedback.accuracy}% — High Depth</span>
                </div>
                <div className="w-full bg-[#181715] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="bg-[#5db8a6] h-full rounded-full"
                    animate={{ width: `${latestFeedback.accuracy}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Meter 3: Answer Structure (STAR Framework Breakdown) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <span className="text-xs text-[#a09d96] uppercase font-mono block">STAR Framework Coverage</span>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-[#181715] p-2.5 rounded border border-white/5 space-y-1">
                    <span className="text-[#a09d96] block text-[10px]">SITUATION</span>
                    <span className="text-[#5db872] font-bold">100%</span>
                  </div>
                  <div className="bg-[#181715] p-2.5 rounded border border-white/5 space-y-1">
                    <span className="text-[#a09d96] block text-[10px]">TASK</span>
                    <span className="text-[#5db872] font-bold">100%</span>
                  </div>
                  <div className="bg-[#181715] p-2.5 rounded border border-white/5 space-y-1">
                    <span className="text-[#a09d96] block text-[10px]">ACTION</span>
                    <span className="text-[#e8a55a] font-bold">85%</span>
                  </div>
                  <div className="bg-[#181715] p-2.5 rounded border border-white/5 space-y-1">
                    <span className="text-[#a09d96] block text-[10px]">RESULT</span>
                    <span className="text-[#5db872] font-bold">90%</span>
                  </div>
                </div>
              </div>

              {/* Live Coaching Tip Box */}
              <div className="bg-[#181715] p-4 rounded-lg border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#cc785c]">
                  <Sparkles className="w-4 h-4" />
                  <span>Real-Time AI Coaching Tip</span>
                </div>
                <p className="text-xs text-[#a09d96] leading-relaxed">
                  {latestFeedback.structureTip || "Great callout on Server Components! Mention caching strategy and fallback states in your next response."}
                </p>
              </div>

            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
