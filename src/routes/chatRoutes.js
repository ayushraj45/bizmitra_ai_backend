import { Router } from 'express';
const router = Router();
import { authenticateToken } from '../middleware/auth.js';
import ChatController from '../controllers/chatController.js';

router.post('/start', ChatController.createChat);
router.post('/continue', ChatController.continueChat);
router.get('/', authenticateToken, ChatController.findBusinessChats);
router.get('/:id/messages', authenticateToken, ChatController.getChatMessages);
// router.put('/:id',  ChatController.updateChat);
router.delete('/:id', authenticateToken, ChatController.deleteChat);

export default router;