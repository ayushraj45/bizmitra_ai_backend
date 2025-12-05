// routes/btaskRoutes.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
import BTaskController from '../controllers/btaskController.js';

router.post('/', BTaskController.createBTask);
router.get('/', authenticateToken, BTaskController.getBTasks);
router.get('/:id', BTaskController.getBTask);
router.put('/:id', BTaskController.updateBTask);
router.delete('/:id', BTaskController.deleteBTask);

export default router;
