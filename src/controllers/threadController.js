import ThreadService from '../services/threadService.js';
import { ForeignKeyConstraintError } from 'sequelize'; // Import the specific error

/**
 * Creates a new Thread.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function createThread(req, res) {
  try {
    const thread = await ThreadService.createThread(req.body);
    res.status(201).json({ thread });
  } catch (err) {
    console.error(err);
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({ error: 'Invalid foreign key provided. Ensure assistant_id exists.' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves all Threads.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getThreads(req, res) {
  try {
    const threads = await ThreadService.getAllThreads();
    res.status(200).json({ threads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves a single Thread by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getThread(req, res) {
  try {
    const { id } = req.params;
    const thread = await ThreadService.getThreadById(id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.status(200).json({ thread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Updates an existing Thread.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function updateThread(req, res) {
  try {
    const { id } = req.params;
    const updatedThread = await ThreadService.updateThread(id, req.body);
    if (!updatedThread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.status(200).json({ thread: updatedThread });
  } catch (err) {
    console.error(err);
    // Consider adding ForeignKeyConstraintError handling here if foreign keys can be updated.
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Deletes a Thread by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function deleteThread(req, res) {
  try {
    const { id } = req.params;
    const deletedRows = await ThreadService.deleteThread(id);
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

export default {
  createThread,
  getThreads,
  getThread,
  updateThread,
  deleteThread
};
