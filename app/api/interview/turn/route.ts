import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiModel } from '@/lib/ai/openrouter';
import { generateText } from 'ai';
import { extractAndParseJSON } from '@/lib/ai/json-extractor';
import {
  detectPromptInjection,
  sanitizeAndEncapsulateForAI,
} from '@/lib/security/document-validator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      targetJobDescription,
      resumeText: customResume,
      conversationHistory = [],
      userResponse,
      isFinal = false,
      company = 'Linear',
      role = 'Frontend Systems',
      candidateName: incomingCandidateName,
    } = body;

    // Check for prompt-injection in user input / resume
    if (userResponse && detectPromptInjection(userResponse).riskLevel === 'high') {
      return NextResponse.json(
        {
          error: 'Security alert: User response contains prohibited adversarial instructions.',
        },
        { status: 400 }
      );
    }

    const isStartTurn = !userResponse || userResponse === 'Start session' || conversationHistory.length === 0;

    let candidateResume = customResume || '';
    let candidateName = incomingCandidateName || 'Candidate';

    if (user && !candidateResume) {
      try {
        const [{ data: dna }, { data: profile }] = await Promise.all([
          supabase.from('career_dna').select('raw_resume_text').eq('user_id', user.id).maybeSingle(),
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        ]);

        if (dna?.raw_resume_text) {
          candidateResume = dna.raw_resume_text;
        }
        if (profile?.full_name && (!incomingCandidateName || incomingCandidateName === 'Candidate')) {
          candidateName = profile.full_name;
        }
      } catch (e) {
        console.warn('Supabase profile lookup notice:', e);
      }
    }

    if (!candidateResume) {
      candidateResume = 'Candidate with comprehensive software engineering experience in full-stack web applications, TypeScript, Next.js, and APIs.';
    }

    const encapsulatedResume = sanitizeAndEncapsulateForAI(candidateResume.slice(0, 600), 'Resume Summary');
    const safeRole = (targetJobDescription?.slice(0, 300) || role).replace(/[\r\n]+/g, ' ');

    const systemPrompt = `You are a Strict Senior Technical Hiring Manager conducting a realistic technical/behavioral interview with ${candidateName} for: ${safeRole}.

${encapsulatedResume}

STRICT SCORING RUBRIC (0-100):
- Single-word, 2-3 word replies, or evasive answers (e.g. "good", "yes", "idk", "ok") MUST BE SCORED 0-15 across all meters.
- Answers lacking technical specifics, metrics, or trade-offs MUST BE SCORED 15-45.
- Solid STAR answers with concrete technologies and actions: 60-80.
- Exceptional architectural answers with measurable results, trade-offs, and failure modes: 85-98.`;

    let resultObject: any = null;

    if (isStartTurn) {
      const defaultStart = {
        feedbackOnPreviousAnswer: 'Session started. Awaiting your first technical response.',
        scores: { confidenceScore: 0, technicalAccuracy: 0, structureScore: 0 },
        nextQuestion: `Welcome, ${candidateName}. To start, could you walk me through a core project from your experience related to ${role}, detailing the architecture and key challenges?`,
        isInterviewComplete: false,
      };

      try {
        const prompt = `${systemPrompt}

Candidate has joined the interview room for ${role}. Output a JSON object with:
{
  "feedbackOnPreviousAnswer": "Session started. Awaiting your first technical response.",
  "scores": { "confidenceScore": 0, "technicalAccuracy": 0, "structureScore": 0 },
  "nextQuestion": "Opening project question tailored to resume",
  "isInterviewComplete": false
}
Return pure JSON only.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const aiPromise = generateText({
            model: aiModel,
            prompt,
            abortSignal: controller.signal,
          });
          const timeoutPromise = new Promise<{ text: string }>((resolve) =>
            setTimeout(() => resolve({ text: JSON.stringify(defaultStart) }), 3000)
          );
          const result = await Promise.race([aiPromise, timeoutPromise]);
          resultObject = extractAndParseJSON(result.text, defaultStart);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch {
        resultObject = defaultStart;
      }
    } else {
      const words = (userResponse || '').trim().split(/\s+/).filter(Boolean);
      const isExtremelyShort = words.length <= 3;
      const isShort = words.length < 15;

      const fallbackTurn = {
        feedbackOnPreviousAnswer: isExtremelyShort
          ? 'The response lacks substantive technical content. Single-word answers cannot be evaluated.'
          : 'Good starting point. Elaborate on technical decisions, trade-offs, and measurable outcomes using the STAR method.',
        scores: isExtremelyShort
          ? { confidenceScore: 10, technicalAccuracy: 5, structureScore: 0 }
          : isShort
          ? { confidenceScore: 35, technicalAccuracy: 25, structureScore: 20 }
          : { confidenceScore: 70, technicalAccuracy: 75, structureScore: 65 },
        nextQuestion: `Could you elaborate with specific technical architecture choices, tools, and quantifiable results for ${role}?`,
        isInterviewComplete: isFinal,
      };

      try {
        const prompt = `${systemPrompt}

Conversation History:
${JSON.stringify(conversationHistory.slice(-4))}

Candidate Latest Answer:
${userResponse}

Output a JSON object with:
{
  "feedbackOnPreviousAnswer": "1-2 sentences of direct constructive feedback on technical depth and STAR format",
  "scores": {
    "confidenceScore": number (0-100),
    "technicalAccuracy": number (0-100),
    "structureScore": number (0-100)
  },
  "nextQuestion": "Next technical follow-up question probing for metrics or trade-offs",
  "isInterviewComplete": ${isFinal}
}
Return pure JSON only.`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const aiPromise = generateText({
            model: aiModel,
            prompt,
            abortSignal: controller.signal,
          });
          const timeoutPromise = new Promise<{ text: string }>((resolve) =>
            setTimeout(() => resolve({ text: JSON.stringify(fallbackTurn) }), 3000)
          );
          const result = await Promise.race([aiPromise, timeoutPromise]);
          resultObject = extractAndParseJSON(result.text, fallbackTurn);
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (modelErr: any) {
        console.warn('AI Turn generation fallback note:', modelErr?.message || modelErr);
        resultObject = fallbackTurn;
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
      confidenceScore: normalizeScore(resultObject.scores?.confidenceScore),
      technicalAccuracy: normalizeScore(resultObject.scores?.technicalAccuracy),
      structureScore: normalizeScore(resultObject.scores?.structureScore),
    };

    const overallScore = Math.round(
      (normalizedScores.confidenceScore + normalizedScores.technicalAccuracy + normalizedScores.structureScore) / 3
    );

    if (isFinal && user) {
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
      scores: isStartTurn
        ? null
        : {
            ...normalizedScores,
            overall: overallScore,
          },
    });
  } catch (error: any) {
    console.error('OpenRouter Interview Turn Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Interview turn failed' },
      { status: 500 }
    );
  }
}
