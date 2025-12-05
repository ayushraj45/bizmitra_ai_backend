import Assistant from '../models/assisstant.js'

/**
 * Creates a new Assistant record.
 * @param {object} data - The Assistant data.
 * @returns {Promise<object>} The created Assistant object.
 */
async function createAssistant(data) {
  const assistant = await Assistant.create(data);
  return assistant;
}

/**
 * Retrieves all Assistant records.
 * @returns {Promise<Array<object>>} An array of Assistant objects.
 */
async function getAllAssistants() {
  const assistants = await Assistant.findAll();
  return assistants;
}

/**
 * Retrieves a single Assistant record by its ID.
 * @param {string} id - The ID of the Assistant.
 * @returns {Promise<object|null>} The Assistant object if found, otherwise null.
 */
async function getAssistantById(id) {
  const assistant = await Assistant.findByPk(id);
  return assistant;
}

/**
 * Updates an existing Assistant record.
 * @param {string} id - The ID of the Assistant to update.
 * @param {object} data - The updated Assistant data.
 * @returns {Promise<object|null>} The updated Assistant object if found, otherwise null.
 */
async function updateAssistant(id, data) {
  const assistant = await Assistant.findByPk(id);
  if (!assistant) {
    return null;
  }
  await assistant.update(data);
  return assistant;
}

/**
 * Deletes an Assistant record by its ID.
 * @param {string} id - The ID of the Assistant to delete.
 * @returns {Promise<number>} The number of destroyed rows (0 or 1).
 */
async function deleteAssistant(id) {
  const deletedRows = await Assistant.destroy({
    where: { id }
  });
  return deletedRows;
}

export default {
  createAssistant,
  getAllAssistants,
  getAssistantById,
  updateAssistant,
  deleteAssistant
};
