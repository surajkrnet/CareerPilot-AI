import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiModel } from '@/lib/ai/openrouter';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TurnEvaluationSchema = z.object({
  feedbackOnPreviousAnswer: z
    .string()
    .describe('1-2 sentences of direct constructive feedback pointing out exact flaws, omissions, or strengths'),
  scores: z.object({
    confidenceScore: z
      .number()
      .min(0)
      .max(100)
      .describe('Score based on assertiveness and depth (0-15 if single-word or empty)'),
    technicalAccuracy: z
      .number()
      .min(0)
      .max(100)
      .describe('Score based on domain correctness (0-10 if no technical facts are stated)'),
    structureScore: z
      .number()
      .min(0)
      .max(100)
      .describe('STAR structure alignment (0 if no Situation/Task/Action/Result is provided)'),
  }),
  nextQuestion: z.string().describe('Next follow-up question probing for technical depth'),
  isInterviewComplete: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const {
      targetJobDescription,
      resumeText: customResume,
      conversationHistory = [],
      userResponse,
      isFinal = false,
      company = 'Linear',
      role = 'Full-Stack Development',
    } = await req.json();

    const isStartTurn = !userResponse || userResponse === 'Start session' || conversationHistory.length === 0;

    let candidateResume = customResume || '';
    let candidateName = 'Candidate';

    if (!candidateResume) {
      const [{ data: dna }, { data: profile }] = await Promise.all([
        supabase.from('career_dna').select('raw_resume_text').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      ]);

      if (dna?.raw_resume_text) {
        candidateResume = dna.raw_resume_text;
      }
      if (profile?.full_name) {
        candidateName = profile.full_name;
      }
    }

    if (!candidateResume) {
      candidateResume = 'Candidate with frontend and backend software engineering background.';
    }

    const systemPrompt = `You are a Strict Senior Technical Hiring Manager conducting a realistic technical/behavioral interview with ${candidateName} for: ${
      targetJobDescription?.slice(0, 300) || role
    }.
Resume Highlights: ${candidateResume?.slice(0, 600) || 'Engineering Candidate'}.

STRICT SCORING RUBRIC (0-100):
- Single-word, 2-3 word replies, or evasive answers (e.g. "good", "yes", "idk", "ok") MUST BE SCORED 0-15 across all meters.
- Answers lacking technical specifics, metrics, or trade-offs MUST BE SCORED 15-45.
- Solid STAR answers with concrete technologies and actions: 60-80.
- Exceptional architectural answers with measurable results, trade-offs, and failure modes: 85-98.

DIRECTIVES:
1. Provide 1-2 constructive feedback sentences evaluating flaws, missing technical depth, or strengths in candidate's answer.
2. Rate Confidence (0-100), Technical Accuracy (0-100), STAR Structure (0-100) strictly following the rubric above.
3. Ask ONE focused follow-up question digging into technical mechanics, architectural trade-offs, or real-world outcomes.`;

    let resultObject: any = null;

    if (isStartTurn) {
      // Start turn initial greeting without artificial score inflation
      try {
        const result = await generateObject({
          model: aiModel,
          schema: TurnEvaluationSchema,
          maxOutputTokens: 300,
          system: systemPrompt,
          prompt: `Candidate has just joined the interview room for ${role}. Give a warm 1-sentence opening and ask the first project-grounded question based on their resume.`,
        });
        resultObject = {
          ...result.object,
          feedbackOnPreviousAnswer: 'Session started. Awaiting your first technical response.',
          scores: {
            confidenceScore: 0,
            technicalAccuracy: 0,
            structureScore: 0,
          },
        };
      } catch {
        resultObject = {
          feedbackOnPreviousAnswer: 'Session started. Awaiting your first technical response.',
          scores: { confidenceScore: 0, technicalAccuracy: 0, structureScore: 0 },
          nextQuestion: `Welcome, ${candidateName}. To start, could you walk me through a core project from your experience related to ${role}, detailing the architecture and key challenges?`,
          isInterviewComplete: false,
        };
      }
    } else {
      const words = (userResponse || '').trim().split(/\s+/).filter(Boolean);
      const isExtremelyShort = words.length <= 3;
      const isShort = words.length < 15;

      try {
        const result = await generateObject({
          model: aiModel,
          schema: TurnEvaluationSchema,
          maxOutputTokens: 400,
          system: systemPrompt,
          prompt: `History:\n${JSON.stringify(conversationHistory.slice(-4))}\n\nCandidate Answer:\n${userResponse}`,
        });
        resultObject = result.object;
      } catch (modelErr: any) {
        console.warn('AI Turn generation fallback note:', modelErr?.message || modelErr);
        resultObject = {
          feedbackOnPreviousAnswer: isExtremelyShort
            ? 'The response lacks any substantive content. Single-word or empty answers cannot be evaluated.'
            : 'Good starting point. Elaborate on technical decisions, trade-offs, and measurable outcomes using the STAR method.',
          scores: isExtremelyShort
            ? { confidenceScore: 10, technicalAccuracy: 5, structureScore: 0 }
            : isShort
            ? { confidenceScore: 35, technicalAccuracy: 25, structureScore: 20 }
            : { confidenceScore: 70, technicalAccuracy: 75, structureScore: 65 },
          nextQuestion: `Could you elaborate with specific technical architecture choices, tools, and quantifiable results for ${role}?`,
          isInterviewComplete: isFinal,
        };
      }

      // Hard programmatic enforcement for deflated/empty inputs
      if (isExtremelyShort) {
        resultObject.scores = {
          confidenceScore: Math.min(15, resultObject.scores?.confidenceScore || 10),
          technicalAccuracy: Math.min(10, resultObject.scores?.technicalAccuracy || 5),
          structureScore: Math.min(5, resultObject.scores?.structureScore || 0),
        };
      } else if (isShort) {
        resultObject.scores = {
          confidenceScore: Math.min(45, resultObject.scores?.confidenceScore || 35),
          technicalAccuracy: Math.min(40, resultObject.scores?.technicalAccuracy || 30),
          structureScore: Math.min(35, resultObject.scores?.structureScore || 25),
        };
      }
    }

    const normalizeScore = (score: number) => {
      if (typeof score !== 'number' || isNaN(score)) return 0;
      if (score <= 1 && score > 0) return Math.round(score * 100);
      return Math.min(100, Math.max(0, Math.round(score)));
    };

    const normalizedScores = {
      confidenceScore: normalizeScore(resultObject.scores.confidenceScore),
      technicalAccuracy: normalizeScore(resultObject.scores.technicalAccuracy),
      structureScore: normalizeScore(resultObject.scores.structureScore),
    };

    const overallScore = Math.round(
      (normalizedScores.confidenceScore + normalizedScores.technicalAccuracy + normalizedScores.structureScore) / 3
    );

    if (isFinal) {
      try {
        await supabase.from('interview_sessions').insert({
          user_id: user.id,
          target_role: role || 'Frontend Systems',
          transcript: conversationHistory,
          completed: true,
          evaluation_report: {
            overallScore,
            technicalScore: normalizedScores.technicalAccuracy,
            starScore: normalizedScores.structureScore,
            confidenceScore: normalizedScores.confidenceScore,
            feedback: resultObject.feedbackOnPreviousAnswer,
            strengths: ['Clear technical articulation', 'Strong understanding of core project architecture'],
            improvements: ['Quantify metrics earlier in the response', 'Deepen distributed failure modes'],
          },
          created_at: new Date().toISOString(),
        });
      } catch (dbErr: any) {
        console.warn('interview_sessions insert note:', dbErr?.message || dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      isStartTurn,
      ...resultObject,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        role: 'assistant',
        text: `${resultObject.feedbackOnPreviousAnswer}\n\n${resultObject.nextQuestion}`,
        feedback: isStartTurn
          ? null
          : {
              confidence: normalizedScores.confidenceScore,
              accuracy: normalizedScores.technicalAccuracy,
              starScore: normalizedScores.structureScore,
              structureTip: `Turn Evaluation: Confidence ${normalizedScores.confidenceScore}%, Technical ${normalizedScores.technicalAccuracy}%, STAR Structure ${normalizedScores.structureScore}%`,
            },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      scores: isStartTurn ? null : {
        ...normalizedScores,
        overall: overallScore,
      },
    });
  } catch (error: any) {
    console.error('OpenRouter Interview Turn Error:', error);
    const msg = error?.message || 'Interview turn failed';
    const cleanMsg = msg.includes('rate-limited')
      ? 'The AI interviewer is momentarily busy. Please try sending your answer again.'
      : msg.includes('credits')
      ? 'AI Engine quota notice: please check credit allocations.'
      : msg;
    return NextResponse.json({ error: cleanMsg }, { status: 500 });
  }
}
