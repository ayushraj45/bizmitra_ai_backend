import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optional: give your assistant a unique name/ID in your DB if you want to persist it
const ASSISTANT_NAME = 'WABA_Global_Assistant';

// const tools = [
//   {
//     type: 'function',
//     function: {
//       name: 'respondToMessage',
//       description: 'You will respond to the user queries based on thread context.',
//       parameters: {
//         type: 'object',
//         properties: {
//           message: { type: 'string' },
//         },
//         required: ['message'],
//       },
//     },
//   },
// ];

// Cache assistant ID across app lifecycle
let assistantId;

/**
 * Creates or retrieves a global assistant with the correct config.
 */
export async function getOrCreateAssistant() {
  if (assistantId) return assistantId;

  // Optional: search for existing assistant by name
  const all = await openai.beta.assistants.list({ limit: 20 });
  const existing = all.data.find((a) => a.name === ASSISTANT_NAME);

//   if (existing) {
//     assistantId = existing.id;
//     return assistantId;
//   }

  const assistant = await openai.beta.assistants.create({
    name: ASSISTANT_NAME,
    instructions: 'You are a WhatsApp assistant that helps small businesses respond to clients. Always be helpful, short, and friendly. Business info will be in the thread system message. The business information is already in the thread so refer to that if a user has a business query.',
    
    model: 'gpt-4o',
  });

  assistantId = assistant.id;
  return assistantId;
}
