import { Router } from 'express';
import { DepartmentsController } from '../controllers/DepartmentsController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { USER_ROLES } from '../constants/roles';

const router = Router();
const controller = new DepartmentsController();

// Only ADMIN can manage departments
router.use(authenticateToken);
router.use(authorizeRoles(USER_ROLES.ADMIN));

router.get('/', (req, res) => controller.getDepartments(req, res));
router.post('/', (req, res) => controller.createDepartment(req, res));
router.put('/:id', (req, res) => controller.updateDepartment(req, res));
router.post('/:id/doctors', (req, res) => controller.assignDoctor(req, res));
router.delete('/:id/doctors/:doctorId', (req, res) => controller.removeDoctor(req, res));

export default router;
