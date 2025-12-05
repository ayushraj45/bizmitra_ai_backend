import { Router } from 'express';
const router = Router();
import AuthController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';


router.get('/google', AuthController.startGoogleOAuth); // sends user to Google's consent screen
router.get('/google/callback', AuthController.handleGoogleCallback); // receives Google auth code

export default router;
