import { Router } from 'express';
const router = Router();
import ThreadController from '../controllers/threadController.js';

router.post('/', ThreadController.createThread);
router.get('/', ThreadController.getThreads);
router.get('/:id', ThreadController.getThread);
router.put('/:id', ThreadController.updateThread);
router.delete('/:id', ThreadController.deleteThread);

export default router;
