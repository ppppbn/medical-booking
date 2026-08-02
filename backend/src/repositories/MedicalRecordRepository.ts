import { PrismaClient } from '@prisma/client';

export interface CreateMedicalRecordData {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  testResults?: string;
  followUpInstructions?: string;
  nextAppointmentDate?: Date;
  attachments?: string;
}

export interface UpdateMedicalRecordData {
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  testResults?: string;
  followUpInstructions?: string;
  nextAppointmentDate?: Date;
  attachments?: string;
}

export class MedicalRecordRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: CreateMedicalRecordData) {
    return this.prisma.medicalRecords.create({
      data,
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
        appointment: {
          select: {
            appointmentDateTime: true,
            symptoms: true,
            notes: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return this.prisma.medicalRecords.findUnique({
      where: { id },
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
        appointment: {
          select: {
            appointmentDateTime: true,
            symptoms: true,
            notes: true
          }
        }
      }
    });
  }

  async findByAppointmentId(appointmentId: string) {
    return this.prisma.medicalRecords.findFirst({
      where: { appointmentId },
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
        appointment: {
          select: {
            appointmentDateTime: true,
            symptoms: true,
            notes: true
          }
        }
      }
    });
  }

  async findByPatientId(patientId: string) {
    return this.prisma.medicalRecords.findMany({
      where: { patientId },
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
        appointment: {
          select: {
            appointmentDateTime: true,
            symptoms: true,
            notes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async update(id: string, data: UpdateMedicalRecordData) {
    return this.prisma.medicalRecords.update({
      where: { id },
      data,
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
        appointment: {
          select: {
            appointmentDateTime: true,
            symptoms: true,
            notes: true
          }
        }
      }
    });
  }

  async delete(id: string) {
    return this.prisma.medicalRecords.delete({
      where: { id }
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.medicalRecords.count({
      where: { id }
    });
    return count > 0;
  }
}
