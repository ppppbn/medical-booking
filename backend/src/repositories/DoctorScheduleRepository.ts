import { PrismaClient, DoctorSchedules as DoctorSchedule } from '@prisma/client';

export class DoctorScheduleRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findByDoctorId(doctorId: string, isActiveOnly = true): Promise<DoctorSchedule[]> {
    const whereClause: any = { doctorId };
    if (isActiveOnly) {
      whereClause.isActive = true;
    }

    return this.prisma.doctorSchedules.findMany({
      where: whereClause,
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  async findByDoctorIdAndDay(doctorId: string, dayOfWeek: string): Promise<DoctorSchedule[]> {
    return this.prisma.doctorSchedules.findMany({
      where: {
        doctorId,
        dayOfWeek: dayOfWeek.toUpperCase(),
        isActive: true
      },
      orderBy: { startTime: 'asc' }
    });
  }

  async findById(id: string) {
    return this.prisma.doctorSchedules.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async create(data: {
    doctorId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    slotDuration?: number;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<DoctorSchedule> {
    return this.prisma.doctorSchedules.create({
      data: {
        doctorId: data.doctorId,
        dayOfWeek: data.dayOfWeek.toUpperCase(),
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: data.slotDuration || 30,
        validFrom: data.validFrom || new Date(),
        validTo: data.validTo,
        isActive: true
      }
    });
  }

  async bulkSetSchedule(doctorId: string, schedules: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    slotDuration?: number;
    validFrom?: Date;
    validTo?: Date;
  }>): Promise<DoctorSchedule[]> {
    await this.prisma.doctorSchedules.deleteMany({
      where: { doctorId }
    });

    const createInputs = schedules.map(s => ({
      doctorId,
      dayOfWeek: s.dayOfWeek.toUpperCase(),
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: s.slotDuration || 30,
      validFrom: s.validFrom || new Date(),
      validTo: s.validTo,
      isActive: true
    }));

    await this.prisma.doctorSchedules.createMany({
      data: createInputs
    });

    return this.findByDoctorId(doctorId);
  }

  async update(id: string, data: {
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
    isActive?: boolean;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<DoctorSchedule> {
    const updateData: any = { ...data };
    if (data.dayOfWeek) {
      updateData.dayOfWeek = data.dayOfWeek.toUpperCase();
    }

    return this.prisma.doctorSchedules.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id: string): Promise<DoctorSchedule> {
    return this.prisma.doctorSchedules.delete({
      where: { id }
    });
  }
}
