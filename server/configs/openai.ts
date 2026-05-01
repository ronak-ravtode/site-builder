import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://site-builder.onrender.com", // Optional, for OpenRouter rankings
    "X-Title": "AiSiteBuilder", // Optional
  }
});

export default openai;