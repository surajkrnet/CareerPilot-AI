import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiModel } from '@/lib/ai/openrouter';
import { generateText } from 'ai';
import { extractAndParseJSON } from '@/lib/ai/json-extractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface SuggestedJobDescription {
  label: string;
  roleTitle: string;
  companyType: string;
  fullJobDescription: string;
}

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

    const { resumeText: customResumeText } = await req.json();

    let resumeText = customResumeText || '';

    if (!resumeText || resumeText.trim().length < 20) {
      const { data: dna } = await supabase
        .from('career_dna')
        .select('raw_resume_text, current_skills, target_roles')
        .eq('user_id', user.id)
        .maybeSingle();

      if (dna?.raw_resume_text) {
        resumeText = dna.raw_resume_text;
      } else if (dna?.current_skills) {
        resumeText = `Skills: ${dna.current_skills.join(', ')}. Target: ${(dna.target_roles || []).join(', ')}`;
      }
    }

    if (!resumeText || resumeText.trim().length < 10) {
      resumeText = 'Software Engineer with experience in React, TypeScript, Java, Python, and SQL.';
    }

    // High quality deterministic fallback generator based on skills detected in resume
    const resumeLower = resumeText.toLowerCase();
    const hasReact = resumeLower.includes('react') || resumeLower.includes('next');
    const hasJava = resumeLower.includes('java') && !resumeLower.includes('javascript');
    const hasPython = resumeLower.includes('python');
    const hasIot = resumeLower.includes('iot') || resumeLower.includes('embedded') || resumeLower.includes('internet of things');
    const hasBackend = resumeLower.includes('node') || resumeLower.includes('sql') || resumeLower.includes('api') || hasJava || hasPython;

    const fallbackJds: SuggestedJobDescription[] = [
      {
        label: 'Full-Stack Engineer',
        roleTitle: 'Software Engineer (Full-Stack Systems)',
        companyType: 'High-Growth Tech SaaS',
        fullJobDescription: `Role: Software Engineer (Full-Stack Systems)
Company: High-Growth Product SaaS
Location: Bengaluru / Hybrid (Remote Eligible)
Experience: 0-3 Years

Overview:
We are looking for a Software Engineer to design, build, and scale interactive web applications and microservices.

Key Requirements:
- Hands-on proficiency in React, TypeScript, and modern component state architectures.
- Experience developing RESTful APIs and connecting backend services with Node.js, Java, or Python.
- Working knowledge of SQL database modeling (PostgreSQL / MySQL) and schema optimization.
- Familiarity with Git version control, CI/CD pipelines, and writing maintainable unit tests.`,
      },
      {
        label: hasJava ? 'Java Backend Systems' : 'Backend & API Engineer',
        roleTitle: hasJava ? 'Software Engineer (Java Backend & Distributed Systems)' : 'Backend Software Engineer (APIs & Data)',
        companyType: 'Fintech & Scale-Up Platforms',
        fullJobDescription: `Role: ${hasJava ? 'Software Engineer (Java Backend)' : 'Backend Software Engineer'}
Company: Fintech & Enterprise Scale-Up
Location: Bengaluru / Remote
Experience: 0-3 Years

Overview:
Join our platform infrastructure team building low-latency, resilient transaction and data handling engines.

Key Requirements:
- Strong core foundation in ${hasJava ? 'Java (Spring Boot / Core Java)' : 'Python / Node.js'} and OOP architecture patterns.
- Strong SQL proficiency for designing relational schemas, indexing, and query optimization.
- Solid understanding of data structures, algorithms, concurrency, and REST API design.
- Passion for reliability metrics, system design principles, and automated testing.`,
      },
      {
        label: hasReact ? 'Frontend Interface Engineer' : 'Frontend Web Developer',
        roleTitle: 'Frontend Engineer (React / Next.js)',
        companyType: 'Product & Design Systems Studio',
        fullJobDescription: `Role: Frontend Engineer (React & Web Systems)
Company: Product Craft & Consumer Web
Location: Bengaluru / Remote
Experience: 0-2 Years

Overview:
Help craft responsive, accessible, and ultra-fast user interfaces across modern web browsers.

Key Requirements:
- Strong foundation in HTML5, modern CSS / Tailwind CSS, JavaScript (ES6+), and TypeScript.
- Demonstrated experience building interactive web applications with React or Next.js.
- Focus on Core Web Vitals, responsive layouts, client-side state, and clean component boundaries.
- Ability to collaborate with product managers and designers on rapid prototyping.`,
      },
      {
        label: hasIot ? 'IoT & Embedded Systems' : hasPython ? 'Python Data / AI Engineer' : 'Junior Systems Engineer',
        roleTitle: hasIot ? 'IoT & Systems Software Engineer' : hasPython ? 'Python Software & Data Engineer' : 'Systems & Cloud Infrastructure Engineer',
        companyType: 'Deep Tech & Connected Devices',
        fullJobDescription: `Role: ${hasIot ? 'IoT & Systems Software Engineer' : hasPython ? 'Python Software Engineer' : 'Systems Engineer'}
Company: Smart Devices & Cloud Connected Systems
Location: Bengaluru / On-Site
Experience: 0-2 Years

Overview:
Bridge hardware/data streams with cloud web platforms and automated data handling pipelines.

Key Requirements:
- Familiarity with ${hasIot ? 'IoT protocols (MQTT, HTTP), sensor data acquisition, and embedded fundamentals' : hasPython ? 'Python scripting, data handling libraries, and automated API services' : 'system design fundamentals and backend automation'}.
- Strong problem-solving aptitude, debugging capabilities, and SQL querying fundamentals.
- Understanding of distributed computing, telemetry logging, and secure data transmission.`,
      },
    ];

    let suggestedRoles = fallbackJds;

    try {
      const prompt = `You are a Principal Technical Recruiter and Career Architect.
Analyze the following candidate resume text and extract their core technical skills (languages, frameworks, domains, projects).

Candidate Resume:
${resumeText.slice(0, 3500)}

Task:
Generate exactly 4 realistic, targeted job descriptions tailored to this candidate's demonstrated background (e.g. Full-Stack, Backend, Frontend, Specialized Systems).

Output a valid JSON object matching this schema:
{
  "suggestedRoles": [
    {
      "label": "Short role chip label (max 3-4 words, e.g. Full-Stack React/Node, Java Backend, IoT Systems)",
      "roleTitle": "Full official Job Title (e.g. Software Engineer (Full-Stack))",
      "companyType": "e.g. Fintech SaaS / Consumer Tech / Enterprise Platforms",
      "fullJobDescription": "Complete structured Job Description text with Role, Company, Location, Experience, Overview, and Key Requirements (formatted cleanly with bullet points)."
    }
  ]
}

Return ONLY the pure JSON object.`;

      const aiResponse = await generateText({
        model: aiModel,
        prompt,
      });

      const parsed = extractAndParseJSON(aiResponse.text, { suggestedRoles: fallbackJds });

      if (parsed && Array.isArray(parsed.suggestedRoles) && parsed.suggestedRoles.length > 0) {
        suggestedRoles = parsed.suggestedRoles.map((r: any, idx: number) => ({
          label: r.label || fallbackJds[idx % fallbackJds.length].label,
          roleTitle: r.roleTitle || fallbackJds[idx % fallbackJds.length].roleTitle,
          companyType: r.companyType || fallbackJds[idx % fallbackJds.length].companyType,
          fullJobDescription: r.fullJobDescription || fallbackJds[idx % fallbackJds.length].fullJobDescription,
        }));
      }
    } catch (aiErr: any) {
      console.warn('AI Suggest JDs note (using calibrated fallback):', aiErr?.message || aiErr);
    }

    return NextResponse.json({
      success: true,
      data: suggestedRoles,
      suggestedRoles,
    });
  } catch (error: any) {
    console.error('Suggest JDs endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to suggest job descriptions.' },
      { status: 500 }
    );
  }
}
