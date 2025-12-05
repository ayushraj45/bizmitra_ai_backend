// routes/btemplateRoutes.js
import { Router } from 'express';
const router = Router();
import { authenticateToken } from '../middleware/auth.js';
import BTemplateController from '../controllers/btemplateController.js';

router.post('/', authenticateToken, BTemplateController.createBTemplate);
router.get('/', authenticateToken, BTemplateController.getBTemplates);
router.get('/:id', BTemplateController.getBTemplate);
router.put('/:id', BTemplateController.updateBTemplate);
router.delete('/:id', BTemplateController.deleteBTemplate);

export default router;
