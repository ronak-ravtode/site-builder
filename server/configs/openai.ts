import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.AI_API_KEY,
});

export default openai;