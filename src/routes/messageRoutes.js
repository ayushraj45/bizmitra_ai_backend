import { Router } from 'express';
const router = Router();
import MessageController from '../controllers/messageController.js';

router.post('/', MessageController.createMessage);
router.get('/', MessageController.getAllMessages);
router.get('/:id', MessageController.getMessageById);
router.put('/:id', MessageController.updateMessage);
router.delete('/:id', MessageController.deleteMessage);
router.post('/send-test', MessageController.sendTestMessage);

export default router;
