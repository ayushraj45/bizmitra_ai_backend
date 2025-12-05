import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "WhatsApp Business Assistant",
    instructions: `You are a helpful assistant for answering business inquiries on WhatsApp.
Use the "queryBusinessDetails" tool to get business info. If you cannot answer a question, escalate to a human using the "escalateToHuman" tool.`,
    model: "gpt-4-turbo",
    tools: [
      {
        type: "function",
        function: {
          name: "queryBusinessDetails",
          description: "Look up product or service info in the business knowledge base",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "The user's question or keywords" },
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "escalateToHuman",
          description: "Send the user's message to the business owner if the assistant cannot answer it",
          parameters: {
            type: "object",
            properties: {
              question: { type: "string", description: "The user's question that couldn’t be answered" },
            },
            required: ["question"]
          }
        }
      }
    ]
  });

  console.log("Assistant created! ID:", assistant.id);
}

createAssistant().catch(console.log('here is the error'), console.error);

export default createAssistant;
