import { Request, Response } from 'express';
import { DepartmentRepository } from '../repositories/DepartmentRepository';
import { DoctorRepository } from '../repositories/DoctorRepository';
import { USER_ROLES } from '../constants/roles';

export class DepartmentsController {
  private departmentRepository: DepartmentRepository;
  private doctorRepository: DoctorRepository;

  constructor() {
    this.departmentRepository = new DepartmentRepository();
    this.doctorRepository = new DoctorRepository();
  }

  async getDepartments(req: Request, res: Response): Promise<void> {
    try {
      const departments = await this.departmentRepository.findAll();
      res.json({ departments });
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Tên chuyên khoa là bắt buộc' });
        return;
      }

      const department = await this.departmentRepository.create({ name, description });

      res.status(201).json({
        message: 'Tạo chuyên ngành thành công',
        department
      });
    } catch (error: any) {
      console.error('Create department error:', error);
      if (error.code === 'P2002') {
         res.status(409).json({ error: 'Tên chuyên ngành đã tồn tại' });
         return;
      }
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedDepartment = await this.departmentRepository.update(id, updateData);

      res.json({
        message: 'Cập nhật chuyên ngành thành công',
        department: updatedDepartment
      });
    } catch (error: any) {
      console.error('Update department error:', error);
      if (error.code === 'P2002') {
         res.status(409).json({ error: 'Tên chuyên ngành đã tồn tại' });
         return;
      }
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async assignDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // departmentId
      const { doctorId } = req.body;

      if (!doctorId) {
        res.status(400).json({ error: 'doctorId là bắt buộc' });
        return;
      }

      // Verify department exists
      const department = await this.departmentRepository.findById(id);
      if (!department) {
        res.status(404).json({ error: 'Không tìm thấy chuyên ngành' });
        return;
      }

      const updatedDoctor = await this.departmentRepository.assignDoctor(doctorId, id);

      res.json({
        message: 'Gán bác sĩ thành công',
        doctor: updatedDoctor
      });
    } catch (error) {
      console.error('Assign doctor error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async removeDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { id, doctorId } = req.params; // id: departmentId

      // Verify department exists
      const department = await this.departmentRepository.findById(id);
      if (!department) {
        res.status(404).json({ error: 'Không tìm thấy chuyên ngành' });
        return;
      }

      const updatedDoctor = await this.departmentRepository.removeDoctor(doctorId);

      res.json({
        message: 'Đã gỡ bác sĩ khỏi chuyên ngành',
        doctor: updatedDoctor
      });
    } catch (error) {
      console.error('Remove doctor error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }
}
