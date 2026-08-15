import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiModel } from '@/lib/ai/openrouter';
import { generateObject } from 'ai';
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
      const model = aiModel;
      const prompt = `You are a Principal AI Career Orchestrator. Determine the single highest leverage next-best action for this candidate.

Candidate State:
- Target Role: ${targetRole}
- Career DNA Calibrated: ${hasDna}
- Total Applications in Pipeline: ${applications.length}
- Mock Interview Drills Completed: ${interviewSessions.length}
- Identified Skill Gaps: ${(careerDna?.skill_gaps || []).join(', ') || 'System Design, Distributed Caching'}

Synthesize the single highest ROI next step.`;

      const aiResponse = await generateObject({
        model,
        schema: NextActionSchema,
        maxOutputTokens: 600,
        prompt,
      });

      nextAction = aiResponse.object;
    } catch (aiErr: any) {
      console.warn('Next Action AI notice:', aiErr?.message || aiErr);

      if (!hasDna) {
        nextAction = {
          title: 'Complete Career DNA Calibration',
          description: 'Upload your resume or specify target roles to unlock personalized ATS match scores and tailored mock interview drills.',
          impactScore: '+45% Opportunity Discovery',
          actionLabel: 'Complete Calibration',
          actionHref: '/onboarding',
          urgency: 'high',
        };
      } else if (!hasInterviews) {
        nextAction = {
          title: `Start AI Mock Interview for ${targetRole}`,
          description: 'Practice real-time technical cross-examination and receive live STAR performance scores.',
          impactScore: '+38% Offer Rate',
          actionLabel: 'Launch Mock Studio',
          actionHref: '/interview',
          urgency: 'high',
        };
      } else if (!hasApps) {
        nextAction = {
          title: 'Optimize & Match 5 Target Roles',
          description: 'Review high-match open positions aligned with your validated Career DNA skills.',
          impactScore: '+24% Response Rate',
          actionLabel: 'View Matched Roles',
          actionHref: '/jobs',
          urgency: 'medium',
        };
      } else {
        nextAction = {
          title: 'Run Resume ATS Scan on New Roles',
          description: 'Ensure your resume keywords directly match recently posted engineering job requirements.',
          impactScore: '+32% Interview Callbacks',
          actionLabel: 'Open Resume Studio',
          actionHref: '/resume',
          urgency: 'medium',
        };
      }
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
