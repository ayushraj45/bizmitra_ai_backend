import { Router } from 'express';
const router = Router();
import BClientController from '../controllers/bclientController.js';
import { authenticateToken } from '../middleware/auth.js';

router.get('/clients', authenticateToken, BClientController.getBClientsByBusiness); // Ensure authentication for this route
router.post('/', BClientController.createBClient);
router.get('/', BClientController.getBClients);
router.get('/:id', BClientController.getBClient);
router.put('/:id', BClientController.updateBClient);
router.delete('/:id', BClientController.deleteBClient);

export default router;