/**
 * Bulletproof Server-Side PDF Text Extractor for Next.js App Router & Node.js runtime.
 * Supports pdf-parse v2 (PDFParse class), legacy function exports, and stream extraction.
 */

// Polyfill DOMMatrix stubs for pdf-parse v2 in Node.js serverless environment
if (typeof globalThis !== 'undefined') {
  if (typeof (globalThis as any).DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true;
      isIdentity = true;
      constructor(init?: any) {
        if (Array.isArray(init)) {
          this.a = init[0] ?? 1;
          this.b = init[1] ?? 0;
          this.c = init[2] ?? 0;
          this.d = init[3] ?? 1;
          this.e = init[4] ?? 0;
          this.f = init[5] ?? 0;
        }
      }
      multiply() { return this; }
      translate() { return this; }
      scale() { return this; }
      rotate() { return this; }
      inverse() { return this; }
      transformPoint(p?: any) { return p || { x: 0, y: 0, z: 0, w: 1 }; }
    };
  }

  if (typeof (globalThis as any).Path2D === 'undefined') {
    (globalThis as any).Path2D = class Path2D {
      addPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
    };
  }

  if (typeof (globalThis as any).ImageData === 'undefined') {
    (globalThis as any).ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(width = 1, height = 1) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    };
  }
}

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
 * Checks if text contains recognizable resume / dictionary words
 */
export function countRecognizableWords(text: string): number {
  if (!text) return 0;
  const words = text.match(/[a-zA-Z]{3,}/g) || [];
  return words.length;
}

/**
 * Checks if extracted text is valid human resume content
 */
export function isHumanResumeText(text: string): boolean {
  if (!text || text.length < 50) return false;
  return countRecognizableWords(text) >= 15;
}

/**
 * Core PDF text extraction function
 */
export async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  let cleanedText = '';

  // 1. Attempt PDFParse class (pdf-parse v2)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require('pdf-parse');
    const PDFParseClass = pdfModule.PDFParse || (pdfModule.default && pdfModule.default.PDFParse);

    if (PDFParseClass && typeof PDFParseClass === 'function') {
      const parser = new PDFParseClass({ data: fileBuffer });
      const textResult = await parser.getText();
      if (textResult?.text) {
        cleanedText = sanitizeText(textResult.text);
      }
      try {
        await parser.destroy();
      } catch {}
    } else if (typeof pdfModule === 'function') {
      const data = await pdfModule(fileBuffer);
      cleanedText = sanitizeText(data?.text || '');
    }
  } catch (error: any) {
    console.warn('pdf-parse v2 parser note:', error?.message || error);
  }

  // 2. Fallback stream text extraction if pdf-parse failed or returned empty
  if (!cleanedText || countRecognizableWords(cleanedText) < 15) {
    try {
      const rawLatin = fileBuffer.toString('latin1');
      const textPieces: string[] = [];

      // Match text operators (string) Tj and [(str)(ing)] TJ
      const tjPattern = /\(([^)]+)\)\s*Tj/g;
      let match;
      while ((match = tjPattern.exec(rawLatin)) !== null) {
        textPieces.push(match[1]);
      }

      const arrayTjPattern = /\[([^\]]+)\]\s*TJ/g;
      while ((match = arrayTjPattern.exec(rawLatin)) !== null) {
        const parts = match[1].match(/\(([^)]+)\)/g);
        if (parts) {
          textPieces.push(parts.map((p) => p.slice(1, -1)).join(' '));
        }
      }

      const streamCleaned = sanitizeText(textPieces.join(' '));
      if (countRecognizableWords(streamCleaned) >= 15) {
        cleanedText = streamCleaned;
      }
    } catch {}
  }

  // 3. Fallback ASCII decoder
  if (!cleanedText || countRecognizableWords(cleanedText) < 15) {
    const rawAscii = fileBuffer.toString('utf-8').replace(/[^a-zA-Z0-9\s.,!?:;@#%&()_\-–—'"/]/g, ' ');
    const sanitizedAscii = sanitizeText(rawAscii);
    if (countRecognizableWords(sanitizedAscii) >= 15) {
      cleanedText = sanitizedAscii;
    }
  }

  // Sanity Check
  const wordCount = countRecognizableWords(cleanedText);
  const isBase64Bytecode = /^[\x00-\x7F]*([A-Za-z0-9+/=]{60,})/.test(cleanedText.slice(0, 150));

  if (!cleanedText || wordCount < 10 || isBase64Bytecode) {
    throw new Error('Unable to extract text from PDF. Please paste resume text directly.');
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
