/**
 * Robust Server-Side PDF Text Extractor for Next.js App Router & Node.js runtime.
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

/**
 * Checks if the extracted text looks like genuine human-readable resume text
 */
export function isHumanResumeText(text: string): boolean {
  if (!text || text.length < 50) return false;
  const lower = text.toLowerCase();
  const resumeIndicators = [
    'experience', 'education', 'skills', 'projects', 'work',
    'technologies', 'summary', 'profile', 'engineer', 'developer',
    'bachelor', 'master', 'university', 'college', 'email', 'phone',
    'github', 'linkedin', 'achievements', 'responsibilities', 'frameworks',
    'languages', 'react', 'python', 'javascript', 'sql', 'management'
  ];

  let matches = 0;
  for (const word of resumeIndicators) {
    if (lower.includes(word)) matches++;
    if (matches >= 2) return true;
  }
  return text.split(/\s+/).length > 25;
}

/**
 * Standard PDF text extraction function
 */
export async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    const parseFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
    const data = await parseFn(fileBuffer);
    
    // Clean and sanitize text (remove control chars, excessive null bytes)
    let cleanedText = (data?.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    // Verify it's not raw stream gibberish
    if (cleanedText.length < 50 || /^[\x00-\x7F]*([A-Za-z0-9+/=]{40,})/.test(cleanedText.slice(0, 100))) {
      // Fallback basic text extraction if parser returns binary stream representation
      cleanedText = cleanedText.replace(/[^a-zA-Z0-9\s.,!?:;@#%&()_\-–—'"/]/g, ' ');
    }

    if (!cleanedText) {
      // Fallback stream text extraction if pdf-parse returns empty string
      const rawLatin = fileBuffer.toString('latin1');
      const textPieces: string[] = [];
      const tjPattern = /\(([^)]+)\)\s*Tj/g;
      let match;
      while ((match = tjPattern.exec(rawLatin)) !== null) {
        textPieces.push(match[1]);
      }
      cleanedText = textPieces.join(' ').replace(/[^a-zA-Z0-9\s.,!?:;@#%&()_\-–—'"/]/g, ' ').trim();
    }

    return cleanedText;
  } catch (error: any) {
    console.error('PDF Parse Error:', error);
    
    // Fallback stream decode instead of crashing
    try {
      const asciiFallback = fileBuffer
        .toString('utf-8')
        .replace(/[^a-zA-Z0-9\s.,!?:;@#%&()_\-–—'"/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (asciiFallback.length > 50) {
        return asciiFallback;
      }
    } catch {}

    throw new Error('Failed to parse PDF resume. Please ensure the file is an unencrypted PDF.');
  }
}

/**
 * Universal helper supporting both PDF and Text/Markdown files
 */
export async function parsePdfBuffer(buffer: Buffer, fileName = 'resume.pdf'): Promise<string> {
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return buffer.toString('utf-8').trim();
  }
  return extractTextFromPdf(buffer);
}

export { parsePdfBuffer as extractTextFromBuffer };
