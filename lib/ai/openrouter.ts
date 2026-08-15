import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'CareerPilot AI Coach',
  },
});

// Standard model identifier for Claude 3.5 Sonnet on OpenRouter
export const claudeSonnetModel = openrouter.chat('anthropic/claude-3.5-sonnet');
export const getClaudeModel = () => claudeSonnetModel;
