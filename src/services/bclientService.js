// services/bclientService.js
import { models } from '../db.js';
/**
 * Creates a new BClient record.
 * @param {object} data - The BClient data.
 * @returns {Promise<object>} The created BClient object.
 */
async function createBClient(data) {
  const bclient = await models.BClient.create(data);
  return bclient;
}

/**
 * Retrieves all BClient records.
 * @returns {Promise<Array<object>>} An array of BClient objects.
 */
async function getAllBClients() {
  const bclients = await models.BClient.findAll();
  return bclients;
}

/**
 * Retrieves a single BClient record by its ID.
 * @param {string} id - The ID of the BClient.
 * @returns {Promise<object|null>} The BClient object if found, otherwise null.
 */
async function getBClientById(id) {
  const bclient = await models.BClient.findByPk(id);
  return bclient;
}

/**
 * Updates an existing BClient record.
 * @param {string} id - The ID of the BClient to update.
 * @param {object} data - The updated BClient data.
 * @returns {Promise<object|null>} The updated BClient object if found, otherwise null.
 */
async function updateBClient(id, data) {
  const bclient = await models.BClient.findByPk(id);
  if (!bclient) {
    return null;
  }
  await bclient.update(data);
  return bclient;
}

/**
 * Deletes a BClient record by its ID.
 * @param {string} id - The ID of the BClient to delete.
 * @returns {Promise<number>} The number of destroyed rows (0 or 1).
 */
async function deleteBClient(id) {
  const deletedRows = await models.BClient.destroy({
    where: { id }
  });
  return deletedRows;
}

async function findClientByPhoneAndBusiness(phoneNumber, businessId) {
  return await models.BClient.findOne({
    where: {
      phone_number: phoneNumber,
      business_id: businessId,
    },
  });
}

async function findOrCreateClient(phoneNumber, businessId, name) {
  let client = await findClientByPhoneAndBusiness(phoneNumber, businessId)
  if(!client) {
    client = createBClient({
      phone_number: phoneNumber,
      business_id: businessId,
      name: name
    });
  }
    return client
}

async function getBClientsByBusinessId(businessId) {
  //console.log('Fetching BClients for businessId:', businessId, '..');
  const bclients = await models.BClient.findAll({ where: { business_id: businessId  } });
  //console.log('BClients fetched:', bclients);
  return bclients;      
}

export default {
  createBClient,  
  getAllBClients,
  getBClientById,
  updateBClient,
  deleteBClient,
  findClientByPhoneAndBusiness,
  findOrCreateClient,
  getBClientsByBusinessId
};
