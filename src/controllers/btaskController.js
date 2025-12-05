// controllers/btaskController.js
import BTaskService from '../services/btaskService.js';
import { ForeignKeyConstraintError } from 'sequelize'; // Import the specific error

/**
 * Creates a new BTask.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function createBTask(req, res) {
  try {
    const btask = await BTaskService.createBTask(req.body);
    res.status(201).json({ btask });
  } catch (err) {
    console.error(err);
    if (err instanceof ForeignKeyConstraintError) {
      // BTask client_id is allowNull: true, so only business_id causes this if not provided
      return res.status(400).json({ error: 'Invalid foreign key provided. Ensure business_id exists and client_id (if provided) exists.' });
    }
    res.status(500).json({ error: 'Something went wrong' }); 
  }
}

/**
 * Retrieves all BTasks.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getBTasks(req, res) {
  try {
    const businessId = req.businessId;
    const btasks = await BTaskService.getAllBTasks(businessId);
    res.status(200).json({ btasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves a single BTask by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getBTask(req, res) {
  try {
    const { id } = req.params;
    const btask = await BTaskService.getBTaskById(id);
    if (!btask) {
      return res.status(404).json({ error: 'BTask not found' });
    }
    res.status(200).json({ btask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Updates an existing BTask.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function updateBTask(req, res) {
  try {
    const { id } = req.params;
    const updatedBTask = await BTaskService.updateBTask(id, req.body);
    if (!updatedBTask) {
      return res.status(404).json({ error: 'BTask not found' });
    }
    res.status(200).json({ btask: updatedBTask });
  } catch (err) {
    console.error(err);
    // You might also want to add ForeignKeyConstraintError handling here if foreign keys can be updated.
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Deletes a BTask by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function deleteBTask(req, res) {
  try {
    const { id } = req.params;
    const deletedRows = await BTaskService.deleteBTask(id);
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'BTask not found' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

export default {
  createBTask,
  getBTasks,
  getBTask,
  updateBTask,
  deleteBTask
};
