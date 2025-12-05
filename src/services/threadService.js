import { models } from "../db.js";

/**
 * Creates a new Thread record.
 * @param {object} data - The Thread data.
 * @returns {Promise<object>} The created Thread object.
 */
async function createThread(data) {
  const thread = await models.Thread.create(data);
  return thread;
}

/**
 * Retrieves all Thread records.
 * @returns {Promise<Array<object>>} An array of Thread objects.
 */
async function getAllThreads() {
  const threads = await models.Thread.findAll();
  return threads;
}

/**
 * Retrieves a single Thread record by its ID.
 * @param {string} id - The ID of the Thread.
 * @returns {Promise<object|null>} The Thread object if found, otherwise null.
 */
async function getThreadById(id) {
  const thread = await models.Thread.findByPk(id);
  return thread;
}

/**
 * Updates an existing Thread record.
 * @param {string} id - The ID of the Thread to update.
 * @param {object} data - The updated Thread data.
 * @returns {Promise<object|null>} The updated Thread object if found, otherwise null.
 */
async function updateThread(id, data) {
  const thread = await models.Thread.findByPk(id);
  if (!thread) {
    return null;
  }
  await thread.update(data);
  return thread;
}

/**
 * Deletes a Thread record by its ID.
 * @param {string} id - The ID of the Thread to delete.
 * @returns {Promise<number>} The number of destroyed rows (0 or 1).
 */
async function deleteThread(id) {
  const deletedRows = await models.Thread.destroy({
    where: { id }
  });
  return deletedRows;
}

async function findThreadByPhoneNumber(phoneNumber, assistantId ) {
  return await models.Thread.findOne({
    where: {
      client_phone_number: phoneNumber,
      assisstant_id: assistantId,
    },
  });
}

async function findOrCreateThread(phoneNumber, assistantId) {
  let thread = await findThreadByPhoneNumber(phoneNumber, assistantId)
  if(!client) {
    client = createThread({
      client_phone_number: phoneNumber,
      assistantId: businessId,
    });
  }
    return thread
}

async function findAssistantThreadId(threadId){
  const threadToReturn = await getThreadById(threadId)
  return threadToReturn.assistantThread_id;
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
