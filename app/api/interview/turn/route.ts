import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { claudeSonnetModel } from '@/lib/ai/openrouter';
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

    const systemPrompt = `You are a Senior Technical Hiring Manager conducting a live technical/behavioral interview.
Candidate Name: ${candidateName}
Target Job Description:
${targetJobDescription || 'Software Development Engineer'}

Candidate's Real Resume Details:
${candidateResume}

Directives:
1. Reference specific projects and skills from the candidate's actual resume.
2. Probe how their actual experience matches the target JD.
3. If the candidate answered a previous question, provide 1-2 sentences of feedback.
4. Score their answer across Confidence (0-100), Technical Accuracy (0-100), and STAR Structure (0-100).
5. Ask exactly ONE clear follow-up or technical challenge question per turn.`;

    const result = await generateObject({
      model: claudeSonnetModel,
      schema: TurnSchema,
      maxOutputTokens: 2048,
      system: systemPrompt,
      prompt: `Conversation History:\n${JSON.stringify(conversationHistory)}\n\nLatest Candidate Answer:\n${userResponse || 'Candidate started the interview session.'}`,
    });

    const overallScore = Math.round(
      (result.object.scores.confidenceScore + result.object.scores.technicalAccuracy + result.object.scores.structureScore) / 3
    );

    if (isFinal) {
      try {
        await supabase.from('interview_sessions').insert({
          user_id: user.id,
          role: role || 'Target Role',
          company: company || 'Linear',
          transcript: conversationHistory,
          overall_score: overallScore,
          technical_score: result.object.scores.technicalAccuracy,
          star_score: result.object.scores.structureScore,
          confidence_score: result.object.scores.confidenceScore,
          feedback_summary: {
            feedback: result.object.feedbackOnPreviousAnswer,
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
      ...result.object,
      message: {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        role: 'assistant',
        text: `${result.object.feedbackOnPreviousAnswer}\n\n${result.object.nextQuestion}`,
        feedback: {
          confidence: result.object.scores.confidenceScore,
          accuracy: result.object.scores.technicalAccuracy,
          starScore: result.object.scores.structureScore,
          structureTip: `STAR Evaluation: Confidence ${result.object.scores.confidenceScore}%, Technical Depth ${result.object.scores.technicalAccuracy}%, STAR Structure ${result.object.scores.structureScore}%`,
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      scores: {
        ...result.object.scores,
        overall: overallScore,
      },
    });
  } catch (error: any) {
    console.error('OpenRouter Interview Turn Error:', error);
    return NextResponse.json({ error: error.message || 'Interview turn failed' }, { status: 500 });
  }
}
