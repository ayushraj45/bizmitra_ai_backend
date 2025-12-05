import { Router } from 'express';
const router = Router();
import { authenticateToken } from '../middleware/auth.js';

import BusinessController from '../controllers/businessController.js';
import { exchangeTokenForBusinessToken } from '../controllers/businessOnboardController.js';

router.post('/register', BusinessController.registerBusiness); // Existing route
router.post('/login', BusinessController.authenticateBusiness); // New route for authentication
router.get('/', authenticateToken, BusinessController.getBusinesses);
router.get('/apiKey', authenticateToken, BusinessController.createApiKey);
router.get('/info', authenticateToken ,BusinessController.getBusiness);
router.get('/connectionStatus', authenticateToken, BusinessController.getConnectionStatus);
router.get('/affiliate/:affiliate_source', authenticateToken, BusinessController.getAffiliateBusinesses);
router.put('/onboard', authenticateToken, BusinessController.onboardBusiness);
router.put('/updateWithMeta', authenticateToken, BusinessController.updateWithMeta);
router.put('/getToken', authenticateToken, exchangeTokenForBusinessToken);
router.put('/:id', BusinessController.updateBusiness);
router.delete('/:id', BusinessController.deleteBusiness);

export default router;
