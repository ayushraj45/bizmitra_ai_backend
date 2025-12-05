import { Router } from 'express';
const router = Router();
import AssistantController from '../controllers/assistantController.js';

router.post('/', AssistantController.createAssistant);
router.get('/', AssistantController.getAssistants);
router.get('/:id', AssistantController.getAssistant);
router.put('/:id', AssistantController.updateAssistant);
router.delete('/:id', AssistantController.deleteAssistant);

export default router;
