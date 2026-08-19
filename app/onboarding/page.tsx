'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ChevronDown,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCareer } from '@/lib/career-store';
import { createClient } from '@/lib/supabase/client';
import ResumeUploadStep from '@/components/resume-upload-step';

// ----------------------------------------------------------------------
// PREDEFINED DROPDOWN & SELECT OPTIONS AS PER MASTER REQUIREMENTS
// ----------------------------------------------------------------------

const EDUCATION_OPTIONS = [
  'High School',
  'Diploma',
  'B.Tech / B.E.',
  'BCA',
  'MCA',
  'B.Sc.',
  'M.Sc.',
  'MBA',
  'M.Tech',
  'PhD',
  'Other',
];

const EXPERIENCE_LEVEL_OPTIONS = [
  'Student',
  'Final-Year Student',
  'Fresh Graduate',
  '0–1 Years',
  '1–3 Years',
  '3–5 Years',
  '5+ Years',
  'Other',
];

const CAREER_TRACK_OPTIONS = [
  'Software Engineering',
  'Full-Stack Development',
  'Frontend Development',
  'Backend Development',
  'AI/ML Engineering',
  'Data Science',
  'Data Analytics',
  'AI Product Management',
  'Product Management',
  'UX/UI Design',
  'Cybersecurity',
  'Cloud/DevOps',
  'Business Analysis',
  'Digital Marketing',
  'Sales',
  'Finance',
  'Consulting',
  'Other',
];

const WORK_PREFERENCE_OPTIONS = [
  'Remote',
  'Hybrid',
  'On-site',
  'Flexible',
  'Other',
];

const JOB_TYPE_OPTIONS = [
  'Full-time',
  'Part-time',
  'Internship',
  'Contract',
  'Freelance',
  'Other',
];

const PREFERRED_INDUSTRY_OPTIONS = [
  'Technology',
  'FinTech',
  'HealthTech',
  'EdTech',
  'E-commerce',
  'SaaS',
  'AI',
  'Automotive',
  'Manufacturing',
  'Consulting',
  'Banking',
  'Healthcare',
  'Government',
  'Media',
  'Gaming',
  'Other',
];

const PREFERRED_LOCATION_OPTIONS = [
  'Bangalore',
  'Hyderabad',
  'Mumbai',
  'Delhi NCR',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Gurgaon',
  'Noida',
  'Remote',
  'Other',
];

const CAREER_GOALS = [
  { id: 'first_job', title: 'Land My First Tech Job', desc: 'Break into high-paying technology & product roles', icon: '🎯' },
  { id: 'switch', title: 'Switch Career Domain', desc: 'Transition seamlessly into AI, Data, or Product roles', icon: '🔄' },
  { id: 'growth', title: 'Accelerate Career Growth', desc: 'Level up from junior to senior / lead engineer', icon: '📈' },
  { id: 'higher_salary', title: 'Maximize Compensation', desc: 'Target top-tier ₹25L–₹50L LPA salary brackets', icon: '💰' },
  { id: 'remote', title: 'Secure Global Remote Role', desc: 'Work internationally from anywhere with flexibility', icon: '🌍' },
  { id: 'startup', title: 'Join High-Growth Startup', desc: 'Build 0-to-1 products with high equity ownership', icon: '🚀' },
  { id: 'mnc', title: 'Crack Tier 1 MNC / FAANG', desc: 'System design, DSA & large-scale distributed impact', icon: '🏢' },
  { id: 'freelancing', title: 'High-Ticket Freelancing', desc: 'Consult for international clients on high hourly rates', icon: '💻' },
  { id: 'entrepreneur', title: 'Launch AI Startup / Product', desc: 'Master technical chops to build indie products', icon: '💡' },
  { id: 'higher_studies', title: 'Higher Studies & Research', desc: 'Prepare portfolio for MS / M.Tech admissions', icon: '🎓' },
];

// Dynamic Track Skills Map calibrated for each career track
const TRACK_SKILLS_MAP: Record<string, string[]> = {
  'Software Engineering': [
    'Data Structures & Algorithms',
    'System Design',
    'Java & Spring Boot',
    'Python',
    'TypeScript',
    'React & Next.js',
    'PostgreSQL & SQL',
    'REST & GraphQL APIs',
    'Docker & CI/CD',
    'Git & Version Control',
    'Redis Caching',
    'Microservices',
  ],
  'Full-Stack Development': [
    'React 19 & Next.js',
    'TypeScript',
    'Node.js & Express',
    'PostgreSQL & Prisma',
    'Tailwind CSS',
    'RESTful APIs',
    'GraphQL',
    'MongoDB',
    'Docker',
    'State Management (Zustand/Redux)',
    'Authentication & JWT',
    'CI/CD Workflows',
  ],
  'Frontend Development': [
    'React & Next.js',
    'TypeScript',
    'JavaScript (ES6+)',
    'HTML5 & Modern CSS',
    'Tailwind CSS',
    'State Management (Zustand/Redux)',
    'Performance Optimization & Core Web Vitals',
    'Responsive Web Design',
    'Testing (Jest/Playwright)',
    'Webpack & Vite',
  ],
  'Backend Development': [
    'Node.js / Express',
    'Python (FastAPI / Django)',
    'Java & Spring Boot',
    'Go / Golang',
    'PostgreSQL & MySQL',
    'Redis & In-Memory Caches',
    'REST & gRPC APIs',
    'Kafka & Message Queues',
    'Microservices Architecture',
    'Docker & Kubernetes',
    'Database Indexing & Sharding',
  ],
  'AI/ML Engineering': [
    'Python',
    'PyTorch & TensorFlow',
    'Machine Learning Algorithms',
    'Deep Learning & Neural Networks',
    'LLMs & Agentic AI',
    'LangChain & LlamaIndex',
    'Vector Databases (Pinecone/Milvus)',
    'NLP & Transformers',
    'Model Evaluation & Fine-Tuning',
    'MLOps & Docker',
    'FastAPI Model Serving',
    'Computer Vision',
  ],
  'Data Science': [
    'Python',
    'R Programming',
    'SQL & Data Warehousing',
    'Pandas & NumPy',
    'Statistical Modeling',
    'Machine Learning',
    'Deep Learning',
    'Data Visualization (Matplotlib/Seaborn)',
    'Tableau / PowerBI',
    'Hypothesis Testing & A/B Tests',
    'Predictive Modeling',
  ],
  'Data Analytics': [
    'Advanced SQL (CTEs, Window Functions)',
    'Power BI',
    'Tableau',
    'Excel & Financial Modeling',
    'Python & Pandas',
    'Data Cleaning & ETL',
    'Business Intelligence & Dashboards',
    'A/B Testing & KPI Metrics',
    'Data Storytelling',
    'Google Analytics / Mixpanel',
  ],
  'AI Product Management': [
    'Product Strategy',
    'AI/ML Fundamentals',
    'LLMs & Prompt Engineering',
    'User Research & Interviews',
    'PRD Writing & Technical Specs',
    'Product Analytics (Mixpanel/Amplitude)',
    'A/B Experimentation',
    'GTM Positioning & Pricing',
    'Agentic AI Workflow Architecture',
    'Roadmap Planning & Agile',
    'SQL & Data Exploration',
  ],
  'Product Management': [
    'Product Strategy & Vision',
    'User Discovery & Interviews',
    'PRD Writing & Backlog Grooming',
    'Agile & Scrum Sprints',
    'A/B Testing & Conversion Optimization',
    'Product Analytics & KPIs',
    'Stakeholder Management',
    'Go-To-Market (GTM) Strategy',
    'Wireframing & Low-Fi Prototyping',
    'Customer Journey Mapping',
  ],
  'UX/UI Design': [
    'Figma & Design Systems',
    'User Research & Usability Testing',
    'Wireframing & Low-Fi Mocks',
    'Interactive Prototyping',
    'Information Architecture',
    'Typography & Spatial Grids',
    'Micro-Animations & Motion Design',
    'Design Tokens & Variables',
    'Design-to-Code Handoff',
    'WCAG Accessibility (a11y)',
  ],
  'Cybersecurity': [
    'OWASP Top 10 & AppSec',
    'Threat Modeling & Risk Assessment',
    'Network Security & Firewalls',
    'OAuth 2.0 / SAML & IAM Security',
    'Penetration Testing & Remediation',
    'Cloud Security (AWS/GCP Security Hub)',
    'Cryptography & TLS/SSL',
    'SIEM & Log Analysis',
    'SOC2 & ISO 27001 Compliance',
    'Vulnerability Scanning (SAST/DAST)',
  ],
  'Cloud/DevOps': [
    'Kubernetes (K8s) Cluster Management',
    'Docker & Containerization',
    'Terraform & Infrastructure as Code',
    'AWS Cloud Architecture',
    'GCP / Google Cloud',
    'CI/CD Pipelines (GitHub Actions/GitLab)',
    'Prometheus & Grafana Observability',
    'Linux Systems & Bash Scripting',
    'ArgoCD & GitOps',
    'SRE Reliability & Incident Response',
  ],
  'Business Analysis': [
    'Requirements Gathering & BRD Writing',
    'SQL & Database Queries',
    'BPMN & Process Mapping',
    'Stakeholder Communication',
    'Tableau / Power BI',
    'Agile User Stories & Acceptance Criteria',
    'Financial Modeling & Cost Benefit Analysis',
    'Gap Analysis',
  ],
  'Digital Marketing': [
    'SEO & Content Strategy',
    'Google Ads & SEM',
    'Meta / LinkedIn Ads',
    'Growth Hacking & Funnels',
    'Email Marketing & Automation',
    'Google Analytics (GA4)',
    'Copywriting & Landing Page Conversion',
    'A/B Testing',
  ],
  'Sales': [
    'B2B SaaS Sales',
    'Enterprise Lead Generation',
    'Cold Outreach & Email Sequences',
    'CRM Management (Salesforce/HubSpot)',
    'Contract Negotiation & Closing',
    'Sales Pipeline Velocity',
    'Discovery Calls & Demos',
  ],
  'Finance': [
    'Financial Modeling & Valuation',
    'Corporate Finance',
    'Accounting & Balance Sheets',
    'DCF & Comparable Analysis',
    'Advanced Excel & VBA',
    'Risk Management',
    'Investment Analysis',
  ],
  'Consulting': [
    'Structured Problem Solving & MECE',
    'Executive Presentation (Pyramid Principle)',
    'Market Sizing & Case Frameworks',
    'Financial Analysis',
    'Change Management',
    'Client Stakeholder Alignment',
  ],
  'Other': [
    'Problem Solving',
    'Communication & Leadership',
    'Project Management',
    'Data Analysis',
    'Technical Execution',
    'Strategy & Planning',
  ],
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams?.get('edit') === 'true';

  const { profile, setProfile } = useCareer();
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [isSavedLocally, setIsSavedLocally] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);

  // Form State with structured dropdown fields
  const [formData, setFormData] = useState({
    // Step 1: Personal & Academic Profile
    fullName: profile.name || '',
    education: 'B.Tech / B.E.',
    customEducation: '',
    degreeMajor: 'Computer Science & Engineering',
    university: 'National Institute of Technology / Tier 1-2 University',
    gradYear: '2025',
    experienceLevel: '0–1 Years',
    customExperienceLevel: '',
    targetCareerTrack: 'Full-Stack Development',
    customCareerTrack: '',
    workPreference: 'Hybrid',
    customWorkPreference: '',
    jobType: 'Full-time',
    customJobType: '',
    preferredIndustry: 'Technology',
    customPreferredIndustry: '',
    preferredLocation: 'Bangalore',
    customPreferredLocation: '',
    expectedPackage: '₹18L - ₹28L LPA',

    // Step 2: Goals & Dynamic Skills
    selectedGoal: 'first_job',
    selectedSkills: [] as string[],
  });

  // Check if user already completed onboarding
  useEffect(() => {
    const checkCompletion = async () => {
      const isCompletedLocal = typeof window !== 'undefined' && localStorage.getItem('onboarding_completed') === 'true';

      // If user has already completed onboarding and not in edit mode, route them straight to Dashboard
      if (isCompletedLocal && !isEditMode) {
        router.replace('/dashboard');
        return;
      }

      // Check Supabase if user exists and has career_dna
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: careerDna } = await supabase
            .from('career_dna')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (careerDna && !isEditMode) {
            localStorage.setItem('onboarding_completed', 'true');
            router.replace('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.warn('Onboarding check note:', err);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkCompletion();
  }, [isEditMode, router]);

  // Load saved draft or initialize skills on track change
  useEffect(() => {
    const saved = localStorage.getItem('careerpilot_onboarding_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          fullName: parsed.fullName || profile.name || prev.fullName,
        }));
      } catch (e) {
        console.warn('Draft parse note:', e);
      }
    }
  }, []);

  // Update dynamic skills when career track changes if no skills selected yet
  useEffect(() => {
    const track = formData.targetCareerTrack;
    const availableSkills = TRACK_SKILLS_MAP[track] || TRACK_SKILLS_MAP['Full-Stack Development'];
    
    // Pre-populate with first 5 skills if selectedSkills is empty
    setFormData((prev) => {
      if (prev.selectedSkills.length === 0) {
        return { ...prev, selectedSkills: availableSkills.slice(0, 5) };
      }
      return prev;
    });
  }, [formData.targetCareerTrack]);

  // Save draft to localStorage
  const saveDraft = (data = formData) => {
    localStorage.setItem('careerpilot_onboarding_draft', JSON.stringify(data));
    setIsSavedLocally(true);
    setTimeout(() => setIsSavedLocally(false), 2000);
  };

  const handleTrackChange = (track: string) => {
    const newSkills = TRACK_SKILLS_MAP[track] || TRACK_SKILLS_MAP['Other'];
    setFormData((prev) => {
      const updated = {
        ...prev,
        targetCareerTrack: track,
        // Reset skills to suggested top skills for the newly selected track
        selectedSkills: newSkills.slice(0, 5),
      };
      saveDraft(updated);
      return updated;
    });
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => {
      const exists = prev.selectedSkills.includes(skill);
      const updatedSkills = exists
        ? prev.selectedSkills.filter((s) => s !== skill)
        : [...prev.selectedSkills, skill];
      const updated = { ...prev, selectedSkills: updatedSkills };
      saveDraft(updated);
      return updated;
    });
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!formData.selectedSkills.includes(trimmed)) {
      setFormData((prev) => {
        const updated = { ...prev, selectedSkills: [...prev.selectedSkills, trimmed] };
        saveDraft(updated);
        return updated;
      });
    }
    setCustomSkillInput('');
  };

  // Step Validation
  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
      if (formData.education === 'Other' && !formData.customEducation.trim()) {
        errors.customEducation = 'Please specify your education';
      }
      if (formData.experienceLevel === 'Other' && !formData.customExperienceLevel.trim()) {
        errors.customExperienceLevel = 'Please specify your experience level';
      }
      if (formData.targetCareerTrack === 'Other' && !formData.customCareerTrack.trim()) {
        errors.customCareerTrack = 'Please specify your target career track';
      }
      if (formData.preferredLocation === 'Other' && !formData.customPreferredLocation.trim()) {
        errors.customPreferredLocation = 'Please specify your location';
      }
    }

    if (step === 2) {
      if (formData.selectedSkills.length < 2) {
        errors.selectedSkills = 'Please select at least 2 core skills or competencies';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      saveDraft();
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get effective values (handling 'Other')
  const effectiveEducation = formData.education === 'Other' ? formData.customEducation : formData.education;
  const effectiveExperience = formData.experienceLevel === 'Other' ? formData.customExperienceLevel : formData.experienceLevel;
  const effectiveTrack = formData.targetCareerTrack === 'Other' ? formData.customCareerTrack : formData.targetCareerTrack;
  const effectiveLocation = formData.preferredLocation === 'Other' ? formData.customPreferredLocation : formData.preferredLocation;
  const effectiveIndustry = formData.preferredIndustry === 'Other' ? formData.customPreferredIndustry : formData.preferredIndustry;
  const effectiveWorkPreference = formData.workPreference === 'Other' ? formData.customWorkPreference : formData.workPreference;
  const effectiveJobType = formData.jobType === 'Other' ? formData.customJobType : formData.jobType;

  // Metadata payload for Career DNA Synthesis & n8n Agent Workflow
  const onboardingPayload = {
    fullName: formData.fullName,
    education: effectiveEducation,
    degree: formData.degreeMajor,
    university: formData.university,
    gradYear: formData.gradYear,
    expLevel: effectiveExperience,
    targetRole: effectiveTrack,
    domain: effectiveTrack,
    workPreference: effectiveWorkPreference,
    jobType: effectiveJobType,
    preferredIndustry: effectiveIndustry,
    preferredLocation: effectiveLocation,
    expectedPackage: formData.expectedPackage,
    selectedGoal: formData.selectedGoal,
    selectedSkills: formData.selectedSkills,
  };

  if (isCheckingExisting) {
    return (
      <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] flex items-center justify-center transition-colors duration-200">
        <div className="flex items-center gap-3 text-sm font-mono text-[#cc785c]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading Career DNA Profiler...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-28 pb-20 space-y-8 text-[#141413] dark:text-[#faf9f5] transition-colors duration-200">
      
      {/* HEADER & STEPPER INDICATOR */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2">
          <Badge variant="coral" size="sm">
            {isEditMode ? 'Edit Career Profile & Preferences' : 'Career DNA Profiler'}
          </Badge>
          {isSavedLocally && (
            <Badge variant="success" size="sm" className="flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3 h-3" />
              <span>Draft Saved</span>
            </Badge>
          )}
        </div>

        <h1 className="font-display text-4xl sm:text-5xl text-[#141413] dark:text-[#faf9f5]">
          {isEditMode ? 'Update Your Career DNA' : 'Configure Your Career DNA'}
        </h1>
        <p className="text-sm text-[#6c6a64] dark:text-[#a09d96] max-w-xl mx-auto">
          {currentStep === 1 && 'Select your academic credentials, experience level, and target career direction.'}
          {currentStep === 2 && 'Calibrate your primary career goals and technical competencies.'}
          {currentStep === 3 && 'Upload your resume to trigger the AI Intelligence Engine Career DNA synthesis pipeline.'}
        </p>

        {/* STEP PROGRESS BAR */}
        <div className="flex items-center justify-center gap-3 pt-4 max-w-md mx-auto">
          {[
            { num: 1, label: 'Profile & Direction' },
            { num: 2, label: 'Goals & Competencies' },
            { num: 3, label: 'Resume & Agent' },
          ].map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div key={step.num} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    isCompleted
                      ? 'bg-[#5db872] text-[#141413]'
                      : isCurrent
                      ? 'bg-[#cc785c] text-white shadow-lg ring-4 ring-[#cc785c]/20'
                      : 'bg-[#efe9de] dark:bg-[#252320] text-[#6c6a64] border border-[#e6dfd8] dark:border-white/10'
                  }`}
                >
                  {isCompleted ? '✓' : step.num}
                </div>
                <span className={`text-[11px] font-mono ${isCurrent ? 'text-[#141413] dark:text-[#faf9f5] font-semibold' : 'text-[#6c6a64]'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FORM CARD CONTAINER */}
      <Card variant="dark-elevated" className="p-6 sm:p-10 border-[#e6dfd8] dark:border-white/10 shadow-xl bg-[#ffffff] dark:bg-[#252320]">
        
        {/* ================================================================ */}
        {/* STEP 1: PERSONAL, ACADEMIC & STRUCTURED PREFERENCES             */}
        {/* ================================================================ */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="border-b border-[#e6dfd8] dark:border-white/10 pb-4">
              <h2 className="font-display text-2xl text-[#141413] dark:text-[#faf9f5] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#cc785c]" />
                <span>1. Personal &amp; Career Preferences</span>
              </h2>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
                Select from predefined options. If your choice isn&apos;t listed, choose &quot;Other&quot; to specify manually.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Suraj K R"
                  className="w-full px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-sm text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                />
                {validationErrors.fullName && (
                  <p className="text-xs text-red-500">{validationErrors.fullName}</p>
                )}
              </div>

              {/* Education Level (Dropdown) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5]">
                  Education / Degree Level *
                </label>
                <div className="relative">
                  <select
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-sm text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] appearance-none cursor-pointer"
                  >
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#ffffff] dark:bg-[#1f1e1b] text-[#141413] dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6c6a64] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {formData.education === 'Other' && (
                  <input
                    type="text"
                    value={formData.customEducation}
                    onChange={(e) => setFormData({ ...formData, customEducation: e.target.value })}
                    placeholder="Please specify education degree..."
                    className="w-full mt-2 px-3.5 py-2.5 rounded-lg bg-[#faf9f5] dark:bg-[#181715] border border-[#cc785c]/40 text-xs text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                  />
                )}
              </div>

              {/* Degree / Branch / Major */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5]">
                  Major / Field of Study
                </label>
                <input
                  type="text"
                  value={formData.degreeMajor}
                  onChange={(e) => setFormData({ ...formData, degreeMajor: e.target.value })}
                  placeholder="e.g. Computer Science, Information Science, ECE"
                  className="w-full px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-sm text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                />
              </div>

              {/* Experience Level (Dropdown) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5]">
                  Experience Level *
                </label>
                <div className="relative">
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-sm text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] appearance-none cursor-pointer"
                  >
                    {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#ffffff] dark:bg-[#1f1e1b] text-[#141413] dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6c6a64] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {formData.experienceLevel === 'Other' && (
                  <input
                    type="text"
                    value={formData.customExperienceLevel}
                    onChange={(e) => setFormData({ ...formData, customExperienceLevel: e.target.value })}
                    placeholder="Please specify experience level..."
                    className="w-full mt-2 px-3.5 py-2.5 rounded-lg bg-[#faf9f5] dark:bg-[#181715] border border-[#cc785c]/40 text-xs text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                  />
                )}
              </div>

              {/* Target Career Track (Dynamic Driver Dropdown) */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#cc785c]" />
                    <span>Target Career Track (Dynamically Updates Skills) *</span>
                  </span>
                  <span className="text-[11px] text-[#cc785c] font-mono">18 Specializations</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.targetCareerTrack}
                    onChange={(e) => handleTrackChange(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border-2 border-[#cc785c]/60 text-sm font-semibold text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] appearance-none cursor-pointer shadow-inner"
                  >
                    {CAREER_TRACK_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#ffffff] dark:bg-[#1f1e1b] text-[#141413] dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#cc785c] absolute right-4 top-4 pointer-events-none" />
                </div>
                {formData.targetCareerTrack === 'Other' && (
                  <input
                    type="text"
                    value={formData.customCareerTrack}
                    onChange={(e) => setFormData({ ...formData, customCareerTrack: e.target.value })}
                    placeholder="Please specify your custom target career track..."
                    className="w-full mt-2 px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#181715] border border-[#cc785c] text-xs text-[#141413] dark:text-[#faf9f5] focus:outline-none"
                  />
                )}
              </div>

              {/* Work Preference (Dropdown) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5]">
                  Work Preference (Mode)
                </label>
                <div className="relative">
                  <select
                    value={formData.workPreference}
                    onChange={(e) => setFormData({ ...formData, workPreference: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-sm text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] appearance-none cursor-pointer"
                  >
                    {WORK_PREFERENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#ffffff] dark:bg-[#1f1e1b] text-[#141413] dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6c6a64] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Job Type (Dropdown) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5]">
                  Job Type
                </label>
                <div className="relative">
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-sm text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] appearance-none cursor-pointer"
                  >
                    {JOB_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#ffffff] dark:bg-[#1f1e1b] text-[#141413] dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6c6a64] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Preferred Industry (Dropdown) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5]">
                  Preferred Industry
                </label>
                <div className="relative">
                  <select
                    value={formData.preferredIndustry}
                    onChange={(e) => setFormData({ ...formData, preferredIndustry: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-sm text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] appearance-none cursor-pointer"
                  >
                    {PREFERRED_INDUSTRY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#ffffff] dark:bg-[#1f1e1b] text-[#141413] dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6c6a64] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {formData.preferredIndustry === 'Other' && (
                  <input
                    type="text"
                    value={formData.customPreferredIndustry}
                    onChange={(e) => setFormData({ ...formData, customPreferredIndustry: e.target.value })}
                    placeholder="Please specify preferred industry..."
                    className="w-full mt-2 px-3.5 py-2.5 rounded-lg bg-[#faf9f5] dark:bg-[#181715] border border-[#cc785c]/40 text-xs text-[#141413] dark:text-[#faf9f5] focus:outline-none"
                  />
                )}
              </div>

              {/* Preferred Location (Dropdown) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>Preferred Location</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.preferredLocation}
                    onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-sm text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] appearance-none cursor-pointer"
                  >
                    {PREFERRED_LOCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#ffffff] dark:bg-[#1f1e1b] text-[#141413] dark:text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6c6a64] absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {formData.preferredLocation === 'Other' && (
                  <input
                    type="text"
                    value={formData.customPreferredLocation}
                    onChange={(e) => setFormData({ ...formData, customPreferredLocation: e.target.value })}
                    placeholder="Please specify custom location..."
                    className="w-full mt-2 px-3.5 py-2.5 rounded-lg bg-[#faf9f5] dark:bg-[#181715] border border-[#cc785c]/40 text-xs text-[#141413] dark:text-[#faf9f5] focus:outline-none"
                  />
                )}
              </div>

            </div>

            {/* CTA Button */}
            <div className="pt-6 border-t border-[#e6dfd8] dark:border-white/10 flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextStep}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="bg-[#cc785c] hover:bg-[#a9583e] font-mono text-xs uppercase tracking-wider px-8"
              >
                Proceed to Goals &amp; Competencies ➔
              </Button>
            </div>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* STEP 2: DYNAMIC SKILLS & PRIMARY CAREER GOALS                    */}
        {/* ================================================================ */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="border-b border-[#e6dfd8] dark:border-white/10 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-[#141413] dark:text-[#faf9f5] flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-[#cc785c]" />
                    <span>2. Dynamic Competencies &amp; Goals</span>
                  </h2>
                  <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
                    Skills dynamically tailored for: <strong className="text-[#141413] dark:text-[#faf9f5] font-mono">{effectiveTrack}</strong>
                  </p>
                </div>
                <Badge variant="teal" size="sm">{formData.selectedSkills.length} Selected</Badge>
              </div>
            </div>

            {/* 10 Primary Career Goals Selection Grid */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5]">
                Primary Career Goal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CAREER_GOALS.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => {
                      setFormData((prev) => {
                        const updated = { ...prev, selectedGoal: goal.id };
                        saveDraft(updated);
                        return updated;
                      });
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      formData.selectedGoal === goal.id
                        ? 'bg-[#ffffff] dark:bg-[#181715] border-[#cc785c] shadow-md ring-1 ring-[#cc785c]'
                        : 'bg-[#faf9f5] dark:bg-[#1f1e1b] border-[#e6dfd8] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl">{goal.icon}</span>
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-xs text-[#141413] dark:text-[#faf9f5]">{goal.title}</h4>
                      <p className="text-[11px] text-[#6c6a64] leading-relaxed">{goal.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DYNAMIC SKILLS CHIPS FOR SELECTED CAREER TRACK */}
            <div className="space-y-3 pt-4 border-t border-[#e6dfd8] dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#141413] dark:text-[#faf9f5] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>Calibrated Skills for {effectiveTrack}</span>
                </label>
                <span className="text-[11px] text-[#6c6a64]">Click to toggle</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(TRACK_SKILLS_MAP[formData.targetCareerTrack] || TRACK_SKILLS_MAP['Other']).map((skill) => {
                  const isSelected = formData.selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#cc785c] text-white font-bold shadow-md'
                          : 'bg-[#faf9f5] dark:bg-[#1f1e1b] text-[#6c6a64] dark:text-[#a09d96] border border-[#e6dfd8] dark:border-white/10 hover:border-black/30 dark:hover:border-white/30'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>

              {validationErrors.selectedSkills && (
                <p className="text-xs text-red-500">{validationErrors.selectedSkills}</p>
              )}
            </div>

            {/* MANUAL CUSTOM SKILL INPUT */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-[#6c6a64] dark:text-[#a09d96] flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>+ Add Custom / Additional Skills</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                  placeholder="Type a skill and press Enter (e.g. Next.js, LangSmith, Tracing, AWS Lambda)"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-white/10 text-xs text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomSkill}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-6 border-t border-[#e6dfd8] dark:border-white/10 flex items-center justify-between">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrevStep}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Profile
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handleNextStep}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="bg-[#cc785c] hover:bg-[#a9583e] font-mono text-xs uppercase tracking-wider px-8"
              >
                Proceed to Resume Upload ➔
              </Button>
            </div>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* STEP 3: RESUME UPLOAD & CAREER DNA AGENT SYNTHESIS               */}
        {/* ================================================================ */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="border-b border-[#e6dfd8] dark:border-white/10 pb-4">
              <h2 className="font-display text-2xl text-[#141413] dark:text-[#faf9f5] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#cc785c]" />
                <span>3. Resume Intelligence &amp; Career DNA Agent</span>
              </h2>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
                Upload your resume (PDF/Text) to let AI Intelligence Engine extract your verified experience and synthesize your Career DNA.
              </p>
            </div>

            {/* Resume Upload Step Component */}
            <ResumeUploadStep
              onboardingData={onboardingPayload}
              onSynthesisStart={() => {
                // Set onboarding completed flag in localStorage
                localStorage.setItem('onboarding_completed', 'true');
              }}
            />

            <div className="pt-4 border-t border-[#e6dfd8] dark:border-white/10 flex items-center justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevStep}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back to Competencies
              </Button>
            </div>
          </motion.div>
        )}

      </Card>

    </div>
  );
}

export default function OnboardingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-mono text-[#cc785c]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading Career DNA Profiler...</span>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </React.Suspense>
  );
}
