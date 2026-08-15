import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

export function getClaudeModel() {
  const apiKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing in .env.local');
  }

  // If the key starts with 'sk-or-', route via OpenRouter endpoint
  if (apiKey.startsWith('sk-or-')) {
    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'CareerPilot AI Coach',
      },
    });

    return openrouter('anthropic/claude-3.5-sonnet');
  }

  // Direct native Anthropic Claude model
  return anthropic('claude-3-5-sonnet-20241022');
}
