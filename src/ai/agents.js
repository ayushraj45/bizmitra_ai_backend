import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import { Agent, Runner, run } from '@openai/agents';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const schedulerAgent = new Agent({
  name: 'Scheduler',
  instructions:
    `You are a scheduler agent, if you are speaking to the customer then it means you have been routed by a triage agent. Follow this routine to complete user requests:
     For new appointment:
        Ask the user for their availability ,
     `
});

const mathTutorAgent = new Agent({
  name: 'Math Tutor',
  instructions:
    'You provide help with math problems. Explain your reasoning at each step and include examples',
});

const userRequestAgent = new Agent({
  name: 'User Request Agent',
  instructions:
    "You determine which agent to use based on the kind of user request you recieve. Your options are: schedulerAgent (to create, update and delete an appointment of the client with the business owner), paymentAgent(to confirm if the payment is made) and ownerAgent(To create a task for the business owner for any kind of request beyond these).",
  handoffs: [schedulerAgent, paymentAgent, ownerAgent],
});


