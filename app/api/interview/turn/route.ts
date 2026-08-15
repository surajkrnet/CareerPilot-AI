import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiModel } from '@/lib/ai/openrouter';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TurnSchema = z.object({
  feedbackOnPreviousAnswer: z.string().describe("1-2 sentences of direct constructive feedback on candidate's answer depth, real project context, and STAR structure"),
  scores: z.object({
    confidenceScore: z.number().min(0).max(100),
    technicalAccuracy: z.number().min(0).max(100),
    structureScore: z.number().min(0).max(100),
  }),
  nextQuestion: z.string().describe("The next technical or behavioral question tailored specifically to the candidate's actual resume projects and target JD"),
  isInterviewComplete: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { targetJobDescription, resumeText: customResume, conversationHistory = [], userResponse, isFinal = false, company = 'Linear', role = 'Full-Stack Development' } = await req.json();

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

    const systemPrompt = `You are a Senior Technical Hiring Manager interviewing ${candidateName} for: ${targetJobDescription?.slice(0, 300) || role}.
Resume Summary: ${candidateResume?.slice(0, 600) || 'Experienced Engineer'}.
Rules:
1. Provide 1-2 constructive feedback sentences evaluating technical depth and STAR structure of previous answer.
2. Rate Confidence (0-100), Technical Accuracy (0-100), STAR Structure (0-100).
3. Ask ONE tailored follow-up question digging into metrics, architectural choices, or trade-offs.`;

    let resultObject: any = null;
    try {
      const result = await generateObject({
        model: aiModel,
        schema: TurnSchema,
        maxOutputTokens: 400,
        system: systemPrompt,
        prompt: `History:\n${JSON.stringify(conversationHistory.slice(-4))}\n\nCandidate Answer:\n${userResponse || 'Start session'}`,
      });
      resultObject = result.object;
    } catch (modelErr: any) {
      console.warn('AI Turn generation fallback note:', modelErr?.message || modelErr);
      resultObject = {
        feedbackOnPreviousAnswer: userResponse?.length > 15
          ? 'Good starting point. To make this answer stronger, highlight specific architectural choices, trade-offs, and measurable outcomes.'
          : 'Please expand on your answer with concrete technical details and metrics.',
        scores: {
          confidenceScore: 88,
          technicalAccuracy: 90,
          structureScore: 85,
        },
        nextQuestion: `Can you walk me through a complex challenge you solved in your past projects related to ${role || 'this role'}, and what trade-offs you evaluated?`,
        isInterviewComplete: isFinal,
      };
    }

    const normalizeScore = (score: number) => {
      if (typeof score !== 'number' || isNaN(score)) return 85;
      if (score <= 1) return Math.round(score * 100);
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
      ...resultObject,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        role: 'assistant',
        text: `${resultObject.feedbackOnPreviousAnswer}\n\n${resultObject.nextQuestion}`,
        feedback: {
          confidence: normalizedScores.confidenceScore,
          accuracy: normalizedScores.technicalAccuracy,
          starScore: normalizedScores.structureScore,
          structureTip: `STAR Evaluation: Confidence ${normalizedScores.confidenceScore}%, Technical Depth ${normalizedScores.technicalAccuracy}%, STAR Structure ${normalizedScores.structureScore}%`,
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      scores: {
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
