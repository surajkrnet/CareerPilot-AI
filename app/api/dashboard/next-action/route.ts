import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiModel } from '@/lib/ai/openrouter';
import { generateText } from 'ai';
import { extractAndParseJSON } from '@/lib/ai/json-extractor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let careerDna: any = null;
    let applications: any[] = [];
    let interviewSessions: any[] = [];

    if (user) {
      const [{ data: dna }, { data: apps }, { data: interviews }] = await Promise.all([
        supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('applications').select('*').eq('user_id', user.id).limit(10),
        supabase.from('interview_sessions').select('*').eq('user_id', user.id).limit(5),
      ]);
      careerDna = dna;
      applications = apps || [];
      interviewSessions = interviews || [];
    }

    const targetRole = careerDna?.target_roles?.[0] || 'Software Engineer (Frontend / Full-Stack)';
    const hasDna = !!careerDna;
    const hasInterviews = interviewSessions.length > 0;
    const hasApps = applications.length > 0;

    let defaultNextAction = {
      title: !hasDna
        ? 'Complete Career DNA Calibration'
        : !hasInterviews
        ? `Launch Live STAR Interview for ${targetRole}`
        : !hasApps
        ? 'Review High-Match Tech Opportunities'
        : 'Run ATS Match Scan on New Positions',
      description: !hasDna
        ? 'Upload your resume or specify target preferences to unlock tailored ATS matching and mock interview drills.'
        : !hasInterviews
        ? 'Practice live technical cross-examination and receive immediate STAR scorecard feedback.'
        : !hasApps
        ? 'Explore curated opportunities matched directly against your verified Career DNA stack.'
        : 'Ensure your resume keywords directly match recently posted engineering job requirements.',
      impactScore: !hasDna ? '+45% Opportunity Discovery' : !hasInterviews ? '+38% Offer Rate' : '+28% Response Rate',
      actionLabel: !hasDna ? 'Complete Calibration' : !hasInterviews ? 'Launch Mock Studio' : !hasApps ? 'View Matched Roles' : 'Open Resume Studio',
      actionHref: (!hasDna ? '/onboarding' : !hasInterviews ? '/interview' : !hasApps ? '/job-fit' : '/resume-intelligence') as
        | '/onboarding'
        | '/interview'
        | '/job-fit'
        | '/resume-intelligence',
      urgency: 'high' as const,
    };

    let nextAction = defaultNextAction;

    try {
      const prompt = `You are a Principal AI Career Orchestrator. Determine the single highest leverage next action for this candidate.
Candidate State:
- Target Role: ${targetRole}
- Career DNA Calibrated: ${hasDna}
- Pipeline Applications: ${applications.length}
- Completed Mock Interviews: ${interviewSessions.length}
- Verified Skills: ${(careerDna?.current_skills || []).join(', ') || 'React, TypeScript, SQL'}

Output a JSON object with:
{
  "title": "Concise headline for the next action",
  "description": "2-sentence strategic rationale",
  "impactScore": "+32% Interview Conversion",
  "actionLabel": "Button text",
  "actionHref": "/interview" or "/resume-intelligence" or "/job-fit" or "/onboarding" or "/tracker",
  "urgency": "high" or "medium" or "low"
}
Return pure JSON only.`;

      const aiResponse = await generateText({
        model: aiModel,
        prompt,
      });

      const parsed = extractAndParseJSON(aiResponse.text, defaultNextAction);
      if (parsed?.title && parsed?.actionHref) {
        nextAction = parsed;
      }
    } catch (aiErr: any) {
      console.warn('Next Action AI notice:', aiErr?.message || aiErr);
    }

    return NextResponse.json({
      success: true,
      nextAction,
    });
  } catch (error: any) {
    console.error('Next-Action error:', error);
    return NextResponse.json({ error: error.message || 'Next-Action synthesis failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
