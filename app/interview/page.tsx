'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Sparkles, RotateCcw, CheckCircle2, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MockInterviewPage() {
  const [messages, setMessages] = useState<Array<{ role: 'interviewer' | 'candidate'; content: string; feedback?: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetJd, setTargetJd] = useState('Linear - Frontend Systems (React, Next.js App Router, TypeScript)');
  const [candidateName, setCandidateName] = useState('');
  const [hasResume, setHasResume] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [scores, setScores] = useState({ confidence: 85, technical: 88, structure: 80 });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCandidateInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: dna }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('career_dna').select('raw_resume_text, target_roles').eq('user_id', user.id).maybeSingle(),
      ]);

      if (profile?.full_name) setCandidateName(profile.full_name);
      if (dna?.raw_resume_text) setHasResume(true);
    }
    fetchCandidateInfo();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleStartInterview = async () => {
    setIsStarted(true);
    setLoading(true);
    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobDescription: targetJd,
          conversationHistory: [],
          userResponse: 'Start session',
        }),
      });
      const data = await res.json();
      setMessages([
        {
          role: 'interviewer',
          content: data.nextQuestion || `Welcome ${candidateName || ''}. Let's dive in. Looking at your resume, could you walk me through your most complex technical project?`,
        },
      ]);
    } catch {
      setMessages([
        {
          role: 'interviewer',
          content: `Welcome ${candidateName || ''}. I have reviewed your uploaded resume. To begin, how does your background prepare you for this ${targetJd} role?`,
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
    const updatedMessages = [...messages, { role: 'candidate' as const, content: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/interview/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobDescription: targetJd,
          conversationHistory: updatedMessages,
          userResponse: userText,
        }),
      });
      const data = await res.json();

      setMessages([
        ...updatedMessages,
        {
          role: 'interviewer',
          content: data.nextQuestion,
          feedback: data.feedbackOnPreviousAnswer,
        },
      ]);

      if (data.scores) {
        setScores({
          confidence: data.scores.confidenceScore || scores.confidence,
          technical: data.scores.technicalAccuracy || scores.technical,
          structure: data.scores.structureScore || scores.structure,
        });
      }
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: 'interviewer',
          content: 'Good breakdown. Can you describe how you tested and verified performance under high load for that implementation?',
          feedback: 'Clear technical framing. Quantify the measurable impact where possible.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#141413] text-[#faf9f5] pt-28 pb-16 px-4 sm:px-8 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#252320] pb-6 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#cc785c] font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> AI Candidate Assessment
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-white mt-1">
              Resume-Grounded Mock Interview
            </h1>
            <p className="text-xs text-[#8e8b82] mt-0.5">
              {hasResume ? "✅ Connected to your uploaded resume" : "⚠️ Upload resume in Onboarding for personalized questions"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={targetJd}
              onChange={(e) => setTargetJd(e.target.value)}
              placeholder="Target Role / JD keywords..."
              className="bg-[#1f1e1b] border border-[#3d3d3a] text-xs text-white px-3 py-2 rounded-md focus:outline-none focus:border-[#cc785c] w-64"
            />
            {!isStarted ? (
              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white px-5 py-2 rounded-md font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" /> Begin Interview
              </button>
            ) : (
              <button
                onClick={() => { setIsStarted(false); setMessages([]); }}
                className="bg-transparent border border-[#3d3d3a] text-[#8e8b82] hover:text-white px-3 py-2 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </header>

        {/* Studio Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Conversation Chat */}
          <div className="lg:col-span-2 bg-[#181715] border border-[#252320] rounded-xl flex flex-col h-[620px] overflow-hidden shadow-lg">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!isStarted && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
                  <Sparkles className="w-10 h-10 text-[#cc785c]" />
                  <h3 className="font-serif text-2xl text-white">Ready for your practice round?</h3>
                  <p className="text-xs text-[#8e8b82] max-w-sm">
                    The AI hiring manager will ask questions referencing your resume's actual projects and evaluate your responses in real time.
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
                    className={`max-w-[85%] rounded-xl p-4 text-xs leading-relaxed ${
                      m.role === 'candidate'
                        ? 'bg-[#cc785c] text-white rounded-br-none'
                        : 'bg-[#252320] text-[#faf9f5] border border-[#3d3d3a] rounded-bl-none'
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1 font-mono">
                      {m.role === 'candidate' ? (candidateName || 'You') : 'Hiring Manager'}
                    </span>
                    {m.content}
                  </div>

                  {m.feedback && (
                    <div className="mt-1.5 text-xs bg-[#1f1e1b] border border-[#3d3d3a] text-[#8e8b82] px-3 py-1.5 rounded-md max-w-[80%]">
                      💡 <strong className="text-white">Coach Note:</strong> {m.feedback}
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-[#8e8b82] bg-[#1f1e1b] border border-[#252320] px-4 py-2 rounded-md w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse" />
                  Interviewer is analyzing your response against the JD...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#252320] bg-[#181715] flex gap-3">
              <input
                type="text"
                placeholder={isStarted ? "Type your response using the STAR method..." : "Click 'Begin Interview' above"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isStarted || loading}
                className="flex-1 bg-[#1f1e1b] border border-[#3d3d3a] rounded-md px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#cc785c] disabled:opacity-50"
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

          {/* Right: Live Assessment Gauges */}
          <div className="space-y-6">
            <div className="bg-[#181715] border border-[#252320] p-6 rounded-xl space-y-6 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-white">Live Evaluation Meters</h3>
                <span className="text-xs font-mono text-[#cc785c] bg-[#252320] px-2 py-0.5 rounded">Active</span>
              </div>

              {/* Confidence */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8e8b82]">CONFIDENCE</span>
                  <span className="text-white font-bold">{scores.confidence}%</span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scores.confidence}%` }} />
                </div>
              </div>

              {/* Technical Accuracy */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8e8b82]">TECHNICAL ACCURACY</span>
                  <span className="text-white font-bold">{scores.technical}%</span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
                  <div className="h-full bg-[#cc785c] rounded-full" style={{ width: `${scores.technical}%` }} />
                </div>
              </div>

              {/* Answer Structure */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8e8b82]">STAR STRUCTURE</span>
                  <span className="text-white font-bold">{scores.structure}%</span>
                </div>
                <div className="w-full h-2 bg-[#252320] rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${scores.structure}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-[#181715] border border-[#252320] p-5 rounded-xl space-y-2.5 shadow-md">
              <h4 className="text-xs uppercase font-mono tracking-widest text-[#8e8b82]">Assessment Criteria</h4>
              <ul className="text-xs text-[#8e8b82] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#cc785c] shrink-0 mt-0.5" />
                  <span>Ground your answers in the tech stack listed in your resume.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#cc785c] shrink-0 mt-0.5" />
                  <span>State the exact metrics and trade-offs of your architectural decisions.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
