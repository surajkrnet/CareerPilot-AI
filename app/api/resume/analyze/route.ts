import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiModel } from '@/lib/ai/openrouter';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AnalysisSchema = z.object({
  atsScore: z.number().min(0).max(100),
  matchPercentage: z.number().min(0).max(100),
  resumeStrengths: z.array(z.string()),
  areasOfImprovement: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  actionableRecommendations: z.array(z.string()),
  starOptimizations: z.array(
    z.object({
      originalBullet: z.string(),
      starOptimizedBullet: z.string(),
      metricImpact: z.string(),
      rationale: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { resumeText, jobDescription } = await req.json();
    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Resume text and Job Description are required' }, { status: 400 });
    }

    // Direct LLM Call using OpenRouter Gemma AI Engine
    const result = await generateObject({
      model: aiModel,
      schema: AnalysisSchema,
      maxOutputTokens: 1500,
      system: `You are a Principal Technical Recruiter and ATS Evaluation Engine.
Analyze the candidate's actual resume against the target Job Description (JD).
1. Calculate an objective ATS Score (0-100) based on hard skills and single-column formatting suitability.
2. Calculate Match Percentage (0-100) based on domain alignment and technical depth.
3. List 3-5 verified Resume Strengths and 3-4 critical Areas of Improvement.
4. Extract essential Missing Keywords from the JD.
5. Provide high-impact Actionable Recommendations.
6. Select 2-3 weak or standard project/experience bullet points from the resume and rewrite them using the STAR method (Situation/Task, Action, Result with quantifiable metrics).`,
      prompt: `Candidate Resume:\n${resumeText}\n\nTarget Job Description:\n${jobDescription}`,
    });

    let scanId = `scan-${Date.now()}`;

    // Save scan to Supabase public.resume_scans
    try {
      const { data: insertedScan, error: insertError } = await supabase
        .from('resume_scans')
        .insert({
          user_id: user.id,
          resume_url: 'career_dna_resume',
          ats_score: result.object.atsScore,
          target_jd: jobDescription,
          missing_skills: result.object.missingKeywords,
          feedback_summary: result.object,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!insertError && insertedScan?.id) {
        scanId = insertedScan.id;
      }
    } catch (dbErr: any) {
      console.warn('resume_scans insert note:', dbErr?.message || dbErr);
    }

    return NextResponse.json({
      success: true,
      data: result.object,
      analysis: result.object,
      scanId,
    });
  } catch (error: any) {
    console.error('OpenRouter Resume Analysis Error:', error);
    const msg = error?.message || 'Analysis failed';
    const cleanMsg = msg.includes('rate-limited')
      ? 'The AI analysis engine is temporarily busy. Please retry in a few moments.'
      : msg.includes('credits')
      ? 'AI Engine quota notice: please check credit allocations.'
      : msg;
    return NextResponse.json({ error: cleanMsg }, { status: 500 });
  }
}
