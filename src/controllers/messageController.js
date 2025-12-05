// services/messageService.js
import Message from '../models/message.js';
import messageService from '../services/messageService.js';
/**
 * Creates a new Message record.
 * @param {object} data - The Message data.
 * @returns {Promise<object>} The created Message object.
 */
async function createMessage(data) {
  const message = await Message.create(data);
  return message;
}

/**
 * Retrieves all Message records.
 * @returns {Promise<Array<object>>} An array of Message objects.
 */
async function getAllMessages() {
  const messages = await Message.findAll();
  return messages;
}

/**
 * Retrieves a single Message record by its ID.
 * @param {string} id - The ID of the Message.
 * @returns {Promise<object|null>} The Message object if found, otherwise null.
 */
async function getMessageById(id) {
  const message = await Message.findByPk(id);
  return message;
}

/**
 * Updates an existing Message record.
 * @param {string} id - The ID of the Message to update.
 * @param {object} data - The updated Message data.
 * @returns {Promise<object|null>} The updated Message object if found, otherwise null.
 */
async function updateMessage(id, data) {
  const message = await Message.findByPk(id);
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
  const deletedRows = await Message.destroy({
    where: { id }
  });
  return deletedRows;
}


export async function sendTestMessage(req, res) {
  try {
    const to = process.env.TEST_PHONE_NUMBER;
    const text = 'Hello from backend!';
    const response = await messageService.sendWhatsAppMessage(to, text);
    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


export default {
  createMessage,
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  sendTestMessage
};
