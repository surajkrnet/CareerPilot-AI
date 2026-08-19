import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiModel } from '@/lib/ai/openrouter';
import { generateText } from 'ai';
import { extractAndParseJSON } from '@/lib/ai/json-extractor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

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

    // 1. Fetch candidate's current record and profile
    const [{ data: dna }, { data: profile }] = await Promise.all([
      supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ]);

    const targetRole = profile?.target_role || dna?.target_roles?.[0] || 'Software Engineer (Full-Stack)';
    const experienceLevel = profile?.experience_level || '0–2 Years';
    let resumeText = dna?.raw_resume_text || '';

    if (!resumeText || resumeText.trim().length < 20) {
      const skills = dna?.current_skills || ['React', 'TypeScript', 'Java', 'Python', 'SQL'];
      resumeText = `Candidate Name: ${profile?.full_name || user.email?.split('@')[0] || 'Candidate'}
Target Role: ${targetRole}
Experience Level: ${experienceLevel}
Technical Skills: ${skills.join(', ')}`;
    }

    const defaultDna = {
      strengths: [
        'Strong core programming fundamentals and typed state modeling',
        'Component architecture and responsive interface design',
        'Modern RESTful API consumption and SQL query structuring',
        'Problem solving and collaborative version control workflow',
      ],
      areasToImprove: [
        'Deepen exposure to production observability and telemetry metrics',
        'Demonstrate distributed caching strategies and latency profiling',
        'Expand end-to-end testing coverage using Playwright or Cypress',
      ],
      currentSkills: dna?.current_skills?.length ? dna.current_skills : ['React', 'TypeScript', 'JavaScript', 'SQL', 'Git'],
      skillsToAcquire: ['Next.js App Router', 'Tailwind CSS', 'Docker', 'Redis', 'GraphQL', 'System Design'],
      targetRoles: [
        targetRole,
        targetRole.includes('Frontend') ? 'Full-Stack Developer' : 'Software Engineer',
        'Product Systems Engineer',
      ],
      recommendedActions: [
        {
          title: 'Optimize Resume for ATS Match on Target Roles',
          rationale: 'Align technical bullet points with modern hiring keywords to boost recruiter callback rates.',
          urgency: 'high' as const,
          moduleLink: '/resume-intelligence',
        },
        {
          title: 'Launch Live STAR Mock Interview Drill',
          rationale: 'Cross-examine your project decisions against hiring manager evaluation criteria.',
          urgency: 'high' as const,
          moduleLink: '/interview',
        },
        {
          title: 'Explore High-Fit Matched Tech Opportunities',
          rationale: 'Review curated roles matching your exact verified stack across LinkedIn and Wellfound.',
          urgency: 'medium' as const,
          moduleLink: '/job-fit',
        },
      ],
    };

    let structuredResult = defaultDna;

    try {
      const prompt = `You are a Principal AI Career Architect. Analyze this candidate resume and profile for target role: ${targetRole} (${experienceLevel}).

Resume Text:
${resumeText.slice(0, 3500)}

Output a valid JSON object matching this exact schema:
{
  "strengths": ["Top 4-5 verified technical/architectural strengths"],
  "areasToImprove": ["Top 3-4 skill gaps or missing depth"],
  "currentSkills": ["All technical skills, languages, tools found in resume"],
  "skillsToAcquire": ["4-6 high-demand skills for target role to learn next"],
  "targetRoles": ["Top 3-4 specific job titles matching candidate background"],
  "recommendedActions": [
    {
      "title": "Clear action title",
      "rationale": "Why this high-ROI action improves hiring conversion",
      "urgency": "high",
      "moduleLink": "/resume-intelligence"
    },
    {
      "title": "Practice multi-turn mock interview",
      "rationale": "Rehearse live technical questions for target role",
      "urgency": "high",
      "moduleLink": "/interview"
    },
    {
      "title": "Explore matched jobs",
      "rationale": "View tailored roles matching verified skills",
      "urgency": "medium",
      "moduleLink": "/job-fit"
    }
  ]
}

Return ONLY the valid JSON object.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const aiPromise = generateText({
          model: aiModel,
          prompt,
          abortSignal: controller.signal,
        });

        const timeoutPromise = new Promise<{ text: string }>((resolve) =>
          setTimeout(() => resolve({ text: JSON.stringify(defaultDna) }), 3000)
        );

        const aiResponse = await Promise.race([aiPromise, timeoutPromise]);
        const parsed = extractAndParseJSON(aiResponse.text, defaultDna);

        if (parsed && Array.isArray(parsed.strengths) && Array.isArray(parsed.currentSkills)) {
          structuredResult = {
            strengths: parsed.strengths.length > 0 ? parsed.strengths : defaultDna.strengths,
            areasToImprove: Array.isArray(parsed.areasToImprove) && parsed.areasToImprove.length > 0 ? parsed.areasToImprove : defaultDna.areasToImprove,
            currentSkills: parsed.currentSkills.length > 0 ? parsed.currentSkills : defaultDna.currentSkills,
            skillsToAcquire: Array.isArray(parsed.skillsToAcquire) && parsed.skillsToAcquire.length > 0 ? parsed.skillsToAcquire : defaultDna.skillsToAcquire,
            targetRoles: Array.isArray(parsed.targetRoles) && parsed.targetRoles.length > 0 ? parsed.targetRoles : defaultDna.targetRoles,
            recommendedActions: Array.isArray(parsed.recommendedActions) && parsed.recommendedActions.length > 0 ? parsed.recommendedActions : defaultDna.recommendedActions,
          };
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (aiErr: any) {
      console.warn('AI Career DNA refresh note:', aiErr?.message || aiErr);
    }

    // Update Supabase public.career_dna
    const upsertRecord = {
      user_id: user.id,
      strengths: structuredResult.strengths,
      areas_to_improve: structuredResult.areasToImprove,
      current_skills: structuredResult.currentSkills,
      skills_to_acquire: structuredResult.skillsToAcquire,
      target_roles: structuredResult.targetRoles,
      recommended_actions: structuredResult.recommendedActions,
      raw_resume_text: resumeText,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('career_dna')
      .upsert(upsertRecord, { onConflict: 'user_id' });

    return NextResponse.json({
      success: true,
      data: upsertRecord,
      careerDna: upsertRecord,
    });
  } catch (error: any) {
    console.error('Refresh Career DNA error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to refresh Career DNA' },
      { status: 500 }
    );
  }
}
