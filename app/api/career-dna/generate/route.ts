import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromBuffer } from '@/lib/pdf-parser';

export const maxDuration = 60;

// Role-specific intelligence map to guarantee rich, relevant Career DNA synthesis
const ROLE_INTELLIGENCE: Record<
  string,
  {
    defaultStrengths: string[];
    skillGaps: string[];
    targetCompanies: string[];
    summaryTemplate: (role: string, exp: string) => string;
  }
> = {
  'Full-Stack Engineer': {
    defaultStrengths: ['React 19 & Next.js Architecture', 'TypeScript & Modular Systems', 'Node.js & Express / NestJS', 'PostgreSQL & Relational Data Modeling', 'RESTful & GraphQL API Design'],
    skillGaps: ['Distributed Caching & Redis Pipelines', 'Docker & Kubernetes Cloud Deployment', 'Automated Integration Testing Suites'],
    targetCompanies: ['Linear', 'Stripe', 'Vercel', 'Supabase', 'Notion'],
    summaryTemplate: (role, exp) => `Full-stack engineer with strong front-to-back mastery, modern TypeScript proficiency, and agile product execution focus.`,
  },
  'Frontend Systems Architect': {
    defaultStrengths: ['React 19 & Next.js App Router', 'Design Systems & Component Tokenization', 'TypeScript & WebGL / CSS Animations', 'Core Web Vitals & Performance Profiling', 'Fluid Responsive UI Craft'],
    skillGaps: ['Micro-Frontend Module Federation', 'WebAssembly (Wasm) Integration', 'Offline-First Service Workers'],
    targetCompanies: ['Vercel', 'Figma', 'Linear', 'Airbnb', 'Notion'],
    summaryTemplate: (role, exp) => `High-craft frontend systems architect specializing in pixel-perfect design system architecture, state machines, and silky smooth web performance.`,
  },
  'Backend & Distributed Systems': {
    defaultStrengths: ['Go / Golang & Python Microservices', 'Distributed Systems & Concurrency', 'PostgreSQL & Database Sharding', 'gRPC & High-Throughput APIs', 'Kafka & Event-Driven Architecture'],
    skillGaps: ['Distributed Locks & Raft Consensus', 'eBPF Kernel Profiling', 'Multi-Region High Availability'],
    targetCompanies: ['Stripe', 'Uber', 'Cloudflare', 'Datadog', 'Amazon'],
    summaryTemplate: (role, exp) => `Backend specialist focused on high-throughput distributed microservices, data consistency, and low-latency system design.`,
  },
  'AI & Machine Learning Engineer': {
    defaultStrengths: ['Python & PyTorch Deep Learning', 'LLM Agents & Multi-Tool Orchestration', 'RAG Pipelines & Vector Search (Pinecone/Milvus)', 'Prompt Optimization & Eval Frameworks', 'FastAPI Microservice Inference'],
    skillGaps: ['Model Quantization & TensorRT Inference', 'Distributed Training with Ray / DeepSpeed', 'Fine-Tuning LoRA / QLoRA Pipelines'],
    targetCompanies: ['Anthropic', 'OpenAI', 'Perplexity', 'Scale AI', 'Mistral'],
    summaryTemplate: (role, exp) => `Frontier AI & ML Engineer with hands-on expertise in LLM agent orchestration, RAG architectures, and scalable model deployment.`,
  },
  'Cloud & DevOps / SRE': {
    defaultStrengths: ['Kubernetes (K8s) Cluster Management', 'Terraform & Infrastructure-as-Code', 'AWS / GCP Multi-Cloud Architecture', 'CI/CD Pipeline Automation', 'Prometheus & Grafana Observability'],
    skillGaps: ['Service Mesh (Istio / Linkerd)', 'Chaos Engineering & Game Days', 'GitOps with ArgoCD'],
    targetCompanies: ['Datadog', 'HashiCorp', 'AWS', 'Google Cloud', 'GitLab'],
    summaryTemplate: (role, exp) => `DevOps & SRE professional dedicated to 99.99% uptime, declarative cloud infrastructure, and zero-downtime deployment pipelines.`,
  },
  'Product Manager (AI / B2B SaaS)': {
    defaultStrengths: ['Product Strategy & PRD Specification', 'User Discovery & Customer Interviews', 'Data-Driven Experimentation & A/B Tests', 'AI Feature Integration & Scoping', 'Cross-Functional Engineering Alignment'],
    skillGaps: ['Technical API Design Verification', 'Advanced SQL Product Modeling', 'Enterprise Go-To-Market Metrics'],
    targetCompanies: ['Notion', 'Linear', 'OpenAI', 'Figma', 'Atlassian'],
    summaryTemplate: (role, exp) => `Strategic AI Product Manager bridging candidate intent with fast execution, data analytics, and customer empathy.`,
  },
  'UI/UX & Product Design': {
    defaultStrengths: ['Figma Design Systems & Variants', 'Interactive Prototyping & Micro-Interactions', 'User Journey Mapping & Research', 'Design-to-Code Handoff Workflow', 'Typography, Spatial Grids & a11y'],
    skillGaps: ['Advanced 3D Spline / WebGL Prototyping', 'Design Analytics & Funnel Drop-off Audits', 'Front-End CSS / React Tokens Pairing'],
    targetCompanies: ['Figma', 'Apple', 'Linear', 'Airbnb', 'Stripe'],
    summaryTemplate: (role, exp) => `Product designer with relentless taste for typography, frictionless UX flows, and scalable design system tokens.`,
  },
  'Data Engineer / Analytics': {
    defaultStrengths: ['Advanced SQL & Query Optimization', 'Python / Pandas & Data Wrangling', 'Snowflake / BigQuery Warehousing', 'dbt Data Modeling & Transformation', 'Apache Airflow / Prefect Orchestration'],
    skillGaps: ['Real-Time Stream Processing (Flink)', 'Data Lakehouse Apache Iceberg / Delta', 'Data Governance & Lineage (Great Expectations)'],
    targetCompanies: ['Databricks', 'Snowflake', 'Stripe', 'Uber', 'Palantir'],
    summaryTemplate: (role, exp) => `Data engineer specializing in rock-solid ELT pipelines, dimensional modeling, and high-performance warehouse queries.`,
  },
  'Mobile Engineer (iOS / Android)': {
    defaultStrengths: ['React Native & Expo Ecosystem', 'Swift & SwiftUI iOS Development', 'Kotlin & Jetpack Compose', 'Mobile State & Offline-First Sync', 'App Store & Play Store CI/CD'],
    skillGaps: ['Native C++ JNI / TurboModules', 'Mobile Performance & Memory Leak Profiling', 'Bluetooth BLE / IoT Protocols'],
    targetCompanies: ['DoorDash', 'Uber', 'Spotify', 'Cash App', 'Airbnb'],
    summaryTemplate: (role, exp) => `Mobile developer creating smooth 120fps native and cross-platform apps with rock-solid offline sync.`,
  },
  'CyberSecurity / AppSec': {
    defaultStrengths: ['OWASP Top 10 & AppSec Audits', 'Threat Modeling & Vulnerability Scans', 'OAuth 2.0 / SAML & Identity Security', 'Cloud Security Posture (AWS/GCP)', 'Penetration Testing & Remediation'],
    skillGaps: ['Kernel Exploit Analysis & Reverse Engineering', 'Zero-Trust Architecture Rollout', 'SOC2 / ISO27001 Compliance Automation'],
    targetCompanies: ['CrowdStrike', 'Cloudflare', 'Palo Alto Networks', 'Okta', 'Zscaler'],
    summaryTemplate: (role, exp) => `Security engineer passionate about proactive vulnerability defense, cryptographic integrity, and zero-trust systems.`,
  },
  'QA & Test Automation': {
    defaultStrengths: ['Playwright & Cypress E2E Automation', 'Jest / Vitest Unit & Integration Suites', 'API Testing with Postman / Newman', 'CI/CD Automated Test Gateways', 'Performance & Load Testing (k6)'],
    skillGaps: ['Chaos Testing & Fault Injection', 'AI-Driven Visual Regression Testing', 'Mobile Automation with Appium'],
    targetCompanies: ['BrowserStack', 'Datadog', 'Postman', 'Atlassian', 'Microsoft'],
    summaryTemplate: (role, exp) => `Test automation architect ensuring zero-defect deployments across web, mobile, and API surfaces.`,
  },
  'Blockchain & Web3': {
    defaultStrengths: ['Solidity & Smart Contract Engineering', 'Ethers.js / Viem / Wagmi Web3 Hooks', 'Hardhat & Foundry Test Frameworks', 'DeFi & Tokenomics Mechanisms', 'IPFS & Decentralized Architectures'],
    skillGaps: ['Zero-Knowledge Proofs (zk-SNARKs)', 'Smart Contract Formal Verification', 'MEV & Cross-Chain Bridge Protocols'],
    targetCompanies: ['Chainlink', 'Polygon', 'Uniswap', 'Coinbase', 'Consensys'],
    summaryTemplate: (role, exp) => `Web3 engineer building verified smart contracts, decentralized apps, and seamless Web3 wallet user experiences.`,
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawMetadata = formData.get('metadata') as string | null;

    const metadata = rawMetadata ? JSON.parse(rawMetadata) : {};
    const targetRole = metadata.targetRole || metadata.domain || 'Full-Stack Engineer';
    const expLevel = metadata.expLevel || '0-1 Yrs (New Grad / Student)';

    let parsedResumeText = '';

    // 1. Extract text from uploaded resume PDF / DOCX / text file
    if (file && file.size > 0) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        parsedResumeText = await extractTextFromBuffer(buffer, file.name);
      } catch (err) {
        console.warn('Text extraction notice:', err);
      }
    }

    // 2. Dispatch to n8n Agent Webhook if configured
    if (process.env.N8N_WEBHOOK_CAREER_DNA) {
      fetch(process.env.N8N_WEBHOOK_CAREER_DNA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'career_dna_generation',
          targetRole,
          experienceLevel: expLevel,
          metadata,
          resumeSnippet: parsedResumeText.slice(0, 3000),
          timestamp: new Date().toISOString(),
        }),
      }).catch((n8nErr) => console.warn('n8n webhook notification notice:', n8nErr.message));
    }

    // 3. Match Role Intelligence Profile
    const roleKey =
      Object.keys(ROLE_INTELLIGENCE).find((key) => targetRole.toLowerCase().includes(key.toLowerCase())) ||
      'Full-Stack Engineer';
    const intelligence = ROLE_INTELLIGENCE[roleKey];

    // Combine user selected skills with role core competencies
    const userSelectedSkills = Array.isArray(metadata.selectedSkills) && metadata.selectedSkills.length > 0
      ? metadata.selectedSkills
      : intelligence.defaultStrengths;

    const synthesizedStrengths = Array.from(new Set([...userSelectedSkills, ...intelligence.defaultStrengths])).slice(0, 6);

    const synthesizedDNA = {
      targetRole,
      experienceLevel: expLevel,
      degree: metadata.degree || 'B.S. Computer Science / Self-Taught',
      university: metadata.university || 'Tier 1 Institution',
      resumeHealthScore: parsedResumeText.length > 200 ? 92 : 88,
      interviewReadinessScore: 86,
      strengths: synthesizedStrengths,
      skillGaps: intelligence.skillGaps,
      targetCompanies: Array.isArray(metadata.targetTiers) && metadata.targetTiers.length > 0
        ? intelligence.targetCompanies
        : ['Linear', 'Stripe', 'Vercel', 'Notion', 'Figma'],
      summary: intelligence.summaryTemplate(targetRole, expLevel),
    };

    // 4. Connect to Supabase and persist into career_dna table
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const safePayload = {
          user_id: user.id,
          target_role: synthesizedDNA.targetRole,
          health_score: synthesizedDNA.resumeHealthScore,
          readiness_score: synthesizedDNA.interviewReadinessScore,
          strengths: synthesizedDNA.strengths,
          skill_gaps: synthesizedDNA.skillGaps,
          target_companies: synthesizedDNA.targetCompanies,
          summary: synthesizedDNA.summary,
          updated_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabase
          .from('career_dna')
          .upsert(safePayload, { onConflict: 'user_id' });

        if (dbError) {
          console.warn('career_dna upsert note:', dbError.message);
        }
      }
    } catch (dbEx) {
      console.warn('Supabase session note:', dbEx);
    }

    return NextResponse.json({
      success: true,
      profile: synthesizedDNA,
      fileName: file?.name || 'resume.pdf',
    });
  } catch (error: any) {
    console.error('Career DNA generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
