import express = require('express');
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const authController = new AuthController();

// Register endpoint
router.post('/register', (req, res) => authController.register(req, res));

// Login endpoint
router.post('/login', (req, res) => authController.login(req, res));

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => authController.verifyToken(req, res));

export default router;
