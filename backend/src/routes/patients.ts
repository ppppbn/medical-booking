import express = require('express');
import { PatientsController } from '../controllers/PatientsController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { USER_ROLES } from '../constants/roles';

const router = express.Router();
const patientsController = new PatientsController();

// Get all patients (protected - admin or doctor only)
router.get('/', authenticateToken, authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.DOCTOR), (req, res) =>
  patientsController.getPatients(req, res)
);

// Get patient statistics (protected - admin only)
router.get('/admin/statistics', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  patientsController.getPatientStatistics(req, res)
);

// Get patient by ID (protected - patient can access their own, admin/doctor can access any)
router.get('/:id', authenticateToken, (req, res) => patientsController.getPatient(req, res));

// Update patient profile (protected - patient can update their own profile, admin can update any profile)
router.put('/:id', authenticateToken, (req, res) => patientsController.updatePatient(req, res));

// Get patient's appointments (protected - patient can access their own, admin/doctor can access any)
router.get('/:id/appointments', authenticateToken, (req, res) =>
  patientsController.getPatientAppointments(req, res)
);

// Get patient's medical records & treatment progress across sessions (protected - patient can access their own, admin/doctor can access any)
router.get('/:id/records', authenticateToken, (req, res) =>
  patientsController.getPatientRecords(req, res)
);

// Create new patient (protected - admin only, for registration use auth/register)
router.post('/', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  patientsController.createPatient(req, res)
);

// Delete patient (protected - admin only, soft delete by deactivating)
router.delete('/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  patientsController.deactivatePatient(req, res)
);

// Toggle patient status (activate/deactivate) (protected - admin only)
router.put('/:id/status', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  patientsController.togglePatientStatus(req, res)
);

export default router;
