// src/routes/verificationRoutes.js
import express from 'express';
import { requestCode, verifyCode } from '../controllers/authController.js';

const router = express.Router();

// Request a verification code to be sent to a university email
router.post('/request-code', requestCode);

// Verify the code and complete login/signup
router.post('/verify-code', verifyCode);

export default router;
