import { Router } from 'express';
const router = Router();
import WebhookController from '../controllers/webhookController.js';

router.post('/', WebhookController.handleWebhook);
router.get('/', WebhookController.handleVerification); // For verification

export default router;
