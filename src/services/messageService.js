// services/messageService.js
import { Json } from 'sequelize/lib/utils';
import { models } from '../db.js';
import businessService from './businessService.js';
import bclientService from './bclientService.js';
import threadService from './threadService.js';
import businessProfileService from './businessProfileService.js';
import {handleWabaMessage, createThreadWithBusinessProfile} from '../ai/aiAssisstantService.js';
import getAgentResponse from '../ai/responsesService.js';
import chatService from './chatService.js';

/**
 * Creates a new Message record.
 * @param {object} data - The Message data.
 * @returns {Promise<object>} The created Message object.
 */
async function createMessage(data) {
  const message = await models.Message.create(data);
  return message;
}

/**
 * Retrieves all Message records.
 * @returns {Promise<Array<object>>} An array of Message objects.
 */
async function getAllMessages() {
  const messages = await models.Message.findAll();
  return messages;
}

/**
 * Retrieves a single Message record by its ID.
 * @param {string} id - The ID of the Message.
 * @returns {Promise<object|null>} The Message object if found, otherwise null.
 */
async function getMessageById(id) {
  const message = await models.Message.findByPk(id);
  return message;
}

/**
 * Updates an existing Message record.
 * @param {string} id - The ID of the Message to update.
 * @param {object} data - The updated Message data.
 * @returns {Promise<object|null>} The updated Message object if found, otherwise null.
 */
async function updateMessage(id, data) {
  const message = await models.Message.findByPk(id);
  if (!message) {
    return null;
  }
  await message.update(data);
  return message;
}

/**
 * Deletes a Message record by its ID.
 * @param {string} id - The ID of the Message to delete.
 * @returns {Promise<number>} The number of destroyed rows (0 or 1).
 */
async function deleteMessage(id) {
  const deletedRows = await models.Message.destroy({
    where: { id }
  });
  return deletedRows;
}

export async function sendWhatsAppMessage(to, text, id) {

  const business = await businessService.getBusinessById(id);

  if (!business) {
    throw new Error('Business not found');
  }

  const response = await fetch(`https://graph.facebook.com/v18.0/${business.phone_number_id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${business.waba_access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Error sending message:', data);
    throw new Error(data.error?.message || 'Unknown error');
  }

  return data;
}

async function processIncomingMessage(body) {
  const entry = body.entry?.[0];
  const message = entry?.changes?.[0]?.value?.messages?.[0];
  if (message) {
  const wabaId= entry.id; 
  const business = await businessService.getBusinessByWabaId(wabaId);
  const from = message.from;
  const text = message.text?.body;
  const contacts = entry.changes[0].value.contacts;
  const name = contacts && contacts[0]?.profile?.name;
  const readable = JSON.stringify(body);
  
  if (!business) throw new Error("Business not found");

  let client = await bclientService.findOrCreateClient(from, business.id, name);
  let threadId = client.thread_id;

  if(!threadId){
    const thread = await threadService.createThread({
      business_id: business.id,
      client_id:client.id,
      client_phone_number: from,
    })

    threadId=thread.id;
  }

  client = await bclientService.updateBClient(client.id, ({thread_id:threadId, business_id: business.id}))

  let chat = await chatService.getChatByThreadAndClientId(threadId,client.id,business.id);

  if(!chat) {
  chat = await chatService.createChatWithMessage({
    business_id: business.id,
    client_id: client.id, 
    thread_id: threadId,
    message: text,
    sender_type: 'client',
    metadata: {source: 'whatsapp'} 
  });
}

  await chatService.createChatMessage(chat.id, text, 'client');

  const profile = await businessProfileService.getProfileByBusinessId(business.id); 

  let assistantThread_id = await threadService.findAssistantThreadId(threadId);
  console.log('thread we got from db somehow? ', assistantThread_id)
  if(!assistantThread_id){
    assistantThread_id = await createThreadWithBusinessProfile(profile.system_prompt);
    await threadService.updateThread(threadId, {assistantThread_id: assistantThread_id});
  }

  console.log('Before sending over to Assistant, ', assistantThread_id)
  try {
  const response = await getAgentResponse(threadId, text);

  if(response){
    await sendWhatsAppMessage(from, response, business.id);
    await chatService.createChatMessage(chat.id, response, 'system');
    businessService.updateAPIUsageForBusiness(business.id);
    
  }
  // Send response back to WhatsApp
  console.log('Assistant response:', response);
} catch (error) {
  console.error('Failed to get response:', error);
  // Handle error appropriately
}

  } else {
    console.log('Non-message event:', JSON.stringify(body));
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
