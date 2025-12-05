// routes/bookingRoutes.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
import BookingController from '../controllers/bookingController.js';

router.post('/', BookingController.createBooking);
router.get('/', authenticateToken, BookingController.getBookings);
router.get('/:id', BookingController.getBooking);
router.put('/:id', BookingController.updateBooking);
router.delete('/:id', BookingController.deleteBooking);

export default router;
