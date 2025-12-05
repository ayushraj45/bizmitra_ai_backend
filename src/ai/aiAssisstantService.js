import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import { getOrCreateAssistant } from './assisstantConfig.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple mutex to prevent multiple runs on same thread
const threadLocks = new Map();

/**
 * Creates a new thread with business context
 */
export async function createThreadWithBusinessProfile(profilePrompt) {
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: `This is the business profile you will keep in mind when replying to messages of this thread, this is not visible to client. Check out the profile and wait for the client to say/ask something.
        ${profilePrompt}`,
      },
    ],
  });
  return thread.id;
}

/**
 * Cancel any active runs for a thread - SIMPLIFIED
 */
async function cancelActiveRuns(threadId) {
  try {
    console.log(`Checking for active runs on thread: ${threadId}`);
    
    const runs = await openai.beta.threads.runs.list(threadId);
    const activeRuns = runs.data.filter(run => 
      ['queued', 'in_progress', 'requires_action'].includes(run.status)
    );
    
    console.log(`Found ${activeRuns.length} active runs`);
    
    // Instead of cancelling, let's just wait for them to complete or timeout
    for (const run of activeRuns) {
      console.log(`Waiting for run ${run.id} to complete...`);
      try {
        // Wait up to 30 seconds for the run to complete
        await waitForRunToFinish(threadId, run.id, 30000);
      } catch (error) {
        console.warn(`Run ${run.id} didn't complete, trying to cancel...`);
        try {
            console.log('thread id at cacnel run ', threadId)
          await openai.beta.threads.runs.cancel(run.id, {thread_id: threadId});
          console.log(`Successfully cancelled run ${run.id}`);
        } catch (cancelError) {
          console.warn(`Failed to cancel run ${run.id}:`, cancelError.message);
          // Continue anyway - the error might resolve itself
        }
      }
    }
  } catch (error) {
    console.warn('Error handling active runs:', error.message);
    // Don't throw - we can continue anyway
  }
}

/**
 * Wait for a specific run to finish (helper function)
 */
async function waitForRunToFinish(threadId, runId, timeoutMs = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const run = await openai.beta.threads.runs.retrieve(runId, threadId );
    
    if (['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
      return run;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Run timeout');
}

/**
 * Wait for run completion with proper polling
 */
async function waitForRunCompletion(threadId, runId, maxWaitTime = 30000) {
  console.log(`Waiting for run ${runId} on thread ${threadId}`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const run = await openai.beta.threads.runs.retrieve(runId, {thread_id: threadId});
      
      if (run.status === 'completed') {
        console.log(`Run ${runId} completed successfully`);
        return run;
      }
      
      if (run.status === 'failed') {
        throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);
      }
      
      if (run.status === 'cancelled') {
        throw new Error('Run was cancelled');
      }
      
      if (run.status === 'requires_action') {
        console.log(`Run ${runId} requires action, handling tool calls...`);
        await handleToolCalls(threadId, run);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Short delay before re-polling
        continue;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error retrieving run:', error);
      throw error;
    }
  }
  
  throw new Error('Run timed out');
}

/**
 * Handle tool calls
 */
async function handleToolCalls(threadId, run) {
  const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];

  const tool_outputs = toolCalls.map((toolCall) => {
    const { id: tool_call_id, function: { name, arguments: rawArgs } } = toolCall;
    const args = JSON.parse(rawArgs);

    if (name === 'respondToMessage') {
      const { message } = args;
      console.log('→ [Tool] respondToMessage:', message);

      return {
        tool_call_id,
        output: message,
      };
    } else {
      console.warn('⚠️ Unknown tool:', name);
      return {
        tool_call_id,
        output: 'Tool not implemented',
      };
    }
  });

 await openai.beta.threads.runs.submitToolOutputs(run.id, {
    thread_id: threadId,
    tool_outputs,
  });



   return await waitForRunCompletion(threadId, run.id);
}

/**
 * Get the latest assistant message from thread
 */
async function getLatestAssistantMessage(threadId, runId) {
  // Step 1: Check the run steps

  console.log('problem is here perhaps')
  
//   const steps = await openai.beta.threads.runs.steps.list(runId, {threadId: threadId});
//   console.log('problem is here perhaps 2')

//   const latestStep = steps.data[0];
//   const isToolStep = latestStep.type === 'tool_calls';

//   if (isToolStep && latestStep.step_details?.tool_calls?.length) {
//     const toolCall = latestStep.step_details.tool_calls[0];

//     if (toolCall.function.name === 'respondToMessage') {
//       // Step 2: This is the tool you care about → return its result
//       return toolCall.function.output; // Already a string
//     }
//   }

  // Step 3: Otherwise, return latest assistant message as fallback
  const messages = await openai.beta.threads.messages.list(threadId, { limit: 10 });

  messages.data.forEach((msg) => {
    msg.content.forEach((item) => {
      if (item.type === 'text') {
        console.log('message log: ', item.text.value);
      }
    });
  });

  const assistantMessages = messages.data
    .filter(msg => msg.role === 'assistant')
    .sort((a, b) => b.created_at - a.created_at);


  console.log('problem is not here perhaps')


  return assistantMessages[0]?.content[0]?.text?.value || null;
}

/**
 * Main function to handle WhatsApp messages - ULTRA SIMPLIFIED
 */
export async function handleWabaMessage(threadId, message) {
    await cancelActiveRuns(threadId);
  // Validate inputs
  if (!threadId) {
    throw new Error('threadId is required');
  }
  if (!message) {
    throw new Error('message is required');
  }

  console.log(`\n=== Processing message for thread: ${threadId} ===`);
  console.log(`Message: ${message}`);

  // Simple mutex to prevent concurrent runs on same thread
  if (threadLocks.has(threadId)) {
    throw new Error('Another message is already being processed for this thread. Please wait.');
  }

  threadLocks.set(threadId, true);

  try {
    // Step 1: Handle any active runs
    await cancelActiveRuns(threadId);

    // Step 2: Get assistant ID
    const assistantId = await getOrCreateAssistant();
    console.log(`Using assistant: ${assistantId}`);

    // Step 3: Add user message to thread
    console.log('Adding message to thread...');
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });

    // Step 4: Create and start run
    console.log('Creating run...');
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    console.log(`Created run: ${run.id}`);

    const completedRun = await waitForRunCompletion(threadId, run.id);
    // Step 5: Wait for completion
//     if (completedRun.status === 'requires_action' && completedRun.required_action?.submit_tool_outputs) {
//   const toolResponse = await handleToolCalls(threadId, completedRun);
//   console.log(`=== Tool response used directly: ${toolResponse} ===\n`);
//   return toolResponse;
// }

// Otherwise, get assistant's message
const response = await getLatestAssistantMessage(threadId, run.id);
if (!response) {
  throw new Error('No response received from assistant');
}
console.log(`=== Assistant message response: ${response} ===\n`);
return response;

  } catch (error) {
    console.error(`❌ Error processing message for thread ${threadId}:`, error.message);
    throw error;
  } finally {
    // Always release the lock
    threadLocks.delete(threadId);
    cleanupStaleLocks();
  }
}

/**
 * Optional: Clean up old locks (call periodically if needed)
 */
export function cleanupStaleLocks() {
  threadLocks.clear();
}