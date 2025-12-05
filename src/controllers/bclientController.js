// controllers/bclientController.js
import BClientService from '../services/bclientService.js';
import { ForeignKeyConstraintError } from 'sequelize'; // Import the specific error

/**
 * Creates a new BClient.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function createBClient(req, res) {
  try {
    const bclient = await BClientService.createBClient(req.body);
    res.status(201).json({ bclient });
  } catch (err) {
    console.error(err);
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({ error: 'Invalid foreign key provided. Ensure business_id exists.' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves all BClients.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getBClients(req, res) {
  try {
    const bclients = await BClientService.getAllBClients();
    res.status(200).json({ bclients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves a single BClient by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getBClient(req, res) {
  try {
    const { id } = req.params;
    const bclient = await BClientService.getBClientById(id);
    if (!bclient) {
      return res.status(404).json({ error: 'BClient not found' });
    }
    res.status(200).json({ bclient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function getBClientsByBusiness(req, res) {
   try {
    const businessId = req.businessId; // ✅ Comes from token via middleware

    const bclients = await BClientService.getBClientsByBusinessId(businessId); // Updated service

    res.status(200).json({ bclients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Updates an existing BClient.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function updateBClient(req, res) {
  try {
    const { id } = req.params;
    const updatedBClient = await BClientService.updateBClient(id, req.body);
    if (!updatedBClient) {
      return res.status(404).json({ error: 'BClient not found' });
    }
    res.status(200).json({ bclient: updatedBClient });
  } catch (err) {
    console.error(err);
    // You might also want to add ForeignKeyConstraintError handling here if foreign keys can be updated.
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Deletes a BClient by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function deleteBClient(req, res) {
  try {
    const { id } = req.params;
    const deletedRows = await BClientService.deleteBClient(id);
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'BClient not found' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

export default {
  createBClient,
  getBClients,
  getBClient,
  updateBClient,
  deleteBClient,
  getBClientsByBusiness
};
