import { Request, Response } from 'express';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { DoctorRepository } from '../repositories/DoctorRepository';
import { MedicalRecordRepository } from '../repositories/MedicalRecordRepository';
import { USER_ROLES, APPOINTMENT_STATUS } from '../constants/roles';
import { EmailService } from '../services/EmailService';
import { ReminderService } from '../services/ReminderService';

export class AppointmentsController {
  private appointmentRepository: AppointmentRepository;
  private doctorRepository: DoctorRepository;
  private medicalRecordRepository: MedicalRecordRepository;
  private emailService: EmailService;
  private reminderService: ReminderService;

  constructor() {
    this.appointmentRepository = new AppointmentRepository();
    this.doctorRepository = new DoctorRepository();
    this.medicalRecordRepository = new MedicalRecordRepository();
    this.emailService = new EmailService();
    this.reminderService = new ReminderService();
  }

  async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, date, startDate, endDate, doctorId, patientId } = req.query;

      const whereClause: any = {};

      if (req.user?.role === USER_ROLES.DOCTOR) {
        const doctor = await this.doctorRepository.findByUserId(req.user.id);
        if (!doctor) {
          res.status(404).json({ error: 'Không tìm thấy thông tin bác sĩ' });
          return;
        }
        whereClause.doctorId = doctor.id;
      } else if (req.user?.role === USER_ROLES.PATIENT) {
        whereClause.patientId = req.user.id;
      }

      if (status) whereClause.status = status as string;
      if (date) whereClause.date = new Date(date as string);
      if (startDate || endDate) {
        whereClause.dateFrom = startDate ? new Date(startDate as string) : undefined;
        whereClause.dateTo = endDate ? new Date(endDate as string) : undefined;
      }
      if (doctorId) whereClause.doctorId = doctorId as string;
      if (patientId) whereClause.patientId = patientId as string;

      const { appointments, total } = await this.appointmentRepository.findAll({
        ...whereClause,
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
      console.error('Get appointments error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async getAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await this.appointmentRepository.findById(id);

      if (!appointment) {
        res.status(404).json({ error: 'Không tìm thấy lịch khám' });
        return;
      }

      const isAdmin = req.user?.role === USER_ROLES.ADMIN;
      const isPatient = req.user?.id === appointment.patientId;

      let isDoctor = false;
      if (req.user?.role === USER_ROLES.DOCTOR) {
        const doctor = await this.doctorRepository.findByUserId(req.user.id);
        isDoctor = doctor?.id === appointment.doctorId;
      }

      if (!isAdmin && !isPatient && !isDoctor) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      res.json({ appointment });
    } catch (error) {
      console.error('Get appointment error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId, date, time, symptoms, notes, isRecurring, recurringWeeks } = req.body;
      const patientId = req.user?.id;

      if (!patientId) {
        res.status(401).json({ error: 'Người dùng chưa được xác thực' });
        return;
      }

      if (!doctorId || !date || !time) {
        res.status(400).json({
          error: 'ID bác sĩ, ngày và giờ khám là bắt buộc'
        });
        return;
      }

      const isActive = await this.doctorRepository.isActive(doctorId);
      if (!isActive) {
        res.status(404).json({ error: 'Không tìm thấy bác sĩ hoặc tài khoản đã bị vô hiệu hóa' });
        return;
      }

      const appointmentDate = new Date(date);

      // Xử lý Đặt lịch lặp lại (Recurring Appointment)
      if (isRecurring && Number(recurringWeeks) > 1) {
        const weeksCount = Number(recurringWeeks);
        try {
          const recurringAppointments = await this.appointmentRepository.createRecurring({
            patientId,
            doctorId,
            startDate: appointmentDate,
            time,
            weeks: weeksCount,
            symptoms,
            notes
          });

          // Gửi email xác nhận cho lịch đầu tiên
          const firstAppt = recurringAppointments[0];
          if (firstAppt?.patient?.email) {
            await this.emailService.sendAppointmentCreatedNotification(
              firstAppt.patient.email,
              firstAppt.patient.fullName,
              {
                date: firstAppt.date,
                time: firstAppt.time,
                doctorName: firstAppt.doctor?.fullName || 'Bác sĩ',
                type: firstAppt.appointmentType || 'Khám lặp lại định kỳ'
              }
            );
          }

          res.status(201).json({
            message: `Đặt lịch khám lặp lại (${weeksCount} tuần) thành công`,
            appointments: recurringAppointments
          });
          return;
        } catch (recurringError: any) {
          res.status(409).json({ error: recurringError.message || 'Xung đột khi đặt lịch lặp lại' });
          return;
        }
      }

      // Logic chống xung đột lịch Bác sĩ & Bệnh nhân
      const isDoctorAvailable = await this.appointmentRepository.checkAvailability(doctorId, appointmentDate, time);
      if (!isDoctorAvailable) {
        res.status(409).json({ error: 'Khung giờ này của bác sĩ đã được đặt' });
        return;
      }

      const isPatientAvailable = await this.appointmentRepository.checkPatientAvailability(patientId, appointmentDate, time);
      if (!isPatientAvailable) {
        res.status(409).json({ error: 'Bạn đã có lịch khám khác trùng khung giờ này' });
        return;
      }

      const appointment = await this.appointmentRepository.create({
        patientId,
        doctorId,
        date: appointmentDate,
        time,
        symptoms,
        notes
      });

      if (appointment.patient?.email) {
        await this.emailService.sendAppointmentCreatedNotification(
          appointment.patient.email,
          appointment.patient.fullName,
          {
            date: appointment.date,
            time: appointment.time,
            doctorName: appointment.doctor?.fullName || 'Bác sĩ',
            type: appointment.appointmentType || 'Khám thường'
          }
        );
      }

      res.status(201).json({
        message: 'Đặt lịch khám thành công',
        appointment
      });
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async updateAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, symptoms, notes, date, time, diagnosis, treatment, prescription, testResults, followUpInstructions, nextAppointmentDate } = req.body;

      const appointment = await this.appointmentRepository.findByIdBasic(id);
      if (!appointment) {
        res.status(404).json({ error: 'Không tìm thấy lịch khám' });
        return;
      }

      const isPatient = req.user?.id === appointment.patientId;
      let isDoctor = false;
      if (req.user?.role === USER_ROLES.DOCTOR) {
        const doctor = await this.doctorRepository.findByUserId(req.user.id);
        isDoctor = doctor?.id === appointment.doctorId;
      }

      const isAdmin = req.user?.role === USER_ROLES.ADMIN;
      const updateData: any = {};

      const extractTime = (dateTime: Date): string => {
        return dateTime.toTimeString().slice(0, 5);
      };

      if (isPatient) {
        if (symptoms !== undefined) updateData.symptoms = symptoms;
        if (notes !== undefined) updateData.notes = notes;

        if ((date || time) && appointment.status === APPOINTMENT_STATUS.PENDING) {
          if (date) {
            const newDate = new Date(date);
            const currentTime = extractTime(appointment.appointmentDateTime);

            const isAvailable = await this.appointmentRepository.checkAvailability(
              appointment.doctorId,
              newDate,
              time || currentTime,
              id
            );

            if (!isAvailable) {
              res.status(409).json({ error: 'Khung giờ mới của bác sĩ đã bị đặt' });
              return;
            }

            const isPatientFree = await this.appointmentRepository.checkPatientAvailability(
              appointment.patientId,
              newDate,
              time || currentTime,
              id
            );

            if (!isPatientFree) {
              res.status(409).json({ error: 'Bạn đã có lịch khám khác trùng khung giờ này' });
              return;
            }

            updateData.appointmentDateTime = newDate;
          }
        }
      }

      if (isDoctor || isAdmin) {
        if (status && Object.values(APPOINTMENT_STATUS).includes(status)) {
          updateData.status = status;
        }
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: 'Không có thông tin hợp lệ để cập nhật' });
        return;
      }

      const updatedAppointment = await this.appointmentRepository.update(id, updateData);

      if (isDoctor && status === APPOINTMENT_STATUS.COMPLETED &&
          (diagnosis || treatment || prescription || testResults || followUpInstructions || nextAppointmentDate)) {

        const doctor = await this.doctorRepository.findByUserId(req.user!.id);
        if (doctor) {
          const existingRecord = await this.medicalRecordRepository.findByAppointmentId(id);

          const medicalRecordData = {
            diagnosis,
            treatment,
            prescription,
            testResults,
            followUpInstructions,
            nextAppointmentDate: nextAppointmentDate ? new Date(nextAppointmentDate) : undefined
          };

          if (existingRecord) {
            await this.medicalRecordRepository.update(existingRecord.id, medicalRecordData);
          } else {
            await this.medicalRecordRepository.create({
              patientId: appointment.patientId,
              doctorId: doctor.id,
              appointmentId: id,
              ...medicalRecordData
            });
          }
        }
      }

      if (status && updatedAppointment.patient?.email) {
        await this.emailService.sendAppointmentStatusUpdate(
          updatedAppointment.patient.email,
          updatedAppointment.patient.fullName,
          {
            date: updatedAppointment.date,
            time: updatedAppointment.time,
            doctorName: updatedAppointment.doctor?.fullName || 'Bác sĩ',
            type: updatedAppointment.appointmentType || 'Khám thường'
          },
          status,
          notes
        );
      }

      res.json({
        message: 'Cập nhật lịch khám thành công',
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const appointment = await this.appointmentRepository.findByIdBasic(id);
      if (!appointment) {
        res.status(404).json({ error: 'Không tìm thấy lịch khám' });
        return;
      }

      const isPatient = req.user?.id === appointment.patientId;
      let isDoctor = false;
      if (req.user?.role === USER_ROLES.DOCTOR) {
        const doctor = await this.doctorRepository.findByUserId(req.user.id);
        isDoctor = doctor?.id === appointment.doctorId;
      }
      const isAdmin = req.user?.role === USER_ROLES.ADMIN;

      if (!isPatient && !isDoctor && !isAdmin) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const canCancel = await this.appointmentRepository.canCancel(id);
      if (!canCancel) {
        res.status(400).json({ error: 'Không thể hủy lịch khám đã hoàn thành hoặc đã bị hủy trước đó' });
        return;
      }

      const updatedAppointment = await this.appointmentRepository.update(id, {
        status: APPOINTMENT_STATUS.CANCELLED,
        notes: reason ? `${appointment.notes || ''}\nCancellation reason: ${reason}` : appointment.notes
      });

      if (updatedAppointment.patient?.email) {
        await this.emailService.sendAppointmentStatusUpdate(
          updatedAppointment.patient.email,
          updatedAppointment.patient.fullName,
          {
            date: updatedAppointment.date,
            time: updatedAppointment.time,
            doctorName: updatedAppointment.doctor?.fullName || 'Bác sĩ',
            type: updatedAppointment.appointmentType || 'Khám thường'
          },
          APPOINTMENT_STATUS.CANCELLED,
          reason
        );
      }

      res.json({
        message: 'Hủy lịch khám thành công',
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async deleteAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const appointment = await this.appointmentRepository.findByIdBasic(id);
      if (!appointment) {
        res.status(404).json({ error: 'Không tìm thấy lịch khám' });
        return;
      }

      await this.appointmentRepository.delete(id);

      res.json({ message: 'Xóa lịch khám thành công' });
    } catch (error) {
      console.error('Delete appointment error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async getAppointmentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.dateFrom = new Date(startDate as string);
      if (endDate) dateFilter.dateTo = new Date(endDate as string);

      const statistics = await this.appointmentRepository.getStatistics(dateFilter);

      res.json({
        statistics,
        dateRange: {
          startDate,
          endDate
        }
      });
    } catch (error) {
      console.error('Get appointment statistics error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async getDoctorAppointmentStatistics(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== USER_ROLES.DOCTOR) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const doctor = await this.doctorRepository.findByUserId(req.user.id);
      if (!doctor) {
        res.status(404).json({ error: 'Không tìm thấy thông tin bác sĩ' });
        return;
      }

      const { startDate, endDate } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.dateFrom = new Date(startDate as string);
      if (endDate) dateFilter.dateTo = new Date(endDate as string);

      const statistics = await this.appointmentRepository.getDoctorStatistics(doctor.id, dateFilter);

      res.json({
        statistics,
        dateRange: {
          startDate,
          endDate
        }
      });
    } catch (error) {
      console.error('Get doctor appointment statistics error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async getPatientAppointmentStatistics(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== USER_ROLES.PATIENT) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const { startDate, endDate } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.dateFrom = new Date(startDate as string);
      if (endDate) dateFilter.dateTo = new Date(endDate as string);

      const statistics = await this.appointmentRepository.getPatientStatistics(req.user.id, dateFilter);

      res.json({
        statistics,
        dateRange: {
          startDate,
          endDate
        }
      });
    } catch (error) {
      console.error('Get patient appointment statistics error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async getDoctorPerformance(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== USER_ROLES.ADMIN) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const { startDate, endDate } = req.query;
      const dateFilter: any = {};
      if (startDate) dateFilter.dateFrom = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        if (typeof endDate === 'string' && endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        dateFilter.dateTo = end;
      }

      const { doctors } = await this.doctorRepository.findAll();
      const performance: any[] = [];

      for (const doctor of doctors) {
        try {
          const totalAppointments = await this.appointmentRepository.countByDoctor(doctor.id, undefined, dateFilter);
          const completedAppointments = await this.appointmentRepository.countByDoctor(doctor.id, APPOINTMENT_STATUS.COMPLETED, dateFilter);
          const pendingAppointments = await this.appointmentRepository.countByDoctor(doctor.id, APPOINTMENT_STATUS.PENDING, dateFilter);

          const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

          performance.push({
            id: doctor.id,
            fullName: doctor.user.fullName,
            specialization: doctor.specialization,
            totalAppointments,
            completedAppointments,
            pendingAppointments,
            completionRate
          });
        } catch (error) {
          continue;
        }
      }

      performance.sort((a, b) => b.completionRate - a.completionRate);

      res.json({ performance });
    } catch (error) {
      console.error('Get doctor performance error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async getAppointmentTrends(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== USER_ROLES.ADMIN) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const { startDate, endDate } = req.query;
      const trends: { month: string; appointments: number }[] = [];

      if (startDate || endDate) {
        const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 5));
        const end = endDate ? new Date(endDate as string) : new Date();
        if (typeof endDate === 'string' && endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }

        let curr = new Date(start.getFullYear(), start.getMonth(), 1);
        while (curr <= end) {
          const year = curr.getFullYear();
          const month = curr.getMonth();
          const startOfMonth = new Date(year, month, 1);
          const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

          const dateFrom = startOfMonth < start ? start : startOfMonth;
          const dateTo = endOfMonth > end ? end : endOfMonth;

          const count = await this.appointmentRepository.count({ dateFrom, dateTo });

          trends.push({
            month: `Tháng ${month + 1}/${year}`,
            appointments: count
          });

          curr.setMonth(curr.getMonth() + 1);
        }
      } else {
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const year = date.getFullYear();
          const month = date.getMonth();

          const startOfMonth = new Date(year, month, 1);
          const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

          const count = await this.appointmentRepository.count({
            dateFrom: startOfMonth,
            dateTo: endOfMonth
          });

          const monthName = `Tháng ${month + 1}/${year}`;
          trends.push({
            month: monthName,
            appointments: count
          });
        }
      }

      res.json({ trends });
    } catch (error) {
      console.error('Get appointment trends error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async getSpecializationPerformance(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== USER_ROLES.ADMIN) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const { startDate, endDate } = req.query;
      const dateFilter: any = {};
      if (startDate) dateFilter.dateFrom = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        if (typeof endDate === 'string' && endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        dateFilter.dateTo = end;
      }

      const { doctors } = await this.doctorRepository.findAll();
      const specializationStats: { [key: string]: { total: number; completed: number } } = {};

      for (const doctor of doctors) {
        if (!specializationStats[doctor.specialization]) {
          specializationStats[doctor.specialization] = { total: 0, completed: 0 };
        }

        const totalAppointments = await this.appointmentRepository.countByDoctor(doctor.id, undefined, dateFilter);
        const completedAppointments = await this.appointmentRepository.countByDoctor(doctor.id, APPOINTMENT_STATUS.COMPLETED, dateFilter);

        specializationStats[doctor.specialization].total += totalAppointments;
        specializationStats[doctor.specialization].completed += completedAppointments;
      }

      const performance = Object.entries(specializationStats).map(([specialization, stats]) => ({
        specialization,
        totalAppointments: stats.total,
        completedAppointments: stats.completed,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      }));

      performance.sort((a, b) => b.completionRate - a.completionRate);

      res.json({ performance });
    } catch (error) {
      console.error('Get specialization performance error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  async triggerReminders(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== USER_ROLES.ADMIN) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      const result = await this.reminderService.checkAndSendReminders();

      res.json({
        message: 'Kích hoạt kiểm tra và gửi email nhắc lịch tự động thành công',
        sentCount: result.sentCount,
        errors: result.errors
      });
    } catch (error) {
      console.error('Trigger reminders error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }
}
