import { createOpenAI } from '@ai-sdk/openai';

const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || '';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey,
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://careerpilot-ai-coach.vercel.app',
    'X-Title': 'CareerPilot AI',
  },
});

// Free Gemma model endpoint on OpenRouter
export const aiModel = openrouter('google/gemma-4-31b-it:free');

// Aliases for seamless backward compatibility across route handlers
export const claudeSonnetModel = aiModel;
export const getClaudeModel = () => aiModel;
export const getAIModel = () => aiModel;
