/**
 * Production-Grade Server-Side PDF Text Extractor for Next.js App Router & Node.js
 * Powered by unpdf + pdf-parse with strict sanitization and zero binary leakage.
 */

import { extractText as extractTextUnpdf } from 'unpdf';

/**
 * Strips null bytes, unprintable ASCII control characters, and normalizes spacing
 */
export function sanitizeText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFF0-\uFFFF]/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Counts recognizable natural language words (>= 2 letters)
 */
export function countRecognizableWords(text: string): number {
  if (!text) return 0;
  const words = text.match(/[a-zA-Z]{2,}/g) || [];
  return words.length;
}

/**
 * Validates if extracted string is genuine readable resume text (not binary metadata or raw PDF bytecode)
 */
export function isHumanResumeText(text: string): boolean {
  if (!text || text.length < 30) return false;
  // Discard raw PDF structural bytecode
  if (text.startsWith('%PDF-') || text.includes('/Root') || text.includes('/Type /Catalog') || text.includes('endobj')) {
    return false;
  }
  return countRecognizableWords(text) >= 10;
}

/**
 * Core multi-engine PDF text extractor
 */
export async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  let cleanedText = '';

  // 1. Primary Engine: unpdf (Serverless & Node.js native, no canvas/worker dependencies)
  try {
    const uint8Data = new Uint8Array(fileBuffer);
    const result = await extractTextUnpdf(uint8Data);
    if (result && Array.isArray(result.text)) {
      const combined = result.text.join('\n\n');
      const sanitized = sanitizeText(combined);
      if (isHumanResumeText(sanitized)) {
        cleanedText = sanitized;
      }
    } else if (result && typeof (result as any).text === 'string') {
      const sanitized = sanitizeText((result as any).text);
      if (isHumanResumeText(sanitized)) {
        cleanedText = sanitized;
      }
    }
  } catch (unpdfErr: any) {
    console.warn('unpdf extraction notice:', unpdfErr?.message || unpdfErr);
  }

  // 2. Secondary Engine: pdf-parse v2 fallback
  if (!cleanedText || !isHumanResumeText(cleanedText)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfModule = require('pdf-parse');
      const PDFParseClass = pdfModule.PDFParse || (pdfModule.default && pdfModule.default.PDFParse);

      if (PDFParseClass && typeof PDFParseClass === 'function') {
        const parser = new PDFParseClass({ data: fileBuffer });
        const textResult = await parser.getText();
        if (textResult?.text) {
          const sanitized = sanitizeText(textResult.text);
          if (isHumanResumeText(sanitized)) {
            cleanedText = sanitized;
          }
        }
        try {
          await parser.destroy();
        } catch {}
      } else if (typeof pdfModule === 'function') {
        const data = await pdfModule(fileBuffer);
        const sanitized = sanitizeText(data?.text || '');
        if (isHumanResumeText(sanitized)) {
          cleanedText = sanitized;
        }
      }
    } catch (pdfParseErr: any) {
      console.warn('pdf-parse fallback notice:', pdfParseErr?.message || pdfParseErr);
    }
  }

  // 3. Tertiary Engine: PDF Stream Text Operator Extraction (Tj / TJ operators)
  if (!cleanedText || !isHumanResumeText(cleanedText)) {
    try {
      const rawLatin = fileBuffer.toString('latin1');
      const textPieces: string[] = [];

      const tjPattern = /\(([^)]+)\)\s*Tj/g;
      let match;
      while ((match = tjPattern.exec(rawLatin)) !== null) {
        if (match[1] && !match[1].startsWith('%PDF') && !match[1].includes('/Obj')) {
          textPieces.push(match[1]);
        }
      }

      const arrayTjPattern = /\[([^\]]+)\]\s*TJ/g;
      while ((match = arrayTjPattern.exec(rawLatin)) !== null) {
        const parts = match[1].match(/\(([^)]+)\)/g);
        if (parts) {
          textPieces.push(parts.map((p) => p.slice(1, -1)).join(' '));
        }
      }

      if (textPieces.length > 0) {
        const streamCleaned = sanitizeText(textPieces.join(' '));
        if (isHumanResumeText(streamCleaned)) {
          cleanedText = streamCleaned;
        }
      }
    } catch {}
  }

  // Final Quality Gate: Never return raw PDF bytecode or unparsed binary streams
  if (!cleanedText || !isHumanResumeText(cleanedText)) {
    throw new Error('Unable to extract plain text from this PDF format. Please paste your resume text directly into the box below.');
  }

  return cleanedText;
}

/**
 * Universal helper supporting PDF and Text/Markdown files
 */
export async function parsePdfBuffer(buffer: Buffer, fileName = 'resume.pdf'): Promise<string> {
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    const txt = sanitizeText(buffer.toString('utf-8'));
    if (countRecognizableWords(txt) < 10) {
      throw new Error('Unable to extract text from file. Please paste resume text directly.');
    }
    return txt;
  }
  return extractTextFromPdf(buffer);
}

export { parsePdfBuffer as extractTextFromBuffer };
export { extractTextFromPdf as parsePdf };
