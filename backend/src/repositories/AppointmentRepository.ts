import { PrismaClient, Appointments as Appointment } from '@prisma/client';
import { APPOINTMENT_STATUS } from '../constants/roles';

// Helper function to combine date and time strings into DateTime
function combineDateTime(date: Date | string, time: string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(dateObj);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

// Helper function to extract time from DateTime
function extractTime(dateTime: Date): string {
  return dateTime.toTimeString().slice(0, 5); // Format: "HH:mm"
}

// Helper function to extract date from DateTime
function extractDate(dateTime: Date): Date {
  const date = new Date(dateTime);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Type for backward compatibility
type AppointmentWithDateTimeFields = Appointment & {
  date: Date;
  time: string;
  doctor?: {
    id: string;
    specialization: string;
    licenseNumber: string | null;
    experience: number | null;
    bio: string | null;
    fullName: string;
  };
  patient?: {
    id?: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
};

export class AppointmentRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(options?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    date?: Date;
    dateFrom?: Date;
    dateTo?: Date;
    skip?: number;
    take?: number;
  }) {
    const whereClause: any = {};

    if (options?.patientId) whereClause.patientId = options.patientId;
    if (options?.doctorId) whereClause.doctorId = options.doctorId;
    if (options?.status) whereClause.status = options.status;

    if (options?.date) {
      const targetDate = new Date(options.date);
      whereClause.appointmentDateTime = {
        gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
      };
    }

    if (options?.dateFrom || options?.dateTo) {
      whereClause.appointmentDateTime = {};
      if (options.dateFrom) whereClause.appointmentDateTime.gte = options.dateFrom;
      if (options.dateTo) whereClause.appointmentDateTime.lt = options.dateTo;
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointments.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              licenseNumber: true,
              experience: true,
              bio: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        },
        skip: options?.skip,
        take: options?.take,
        orderBy: {
          appointmentDateTime: 'desc'
        }
      }),
      this.prisma.appointments.count({ where: whereClause })
    ]);

    const appointmentsWithDateTimeFields = appointments.map(appointment => ({
      ...appointment,
      date: extractDate(appointment.appointmentDateTime),
      time: extractTime(appointment.appointmentDateTime),
      doctor: {
        ...appointment.doctor,
        fullName: appointment.doctor.user.fullName
      }
    }));

    return { appointments: appointmentsWithDateTimeFields, total };
  }

  async findById(id: string) {
    const appointment = await this.prisma.appointments.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            address: true
          }
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            licenseNumber: true,
            experience: true,
            bio: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!appointment) return null;

    return {
      ...appointment,
      date: extractDate(appointment.appointmentDateTime),
      time: extractTime(appointment.appointmentDateTime),
      doctor: {
        ...appointment.doctor,
        fullName: appointment.doctor.user.fullName
      }
    };
  }

  async findByIdBasic(id: string): Promise<Appointment | null> {
    return this.prisma.appointments.findUnique({
      where: { id }
    });
  }

  async findByPatientId(patientId: string, options?: {
    status?: string;
    skip?: number;
    take?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const whereClause: any = { patientId };

    if (options?.status) {
      whereClause.status = options.status;
    }

    if (options?.search) {
      whereClause.OR = [
        {
          doctor: {
            user: {
              fullName: {
                contains: options.search
              }
            }
          }
        },
        {
          doctor: {
            specialization: {
              contains: options.search
            }
          }
        },
        {
          symptoms: {
            contains: options.search
          }
        },
        {
          notes: {
            contains: options.search
          }
        }
      ];
    }

    let orderBy: any = {
      appointmentDateTime: 'desc' as const
    };

    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'date':
          orderBy = { appointmentDateTime: options.sortOrder || 'desc' };
          break;
        case 'doctor':
          orderBy = {
            doctor: {
              user: {
                fullName: options.sortOrder || 'asc'
              }
            }
          };
          break;
        case 'specialization':
          orderBy = {
            doctor: {
              specialization: options.sortOrder || 'asc'
            }
          };
          break;
        case 'status':
          orderBy = { status: options.sortOrder || 'asc' };
          break;
        default:
          orderBy = { appointmentDateTime: 'desc' as const };
      }
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointments.findMany({
        where: whereClause,
        include: {
          doctor: {
            select: {
              id: true,
              specialization: true,
              licenseNumber: true,
              experience: true,
              bio: true,
              user: {
                select: {
                  fullName: true
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          }
        },
        skip: options?.skip,
        take: options?.take,
        orderBy
      }),
      this.prisma.appointments.count({ where: whereClause })
    ]);

    const appointmentsWithDateTimeFields = appointments.map(appointment => ({
      ...appointment,
      date: extractDate(appointment.appointmentDateTime),
      time: extractTime(appointment.appointmentDateTime),
      doctor: {
        ...(appointment as any).doctor,
        fullName: (appointment as any).doctor.user.fullName
      },
      patient: {
        ...(appointment as any).patient,
        fullName: (appointment as any).patient.fullName,
        email: (appointment as any).patient.email,
        phone: (appointment as any).patient.phone
      }
    }));

    return { appointments: appointmentsWithDateTimeFields, total };
  }

  async findByDoctorId(doctorId: string, options?: {
    date?: Date;
    status?: string;
    skip?: number;
    take?: number;
  }) {
    const whereClause: any = { doctorId };

    if (options?.status) {
      whereClause.status = options.status;
    }

    if (options?.date) {
      const targetDate = new Date(options.date);
      whereClause.appointmentDateTime = {
        gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
      };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointments.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              dateOfBirth: true
            }
          }
        },
        skip: options?.skip,
        take: options?.take,
        orderBy: {
          appointmentDateTime: 'desc'
        }
      }),
      this.prisma.appointments.count({ where: whereClause })
    ]);

    const appointmentsWithDateTimeFields = appointments.map(appointment => ({
      ...appointment,
      date: extractDate(appointment.appointmentDateTime),
      time: extractTime(appointment.appointmentDateTime)
    }));

    return { appointments: appointmentsWithDateTimeFields, total };
  }

  async create(data: {
    patientId: string;
    doctorId: string;
    date: Date;
    time: string;
    symptoms?: string;
    notes?: string;
    status?: string;
  }): Promise<AppointmentWithDateTimeFields> {
    const appointmentDateTime = combineDateTime(data.date, data.time);
    
    const appointment = await this.prisma.appointments.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDateTime,
        symptoms: data.symptoms,
        notes: data.notes,
        status: data.status || APPOINTMENT_STATUS.PENDING
      },
      include: {
        patient: {
          select: { fullName: true, email: true }
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            licenseNumber: true,
            experience: true,
            bio: true,
            user: {
              select: { fullName: true, email: true }
            }
          }
        }
      }
    });

    return {
      ...appointment,
      date: extractDate(appointment.appointmentDateTime),
      time: extractTime(appointment.appointmentDateTime),
      doctor: {
        ...appointment.doctor,
        fullName: appointment.doctor.user.fullName
      }
    };
  }

  async update(id: string, data: Partial<Appointment>): Promise<AppointmentWithDateTimeFields> {
    const appointment = await this.prisma.appointments.update({
      where: { id },
      data,
      include: {
        patient: {
          select: { fullName: true, email: true }
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            licenseNumber: true,
            experience: true,
            bio: true,
            user: {
              select: { fullName: true, email: true }
            }
          }
        }
      }
    });

    return {
      ...appointment,
      date: extractDate(appointment.appointmentDateTime),
      time: extractTime(appointment.appointmentDateTime),
      doctor: {
        ...appointment.doctor,
        fullName: appointment.doctor.user.fullName
      }
    };
  }

  async delete(id: string): Promise<Appointment> {
    return this.prisma.appointments.delete({
      where: { id }
    });
  }

  async checkAvailability(doctorId: string, date: Date, time: string, excludeAppointmentId?: string): Promise<boolean> {
    const appointmentDateTime = combineDateTime(date, time);
    const whereClause: any = {
      doctorId,
      appointmentDateTime,
      status: {
        in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]
      }
    };

    if (excludeAppointmentId) {
      whereClause.id = { not: excludeAppointmentId };
    }

    const count = await this.prisma.appointments.count({
      where: whereClause
    });

    return count === 0;
  }

  async getAvailableSlots(doctorId: string, date: Date): Promise<string[]> {
    if (!date || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }

    const timeSlots = [];
    const startHour = 8;
    const endHour = 17;
    const slotDuration = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push(timeString);
      }
    }

    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const bookedAppointments = await this.prisma.appointments.findMany({
      where: {
        doctorId,
        appointmentDateTime: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        },
        status: {
          in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]
        }
      },
      select: { appointmentDateTime: true }
    });

    const bookedTimes = bookedAppointments.map(apt => extractTime(apt.appointmentDateTime));
    return timeSlots.filter(slot => !bookedTimes.includes(slot));
  }

  async getStatistics(options?: {
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const dateFilter: any = {};
    if (options?.dateFrom) dateFilter.gte = options.dateFrom;
    if (options?.dateTo) dateFilter.lt = options.dateTo;

    const whereClause = Object.keys(dateFilter).length > 0 ? { appointmentDateTime: dateFilter } : {};

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today
    ] = await Promise.all([
      this.prisma.appointments.count({ where: whereClause }),
      this.prisma.appointments.count({
        where: { ...whereClause, status: APPOINTMENT_STATUS.PENDING }
      }),
      this.prisma.appointments.count({
        where: { ...whereClause, status: APPOINTMENT_STATUS.CONFIRMED }
      }),
      this.prisma.appointments.count({
        where: { ...whereClause, status: APPOINTMENT_STATUS.COMPLETED }
      }),
      this.prisma.appointments.count({
        where: { ...whereClause, status: APPOINTMENT_STATUS.CANCELLED }
      }),
      this.prisma.appointments.count({
        where: {
          appointmentDateTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ]);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today
    };
  }

  async getDoctorStatistics(doctorId: string, options?: {
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const dateFilter: any = {};
    if (options?.dateFrom) dateFilter.gte = options.dateFrom;
    if (options?.dateTo) dateFilter.lt = options.dateTo;

    const baseWhereClause = { doctorId };

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today
    ] = await Promise.all([
      this.prisma.appointments.count({ where: baseWhereClause }),
      this.prisma.appointments.count({
        where: { ...baseWhereClause, status: APPOINTMENT_STATUS.PENDING }
      }),
      this.prisma.appointments.count({
        where: { ...baseWhereClause, status: APPOINTMENT_STATUS.CONFIRMED }
      }),
      this.prisma.appointments.count({
        where: { ...baseWhereClause, status: APPOINTMENT_STATUS.COMPLETED }
      }),
      this.prisma.appointments.count({
        where: { ...baseWhereClause, status: APPOINTMENT_STATUS.CANCELLED }
      }),
      this.prisma.appointments.count({
        where: {
          ...baseWhereClause,
          appointmentDateTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ]);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today
    };
  }

  async getPatientStatistics(patientId: string, options?: {
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const dateFilter: any = {};
    if (options?.dateFrom) dateFilter.gte = options.dateFrom;
    if (options?.dateTo) dateFilter.lt = options.dateTo;

    const baseWhereClause = { patientId };

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today
    ] = await Promise.all([
      this.prisma.appointments.count({ where: baseWhereClause }),
      this.prisma.appointments.count({
        where: { ...baseWhereClause, status: APPOINTMENT_STATUS.PENDING }
      }),
      this.prisma.appointments.count({
        where: { ...baseWhereClause, status: APPOINTMENT_STATUS.CONFIRMED }
      }),
      this.prisma.appointments.count({
        where: { ...baseWhereClause, status: APPOINTMENT_STATUS.COMPLETED }
      }),
      this.prisma.appointments.count({
        where: { ...baseWhereClause, status: APPOINTMENT_STATUS.CANCELLED }
      }),
      this.prisma.appointments.count({
        where: {
          ...baseWhereClause,
          appointmentDateTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ]);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today
    };
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.appointments.count({
      where: { id }
    });
    return count > 0;
  }

  async canCancel(id: string): Promise<boolean> {
    const appointment = await this.prisma.appointments.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!appointment) return false;

    return appointment.status === APPOINTMENT_STATUS.PENDING ||
           appointment.status === APPOINTMENT_STATUS.CONFIRMED;
  }

  async hasActiveAppointments(patientId: string): Promise<boolean> {
    const count = await this.prisma.appointments.count({
      where: {
        patientId,
        status: {
          in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]
        }
      }
    });

    return count > 0;
  }

  async countByDoctor(doctorId: string, status?: string): Promise<number> {
    const whereClause: any = { doctorId };
    if (status) whereClause.status = status;

    return this.prisma.appointments.count({ where: whereClause });
  }

  async count(options?: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    doctorId?: string;
    patientId?: string;
  }): Promise<number> {
    const whereClause: any = {};

    if (options?.status) whereClause.status = options.status;
    if (options?.doctorId) whereClause.doctorId = options.doctorId;
    if (options?.patientId) whereClause.patientId = options.patientId;

    if (options?.dateFrom || options?.dateTo) {
      whereClause.appointmentDateTime = {};
      if (options.dateFrom) whereClause.appointmentDateTime.gte = options.dateFrom;
      if (options.dateTo) whereClause.appointmentDateTime.lt = options.dateTo;
    }

    return this.prisma.appointments.count({ where: whereClause });
  }
}
