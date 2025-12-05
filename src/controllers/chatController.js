import chat from "../models/chat.js";
import chatMessage from "../models/chatMessage.js";
import businessService from "../services/businessService.js";
import threadService from "../services/threadService.js";
import chatService from "../services/chatService.js";
import getAgentResponse from "../ai/responsesService.js";
import { models } from "../db.js";

async function createChat(req, res) {
  try {
    // Extract API key from header
    const apiKey = req.headers.authorization?.split(' ')[1];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // Find business by API key
    const business = await businessService.findBusinessByApiKey(apiKey);
    if (!business) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const phone_number = phone || '000-000-0000';

    // Create or find client
    const client = await businessService.findOrCreateClientForChat({
      business_id: business.id,
      name,
      email,
      phone_number: phone_number,
       
    });

    const thread = await threadService.createThread({
        business_id: business.id,
        client_id:client.id,
        client_phone_number: phone_number
    })

    // Create chat and initial message
    const chat = await chatService.createChatWithMessage({
      business_id: business.id,
      client_id: client.id, 
      thread_id: thread.id,
      message,
      sender_type: 'client',
      metadata: {source: 'website'} 
    });

    const messageToSend = 'Sender Name: ' + name + '\nMessage: ' + message;

    const response = await getAgentResponse(thread.id, messageToSend);
        console.log('AI Response:', response);
    if (response){

        const threadID = thread.id;
        await chatService.addToChat(threadID, response, 'system');
        businessService.updateAPIUsageForBusiness(business.id);

        return res.status(201).json({ 
                    threadID: thread.id,
                    message: response
        });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }   
}

async function continueChat (req, res) {
    try {
    // Extract API key from header
    const apiKey = req.headers.authorization?.split(' ')[1];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // Find business by API key
    const business = await businessService.findBusinessByApiKey(apiKey);
    if (!business) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const { threadID, message } = req.body;
    if (!threadID || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await chatService.addToChat(
      threadID,
      message,
      'client'
    );

    try {
        const response = await getAgentResponse(threadID, message);
        console.log('AI Response:', response);

        if (!response) {
            return res.status(500).json({ error: 'No response from AI' });
        }

    // Save AI response to chat
    await chatService.addToChat(
      threadID,
       response,
       'system'
    );
    businessService.updateAPIUsageForBusiness(business.id);


        return res.status(201).json({ 
            threadID: threadID,
            message: response
        });
    } catch (error) {
        console.error('AI Response Error:', error);
        return res.status(500).json({ error: 'Error getting AI response' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }   
}

async function findBusinessChats(req, res) {
  try {
    const businessId  = req.businessId;
    const chats = await chatService.getChats(businessId);
    res.status(200).json({ chats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function deleteChat(req, res) {
  try {
    const chatId = req.params.id;
    const businessId  = req.businessId;
    if(!businessId){
        return res.status(400).json({ error: 'business id is required in body/invalid' });
    }

    
    const chatToDelete = await models.Chat.findByPk(chatId);

    if(!chatToDelete){
        return res.status(404).json({ error: 'Chat not found for the given business' });
    }

    await chatService.deleteChat(chatId);
    res.status(200).json({ message: 'Chats deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function getChatMessages(req, res) {
  try {
    const businessId  = req.businessId;

    if(!businessId){
        return res.status(400).json({ error: 'business id is required in body/invalid' });
    }
 
     const chat_id = req.params.id;

    if (!chat_id) {
      return res.status(400).json({ error: 'chat id is required in params' });
    }

    // Find chat by primary key to ensure it exists
    const chatToGet = await models.Chat.findByPk(chat_id);

    if(!chatToGet){
        return res.status(404).json({ error: 'Chat not found for the given business' });
    }

    const messages = await chatService.getChatMessages(chat_id);

    res.status(200).json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  } 
}

export default {
    findBusinessChats,
    createChat,
    continueChat,
    deleteChat,
    getChatMessages
};