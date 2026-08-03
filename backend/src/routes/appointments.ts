import express = require('express');
import { AppointmentsController } from '../controllers/AppointmentsController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { USER_ROLES } from '../constants/roles';

const router = express.Router();
const appointmentsController = new AppointmentsController();

// Get all appointments (protected - role-based access)
router.get('/', authenticateToken, (req, res) => appointmentsController.getAppointments(req, res));

// Get appointment statistics (protected - admin only)
router.get('/stats/overview', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  appointmentsController.getAppointmentStatistics(req, res)
);

// Get doctor appointment statistics (protected - doctor only)
router.get('/stats/doctor', authenticateToken, authorizeRoles(USER_ROLES.DOCTOR), (req, res) =>
  appointmentsController.getDoctorAppointmentStatistics(req, res)
);

// Get patient appointment statistics (protected - patient only)
router.get('/stats/patient', authenticateToken, authorizeRoles(USER_ROLES.PATIENT), (req, res) =>
  appointmentsController.getPatientAppointmentStatistics(req, res)
);

// Get doctor performance statistics (protected - admin only)
router.get('/stats/doctor-performance', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  appointmentsController.getDoctorPerformance(req, res)
);

// Get appointment trends for last 6 months (protected - admin only)
router.get('/stats/appointment-trends', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  appointmentsController.getAppointmentTrends(req, res)
);

// Get specialization performance statistics (protected - admin only)
router.get('/stats/specialization-performance', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  appointmentsController.getSpecializationPerformance(req, res)
);

// Trigger automatic appointment reminders check (protected - admin only)
router.post('/reminders/trigger', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  appointmentsController.triggerReminders(req, res)
);

// Get appointment by ID (protected - participants can access their own appointments)
router.get('/:id', authenticateToken, (req, res) => appointmentsController.getAppointment(req, res));

// Create new appointment (protected - patients can book for themselves, supports single & recurring)
router.post('/', authenticateToken, authorizeRoles(USER_ROLES.PATIENT), (req, res) =>
  appointmentsController.createAppointment(req, res)
);

// Update appointment (protected - doctors can update status, patients can update details)
router.put('/:id', authenticateToken, (req, res) => appointmentsController.updateAppointment(req, res));

// Cancel appointment (protected - participants can cancel their appointments)
router.put('/:id/cancel', authenticateToken, (req, res) =>
  appointmentsController.cancelAppointment(req, res)
);

// Delete appointment (protected - admin only, hard delete)
router.delete('/:id', authenticateToken, authorizeRoles(USER_ROLES.ADMIN), (req, res) =>
  appointmentsController.deleteAppointment(req, res)
);

export default router;
