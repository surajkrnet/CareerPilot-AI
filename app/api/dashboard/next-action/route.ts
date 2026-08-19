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
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let careerDna = body.careerDna || null;
    let applications: any[] = [];
    let interviewSessions: any[] = [];
    let resumeScans: any[] = [];

    if (user) {
      const [
        { data: dna },
        { data: apps },
        { data: interviews },
        { data: scans },
      ] = await Promise.all([
        supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('applications').select('*').eq('user_id', user.id).limit(10),
        supabase.from('interview_sessions').select('*').eq('user_id', user.id).limit(5),
        supabase.from('resume_scans').select('*').eq('user_id', user.id).limit(5),
      ]);
      if (!careerDna && dna) careerDna = dna;
      applications = apps || [];
      interviewSessions = interviews || [];
      resumeScans = scans || [];
    }

    const targetRoles: string[] = careerDna?.target_roles || careerDna?.targetRoles || (careerDna?.target_role ? [careerDna.target_role] : ['Software Engineer']);
    const targetRole = targetRoles[0] || 'Software Engineer';
    const verifiedSkills: string[] = careerDna?.current_skills || careerDna?.currentSkills || ['React', 'TypeScript', 'SQL'];
    const skillGaps: string[] = careerDna?.areas_to_improve || careerDna?.areasToImprove || careerDna?.skills_to_acquire || [];
    const experienceLevel = careerDna?.experience_level || '0–2 Years';

    const hasDna = !!careerDna;
    const hasInterviews = interviewSessions.length > 0;
    const hasScans = resumeScans.length > 0;
    const hasApps = applications.length > 0;

    // High Quality Default Fallback
    const defaultNextAction = {
      title: !hasDna
        ? 'Calibrate Your Living Career DNA Profile'
        : !hasScans
        ? `Scan Your Resume Against Target ${targetRole} JDs`
        : !hasInterviews
        ? `Practice Live STAR Mock Interview for ${targetRole}`
        : !hasApps
        ? 'Apply to Live Scraped High-Fit Opportunities'
        : `Drill on Skill Gap: ${skillGaps[0] || 'System Design & STAR Delivery'}`,
      description: !hasDna
        ? 'Upload your resume or specify target preferences to synthesize verified competency vectors and unlock tailored ATS scoring.'
        : !hasScans
        ? 'Your Career DNA is calibrated. Run a live JD match scan to generate metric-backed STAR bullet points and maximize recruiter pass rate.'
        : !hasInterviews
        ? 'Your ATS score is solid. Rehearse live multi-turn behavioral and technical cross-examinations with instant STAR scorecards.'
        : !hasApps
        ? 'Browse real-time job openings from LinkedIn, Wellfound, Naukri, and Y Combinator matching your verified skillset.'
        : `Close your priority skill gap in ${skillGaps[0] || 'System Architecture'} before your upcoming interview drills.`,
      impactScore: !hasDna ? '+45% Opportunity Discovery' : !hasScans ? '+34% ATS Pass Rate' : !hasInterviews ? '+40% Offer Probability' : '+25% Callback Velocity',
      actionLabel: !hasDna ? 'Calibrate DNA' : !hasScans ? 'Scan in Resume Studio' : !hasInterviews ? 'Launch Mock Studio' : !hasApps ? 'Explore Matched Jobs' : 'Start Mock Drill',
      actionHref: (!hasDna ? '/onboarding' : !hasScans ? '/resume-intelligence' : !hasInterviews ? '/interview' : !hasApps ? '/job-fit' : '/interview') as
        | '/onboarding'
        | '/interview'
        | '/job-fit'
        | '/resume-intelligence'
        | '/tracker',
      urgency: 'high' as const,
    };

    let nextAction = defaultNextAction;

    // Generate AI Next Action with Career DNA grounding
    try {
      const prompt = `You are a Principal AI Career Strategist for "CareerPilot AI".
Analyze this candidate's live Career DNA and pipeline state to recommend their SINGLE MOST IMPACTFUL NEXT ACTION.

Candidate Profile & State:
- Target Role: ${targetRole}
- Experience Level: ${experienceLevel}
- Verified Stack/Skills: ${verifiedSkills.slice(0, 10).join(', ')}
- Skill Gaps / Areas to Improve: ${skillGaps.slice(0, 6).join(', ') || 'Distributed Systems, System Design'}
- Resume Scans Completed: ${resumeScans.length}
- Live Mock Interviews Taken: ${interviewSessions.length}
- Pipeline Tracked Applications: ${applications.length}

Generate a structured JSON recommendation with actionable strategic rationale.
Rules:
1. "actionHref" MUST be one of: "/resume-intelligence", "/interview", "/job-fit", "/onboarding", "/tracker".
2. Title should be punchy, motivating, and specific to their target role (${targetRole}).
3. Description should explain the exact tactical ROI (1-2 sentences).
4. impactScore should be like "+35% Recruiter Callback" or "+42% Offer Rate".

JSON Schema:
{
  "title": "Clear next action headline",
  "description": "2-sentence strategic rationale based on their Career DNA",
  "impactScore": "+35% Recruiter Response",
  "actionLabel": "Button CTA text",
  "actionHref": "/resume-intelligence" | "/interview" | "/job-fit" | "/onboarding" | "/tracker",
  "urgency": "high" | "medium"
}
Return JSON only.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      try {
        const aiPromise = generateText({
          model: aiModel,
          prompt,
          abortSignal: controller.signal,
        });

        const timeoutPromise = new Promise<{ text: string }>((resolve) =>
          setTimeout(() => resolve({ text: JSON.stringify(defaultNextAction) }), 2800)
        );

        const aiResponse = await Promise.race([aiPromise, timeoutPromise]);
        const parsed = extractAndParseJSON(aiResponse.text, defaultNextAction);

        if (parsed?.title && parsed?.actionHref) {
          nextAction = {
            ...defaultNextAction,
            ...parsed,
          };
        }
      } finally {
        clearTimeout(timeoutId);
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
