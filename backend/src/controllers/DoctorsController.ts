import { Request, Response } from 'express';
import { DoctorRepository } from '../repositories/DoctorRepository';
import { UserRepository } from '../repositories/UserRepository';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { USER_ROLES } from '../constants/roles';
import { getDepartmentIdFromSpecialization } from '../constants/departments';

export class DoctorsController {
  private doctorRepository: DoctorRepository;
  private userRepository: UserRepository;
  private appointmentRepository: AppointmentRepository;

  constructor() {
    this.doctorRepository = new DoctorRepository();
    this.userRepository = new UserRepository();
    this.appointmentRepository = new AppointmentRepository();
  }

  async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const { specialization } = req.query;

      // For admin users, show all doctors (active and inactive)
      // For regular users, only show active doctors
      const isAdmin = req.user?.role === USER_ROLES.ADMIN;
      const options: any = {
        specialization: specialization as string
      };

      // Only add isActive filter for non-admin users
      if (!isAdmin) {
        options.isActive = true;
      }

      const { doctors, total } = await this.doctorRepository.findAll(options);

      // Get specializations from departments (available to all users)
      const specializations = await this.doctorRepository.getSpecializations();

      res.json({
        doctors: doctors.map(doctor => ({
          id: doctor.id,
          userId: doctor.userId,
          fullName: doctor.user.fullName,
          email: doctor.user.email,
          phone: doctor.user.phone,
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
          experience: doctor.experience,
          bio: doctor.bio,
          isActive: doctor.isActive,
          createdAt: doctor.createdAt
        })),
        specializations,
        total
      });
    } catch (error) {
      console.error('Get doctors error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const doctor = await this.doctorRepository.findById(id);

      if (!doctor) {
        res.status(404).json({ error: 'Doctor not found' });
        return;
      }

      res.json({
        doctor: {
          id: doctor.id,
          userId: doctor.userId,
          fullName: doctor.user.fullName,
          email: doctor.user.email,
          phone: doctor.user.phone,
          dateOfBirth: doctor.user.dateOfBirth,
          address: doctor.user.address,
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
          experience: doctor.experience,
          bio: doctor.bio,
          isActive: doctor.isActive,
          createdAt: doctor.createdAt,
          updatedAt: doctor.updatedAt
        }
      });
    } catch (error) {
      console.error('Get doctor error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDoctorAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({ error: 'Date parameter is required' });
        return;
      }

      // Check if doctor exists and is active
      const isActive = await this.doctorRepository.isActive(id);
      if (!isActive) {
        res.status(404).json({ error: 'Doctor not found or inactive' });
        return;
      }

      const targetDate = new Date(date as string);

      // Validate date
      if (isNaN(targetDate.getTime())) {
        res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
        return;
      }

      const availableSlots = await this.appointmentRepository.getAvailableSlots(id, targetDate);
      const bookedSlots = await this.appointmentRepository.findByDoctorId(id, {
        date: targetDate,
        skip: 0,
        take: 100
      });

      res.json({
        doctorId: id,
        date: date,
        availableSlots,
        bookedSlots: bookedSlots.appointments.map(apt => apt.time)
      });
    } catch (error) {
      console.error('Get doctor availability error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDoctorAppointments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date, status, page = 1, limit = 10 } = req.query;

      // Verify the doctor is accessing their own appointments
      if (req.user?.id !== id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const { appointments, total } = await this.appointmentRepository.findByDoctorId(id, {
        date: date ? new Date(date as string) : undefined,
        status: status as string,
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
      console.error('Get doctor appointments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateDoctorProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // This is the doctor profile ID
      const { specialization, licenseNumber, experience, bio, fullName } = req.body;

      // First, get the doctor to check ownership
      const doctor = await this.doctorRepository.findById(id);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor not found' });
        return;
      }

      // Allow doctors to update their own profile, or admins to update any profile
      const isDoctorUpdatingOwnProfile = req.user?.role === USER_ROLES.DOCTOR && req.user?.id === doctor.userId;
      const isAdmin = req.user?.role === USER_ROLES.ADMIN;

      if (!isDoctorUpdatingOwnProfile && !isAdmin) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Update doctor profile
      const updateData: any = {
        specialization,
        licenseNumber,
        experience,
        bio
      };

      // If specialization is being changed, update departmentId accordingly
      if (specialization && specialization !== doctor.specialization) {
        const newDepartmentId = getDepartmentIdFromSpecialization(specialization);
        if (newDepartmentId) {
          updateData.departmentId = newDepartmentId;
        }
      }

      const updatedDoctor = await this.doctorRepository.update(id, updateData);

      // If fullName is provided and user is admin, update the user record as well
      if (fullName && isAdmin) {
        await this.userRepository.update(doctor.userId, { fullName });
      }

      res.json({
        message: 'Doctor profile updated successfully',
        doctor: {
          id: updatedDoctor.id,
          specialization: updatedDoctor.specialization,
          licenseNumber: updatedDoctor.licenseNumber,
          experience: updatedDoctor.experience,
          bio: updatedDoctor.bio,
          fullName: isAdmin && fullName ? fullName : updatedDoctor.user.fullName
        }
      });
    } catch (error) {
      console.error('Update doctor profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, phone, specialization, licenseNumber, experience, bio } = req.body;

      // Validate required fields
      if (!email || !password || !fullName || !specialization || !licenseNumber) {
        res.status(400).json({
          error: 'Email, password, fullName, specialization, and licenseNumber are required'
        });
        return;
      }

      // Check if user with this email already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      // Create user and doctor in transaction (simplified for now)
      const hashedPassword = await require('bcryptjs').hash(password, 10);

      const user = await this.userRepository.create({
        email,
        password: hashedPassword,
        fullName,
        phone,
        role: USER_ROLES.DOCTOR
      });

      const departmentId = getDepartmentIdFromSpecialization(specialization);

      const doctor = await this.doctorRepository.create({
        userId: user.id,
        ...(departmentId && { departmentId }), // Only include if departmentId exists
        specialization,
        licenseNumber,
        experience,
        bio
      });

      res.status(201).json({
        message: 'Doctor created successfully',
        doctor: {
          id: doctor.id,
          userId: doctor.userId,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
          experience: doctor.experience,
          bio: doctor.bio
        }
      });
    } catch (error) {
      console.error('Create doctor error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async toggleDoctorStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // This is the doctor profile ID

      // Only admins can toggle doctor status
      if (req.user?.role !== USER_ROLES.ADMIN) {
        res.status(403).json({ error: 'Access denied. Only admins can change doctor status.' });
        return;
      }

      // Check current status
      const isCurrentlyActive = await this.doctorRepository.isActive(id);

      if (isCurrentlyActive) {
        // Deactivate the doctor
        await this.doctorRepository.deactivate(id);
        res.json({ message: 'Doctor deactivated successfully', isActive: false });
      } else {
        // Activate the doctor
        await this.doctorRepository.activate(id);
        res.json({ message: 'Doctor activated successfully', isActive: true });
      }
    } catch (error) {
      console.error('Toggle doctor status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
