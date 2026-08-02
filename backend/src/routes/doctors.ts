import express = require('express');
import { DoctorsController } from '../controllers/DoctorsController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { USER_ROLES } from '../constants/roles';

const router = express.Router();
const doctorsController = new DoctorsController();

// Get all doctors (protected - all authenticated users)
router.get('/', authenticateToken, (req, res) => doctorsController.getDoctors(req, res));

// Get doctor by ID (protected - all authenticated users)
router.get('/:id', authenticateToken, (req, res) => doctorsController.getDoctor(req, res));

// Get doctor's availability for a specific date (public endpoint)
router.get('/:id/availability', (req, res) => doctorsController.getDoctorAvailability(req, res));

// Get doctor's appointments (protected - doctor only)
router.get('/:id/appointments', authenticateToken, authorizeRoles(USER_ROLES.DOCTOR), (req, res) =>
  doctorsController.getDoctorAppointments(req, res)
);

// Update doctor profile (protected - doctor or admin)
router.put('/:id', authenticateToken, (req, res) =>
  doctorsController.updateDoctorProfile(req, res)
);

// Create new doctor (protected - admin only)
router.post('/', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  doctorsController.createDoctor(req, res)
);

// Toggle doctor status (activate/deactivate) (protected - admin only)
router.delete('/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  doctorsController.toggleDoctorStatus(req, res)
);

export default router;
