import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { MedicalRecordRepository } from '../repositories/MedicalRecordRepository';
import { USER_ROLES } from '../constants/roles';

export class PatientsController {
  private userRepository: UserRepository;
  private appointmentRepository: AppointmentRepository;
  private medicalRecordRepository: MedicalRecordRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.appointmentRepository = new AppointmentRepository();
    this.medicalRecordRepository = new MedicalRecordRepository();
  }

  async getPatients(req: Request, res: Response): Promise<void> {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const isAdmin = req.user?.role === USER_ROLES.ADMIN;
      const options: any = {
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        search: search as string
      };

      if (!isAdmin) {
        options.isActive = true;
      }

      const { users, total } = await this.userRepository.findByRole(USER_ROLES.PATIENT, options);

      res.json({
        patients: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get patients error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const isAdminOrDoctor = req.user?.role === USER_ROLES.ADMIN || req.user?.role === USER_ROLES.DOCTOR;
      const isAccessingOwnProfile = req.user?.id === id;

      if (!isAdminOrDoctor && !isAccessingOwnProfile) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const patient = await this.userRepository.findById(id);

      if (!patient || patient.role !== USER_ROLES.PATIENT) {
        res.status(404).json({ error: 'Không tìm thấy bệnh nhân' });
        return;
      }

      res.json({ patient });
    } catch (error) {
      console.error('Get patient error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePatient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, phone, dateOfBirth, address } = req.body;

      const isAdmin = req.user?.role === USER_ROLES.ADMIN;
      const isUpdatingOwnProfile = req.user?.id === id;

      if (!isAdmin && !isUpdatingOwnProfile) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (address !== undefined) updateData.address = address;

      const updatedPatient = await this.userRepository.update(id, updateData);

      res.json({
        message: 'Patient profile updated successfully',
        patient: updatedPatient
      });
    } catch (error) {
      console.error('Update patient error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatientAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy,
        sortOrder = 'desc'
      } = req.query;

      const isAdminOrDoctor = req.user?.role === USER_ROLES.ADMIN || req.user?.role === USER_ROLES.DOCTOR;
      const isPatientOwner = req.user?.id === id;

      if (!isAdminOrDoctor && !isPatientOwner) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const { appointments, total } = await this.appointmentRepository.findByPatientId(id, {
        status: status as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      res.json({
        appointments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get patient appointments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Theo dõi tiến trình qua từng buổi trị liệu & Kết quả khám, chẩn đoán
  async getPatientRecords(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const isAdminOrDoctor = req.user?.role === USER_ROLES.ADMIN || req.user?.role === USER_ROLES.DOCTOR;
      const isPatientOwner = req.user?.id === id;

      if (!isAdminOrDoctor && !isPatientOwner) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const medicalRecords = await this.medicalRecordRepository.findByPatientId(id);

      const formattedRecords = medicalRecords.map(record => {
        let date = new Date(record.createdAt).toISOString().split('T')[0];
        let time = '00:00';

        if (record.appointment?.appointmentDateTime) {
          const appointmentDate = new Date(record.appointment.appointmentDateTime);
          date = appointmentDate.toISOString().split('T')[0];
          time = appointmentDate.toTimeString().slice(0, 5);
        }

        return {
          id: record.id,
          date,
          time,
          doctor: {
            id: record.doctor.id,
            specialization: record.doctor.specialization,
            licenseNumber: record.doctor.licenseNumber,
            experience: record.doctor.experience,
            bio: record.doctor.bio,
            user: {
              fullName: record.doctor.user.fullName
            }
          },
          symptoms: record.appointment?.symptoms || null,
          notes: record.appointment?.notes || null,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          prescription: record.prescription,
          testResults: record.testResults,
          followUpInstructions: record.followUpInstructions,
          nextAppointmentDate: record.nextAppointmentDate ? record.nextAppointmentDate.toISOString().split('T')[0] : null,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString()
        };
      });

      res.json({
        medicalRecords: formattedRecords,
        totalRecords: formattedRecords.length
      });
    } catch (error) {
      console.error('Get patient records error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createPatient(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, phone, dateOfBirth, address } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({
          error: 'Email, mật khẩu và họ tên là bắt buộc'
        });
        return;
      }

      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'Email này đã được sử dụng' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newPatient = await this.userRepository.create({
        email,
        password: hashedPassword,
        fullName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
        role: USER_ROLES.PATIENT
      });

      res.status(201).json({
        message: 'Patient created successfully',
        patient: newPatient
      });
    } catch (error) {
      console.error('Create patient error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deactivatePatient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const hasActiveAppointments = await this.appointmentRepository.hasActiveAppointments(id);

      if (hasActiveAppointments) {
        res.status(409).json({
          error: 'Không thể xóa bệnh nhân có lịch hẹn đang hoạt động. Hãy hủy tất cả lịch hẹn trước.'
        });
        return;
      }

      await this.userRepository.delete(id);

      res.json({ message: 'Patient deactivated successfully' });
    } catch (error) {
      console.error('Deactivate patient error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async togglePatientStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (req.user?.role !== USER_ROLES.ADMIN) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const patient = await this.userRepository.findById(id);

      if (!patient || patient.role !== USER_ROLES.PATIENT) {
        res.status(404).json({ error: 'Không tìm thấy bệnh nhân' });
        return;
      }

      if (patient.isActive) {
        const hasActiveAppointments = await this.appointmentRepository.hasActiveAppointments(id);
        if (hasActiveAppointments) {
          res.status(409).json({
            error: 'Không thể vô hiệu hóa bệnh nhân có lịch hẹn đang hoạt động. Hãy hủy tất cả lịch hẹn trước.'
          });
          return;
        }
      }

      const updatedPatient = patient.isActive
        ? await this.userRepository.deactivate(id)
        : await this.userRepository.activate(id);

      res.json({
        message: `Patient ${updatedPatient.isActive ? 'activated' : 'deactivated'} successfully`,
        patient: updatedPatient
      });
    } catch (error) {
      console.error('Toggle patient status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatientStatistics(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== USER_ROLES.ADMIN) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const { users: allPatients } = await this.userRepository.findByRole(USER_ROLES.PATIENT);
      const activePatients = allPatients.filter(p => p.isActive);
      const inactivePatients = allPatients.filter(p => !p.isActive);

      const appointmentStats = await this.appointmentRepository.getStatistics();

      res.json({
        totalPatients: allPatients.length,
        activePatients: activePatients.length,
        inactivePatients: inactivePatients.length,
        totalAppointments: appointmentStats.total,
        completedAppointments: appointmentStats.completed,
        pendingAppointments: appointmentStats.pending
      });
    } catch (error) {
      console.error('Get patient statistics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
