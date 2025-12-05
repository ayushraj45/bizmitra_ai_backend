import AssistantService from '../services/assistantService.js';
import { ForeignKeyConstraintError } from 'sequelize'; // Import the specific error

/**
 * Creates a new Assistant.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function createAssistant(req, res) {
  try {
    const assistant = await AssistantService.createAssistant(req.body);
    res.status(201).json({ assistant });
  } catch (err) {
    console.error(err);
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({ error: 'Invalid foreign key provided. Ensure user_id exists.' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves all Assistants.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getAssistants(req, res) {
  try {
    const assistants = await AssistantService.getAllAssistants();
    res.status(200).json({ assistants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves a single Assistant by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getAssistant(req, res) {
  try {
    const { id } = req.params;
    const assistant = await AssistantService.getAssistantById(id);
    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }
    res.status(200).json({ assistant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Updates an existing Assistant.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function updateAssistant(req, res) {
  try {
    const { id } = req.params;
    const updatedAssistant = await AssistantService.updateAssistant(id, req.body);
    if (!updatedAssistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }
    res.status(200).json({ assistant: updatedAssistant });
  } catch (err) {
    console.error(err);
    // Consider adding ForeignKeyConstraintError handling here if foreign keys can be updated.
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Deletes an Assistant by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function deleteAssistant(req, res) {
  try {
    const { id } = req.params;
    const deletedRows = await AssistantService.deleteAssistant(id);
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Assistant not found' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

export default {
  createAssistant,
  getAssistants,
  getAssistant,
  updateAssistant,
  deleteAssistant
};
