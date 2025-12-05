import { models } from '../db.js';
import axios from 'axios';
import businessService from './businessService.js';
import bclientService from './bclientService.js';
import threadService from './threadService.js';
import businessProfileService from './businessProfileService.js';
import { createThreadWithBusinessProfile } from '../ai/aiAssisstantService.js';
import getAgentResponse from '../ai/responsesService.js';
import chatService from './chatService.js';

async function createMessage(data) {
  return await models.Message.create(data);
}

async function getAllMessages() {
  return await models.Message.findAll();
}

async function getMessageById(id) {
  return await models.Message.findByPk(id);
}

async function updateMessage(id, data) {
  const message = await models.Message.findByPk(id);
  if (!message) return null;
  return await message.update(data);
}

async function deleteMessage(id) {
  return await models.Message.destroy({ where: { id } });
}

export async function sendWhatsAppMessage(to, text, id) {
  const business = await businessService.getBusinessById(id);
  if (!business) throw new Error('Business not found');

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${business.phone_number_id}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${business.waba_access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send message');
  }
}

async function processIncomingMessage(body) {
  const entry = body.entry?.[0];
  const message = entry?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    console.log('Non-message event received');
    return;
  }

  const wabaId = entry.id;
  const business = await businessService.getBusinessByWabaId(wabaId);
  if (!business) throw new Error("Business not found for WABA ID");

  const from = message.from;
  const text = message.text?.body;
  const contacts = entry.changes[0].value.contacts;
  const name = contacts?.[0]?.profile?.name || 'Unknown';

  // 1. Find or Create Client
  let client = await bclientService.findOrCreateClient(from, business.id, name);
  
  // 2. Manage Thread
  let threadId = client.thread_id;
  if (!threadId) {
    const thread = await threadService.createThread({
      business_id: business.id,
      client_id: client.id,
      client_phone_number: from,
    });
    threadId = thread.id;
    // Update client with new thread reference
    client = await bclientService.updateBClient(client.id, { thread_id: threadId });
  }

  // 3. Manage Chat History in DB
  let chat = await chatService.getChatByThreadAndClientId(threadId, client.id, business.id);
  if (!chat) {
    chat = await chatService.createChatWithMessage({
      business_id: business.id,
      client_id: client.id,
      thread_id: threadId,
      message: text,
      sender_type: 'client',
      metadata: { source: 'whatsapp' }
    });
  } else {
    await chatService.createChatMessage(chat.id, text, 'client');
  }

  // 4. AI Processing
  const profile = await businessProfileService.getProfileByBusinessId(business.id);
  
  let assistantThreadId = await threadService.findAssistantThreadId(threadId);
  if (!assistantThreadId) {
    assistantThreadId = await createThreadWithBusinessProfile(profile.system_prompt);
    await threadService.updateThread(threadId, { assistantThread_id: assistantThreadId });
  }

  try {
    const response = await getAgentResponse(threadId, text);
    if (response) {
      await sendWhatsAppMessage(from, response, business.id);
      await chatService.createChatMessage(chat.id, response, 'system');
      await businessService.updateAPIUsageForBusiness(business.id);
    }
  } catch (error) {
    console.error('Failed to get Agent response:', error);
  }
}

export default {
  createMessage,
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  sendWhatsAppMessage,
  processIncomingMessage
};