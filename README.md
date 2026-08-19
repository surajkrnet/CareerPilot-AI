# 🚀 CareerPilot AI

LIVE APP LINK - https://careerpilot-ai-coach.vercel.app/

**Autonomous AI Career Operating System for Early-Career Engineers**

CareerPilot AI is a comprehensive, AI-powered platform designed to help software engineers and tech candidates prepare for interviews, optimize their resumes, practice technical communication, and discover highly relevant job opportunities. It replaces fragmented career tools with a single, unified "Career DNA" profile.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)
![OpenRouter](https://img.shields.io/badge/AI-OpenRouter_(Gemma_4)-FF4B4B)

## ✨ Core Features

*   **🧬 AI Career DNA Synthesizer:** Parses PDF resumes entirely server-side (zero binary corruption) to extract verified technical skills, strengths, and experience levels into a unified structural profile.
*   **📄 Resume Intelligence & ATS Match:** Evaluates the candidate's resume against a Target Job Description (JD). Provides a live ATS Score (0-100), Match Percentage, missing keywords, and rewrites weak bullet points using the quantifiable STAR method.
*   **🎙️ Live Mock Interview Studio:** A multi-turn conversational AI simulation grounded *strictly* in the candidate's real resume projects and the target JD. Features real-time evaluation meters for Delivery Confidence, Technical Accuracy, and STAR Structure.
*   **💼 Job Fit & Opportunity Hub:** Scrapes live job postings from LinkedIn, Indeed, Glassdoor, and Wellfound. Evaluates the candidate's Career DNA against live JDs to calculate Fit Scores and provides 1-click application tracking.
*   **📊 Kanban Application Tracker:** An integrated drag-and-drop board to track job applications from 'Saved' to 'Offered'.

## 🛠️ Tech Stack

*   **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion
*   **Backend / Database:** Supabase (PostgreSQL, Auth, Row-Level Security)
*   **AI Orchestration:** Vercel AI SDK (`@ai-sdk/openai`), OpenRouter API
*   **LLM Engine:** Google `gemma-4-31b-it:free` (Configured for deterministic JSON extraction)
*   **External APIs:** RapidAPI (JSearch) for real-time job scraping
*   **Utilities:** `pdf-parse` (Server-side document extraction), Zod (Schema validation)

## 🏗️ System Architecture

1.  **Auth & Context:** Users authenticate via Supabase. Their uploaded PDF is sanitized and parsed into `public.career_dna`.
2.  **AI Routing:** Next.js API Route Handlers pass the user's contextual DNA to the OpenRouter Gemma-4 model.
3.  **Structured Output:** The Vercel AI SDK forces the LLM to return strictly typed JSON (validated by Zod schemas) for UI rendering.
4.  **Atomic Persistence:** All AI generations (ATS scores, interview transcripts, job matches) are atomically upserted into Supabase with RLS policies ensuring data privacy.

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Supabase Account & Project
*   OpenRouter API Key
*   RapidAPI Account (for JSearch)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/careerpilot-ai.git](https://github.com/yourusername/careerpilot-ai.git)
   cd careerpilot-ai
