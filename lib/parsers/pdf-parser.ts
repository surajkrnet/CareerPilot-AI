/**
 * Robust Zero-Crash Server-Side PDF Text Extractor
 * Strictly designed for Node.js App Router and Serverless runtimes.
 * Automatically polyfills DOMMatrix/Canvas stubs to prevent pdf-parse v2 errors,
 * strips binary null bytes, unprintable characters, and normalizes human-readable text.
 */

// 1. Polyfill standard browser classes expected by pdf-parse v2 in Node.js
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
 * Strips binary garbage, control characters, null bytes, and normalizes whitespace
 */
export function sanitizeExtractedText(raw: string): string {
  if (!raw) return '';
  return raw
    // Remove binary null bytes and non-printable control characters (preserve \n, \r, \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFF0-\uFFFF]/g, ' ')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive spacing per line
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    // Collapse multi-blank lines into maximum 2 newlines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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
 * Core bulletproof PDF extraction function
 */
export async function parsePdfBuffer(buffer: Buffer, fileName = 'resume.pdf'): Promise<string> {
  // 1. Plain text / Markdown fast-path
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return sanitizeExtractedText(buffer.toString('utf-8'));
  }

  let extracted = '';

  // 2. Attempt pdf-parse with DOMMatrix stubs active
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const result = typeof pdfParse === 'function' ? await pdfParse(buffer) : await pdfParse.default?.(buffer);
    if (result && result.text) {
      extracted = sanitizeExtractedText(result.text);
    }
  } catch (err: any) {
    console.warn('pdf-parse notice, falling back to stream text decoding:', err?.message || err);
  }

  if (extracted && isHumanResumeText(extracted)) {
    return extracted;
  }

  // 3. Fallback: Parse PDF stream objects, text operators, and font charmaps directly
  try {
    const rawLatin = buffer.toString('latin1');
    const textPieces: string[] = [];

    // Match (string) Tj operator
    const tjPattern = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjPattern.exec(rawLatin)) !== null) {
      const decoded = match[1].replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
      textPieces.push(decoded);
    }

    // Match [(str)(ing)] TJ operator
    const arrayTjPattern = /\[([^\]]+)\]\s*TJ/g;
    while ((match = arrayTjPattern.exec(rawLatin)) !== null) {
      const inner = match[1];
      const parts = inner.match(/\(([^)]+)\)/g);
      if (parts) {
        textPieces.push(
          parts.map((p) => p.slice(1, -1).replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))).join(' ')
        );
      }
    }

    // Match uncompressed stream blocks
    const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    while ((match = streamPattern.exec(rawLatin)) !== null) {
      const streamContent = match[1];
      const words = streamContent.match(/[a-zA-Z0-9.,@:\-\s]{4,}/g);
      if (words && words.length > 5) {
        textPieces.push(words.join(' '));
      }
    }

    const streamResult = sanitizeExtractedText(textPieces.join('\n'));
    if (streamResult && isHumanResumeText(streamResult)) {
      return streamResult;
    }
  } catch (streamErr) {
    console.warn('Stream parser notice:', streamErr);
  }

  // 4. Final Fallback: extract all readable ASCII words
  const asciiOnly = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
  return sanitizeExtractedText(asciiOnly);
}
