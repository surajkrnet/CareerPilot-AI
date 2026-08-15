import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AnalysisSchema = z.object({
  atsScore: z.number().min(0).max(100).describe('Overall ATS compatibility score (0-100)'),
  matchPercentage: z.number().min(0).max(100).describe('Domain and keyword match percentage (0-100)'),
  resumeStrengths: z.array(z.string()).describe('3-5 verified strengths aligning with target JD'),
  areasOfImprovement: z.array(z.string()).describe('3-4 critical gaps or improvements'),
  missingKeywords: z.array(z.string()).describe('Key hard and soft skills missing from resume'),
  actionableRecommendations: z.array(z.string()).describe('3-5 high-impact actionable steps'),
  starOptimizations: z.array(
    z.object({
      originalBullet: z.string().describe('Original weak bullet point from candidate draft'),
      starOptimizedBullet: z.string().describe('STAR method rewrite with Action Verb, Stack, and Measurable Metric'),
      metricImpact: z.string().describe('e.g. +42% Performance / +24% ATS Match'),
      rationale: z.string().describe('Explanation of why this improves hiring conversion'),
    })
  ).describe('2-3 STAR technical bullet rewrites'),
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is missing in .env.local' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { resumeText, jobDescription } = await req.json();
    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Resume text and Job Description are required' }, { status: 400 });
    }

    // Direct Claude 3.5 Sonnet generation via Vercel AI SDK (no silent mock fallbacks)
    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: AnalysisSchema,
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

    const analysisData = result.object;
    let scanId = `scan-${Date.now()}`;

    // Save scan to Supabase database
    try {
      const { data: insertedScan, error: insertError } = await supabase
        .from('resume_scans')
        .insert({
          user_id: user.id,
          resume_url: 'career_dna_resume',
          ats_score: analysisData.atsScore,
          target_jd: jobDescription,
          missing_skills: analysisData.missingKeywords,
          feedback_summary: analysisData,
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
      data: analysisData,
      analysis: analysisData,
      scanId,
    });
  } catch (error: any) {
    console.error('Live Claude 3.5 Sonnet Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Claude 3.5 Sonnet Analysis failed' },
      { status: 500 }
    );
  }
}
