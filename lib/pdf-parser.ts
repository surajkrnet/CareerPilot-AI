/**
 * Robust zero-crash PDF and document text extractor for Next.js App Router
 */

export async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
  // 1. Plain text / Markdown files
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return buffer.toString('utf-8');
  }

  // 2. Try standard pdf-parse with safe try/catch
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    if (data && data.text && data.text.trim().length > 20) {
      return data.text.trim();
    }
  } catch (err) {
    console.warn('Standard pdf-parse notice, applying stream regex extractor:', err);
  }

  // 3. Pure binary/stream regex fallback extractor (guaranteed 0 dependencies & 0 canvas crashes)
  try {
    const raw = buffer.toString('latin1');
    const textBlocks: string[] = [];

    // Extract text from (text) Tj and [(t)(e)(x)(t)] TJ PDF objects
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(raw)) !== null) {
      textBlocks.push(match[1]);
    }

    const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = arrayTjRegex.exec(raw)) !== null) {
      const inner = match[1];
      const parts = inner.match(/\(([^)]+)\)/g);
      if (parts) {
        textBlocks.push(parts.map((p) => p.slice(1, -1)).join(' '));
      }
    }

    // Also extract clean text stream blocks
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    while ((match = streamRegex.exec(raw)) !== null) {
      const streamContent = match[1];
      const words = streamContent.match(/[a-zA-Z0-9.,@:\-\s]{4,}/g);
      if (words && words.length > 5) {
        textBlocks.push(words.join(' '));
      }
    }

    const fallbackResult = textBlocks.join('\n').replace(/\\r|\\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (fallbackResult.length > 30) {
      return fallbackResult;
    }
  } catch (streamErr) {
    console.warn('Fallback stream parser error:', streamErr);
  }

  // 4. Final fallback: sanitize readable ASCII words
  return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
}
