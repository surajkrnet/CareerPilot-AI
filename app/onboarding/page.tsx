'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Target,
  Layers,
  Code2,
  Building2,
  GraduationCap,
  Sparkles,
  Plus,
  X,
  User,
  MapPin,
  IndianRupee,
  Clock,
  Briefcase,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';
import { createClient } from '@/lib/supabase/client';
import ResumeUploadStep from '@/components/resume-upload-step';

// Dynamic skill suggestions tailored for each career track
const TRACK_SKILLS_MAP: Record<string, string[]> = {
  'Software Engineer / Full-Stack': [
    'Data Structures & Algorithms',
    'JavaScript / TypeScript',
    'Python',
    'Java & Spring Boot',
    'React & Next.js',
    'Node.js & Express',
    'PostgreSQL & SQL',
    'REST & GraphQL APIs',
    'Databases & Redis',
    'Git & Version Control',
    'System Design',
    'Docker & CI/CD',
  ],
  'AI & Machine Learning Engineer': [
    'Python',
    'Machine Learning',
    'Deep Learning',
    'PyTorch & TensorFlow',
    'NLP & Transformers',
    'Computer Vision',
    'LLMs & Agentic AI',
    'LangChain & LlamaIndex',
    'Vector DBs (Pinecone/Milvus)',
    'Model Evaluation & Fine-Tuning',
    'MLOps & Docker',
    'FastAPI Model Serving',
  ],
  'AI Product Manager': [
    'Product Strategy',
    'Product Discovery',
    'User Research & Interviews',
    'PRD Writing & Specs',
    'AI/ML Fundamentals',
    'LLMs & Prompt Engineering',
    'Agentic AI Architectures',
    'Product Analytics & Mixpanel',
    'A/B Experimentation',
    'GTM Strategy & Positioning',
    'SQL & Data Exploration',
    'Agile Sprints & Roadmaps',
  ],
  'Data Analyst / Data Science': [
    'SQL (Advanced Queries & CTEs)',
    'Excel & Advanced Modeling',
    'Python & Pandas / NumPy',
    'Statistics & Probability',
    'Data Visualization',
    'Power BI',
    'Tableau',
    'Data Cleaning & Wrangling',
    'A/B Testing & Hypothesis Testing',
    'Business Analytics & KPI Modeling',
  ],
  'UX/UI Designer': [
    'UX Research & Interviews',
    'User Flows & Information Architecture',
    'Wireframing & Low-Fi Mocks',
    'Interactive Prototyping',
    'Figma Component Systems',
    'Interaction Design & Micro-Animations',
    'Design Systems & Tokens',
    'Usability Testing',
    'Visual Design & Typography',
    'Design-to-Code Handoff',
  ],
  'Backend & Distributed Systems': [
    'Go / Golang',
    'Python & FastAPI',
    'Java / Kotlin & Spring Boot',
    'PostgreSQL & Database Sharding',
    'Redis & Distributed Caching',
    'Kafka & Event Streaming',
    'gRPC & Protocol Buffers',
    'Docker & Kubernetes',
    'Concurrency & Goroutines',
    'Microservice Orchestration',
  ],
  'Cloud & DevOps / SRE': [
    'Kubernetes (K8s) Clusters',
    'Docker & Containers',
    'Terraform & IaC',
    'AWS Cloud Architecture',
    'GCP / Google Cloud',
    'CI/CD Pipelines (GitHub Actions)',
    'Prometheus & Grafana Observability',
    'Linux Systems & Bash',
    'ArgoCD & GitOps',
    'SRE Reliability & Incident Response',
  ],
  'Mobile Engineer (iOS / Android)': [
    'React Native & Expo',
    'Swift & SwiftUI (iOS)',
    'Kotlin & Jetpack Compose (Android)',
    'Flutter & Dart',
    'Mobile State Architecture',
    'App Store & Play Store Deployment',
    'Offline-First Data Sync',
    'Push Notifications & Deep Linking',
    'Mobile Performance Profiling',
    'REST & GraphQL APIs',
  ],
  'Data Engineer': [
    'Advanced SQL & Query Optimization',
    'Python & PySpark',
    'Snowflake & BigQuery',
    'dbt (Data Build Tool)',
    'Apache Airflow / Dagster',
    'Apache Spark & Distributed Compute',
    'Data Lakehouse (Iceberg/Delta)',
    'Kafka Real-Time Streaming',
    'Dimensional Data Modeling',
    'Data Governance & Quality',
  ],
  'CyberSecurity / AppSec': [
    'OWASP Top 10 & Web App Defense',
    'Threat Modeling & Architecture Review',
    'OAuth 2.0 / SAML & IAM Security',
    'Penetration Testing & Remediation',
    'Cloud Security Posture (AWS/GCP)',
    'Vulnerability Scanning (SAST/DAST)',
    'Cryptography & TLS/SSL',
    'SIEM & Incident Response',
    'SOC2 & GDPR Compliance',
    'Zero Trust Architecture',
  ],
  'QA & Test Automation': [
    'Playwright E2E Automation',
    'Cypress Testing',
    'Jest & Vitest Unit Suites',
    'API Testing (Postman / Newman)',
    'CI/CD Automated Test Gateways',
    'Performance & Load Testing (k6)',
    'Mobile Automation (Appium)',
    'Visual Regression Testing',
    'Test Strategy & QA Planning',
    'TypeScript Test Scripts',
  ],
  'Blockchain & Web3': [
    'Solidity Smart Contracts',
    'Ethers.js / Viem / Wagmi Hooks',
    'Hardhat & Foundry Testing',
    'DeFi Protocols & Tokenomics',
    'Smart Contract Security & Audits',
    'Rust & Solana Ecosystem',
    'Zero-Knowledge Proofs (zk-SNARKs)',
    'IPFS & Decentralized Storage',
    'Web3 Wallet Authentication',
    'Layer 2 Scaling (Arbitrum / Optimism)',
  ],
};

export default function OnboardingPage() {
  const { profile, setProfile } = useCareer();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Personal Profile States
  const [candidateName, setCandidateName] = useState(profile.name || 'Rahul Sharma');
  const [currentRoleStatus, setCurrentRoleStatus] = useState('Final Year Student / Looking for Roles');
  const [degree, setDegree] = useState('B.Tech / B.E. Computer Science');
  const [university, setUniversity] = useState('Tier 1 / Leading Engineering Institute');
  const [gradYear, setGradYear] = useState('2025');
  const [expLevel, setExpLevel] = useState('0–1 years (Fresher / Early Career)');

  // 2. Career Preferences States
  const [selectedRole, setSelectedRole] = useState('Software Engineer / Full-Stack');
  const [preferredJobRole, setPreferredJobRole] = useState('Full-Stack Software Engineer');
  const [goalIntent, setGoalIntent] = useState('First tech job');
  const [preferredIndustry, setPreferredIndustry] = useState('AI / B2B SaaS & High-Growth Tech');
  const [preferredLocation, setPreferredLocation] = useState('Bengaluru / Remote');
  const [workPreference, setWorkPreference] = useState('Hybrid / Remote-First');
  const [preferredCompanySize, setPreferredCompanySize] = useState('High-Growth Tech Startups & Product Unicorns');
  const [expectedSalary, setExpectedSalary] = useState('₹18L - ₹28L LPA');
  const [noticePeriod, setNoticePeriod] = useState('Immediate / Available in 30 Days');

  // 3. Dynamic Skills & Custom Skills States
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'React & Next.js',
    'JavaScript / TypeScript',
    'Node.js & Express',
    'PostgreSQL & SQL',
    'Data Structures & Algorithms',
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');

  const [targetTiers, setTargetTiers] = useState<string[]>([
    'High-Growth Tech Startups (Linear, Vercel, Supabase, Razorpay)',
    'Big Tech / FAANG (Google, Meta, Apple, Microsoft)',
  ]);
  const [timeline, setTimeline] = useState('Actively Interviewing (Immediate / Next 30 Days)');

  // Restore saved state from localStorage or Supabase on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('careerpilot_dna_draft');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.candidateName) setCandidateName(parsed.candidateName);
        if (parsed.selectedRole) setSelectedRole(parsed.selectedRole);
        if (parsed.preferredJobRole) setPreferredJobRole(parsed.preferredJobRole);
        if (parsed.degree) setDegree(parsed.degree);
        if (parsed.university) setUniversity(parsed.university);
        if (parsed.gradYear) setGradYear(parsed.gradYear);
        if (parsed.expLevel) setExpLevel(parsed.expLevel);
        if (parsed.goalIntent) setGoalIntent(parsed.goalIntent);
        if (parsed.preferredLocation) setPreferredLocation(parsed.preferredLocation);
        if (parsed.workPreference) setWorkPreference(parsed.workPreference);
        if (parsed.expectedSalary) setExpectedSalary(parsed.expectedSalary);
        if (Array.isArray(parsed.selectedSkills) && parsed.selectedSkills.length > 0) {
          setSelectedSkills(parsed.selectedSkills);
        }
      }
    } catch (e) {
      console.warn('Draft load notice:', e);
    }
  }, []);

  // Dynamically update suggested skills when user switches role
  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    setPreferredJobRole(newRole);
    const suggested = TRACK_SKILLS_MAP[newRole] || TRACK_SKILLS_MAP['Software Engineer / Full-Stack'];
    const newSkills = suggested.slice(0, 5);
    setSelectedSkills(newSkills);
  };

  const roleOptions = [
    { title: 'Software Engineer / Full-Stack', desc: 'DSA, React, Node.js, Next.js, relational databases & modern APIs' },
    { title: 'AI & Machine Learning Engineer', desc: 'LLM agents, PyTorch, model evaluation, RAG pipelines & vector DBs' },
    { title: 'AI Product Manager', desc: 'PRDs, product discovery, AI scoping, metrics, roadmap & GTM strategy' },
    { title: 'Data Analyst / Data Science', desc: 'SQL, Python, Power BI, Tableau, statistics & business analytics' },
    { title: 'UX/UI Designer', desc: 'Figma design systems, interactive prototypes, user flows & usability research' },
    { title: 'Backend & Distributed Systems', desc: 'Microservices, Go, Python, distributed caching, Kafka & DB scaling' },
    { title: 'Cloud & DevOps / SRE', desc: 'Kubernetes, Docker, Terraform, CI/CD pipelines, AWS/GCP & reliability' },
    { title: 'Mobile Engineer (iOS / Android)', desc: 'React Native, Swift, Kotlin, Flutter & cross-platform apps' },
    { title: 'Data Engineer', desc: 'ETL pipelines, Snowflake, dbt, Spark, Airflow & data lakehouse modeling' },
    { title: 'CyberSecurity / AppSec', desc: 'OWASP Top 10, threat modeling, IAM security & penetration testing' },
    { title: 'QA & Test Automation', desc: 'Playwright, Cypress, CI/CD test gateways & performance profiling' },
    { title: 'Blockchain & Web3', desc: 'Solidity smart contracts, EVM, DeFi protocols & Web3 dApps' },
  ];

  const goalOptions = [
    'First tech job',
    'Career switch (Non-tech to Tech)',
    'Career growth / Promotion to Senior',
    'Higher salary & compensation boost',
    'Remote job / Global flexibility',
    'Startup / High-growth product unicorn',
    'MNC / Global Enterprise',
    'Freelancing / Contract engineering',
    'Entrepreneurship / Building my startup',
    'Higher studies preparation',
  ];

  const experienceOptions = [
    'Student',
    'Fresh Graduate',
    '0–1 years',
    '1–3 years',
    '3–5 years',
    '5+ years',
  ];

  const workPreferenceOptions = ['Remote-First', 'Hybrid (2-3 Days Office)', 'On-site'];

  const tierOptions = [
    'High-Growth Tech Startups (Linear, Vercel, Supabase, Razorpay)',
    'Big Tech / FAANG (Google, Meta, Apple, Microsoft)',
    'Remote-First Global Tech (Automattic, GitLab, Stripe)',
    'AI Research & Frontier Labs (OpenAI, Anthropic, Scale AI)',
    'Enterprise Cloud / FinTech (CRED, Postman, Datadog)',
  ];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
      setCustomSkillInput('');
    }
  };

  const toggleTier = (tier: string) => {
    if (targetTiers.includes(tier)) {
      setTargetTiers(targetTiers.filter((t) => t !== tier));
    } else {
      setTargetTiers([...targetTiers, tier]);
    }
  };

  const currentTrackSuggestions = TRACK_SKILLS_MAP[selectedRole] || TRACK_SKILLS_MAP['Software Engineer / Full-Stack'];

  const onboardingData = {
    candidateName,
    currentRoleStatus,
    goalIntent,
    targetRole: preferredJobRole || selectedRole,
    domain: selectedRole,
    selectedSkills,
    degree,
    university,
    gradYear,
    expLevel,
    preferredIndustry,
    preferredLocation,
    workPreference,
    preferredCompanySize,
    expectedSalary,
    noticePeriod,
    targetTiers,
    timeline,
  };

  // Step 1 Validation & Progression
  const handleProceedToStep2 = () => {
    setValidationError(null);
    if (!candidateName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (!degree.trim()) {
      setValidationError('Please specify your degree or education background.');
      return;
    }

    // Save draft
    try {
      localStorage.setItem('careerpilot_dna_draft', JSON.stringify(onboardingData));
    } catch (e) {}

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 Validation & Progression
  const handleProceedToStep3 = () => {
    setValidationError(null);
    if (selectedSkills.length < 2) {
      setValidationError('Please select or add at least 2 technical strengths.');
      return;
    }

    // Save profile to store & draft
    setProfile((prev) => ({
      ...prev,
      name: candidateName,
      targetRole: preferredJobRole || selectedRole,
      experienceLevel: expLevel,
      strengths: selectedSkills,
    }));

    try {
      localStorage.setItem('careerpilot_dna_draft', JSON.stringify(onboardingData));
    } catch (e) {}

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
  };

  return (
    <div className="min-h-[85vh] max-w-5xl mx-auto px-4 pt-28 pb-16 space-y-8">
      
      {/* Header Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="coral" size="sm">Career DNA Profiler</Badge>
            <span className="text-[11px] font-mono text-[#5db872]">● Multi-Track Calibration</span>
          </div>
          <h1 className="font-display text-4xl text-[#faf9f5]">Build Your AI Career DNA</h1>
          <p className="text-xs text-[#a09d96] mt-1">
            Calibrate your personal background, career goals, dynamic competencies, and preferences.
          </p>
        </div>

        {/* Stepper Indicator (3 Steps) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[
            { num: 1, label: 'Profile' },
            { num: 2, label: 'Skills & Intent' },
            { num: 3, label: 'Resume & DNA' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === s.num
                    ? 'bg-[#cc785c] text-white shadow-lg ring-2 ring-[#cc785c]/40'
                    : step > s.num
                    ? 'bg-[#5db872] text-white'
                    : 'bg-[#252320] text-[#6c6a64]'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-[11px] font-mono uppercase tracking-wider hidden sm:inline ${step === s.num ? 'text-[#faf9f5] font-bold' : 'text-[#6c6a64]'}`}>
                {s.label}
              </span>
              {s.num < 3 && <div className="w-6 sm:w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>
      </div>

      {validationError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* ══════════════════════════════════════════════════════
            STEP 1: PERSONAL PROFILE & CAREER PREFERENCES
           ══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            <Card variant="dark-elevated" className="p-8 sm:p-10 space-y-8 shadow-xl border-white/10">
              
              {/* SECTION 1: PERSONAL PROFILE */}
              <div className="space-y-4">
                <label className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                  <User className="w-4 h-4" />
                  <span>1. Personal &amp; Academic Background</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Full Name *</label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Current Role / Status</label>
                    <input
                      type="text"
                      value={currentRoleStatus}
                      onChange={(e) => setCurrentRoleStatus(e.target.value)}
                      placeholder="e.g. Final Year CS Undergrad / Junior Developer"
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Degree / Major *</label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="e.g. B.Tech Computer Science / MCA / BCA / Self-Taught"
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">College / University</label>
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="e.g. IIT / NIT / BITS / Anna University / VIT / BootCamp"
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Graduation Year</label>
                    <input
                      type="text"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      placeholder="2025 / 2026"
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Experience Level</label>
                    <select
                      value={expLevel}
                      onChange={(e) => setExpLevel(e.target.value)}
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                    >
                      {experienceOptions.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TARGET CAREER TRACK SELECTION (12 Tracks) */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <label className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>2. Target Career Track (Select Primary Track)</span>
                  </label>
                  <span className="text-[11px] text-[#6c6a64] font-mono">12 Tracks Available</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roleOptions.map((role) => {
                    const isSelected = selectedRole === role.title;
                    return (
                      <div
                        key={role.title}
                        onClick={() => handleRoleChange(role.title)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#1f1e1b] border-[#cc785c] text-white shadow-lg translate-x-1 ring-1 ring-[#cc785c]'
                            : 'bg-[#252320]/60 border-white/5 text-[#a09d96] hover:border-white/20 hover:bg-[#252320]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-display text-sm font-semibold ${isSelected ? 'text-[#faf9f5]' : 'text-[#d4d1ca]'}`}>
                            {role.title}
                          </h4>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#cc785c] shrink-0 mt-0.5" />}
                        </div>
                        <p className="text-[11px] text-[#6c6a64] mt-1 font-sans leading-relaxed">{role.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: JOB PREFERENCES & LOCATION */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <label className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                  <Briefcase className="w-4 h-4" />
                  <span>3. Work Preferences &amp; Target Compensation</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Preferred Location</label>
                    <input
                      type="text"
                      value={preferredLocation}
                      onChange={(e) => setPreferredLocation(e.target.value)}
                      placeholder="e.g. Bengaluru / Hyderabad / Remote"
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Work Mode</label>
                    <select
                      value={workPreference}
                      onChange={(e) => setWorkPreference(e.target.value)}
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                    >
                      {workPreferenceOptions.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#faf9f5] uppercase font-mono text-[11px]">Expected Package (INR LPA)</label>
                    <input
                      type="text"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      placeholder="e.g. ₹18L - ₹28L LPA"
                      className="w-full p-3 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                    />
                  </div>
                </div>
              </div>

              {/* Step 1 Continue Button */}
              <div className="flex justify-end pt-6 border-t border-white/10">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                  onClick={handleProceedToStep2}
                  className="font-mono text-xs uppercase tracking-wider px-8 h-12 bg-[#cc785c] hover:bg-[#a9583e]"
                >
                  Continue to Skills &amp; Intent (Step 2) ↗
                </Button>
              </div>

            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2: DYNAMIC SKILLS & MANUAL SKILL ENTRY & GOALS
           ══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            <Card variant="dark-elevated" className="p-8 sm:p-10 space-y-8 shadow-xl border-white/10">
              
              {/* Header with back navigation */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-2xl text-[#faf9f5]">Core Technical Strengths &amp; Career Goals</h3>
                  <p className="text-xs text-[#a09d96]">
                    Calibrated specifically for <strong className="text-[#cc785c]">{selectedRole}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-mono text-[#cc785c] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Profile</span>
                </button>
              </div>

              {/* SECTION A: PRIMARY CAREER GOAL INTENT (10 Goals) */}
              <div className="space-y-4">
                <label className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                  <Layers className="w-4 h-4" />
                  <span>A. Primary Career Goal &amp; Intent</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {goalOptions.map((intent) => {
                    const isSelected = goalIntent === intent;
                    return (
                      <div
                        key={intent}
                        onClick={() => setGoalIntent(intent)}
                        className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#1f1e1b] border-[#cc785c] text-[#faf9f5] font-semibold shadow-md ring-1 ring-[#cc785c]'
                            : 'bg-[#252320]/60 border-white/5 text-[#a09d96] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#cc785c]' : 'bg-white/20'}`} />
                          <span>{intent}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION B: DYNAMIC SKILLS & MANUAL SKILL TYPING */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <label className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    <span>B. Core Technical Strengths ({selectedSkills.length} Selected)</span>
                  </label>
                  <span className="text-[11px] text-[#6c6a64] font-mono">Click chips to toggle</span>
                </div>

                {/* Track-Specific Suggested Skill Chips */}
                <div className="flex flex-wrap gap-2">
                  {currentTrackSuggestions.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#cc785c] text-white font-bold shadow-md ring-1 ring-[#cc785c]'
                            : 'bg-[#1f1e1b] border border-white/10 text-[#a09d96] hover:text-white hover:border-white/30'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Added Skills Display */}
                {selectedSkills.filter((s) => !currentTrackSuggestions.includes(s)).length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#cc785c] block">Your Custom Added Skills:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.filter((s) => !currentTrackSuggestions.includes(s)).map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#252320] border border-[#cc785c]/40 text-[#faf9f5] flex items-center gap-1.5"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className="text-[#cc785c] hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Skill Entry Input */}
                <form onSubmit={handleAddCustomSkill} className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    placeholder="+ Add Custom Skill (e.g. Next.js 15, FastAPI, LangGraph, Redis, WebAssembly)..."
                    className="flex-1 p-2.5 bg-[#1f1e1b] border border-white/10 rounded-lg text-xs text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5 text-[#cc785c]" />}
                    className="text-xs h-10 px-4"
                  >
                    Add
                  </Button>
                </form>
              </div>

              {/* SECTION C: TARGET COMPANY TIERS */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <label className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                  <Building2 className="w-4 h-4" />
                  <span>C. Target Company Categories</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tierOptions.map((tier) => (
                    <div
                      key={tier}
                      onClick={() => toggleTier(tier)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        targetTiers.includes(tier)
                          ? 'bg-[#1f1e1b] border-[#cc785c] text-[#faf9f5] font-semibold'
                          : 'bg-[#252320]/40 border-white/5 text-[#6c6a64]'
                      }`}
                    >
                      {targetTiers.includes(tier) ? '✓ ' : '+ '} {tier}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2 CTA: Save & Proceed to Resume Upload */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-mono text-[#5db872]">
                  {saveSuccessMsg && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Profile draft saved!
                    </span>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                  onClick={handleProceedToStep3}
                  className="font-mono text-xs uppercase tracking-wider px-8 h-12 bg-[#cc785c] hover:bg-[#a9583e]"
                >
                  Save Profile &amp; Proceed to Resume (Step 3) ↗
                </Button>
              </div>

            </Card>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 3: RESUME UPLOAD & SYNTHESIS
           ══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
          >
            <Card variant="dark-elevated" className="p-8 sm:p-10 space-y-8 shadow-xl border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-display text-3xl text-[#faf9f5]">3. Resume Upload &amp; Career DNA Synthesis</h2>
                  <p className="text-xs text-[#a09d96]">
                    Upload your PDF / DOCX resume to extract verified metrics and synthesize your Career DNA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-mono text-[#cc785c] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Skills &amp; Intent</span>
                </button>
              </div>

              <ResumeUploadStep onboardingData={onboardingData} />
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
