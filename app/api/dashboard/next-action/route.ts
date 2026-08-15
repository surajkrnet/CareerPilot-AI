import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const NextActionSchema = z.object({
  title: z.string().describe('Concise headline for the single most impactful next action'),
  description: z.string().describe('2-sentence strategic rationale explaining why this action maximizes hiring conversion right now'),
  impactScore: z.string().describe('e.g. "+28% Interview Conversion" or "High Leverage"'),
  actionLabel: z.string().describe('Button label e.g. "Open Resume Studio", "Start AI Mock Drill", "Apply to Matched Roles"'),
  actionHref: z.enum(['/resume', '/interview', '/jobs', '/onboarding', '/tracker']).describe('Direct 1-click navigation route'),
  urgency: z.enum(['high', 'medium', 'low']).describe('Priority level'),
});

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

    const targetRole = careerDna?.target_role || 'Full-Stack Development';
    const hasDna = !!careerDna;
    const hasInterviews = interviewSessions.length > 0;
    const hasApps = applications.length > 0;

    let nextAction: z.infer<typeof NextActionSchema>;

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set');
      }

      const prompt = `You are a Principal AI Career Orchestrator. Determine the single highest leverage next-best action for this candidate.

Candidate State:
- Target Role: ${targetRole}
- Career DNA Calibrated: ${hasDna}
- Total Applications in Pipeline: ${applications.length}
- Mock Interviews Completed: ${interviewSessions.length}
- Verified Strengths: ${JSON.stringify(careerDna?.strengths || [])}
- Identified Skill Gaps: ${JSON.stringify(careerDna?.areas_to_improve || [])}

Recommend the single most urgent and high-conversion action across (/resume, /interview, /jobs, /tracker, /onboarding).`;

      const aiResponse = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        schema: NextActionSchema,
        prompt,
      });

      nextAction = aiResponse.object;
    } catch (aiErr) {
      // Fallback rule-based action synthesis
      if (!hasDna) {
        nextAction = {
          title: 'Complete Career DNA Onboarding',
          description: 'Calibrate your competency vector and extract verified technical strengths to unlock ATS scoring.',
          impactScore: '+35% Match Accuracy',
          actionLabel: 'Complete Career DNA',
          actionHref: '/onboarding',
          urgency: 'high',
        };
      } else if (!hasInterviews) {
        nextAction = {
          title: `Rehearse Live STAR Interview Drills for ${targetRole}`,
          description: 'Practice 15 minutes of live technical roleplay in Mock Studio to sharpen response structure and delivery confidence.',
          impactScore: '+28% Interview Conversion',
          actionLabel: 'Launch Mock Studio',
          actionHref: '/interview',
          urgency: 'high',
        };
      } else {
        nextAction = {
          title: `Run JD-Aligned ATS Resume Scan for ${targetRole}`,
          description: 'Inject active STAR accomplishment bullets to boost your automated resume screening pass rate.',
          impactScore: '+22% ATS Match',
          actionLabel: 'Open Resume Studio',
          actionHref: '/resume',
          urgency: 'medium',
        };
      }
    }

    return NextResponse.json({
      success: true,
      recommendation: nextAction,
      data: nextAction,
    });
  } catch (error: any) {
    console.error('Next-Action route error:', error);
    return NextResponse.json({ error: error.message || 'Next-action error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
