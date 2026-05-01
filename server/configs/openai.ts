import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://site-builder-bf8p.onrender.com",
    "X-Title": "AiSiteBuilder",
  }
});

// Free models to try in order — if one is rate-limited, the next is tried
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-27b-it:free',
  'deepseek/deepseek-r1-0528:free',
];

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function callAI(messages: ChatMessage[]): Promise<string> {
  let lastError: any;

  for (const model of FREE_MODELS) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
      });
      const content = response.choices[0]?.message?.content;
      if (content) return content;
    } catch (err: any) {
      lastError = err;
      // Only retry on rate-limit (429) or not-found (404) errors
      if (err?.status === 429 || err?.status === 404) {
        console.log(`Model ${model} failed (${err.status}), trying next...`);
        continue;
      }
      throw err; // Re-throw other errors immediately
    }
  }

  throw lastError ?? new Error('All AI models failed');
}

export default openai;