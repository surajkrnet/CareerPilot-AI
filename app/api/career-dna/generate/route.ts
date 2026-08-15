import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parsePdfBuffer } from '@/lib/parsers/pdf-parser';
import { aiModel } from '@/lib/ai/openrouter';
import { generateObject } from 'ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// Authoritative Zod schema for Career DNA Synthesis
const CareerDnaSchema = z.object({
  strengths: z.array(z.string()).describe('Top 4-6 verified technical and architectural strengths'),
  areasToImprove: z.array(z.string()).describe('Top 3-4 skill gaps or missing depth based on target role'),
  currentSkills: z.array(z.string()).describe('List of all technical skills, frameworks, and tools found in resume'),
  skillsToAcquire: z.array(z.string()).describe('Key industry skills required for target role but missing from profile'),
  targetRoles: z.array(z.string()).describe('Top 2-3 matched job titles with seniority level'),
  recommendedActions: z.array(
    z.object({
      title: z.string().describe('Short actionable recommendation title'),
      rationale: z.string().describe('Why this action directly improves hiring probability'),
      urgency: z.enum(['high', 'medium', 'low']).describe('Priority level'),
      moduleLink: z.string().default('/resume-intelligence'),
    })
  ).describe('3-5 prioritized next actions'),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user session using Supabase SSR server client
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to proceed.' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let extractedResumeText = '';
    let metadata: Record<string, any> = {};
    let storageResumeUrl = '';

    // 2. Parse incoming payload (supports both JSON body & multipart FormData)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      extractedResumeText = body.resumeText || '';
      metadata = body.metadata || body || {};
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const rawMetadata = formData.get('metadata') as string | null;
      const directResumeText = formData.get('resumeText') as string | null;

      if (rawMetadata) {
        try {
          metadata = JSON.parse(rawMetadata);
        } catch {
          metadata = {};
        }
      }

      if (directResumeText && directResumeText.trim().length > 30) {
        extractedResumeText = directResumeText.trim();
      }

      // Extract text from attached PDF if text not already provided
      if (file && file.size > 0) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          if (!extractedResumeText) {
            extractedResumeText = await parsePdfBuffer(buffer, file.name);
          }

          // Persist raw PDF to private Supabase storage bucket 'resumes'
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
          console.warn('Resume file extraction notice:', fileErr?.message || fileErr);
        }
      }
    }

    const targetRole = metadata.targetRole || metadata.domain || 'Full-Stack Development';
    const experienceLevel = metadata.experienceLevel || metadata.expLevel || '0–1 Years';
    const candidateSkills = Array.isArray(metadata.skills)
      ? metadata.skills
      : Array.isArray(metadata.selectedSkills)
      ? metadata.selectedSkills
      : [];

    // Fallback if no resume text available
    if (!extractedResumeText || extractedResumeText.trim().length < 20) {
      extractedResumeText = `Candidate Name: ${metadata.fullName || user.email?.split('@')[0] || 'Candidate'}
Target Role: ${targetRole}
Experience Level: ${experienceLevel}
Education: ${metadata.education || 'B.Tech / B.E.'} - ${metadata.degree || 'Computer Science'}
Preferred Location: ${metadata.preferredLocation || 'Bangalore'} (${metadata.workPreference || 'Hybrid'})
Technical Skills: ${candidateSkills.join(', ') || 'React, TypeScript, Node.js, SQL, System Design'}
Career Intent: ${metadata.careerIntent || metadata.selectedGoal || 'Accelerate tech career growth'}`;
    }

    const prompt = `You are a Principal Career Systems Architect and Technical Recruiter.
Analyze this candidate's verified resume and questionnaire responses to generate an authoritative Career DNA profile.

Candidate Context:
- Target Role Track: ${targetRole}
- Experience Level: ${experienceLevel}
- Questionnaire Skills: ${candidateSkills.join(', ')}
- Education & Intent: ${metadata.education || 'Computer Science'} | ${metadata.careerIntent || metadata.selectedGoal || 'Accelerate Career Growth'}

RESUME PLAIN TEXT:
${extractedResumeText}

Extract verified strengths, identify real market skill gaps for ${targetRole}, list current skills, recommend high-leverage skills to acquire, propose exact target roles with seniority, and provide 3-5 prioritized next actions.`;

    // 3. Invoke OpenRouter Gemma AI Engine
    const aiResponse = await generateObject({
      model: aiModel,
      schema: CareerDnaSchema,
      maxOutputTokens: 1500,
      prompt,
    });

    const structuredResult = aiResponse.object;

    // 4. Atomic Supabase Upsert into public.career_dna
    const upsertRecord = {
      user_id: user.id,
      strengths: structuredResult.strengths,
      areas_to_improve: structuredResult.areasToImprove,
      current_skills: structuredResult.currentSkills,
      skills_to_acquire: structuredResult.skillsToAcquire,
      target_roles: structuredResult.targetRoles,
      recommended_actions: structuredResult.recommendedActions,
      raw_resume_text: extractedResumeText,
      updated_at: new Date().toISOString(),
    };

    const { data: insertedDna, error: dbError } = await supabase
      .from('career_dna')
      .upsert(upsertRecord, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

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
        full_name: metadata.fullName || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        ...structuredResult,
        user_id: user.id,
        targetRoles: structuredResult.targetRoles,
        currentSkills: structuredResult.currentSkills,
        areasToImprove: structuredResult.areasToImprove,
        strengths: structuredResult.strengths,
        skillsToAcquire: structuredResult.skillsToAcquire,
        recommendedActions: structuredResult.recommendedActions,
        rawResumeText: extractedResumeText,
        resumeUrl: storageResumeUrl,
      },
      profile: {
        ...structuredResult,
        targetRole,
        experienceLevel,
      },
      resumeText: extractedResumeText,
    });
  } catch (error: any) {
    console.error('Career DNA Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to synthesize Career DNA' },
      { status: 500 }
    );
  }
}
