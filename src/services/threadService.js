import { models } from "../db.js";

async function createThread(data) {
  return await models.Thread.create(data);
}

async function getAllThreads() {
  return await models.Thread.findAll();
}

async function getThreadById(id) {
  return await models.Thread.findByPk(id);
}

async function updateThread(id, data) {
  const thread = await models.Thread.findByPk(id);
  if (!thread) return null;
  return await thread.update(data);
}

async function deleteThread(id) {
  return await models.Thread.destroy({ where: { id } });
}

async function findThreadByPhoneNumber(phoneNumber, assistantId) {
  return await models.Thread.findOne({
    where: {
      client_phone_number: phoneNumber,
      assisstant_id: assistantId,
    },
  });
}

// BUG FIX: Variable 'client' was undefined, changed to 'thread'
async function findOrCreateThread(phoneNumber, assistantId) {
  let thread = await findThreadByPhoneNumber(phoneNumber, assistantId);
  if (!thread) {
    thread = await createThread({
      client_phone_number: phoneNumber,
      assisstant_id: assistantId, 
    });
  }
  return thread;
}

async function findAssistantThreadId(threadId) {
  const thread = await getThreadById(threadId);
  return thread?.assistantThread_id;
}

export default {
  createThread,
  getAllThreads,
  getThreadById,
  updateThread,
  deleteThread,
  findAssistantThreadId,
  findOrCreateThread
};