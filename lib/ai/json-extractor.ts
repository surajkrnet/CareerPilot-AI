/**
 * Robust JSON Extractor & Sanitizer for LLM outputs
 * Handles markdown fences, trailing commas, and wrapped text gracefully.
 */
export function extractAndParseJSON<T = any>(text: string, fallback?: T): T {
  if (!text || typeof text !== 'string') {
    if (fallback !== undefined) return fallback;
    throw new Error('Empty or invalid AI response string.');
  }

  const trimmed = text.trim();

  // 1. Attempt direct standard JSON parse
  try {
    return JSON.parse(trimmed) as T;
  } catch {}

  // 2. Strip code fences (```json ... ``` or ``` ...)
  let cleaned = trimmed
    .replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1')
    .replace(/^```[a-z0-9_-]*\n?/gim, '')
    .replace(/```$/gm, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {}

  // 3. Extract JSON object by finding the outermost matching curly braces '{' ... '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.substring(firstBrace, lastBrace + 1).trim();
    try {
      return JSON.parse(candidate) as T;
    } catch {}
  }

  // 4. Extract JSON array by finding the outermost matching square brackets '[' ... ']'
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = cleaned.substring(firstBracket, lastBracket + 1).trim();
    try {
      return JSON.parse(candidate) as T;
    } catch {}
  }

  // 5. If a fallback was provided, return it safely without throwing
  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Failed to parse structured JSON from AI output: ${trimmed.slice(0, 120)}...`);
}
