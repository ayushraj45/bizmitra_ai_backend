// services/btaskService.js
import { where } from "sequelize";
import { models } from "../db.js";
/**
 * Creates a new BTask record.
 * @param {object} data - The BTask data.
 * @returns {Promise<object>} The created BTask object.
 */
async function createBTask(data) {
  const btask = await models.BTask.create(data);
  return btask;
}

/**
 * Retrieves all BTask records.
 * @returns {Promise<Array<object>>} An array of BTask objects.
 */
async function getAllBTasks(businessId) {
  const btasks = await models.BTask.findAll({where: { business_id: businessId }});
  return btasks;
}

/**
 * Retrieves a single BTask record by its ID.
 * @param {string} id - The ID of the BTask.
 * @returns {Promise<object|null>} The BTask object if found, otherwise null.
 */
async function getBTaskById(id) {
  const btask = await models.BTask.findByPk(id);
  return btask;
}

/**
 * Updates an existing BTask record.
 * @param {string} id - The ID of the BTask to update.
 * @param {object} data - The updated BTask data.
 * @returns {Promise<object|null>} The updated BTask object if found, otherwise null.
 */
async function updateBTask(id, data) {
  const btask = await models.BTask.findByPk(id);
  if (!btask) {
    return null;
  }
  await btask.update(data);
  return btask;
}

/**
 * Deletes a BTask record by its ID.
 * @param {string} id - The ID of the BTask to delete.
 * @returns {Promise<number>} The number of destroyed rows (0 or 1).
 */
async function deleteBTask(id) {
  const deletedRows = await models.BTask.destroy({
    where: { id }
  });
  return deletedRows;
}

export default {
  createBTask,
  getAllBTasks,
  getBTaskById,
  updateBTask,
  deleteBTask
};
