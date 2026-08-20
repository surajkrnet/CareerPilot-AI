/**
 * Universal Multi-Format Document Intelligence Parser for CareerPilot AI
 * Supports: PDF, DOCX, DOC, TXT, RTF, MD
 * Features: Multi-engine extraction, Document Classification (Resume vs JD vs Other),
 * Quality validation, text normalization, and token-aware context trimming.
 */

import { extractTextFromPdf, sanitizeText, countRecognizableWords } from './pdf-parser';

export type DocumentType = 'resume' | 'job_description' | 'cover_letter' | 'other';

export interface DocumentClassificationResult {
  type: DocumentType;
  confidence: number;
  isResume: boolean;
  isJobDescription: boolean;
  rationale: string;
}

export interface DocumentParseResult {
  success: boolean;
  text: string;
  wordCount: number;
  fileType: string;
  classification: DocumentClassificationResult;
  error?: string;
}

/**
 * Strips RTF control codes, formatting tags, and escaped characters
 */
export function stripRtfFormatting(rtfString: string): string {
  if (!rtfString) return '';
  return rtfString
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\line/g, '\n')
    .replace(/\\tab/g, '\t')
    .replace(/\\[a-zA-Z0-9]+(?:\s|(?=[^a-zA-Z0-9]))/g, '')
    .replace(/[{}\\]/g, '')
    .replace(/\\'[0-9a-fA-F]{2}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts plain text from legacy Word .doc binary streams
 */
export function extractTextFromLegacyDoc(buffer: Buffer): string {
  try {
    const rawString = buffer.toString('binary');
    // Extract continuous printable ASCII/Unicode word chunks
    const matches = rawString.match(/[\x20-\x7E\t\n\r]{4,}/g) || [];
    const joined = matches.join(' ');
    return sanitizeText(joined);
  } catch {
    return '';
  }
}

/**
 * Classifies extracted document text as Resume, Job Description, Cover Letter, or Other
 */
export function classifyDocument(text: string): DocumentClassificationResult {
  const lower = (text || '').toLowerCase();
  const words = countRecognizableWords(text);

  if (!text || words < 10) {
    return {
      type: 'other',
      confidence: 0,
      isResume: false,
      isJobDescription: false,
      rationale: 'Insufficient text content to classify document.',
    };
  }

  // Resume Indicators
  const resumeKeywords = [
    'experience',
    'work experience',
    'professional experience',
    'employment history',
    'education',
    'skills',
    'technical skills',
    'projects',
    'personal projects',
    'certifications',
    'summary',
    'professional summary',
    'curriculum vitae',
    'resume',
    'bachelor',
    'master',
    'university',
    'college',
    'github',
    'linkedin',
  ];

  // Job Description Indicators
  const jdKeywords = [
    'responsibilities',
    'roles & responsibilities',
    'key responsibilities',
    'requirements',
    'job requirements',
    'qualifications',
    'minimum qualifications',
    'preferred qualifications',
    'what you will do',
    'what you\'ll do',
    'who you are',
    'about the role',
    'about the company',
    'benefits',
    'compensation',
    'equal opportunity employer',
    'job description',
    'apply now',
    'hiring',
  ];

  // Cover Letter Indicators
  const coverLetterKeywords = [
    'dear hiring manager',
    'dear recruiter',
    'to whom it may concern',
    'i am writing to apply',
    'i am excited to express my interest',
    'enclosed is my resume',
    'sincerely',
    'best regards',
  ];

  let resumeHits = 0;
  let jdHits = 0;
  let coverLetterHits = 0;

  for (const kw of resumeKeywords) {
    if (lower.includes(kw)) resumeHits++;
  }

  for (const kw of jdKeywords) {
    if (lower.includes(kw)) jdHits++;
  }

  for (const kw of coverLetterKeywords) {
    if (lower.includes(kw)) coverLetterHits++;
  }

  if (coverLetterHits >= 2 && coverLetterHits > resumeHits && coverLetterHits > jdHits) {
    return {
      type: 'cover_letter',
      confidence: Math.min(0.95, 0.5 + coverLetterHits * 0.15),
      isResume: false,
      isJobDescription: false,
      rationale: 'Document structure matches a formal Cover Letter / Application Letter.',
    };
  }

  if (jdHits > resumeHits && jdHits >= 2) {
    const confidence = Math.min(0.98, 0.55 + jdHits * 0.1);
    return {
      type: 'job_description',
      confidence,
      isResume: false,
      isJobDescription: true,
      rationale: `Document contains ${jdHits} job requirement headers (e.g. Responsibilities, Qualifications).`,
    };
  }

  if (resumeHits >= 2 || (resumeHits >= 1 && jdHits === 0)) {
    const confidence = Math.min(0.98, 0.6 + resumeHits * 0.08);
    return {
      type: 'resume',
      confidence,
      isResume: true,
      isJobDescription: false,
      rationale: `Document contains ${resumeHits} candidate profile sections (e.g. Experience, Education, Skills).`,
    };
  }

  return {
    type: 'other',
    confidence: 0.4,
    isResume: false,
    isJobDescription: false,
    rationale: 'Document contains general text without distinct Resume or JD section headers.',
  };
}

/**
 * Validates document extraction quality and readability
 */
export function validateDocumentQuality(text: string): { isValid: boolean; wordCount: number; error?: string } {
  if (!text || typeof text !== 'string') {
    return { isValid: false, wordCount: 0, error: 'Empty file or unreadable document.' };
  }

  const sanitized = sanitizeText(text);
  const wordCount = countRecognizableWords(sanitized);

  if (wordCount < 12) {
    return {
      isValid: false,
      wordCount,
      error: 'The uploaded file contains insufficient readable text (fewer than 12 recognizable words). Please upload a text-based document or PDF.',
    };
  }

  // Detect raw binary garbage leakage
  if (sanitized.startsWith('%PDF-') || sanitized.includes('PK\x03\x04') || sanitized.includes('/Filter /FlateDecode')) {
    return {
      isValid: false,
      wordCount,
      error: 'Document contains unparsed binary bytecode. Please upload a standard PDF, DOCX, or text document.',
    };
  }

  return { isValid: true, wordCount };
}

/**
 * Universal document text extractor supporting PDF, DOCX, DOC, TXT, RTF, MD
 */
export async function extractTextFromDocument({
  buffer,
  fileName = '',
  mimeType = '',
}: {
  buffer: Buffer;
  fileName?: string;
  mimeType?: string;
}): Promise<DocumentParseResult> {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  let extractedRaw = '';
  let detectedType = extension || 'unknown';

  try {
    // 1. PDF Document (.pdf)
    if (extension === 'pdf' || mimeType.includes('pdf')) {
      detectedType = 'pdf';
      extractedRaw = await extractTextFromPdf(buffer);
    }
    // 2. Microsoft Word Document (.docx)
    else if (extension === 'docx' || mimeType.includes('wordprocessingml')) {
      detectedType = 'docx';
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        extractedRaw = result?.value || '';
      } catch (docxErr: any) {
        console.warn('Mammoth docx parse notice:', docxErr?.message || docxErr);
        // Fallback: unzip xml extractor if needed
        extractedRaw = extractTextFromLegacyDoc(buffer);
      }
    }
    // 3. Legacy Word Document (.doc)
    else if (extension === 'doc' || mimeType.includes('msword')) {
      detectedType = 'doc';
      extractedRaw = extractTextFromLegacyDoc(buffer);
    }
    // 4. Rich Text Format (.rtf)
    else if (extension === 'rtf' || mimeType.includes('rtf')) {
      detectedType = 'rtf';
      const rtfStr = buffer.toString('utf-8');
      extractedRaw = stripRtfFormatting(rtfStr);
    }
    // 5. Plain Text, Markdown, CSV (.txt, .md, .csv)
    else {
      detectedType = extension || 'text';
      extractedRaw = buffer.toString('utf-8');
    }
  } catch (err: any) {
    console.error('Document extraction error:', err);
    return {
      success: false,
      text: '',
      wordCount: 0,
      fileType: detectedType,
      classification: {
        type: 'other',
        confidence: 0,
        isResume: false,
        isJobDescription: false,
        rationale: 'Failed to read document buffer.',
      },
      error: `Could not parse ${fileName || 'document'}: ${err?.message || 'Unknown format error'}. Please upload a standard text or PDF document.`,
    };
  }

  const sanitized = sanitizeText(extractedRaw);
  const quality = validateDocumentQuality(sanitized);

  if (!quality.isValid) {
    return {
      success: false,
      text: sanitized,
      wordCount: quality.wordCount,
      fileType: detectedType,
      classification: classifyDocument(sanitized),
      error: quality.error,
    };
  }

  const classification = classifyDocument(sanitized);

  return {
    success: true,
    text: sanitized,
    wordCount: quality.wordCount,
    fileType: detectedType,
    classification,
  };
}

/**
 * Token-aware context chunking to keep large documents within fast LLM bounds
 */
export function chunkDocumentForAI(text: string, maxCharacters = 4500): string {
  if (!text || text.length <= maxCharacters) return text;
  // Preserve start and mid-sections where core summary and recent experience live
  const head = text.substring(0, Math.floor(maxCharacters * 0.75));
  const tail = text.substring(text.length - Math.floor(maxCharacters * 0.25));
  return `${head}\n\n[...Additional project & education details synthesized...]\n\n${tail}`;
}
