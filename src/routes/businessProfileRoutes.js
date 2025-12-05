import { Router } from 'express';
const router = Router();
import { authenticateToken } from '../middleware/auth.js';
import businessProfileController from '../controllers/businessProfileController.js';

router.post('/', businessProfileController.createProfile);
router.get('/', authenticateToken, businessProfileController.getProfile);
router.post('/addFromWebsite', authenticateToken, businessProfileController.addFromWebsite);
router.put('/:id', businessProfileController.updateProfile);

export default router;