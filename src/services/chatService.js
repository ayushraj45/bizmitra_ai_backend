import { content } from "googleapis/build/src/apis/content/index.js";
import { models } from "../db.js";

async function createChatWithMessage(data) {
    const { business_id, client_id, thread_id, message, sender_type, metadata } = data;
    
    // Create chat
    const chat = await models.Chat.create({
        business_id,
        client_id,
        thread_id,
        status: 'active',
        last_message_timestamp: new Date(),
        metadata: metadata
    });

    // Create initial message
    await models.ChatMessage.create({
        chat_id: chat.id,
        sender_type,
        message_type: 'text',
        content: message,
        metadata: {}
    });

    return chat;
}

async function addToChat(threadID, message, type) {
    console.log('Adding message to chat: ', { threadID, message, type });
    const chat = await models.Chat.findOne({ where: { thread_id: threadID } });
    if (!chat) {
        throw new Error('Chat not found for the given thread ID');
    }
    await models.ChatMessage.create({
        chat_id: chat.id,
        sender_type: type, 
        message_type: 'text',
        content: message,
        metadata: {}
    });

    return chat;
}

async function createChatMessage(chatId, message, senderType) {
    const chatMessage = await models.ChatMessage.create({
        chat_id: chatId,   
        sender_type: senderType, 
        content: message});
    return chatMessage;
}

async function getChats(businessId) {
    const chats = await models.Chat.findAll({
        where: { business_id: businessId },
        include: [
            {
                model: models.BClient,
                required: true,  // INNER JOIN to ensure client exists
                attributes: ['id', 'name', 'email']  // Including phone_number as it might be useful
            },
            
        ],
    });
    return chats;
}

async function deleteChat(chatId) {
    const result = await models.Chat.destroy({
        where: { id: chatId }
    });
    return result;
}

async function getChatMessages(chatId) {
    const messages = await models.ChatMessage.findAll({
        where: { chat_id: chatId }, 
        order : [['timestamp', 'ASC']]
    });
    return messages;
}

async function getChatByThreadAndClientId(threadId, clientId, businessId) {
    const chat = await models.Chat.findOne({
        where: { thread_id: threadId, client_id: clientId, business_id: businessId }
    });
    return chat;
}

export default {
    getChats,
    createChatWithMessage,
    addToChat,
    deleteChat,
    getChatMessages,
    getChatByThreadAndClientId,
    createChatMessage
};