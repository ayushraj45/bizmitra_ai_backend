// controllers/bookingController.js
import BookingService from '../services/bookingService.js';
import { ForeignKeyConstraintError } from 'sequelize'; // Import the specific error

/**
 * Creates a new Booking.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function createBooking(req, res) {
  try {
    const booking = await BookingService.createBooking(req.body);
    res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({ error: 'Invalid foreign key provided. Ensure business_id and client_id exist.' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves all Bookings.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getBookings(req, res) {
  try {
    const businessId = req.businessId;
    const bookings = await BookingService.getAllBookings(businessId);
    res.status(200).json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves a single Booking by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getBooking(req, res) {
  try {
    const { id } = req.params;
    const booking = await BookingService.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Updates an existing Booking.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const updatedBooking = await BookingService.updateBooking(id, req.body);
    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json({ booking: updatedBooking });
  } catch (err) {
    console.error(err);
    // You might also want to add ForeignKeyConstraintError handling here if foreign keys can be updated.
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Deletes a Booking by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const deletedRows = await BookingService.deleteBooking(id);
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

export default {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking
};
