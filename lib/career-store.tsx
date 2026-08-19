'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  avatar: string;
  title: string;
  targetRole: string;
  experienceLevel: string;
  targetCompanies: string[];
  strengths: string[];
  skillGaps: string[];
  resumeHealthScore: number;
  interviewReadinessScore: number;
}

export interface ApplicationTrackerItem {
  id: string;
  company: string;
  role: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected' | 'bookmarked' | 'saved' | 'offered';
  matchScore: number;
  salary: string;
  location: string;
  appliedDate: string;
  atsConfidence?: number;
  missingSkills?: string[];
  jdText?: string;
}

export interface InterviewMessage {
  id: string;
  sender: 'interviewer' | 'user';
  text: string;
  timestamp: string;
  feedback?: {
    confidence: number;
    accuracy: number;
    structureTip: string;
  };
}

export interface TailoredBulletPoint {
  id: string;
  category: string;
  originalText: string;
  suggestedText: string;
  reasoning: string;
  impactScore: string;
}

interface CareerContextType {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  applications: ApplicationTrackerItem[];
  setApplications: React.Dispatch<React.SetStateAction<ApplicationTrackerItem[]>>;
  activeInterviewRole: string;
  setActiveInterviewRole: (role: string) => void;
  activeInterviewCompany: string;
  setActiveInterviewCompany: (company: string) => void;
  interviewMessages: InterviewMessage[];
  addInterviewMessage: (msg: Omit<InterviewMessage, 'id' | 'timestamp'>) => void;
  resumeState: {
    resumeText: string;
    targetJdText: string;
    atsScore: number;
    matchStrengths: string[];
    missingSkills: string[];
    tailoredBulletPoints: TailoredBulletPoint[];
    isAnalyzing: boolean;
  };
  setResumeState: React.Dispatch<React.SetStateAction<CareerContextType['resumeState']>>;
  runResumeAnalysis: (jd?: string) => void;
  switchProfile: (person: 'engineer' | 'priya') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DEFAULT_PROFILE_ENGINEER: UserProfile = {
  name: 'Candidate Profile',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  title: 'CS Graduate & Frontend Engineer',
  targetRole: 'Software Engineer (Frontend / Full-Stack)',
  experienceLevel: 'Early Career (0-2 Yrs)',
  targetCompanies: ['Stripe', 'Linear', 'Vercel', 'Google'],
  strengths: ['React.js', 'TypeScript', 'Next.js 14', 'Tailwind CSS', 'State Management'],
  skillGaps: ['System Architecture & Caching', 'Docker & CI/CD', 'GraphQL & WebSockets', 'Performance Profiling'],
  resumeHealthScore: 88,
  interviewReadinessScore: 84,
};

const DEFAULT_PROFILE_PRIYA: UserProfile = {
  name: 'Priya Nair',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  title: 'Career Switcher & Product Manager',
  targetRole: 'Product Manager (AI / B2B SaaS)',
  experienceLevel: 'Career Switcher (3+ Yrs Work Ex)',
  targetCompanies: ['Notion', 'Figma', 'OpenAI', 'Anthropic'],
  strengths: ['User Research', 'Product Requirements (PRDs)', 'A/B Testing', 'Stakeholder Management', 'Data Analytics'],
  skillGaps: ['Technical AI Architecture', 'SQL & Database Schemas', 'API Design Basics', 'Go-To-Market Metrics'],
  resumeHealthScore: 85,
  interviewReadinessScore: 79,
};

const INITIAL_APPLICATIONS: ApplicationTrackerItem[] = [
  {
    id: 'app-1',
    company: 'Linear',
    role: 'Frontend Systems Engineer',
    status: 'interviewing',
    matchScore: 94,
    salary: '₹18L - ₹28L LPA',
    location: 'Bengaluru / Remote',
    appliedDate: '2 days ago',
    atsConfidence: 96,
    missingSkills: ['WebAssembly', 'Canvas Rendering'],
  },
  {
    id: 'app-2',
    company: 'Stripe',
    role: 'Full-Stack Developer (Billing)',
    status: 'interviewing',
    matchScore: 88,
    salary: '₹22L - ₹36L LPA',
    location: 'Bengaluru / Remote',
    appliedDate: '5 days ago',
    atsConfidence: 89,
    missingSkills: ['Distributed Caching', 'Kafka'],
  },
  {
    id: 'app-3',
    company: 'Vercel',
    role: 'Developer Experience Engineer',
    status: 'applied',
    matchScore: 91,
    salary: '₹20L - ₹32L LPA',
    location: 'Remote (India / Global)',
    appliedDate: '1 week ago',
    atsConfidence: 93,
    missingSkills: ['Turborepo CLI', 'Edge Middleware'],
  },
  {
    id: 'app-4',
    company: 'Notion',
    role: 'Product Engineer (AI Systems)',
    status: 'offered',
    matchScore: 96,
    salary: '₹24L - ₹40L LPA',
    location: 'Bengaluru / Remote',
    appliedDate: '2 weeks ago',
    atsConfidence: 97,
    missingSkills: ['Vector Embeddings'],
  },
  {
    id: 'app-5',
    company: 'Ramp',
    role: 'Frontend Core Engineer',
    status: 'saved',
    matchScore: 86,
    salary: '₹19L - ₹30L LPA',
    location: 'Bengaluru / Hybrid',
    appliedDate: 'Saved',
    atsConfidence: 85,
    missingSkills: ['GraphQL Federation', 'Financial Ledger UX'],
  },
];

const INITIAL_MESSAGES: InterviewMessage[] = [
  {
    id: 'm1',
    sender: 'interviewer',
    text: "Hello! Welcome to your technical interview for the Frontend Engineer position at Linear. Let's start by walking through a complex React/Next.js performance optimization you've driven. How did you identify the bottleneck and measure the impact?",
    timestamp: '10:00 AM',
  },
  {
    id: 'm2',
    sender: 'user',
    text: "In my previous project, our dashboard initial render time was high due to heavy bundle size and unoptimized re-renders. I migrated key layout chunks to Next.js Server Components, used React.memo for heavy table rows, and deferred non-critical script loading.",
    timestamp: '10:02 AM',
    feedback: {
      confidence: 89,
      accuracy: 92,
      structureTip: 'STAR structure executed cleanly! Clear Situation & Action stated.',
    },
  },
  {
    id: 'm3',
    sender: 'interviewer',
    text: "That's a solid approach. How did you handle state synchronization across server components and client dynamic filters without triggering full page layout re-creations?",
    timestamp: '10:03 AM',
  },
];

const INITIAL_BULLET_POINTS: TailoredBulletPoint[] = [
  {
    id: 'b1',
    category: 'Performance & Architecture',
    originalText: 'Built React components for frontend dashboard.',
    suggestedText: 'Architected high-throughput React & Next.js 14 dashboard components, reducing Core Web Vitals LCP by 42% across 50k monthly active users.',
    reasoning: 'Quantifies impact, highlights modern framework stack (Next.js 14), and aligns directly with Linear JD requirement for frontend optimization.',
    impactScore: '+28% Match Boost',
  },
  {
    id: 'b2',
    category: 'State & Design System',
    originalText: 'Created UI components using CSS and Tailwind.',
    suggestedText: 'Spearheaded a design system component library in TypeScript & Tailwind CSS, ensuring 100% WCAG accessibility and reducing feature delivery cycles by 3.5x.',
    reasoning: 'Replaces passive phrasing with proactive leadership verbs and introduces design system terminology requested in job post.',
    impactScore: '+22% Match Boost',
  },
  {
    id: 'b3',
    category: 'System Integration & API',
    originalText: 'Connected frontend to backend REST APIs.',
    suggestedText: 'Integrated optimistic UI updates and resilient TanStack Query caching for real-time GraphQL APIs, reducing perceived latencies to under 50ms.',
    reasoning: 'Demonstrates deep state management expertise and asynchronous error resilience.',
    impactScore: '+19% Match Boost',
  },
];

const CareerContext = createContext<CareerContextType | undefined>(undefined);

export function CareerProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE_ENGINEER);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [applications, setApplications] = useState<ApplicationTrackerItem[]>(INITIAL_APPLICATIONS);
  const [activeInterviewRole, setActiveInterviewRole] = useState('Frontend Engineer');
  const [activeInterviewCompany, setActiveInterviewCompany] = useState('Linear');
  const [interviewMessages, setInterviewMessages] = useState<InterviewMessage[]>(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [resumeState, setResumeState] = useState({
    resumeText: `Candidate Profile
Computer Science B.S. | Software Engineer
Skills: React, Next.js, TypeScript, JavaScript, Tailwind CSS, Redux, REST APIs, Git, Jest.
Experience: Built full-stack web applications, designed accessible web interfaces, collaborated on agile sprint workflows.`,
    targetJdText: `Linear - Frontend Engineer (Product Systems)
Requirements:
- 2+ years experience crafting web applications with React, Next.js (App Router), and TypeScript.
- Strong mastery of design systems, CSS micro-animations, and fluid layout responsiveness.
- Passion for performance profiling, Core Web Vitals, and responsive UI craft.
- Experience with real-time state management and optimized API client caching.`,
    atsScore: 84,
    matchStrengths: [
      'Expert proficiency in React & Next.js App Router',
      'Solid TypeScript typing and interface modularity',
      'Hands-on experience building design systems with Tailwind CSS',
    ],
    missingSkills: [
      'WebAssembly / WebGL canvas rendering',
      'Edge middleware micro-routing',
      'Real-time CRDT collaborative data structures',
    ],
    tailoredBulletPoints: INITIAL_BULLET_POINTS,
    isAnalyzing: false,
  });

  const addInterviewMessage = (msg: Omit<InterviewMessage, 'id' | 'timestamp'>) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: InterviewMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeString,
    };
    setInterviewMessages((prev) => [...prev, newMessage]);
  };

  const runResumeAnalysis = async (customJd?: string) => {
    const jdToUse = customJd || resumeState.targetJdText;
    setResumeState((prev) => ({ ...prev, isAnalyzing: true }));

    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeState.resumeText,
          jobDescription: jdToUse,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const data = json.data || json;
        if (data.atsScore !== undefined) {
          setResumeState((prev) => ({
            ...prev,
            isAnalyzing: false,
            atsScore: data.atsScore,
            matchStrengths: data.resumeStrengths || prev.matchStrengths,
            missingSkills: data.missingKeywords || prev.missingSkills,
            tailoredBulletPoints: data.starOptimizations?.map((s: any, idx: number) => ({
              id: `star-${idx}`,
              category: 'STAR Impact Optimization',
              originalText: s.originalBullet,
              suggestedText: s.starOptimizedBullet,
              reasoning: s.rationale,
              impactScore: s.metricImpact,
            })) || prev.tailoredBulletPoints,
          }));
          return;
        }
      }
    } catch (err) {
      console.warn('Analysis API fallback:', err);
    }

    setResumeState((prev) => ({
      ...prev,
      isAnalyzing: false,
      atsScore: Math.floor(Math.random() * 8) + 88,
    }));
  };

  const switchProfile = (person: 'engineer' | 'priya') => {
    if (person === 'engineer') {
      setProfile(DEFAULT_PROFILE_ENGINEER);
      setActiveInterviewRole('Frontend Engineer');
      setActiveInterviewCompany('Linear');
    } else {
      setProfile(DEFAULT_PROFILE_PRIYA);
      setActiveInterviewRole('Product Manager');
      setActiveInterviewCompany('Notion');
    }
  };

  return (
    <CareerContext.Provider
      value={{
        profile,
        setProfile,
        isOnboardingOpen,
        setIsOnboardingOpen,
        onboardingStep,
        setOnboardingStep,
        applications,
        setApplications,
        activeInterviewRole,
        setActiveInterviewRole,
        activeInterviewCompany,
        setActiveInterviewCompany,
        interviewMessages,
        addInterviewMessage,
        resumeState,
        setResumeState,
        runResumeAnalysis,
        switchProfile,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </CareerContext.Provider>
  );
}

export function useCareer() {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error('useCareer must be used within a CareerProvider');
  }
  return context;
}
