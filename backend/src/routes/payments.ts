import express = require('express');
import { PaymentsController } from '../controllers/PaymentsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const paymentsController = new PaymentsController();

// Create VNPay payment URL (protected - patient/admin)
router.post('/vnpay/create-url', authenticateToken, (req, res) =>
  paymentsController.createVNPayUrl(req, res)
);

// VNPay return URL callback (public)
router.get('/vnpay/return', (req, res) =>
  paymentsController.handleVNPayReturn(req, res)
);

// VNPay Webhook IPN (public)
router.get('/vnpay/ipn', (req, res) =>
  paymentsController.handleVNPayIPN(req, res)
);

// Get payment details by appointment ID (protected)
router.get('/appointment/:appointmentId', authenticateToken, (req, res) =>
  paymentsController.getPaymentByAppointment(req, res)
);

export default router;
