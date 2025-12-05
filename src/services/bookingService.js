// services/bookingService.js
import { models } from '../db.js';
import { DateTime } from 'luxon';
/**
 * Creates a new Booking record.
 * @param {object} data - The Booking data.
 * @returns {Promise<object>} The created Booking object.
 */
async function createBooking(data) {
  const booking = await models.Booking.create(data);
  return booking;
}

/**
 * Retrieves all Booking records.
 * @returns {Promise<Array<object>>} An array of Booking objects.
 */
async function getAllBookings(businessId) {
  const bookings = await models.Booking.findAll({where: { business_id: businessId }});
  return bookings;
}

async function getAllBookingsById(businessId, clientId){
  const bookings = await models.Booking.findAll({
    where : {
      business_id: businessId,
      client_id: clientId,
    }
  })
  return bookings;
}

async function getBookingByStartAndEndTime(businessId, clientId, startTime, endTime){
const convertedStart = new Date(startTime);
const convertedEnd = new Date(endTime);
  console.log(convertedEnd,' ', convertedStart)
  const booking = await models.Booking.findAll({
    where : {
      business_id: businessId,
      client_id: clientId,
      start_time: convertedStart,
      end_time:convertedStart
    }
  })
  return booking;
}

/**
 * Retrieves a single Booking record by its ID.
 * @param {string} id - The ID of the Booking.
 * @returns {Promise<object|null>} The Booking object if found, otherwise null.
 */
async function getBookingById(id) {
  const booking = await models.Booking.findByPk(id);
  return booking;
}

/**
 * Updates an existing Booking record.
 * @param {string} id - The ID of the Booking to update.
 * @param {object} data - The updated Booking data.
 * @returns {Promise<object|null>} The updated Booking object if found, otherwise null.
 */
async function updateBooking(id, data) {
  const booking = await models.Booking.findByPk(id);
  if (!booking) {
    return null;
  }
  await booking.update(data);
  return booking;
}

/**
 * Deletes a Booking record by its ID.
 * @param {string} id - The ID of the Booking to delete.
 * @returns {Promise<number>} The number of destroyed rows (0 or 1).
 */
async function deleteBooking(id) {
  const deletedRows = await models.Booking.destroy({
    where: { id }
  });
  return deletedRows;
}

export default {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getAllBookingsById,
  getBookingByStartAndEndTime,
};
