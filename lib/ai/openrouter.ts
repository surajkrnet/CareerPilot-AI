import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'CareerPilot AI Coach',
  },
});

// Primary: Claude Sonnet 4.5 (cost-effective, supports structured outputs)
// Claude 3.5 Sonnet was retired from OpenRouter in Oct 2025
export const claudeSonnetModel = openrouter.chat('anthropic/claude-sonnet-4.5');

// Alias for backward compat with lib/ai/model.ts re-export
export const getClaudeModel = () => claudeSonnetModel;
