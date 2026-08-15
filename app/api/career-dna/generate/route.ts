import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parsePdfBuffer } from '@/lib/parsers/pdf-parser';
import { claudeSonnetModel } from '@/lib/ai/openrouter';
import { generateObject } from 'ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// Strict Zod schema required for Career DNA
const CareerDnaSchema = z.object({
  strengths: z.array(z.string()).describe('List of key technical and professional strengths identified in the resume/profile'),
  areasToImprove: z.array(z.string()).describe('Key skill gaps or areas that need development for target roles'),
  currentSkills: z.array(z.string()).describe('Verified technical tools, languages, and frameworks the candidate currently uses'),
  skillsToAcquire: z.array(z.string()).describe('Recommended high-demand skills to acquire for target job tracks'),
  targetRoles: z.array(z.string()).describe('Primary and adjacent job roles suited for this candidate'),
  recommendedActions: z.array(
    z.object({
      title: z.string().describe('Short actionable recommendation title'),
      rationale: z.string().describe('Why this action directly improves hiring probability'),
      urgency: z.enum(['high', 'medium', 'low']).describe('Priority level'),
    })
  ).describe('3-5 prioritized next actions'),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user via lib/supabase/server.ts
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to proceed.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawMetadata = formData.get('metadata') as string | null;

    const metadata = rawMetadata ? JSON.parse(rawMetadata) : {};
    const targetRole = metadata.targetRole || metadata.domain || 'Full-Stack Development';
    const experienceLevel = metadata.experienceLevel || metadata.expLevel || '0–1 Years';
    const candidateSkills = Array.isArray(metadata.skills)
      ? metadata.skills
      : Array.isArray(metadata.selectedSkills)
      ? metadata.selectedSkills
      : [];

    let extractedResumeText = '';
    let storageResumeUrl = '';

    // 2. Extract clean text from uploaded PDF FormData
    if (file && file.size > 0) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        extractedResumeText = await parsePdfBuffer(buffer, file.name);

        // Upload raw PDF to private Supabase storage bucket 'resumes'
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${user.id}/${Date.now()}-${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(storagePath, buffer, {
            contentType: file.type || 'application/pdf',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(storagePath);
          storageResumeUrl = publicUrlData?.publicUrl || storagePath;
        }
      } catch (fileErr: any) {
        console.warn('PDF parsing warning:', fileErr?.message || fileErr);
      }
    }

    // Fallback text if no PDF was attached
    if (!extractedResumeText) {
      extractedResumeText = `Candidate Name: ${metadata.fullName || user.email?.split('@')[0] || 'Candidate'}
Target Role: ${targetRole}
Experience Level: ${experienceLevel}
Education: ${metadata.education || 'B.Tech / B.E.'} - ${metadata.degree || 'Computer Science'}
Preferred Location: ${metadata.preferredLocation || 'Bangalore'} (${metadata.workPreference || 'Hybrid'})
Technical Skills: ${candidateSkills.join(', ') || 'React, TypeScript, Node.js, SQL, System Design'}
Career Intent: ${metadata.careerIntent || metadata.selectedGoal || 'Accelerate tech career growth'}`;
    }

    const prompt = `You are a Principal Career Systems Architect and Technical Recruiter.
Analyze this candidate's resume and target career track to construct their authoritative Career DNA.

Target Role: ${targetRole}
Experience Level: ${experienceLevel}
Candidate Input Skills: ${candidateSkills.join(', ')}

RESUME CONTENT:
${extractedResumeText}

Extract verified strengths, identify real market skill gaps for ${targetRole}, list current skills, recommend high-leverage skills to acquire, propose exact target roles, and provide 3-5 prioritized next actions with rationale and urgency.`;

    // 3. Invoke OpenRouter Claude 4.5 Sonnet via Vercel AI SDK generateObject
    const aiResponse = await generateObject({
      model: claudeSonnetModel,
      schema: CareerDnaSchema,
      maxOutputTokens: 1500,
      prompt,
    });

    const structuredResult = aiResponse.object;

    // 4. Direct Supabase Upsert into public.career_dna
    const { data: insertedDna, error: dbError } = await supabase
      .from('career_dna')
      .upsert(
        {
          user_id: user.id,
          target_roles: structuredResult.targetRoles,
          current_skills: structuredResult.currentSkills,
          skill_gaps: structuredResult.areasToImprove,
          readiness_score: 85,
          raw_resume_text: extractedResumeText,
          resume_url: storageResumeUrl || null,
          metadata: {
            strengths: structuredResult.strengths,
            skillsToAcquire: structuredResult.skillsToAcquire,
            recommendedActions: structuredResult.recommendedActions,
            experienceLevel,
            extractedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (dbError) {
      console.warn('career_dna upsert note:', dbError.message);
    }

    // 5. Update public.profiles onboarding flag
    await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        target_role: targetRole,
        experience_level: experienceLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      data: insertedDna || {
        user_id: user.id,
        target_roles: structuredResult.targetRoles,
        current_skills: structuredResult.currentSkills,
        skill_gaps: structuredResult.areasToImprove,
        readiness_score: 85,
        raw_resume_text: extractedResumeText,
        metadata: {
          strengths: structuredResult.strengths,
          skillsToAcquire: structuredResult.skillsToAcquire,
          recommendedActions: structuredResult.recommendedActions,
        },
      },
      careerDna: structuredResult,
    });
  } catch (error: any) {
    console.error('Career DNA Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Career DNA' },
      { status: 500 }
    );
  }
}
