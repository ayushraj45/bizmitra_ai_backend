//This is likely not oging to work we will need to indivually do what we can for our functions to improve this and then we can combine everything together
import OpenAI from "openai";
import { queryBusinessDetails, escalateToHuman } from "./tools.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const assistant_id = "YOUR_ASSISTANT_ID"; // or create dynamically

export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

export async function handleMessage(thread_id, user_msg) {
  // Add message to thread
  await openai.beta.threads.messages.create(thread_id, {
    role: "user",
    content: user_msg,
  });

  // Run the assistant
  const run = await openai.beta.threads.runs.create(thread_id, {
    assistant_id,
  });

  // Wait for run to complete (polling)
  let runStatus;
  do {
    await new Promise((r) => setTimeout(r, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread_id, run.id);
  } while (runStatus.status !== "completed");

  // Get messages (assistant response)
  const messages = await openai.beta.threads.messages.list(thread_id);
  return messages.data[0].content[0].text.value;
}
