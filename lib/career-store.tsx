'use client';

import React, { createContext, useContext, useState } from 'react';

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
  location: string;
  salary: string;
  matchScore: number;
  appliedDate: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  jdText: string;
}

export interface InterviewMessage {
  id: string;
  sender: 'interviewer' | 'user';
  text: string;
  timestamp: string;
  feedback?: {
    confidence: number;
    accuracy: number;
    structureTip?: string;
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

export interface CareerContextType {
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
  addInterviewMessage: (text: string, sender: 'interviewer' | 'user') => void;
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
  switchProfile: (person: 'rahul' | 'priya') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DEFAULT_PROFILE_RAHUL: UserProfile = {
  name: 'Rahul Sharma',
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
    role: 'Frontend Engineer - Product Systems',
    location: 'Remote / Bengaluru',
    salary: '₹28L - ₹42L LPA',
    matchScore: 94,
    appliedDate: '2026-08-10',
    status: 'interviewing',
    jdText: 'Looking for a Frontend Engineer with expert knowledge in Next.js, Framer Motion, and design systems to craft world-class software craft.',
  },
  {
    id: 'app-2',
    company: 'Stripe',
    role: 'Software Engineer - Dashboard & Apps',
    location: 'Bengaluru / Hyderabad',
    salary: '₹35L - ₹52L LPA',
    matchScore: 91,
    appliedDate: '2026-08-08',
    status: 'interviewing',
    jdText: 'Architecting financial dashboards with high reliability, performance tuning, and React micro-frontends.',
  },
  {
    id: 'app-3',
    company: 'Vercel',
    role: 'Developer Relations / Frontend Specialist',
    location: 'Remote India',
    salary: '₹26L - ₹38L LPA',
    matchScore: 89,
    appliedDate: '2026-08-12',
    status: 'applied',
    jdText: 'Building next-generation web applications, open-source demos, and developer docs for Next.js App Router.',
  },
  {
    id: 'app-4',
    company: 'Google',
    role: 'Associate Software Engineer',
    location: 'Bengaluru / Hyderabad',
    salary: '₹32L - ₹48L LPA',
    matchScore: 82,
    appliedDate: '2026-08-02',
    status: 'saved',
    jdText: 'Core infrastructure and user-facing frontend development for Google Workspace suite.',
  },
  {
    id: 'app-5',
    company: 'Figma',
    role: 'Product Engineer - Canvas & UI',
    location: 'Remote / Pune',
    salary: '₹30L - ₹45L LPA',
    matchScore: 96,
    appliedDate: '2026-07-28',
    status: 'offered',
    jdText: 'Creating collaborative design tools using WebGL, WebAssembly, and React state architectures.',
  },
  {
    id: 'app-6',
    company: 'Datadog',
    role: 'Frontend Engineer',
    location: 'Bengaluru / Gurgaon',
    salary: '₹24L - ₹36L LPA',
    matchScore: 78,
    appliedDate: '2026-07-15',
    status: 'rejected',
    jdText: 'Data visualization and real-time observability telemetry UI dashboards.',
  },
];

const INITIAL_MESSAGES: InterviewMessage[] = [
  {
    id: 'm1',
    sender: 'interviewer',
    text: "Hello Rahul! Welcome to your technical interview for the Frontend Engineer position at Linear. Let's start by walking through a complex React/Next.js performance optimization you've driven. How did you identify the bottleneck and measure the impact?",
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
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE_RAHUL);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [applications, setApplications] = useState<ApplicationTrackerItem[]>(INITIAL_APPLICATIONS);
  const [activeInterviewRole, setActiveInterviewRole] = useState('Frontend Engineer');
  const [activeInterviewCompany, setActiveInterviewCompany] = useState('Linear');
  const [interviewMessages, setInterviewMessages] = useState<InterviewMessage[]>(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [resumeState, setResumeState] = useState({
    resumeText: `Rahul Sharma
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
      'Advanced CI/CD pipeline automation',
      'Optimistic state mutation & offline-first caching',
    ],
    tailoredBulletPoints: INITIAL_BULLET_POINTS,
    isAnalyzing: false,
  });

  const addInterviewMessage = (text: string, sender: 'interviewer' | 'user') => {
    const newMessage: InterviewMessage = {
      id: `msg-${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(sender === 'user' && {
        feedback: {
          confidence: Math.floor(Math.random() * 12) + 84,
          accuracy: Math.floor(Math.random() * 10) + 88,
          structureTip: 'Strong technical explanation with clear architectural rationale.',
        },
      }),
    };

    setInterviewMessages((prev) => [...prev, newMessage]);

    if (sender === 'user') {
      setTimeout(() => {
        const responses = [
          "Excellent observation. Following up on that: how do you balance rapid feature delivery with code quality and test coverage when building complex UI components?",
          "Spot on. Can you walk me through how you structured error boundary fallbacks and telemetry logging for critical user flows?",
          "Great depth! Now let's shift to a scenario question: Imagine a customer reports a memory leak during long-session usage in your app. What profiling tools and steps would you use to isolate the leak?",
        ];
        const randomResp = responses[Math.floor(Math.random() * responses.length)];
        const interviewerMsg: InterviewMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'interviewer',
          text: randomResp,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setInterviewMessages((prev) => [...prev, interviewerMsg]);
      }, 1200);
    }
  };

  const runResumeAnalysis = async (jd?: string) => {
    setResumeState((prev) => ({ ...prev, isAnalyzing: true }));
    const targetJd = jd || resumeState.targetJdText;

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeState.resumeText,
          targetJdText: targetJd,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setResumeState((prev) => ({
            ...prev,
            isAnalyzing: false,
            atsScore: data.analysis.atsScore || 91,
            matchStrengths: data.analysis.matchStrengths || prev.matchStrengths,
            missingSkills: data.analysis.missingSkills || prev.missingSkills,
            tailoredBulletPoints: data.analysis.tailoredBulletPoints || prev.tailoredBulletPoints,
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

  const switchProfile = (person: 'rahul' | 'priya') => {
    if (person === 'rahul') {
      setProfile(DEFAULT_PROFILE_RAHUL);
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
