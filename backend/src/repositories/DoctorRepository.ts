import { PrismaClient, Doctors as Doctor } from '@prisma/client';

export class DoctorRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(options?: {
    isActive?: boolean;
    specialization?: string;
    skip?: number;
    take?: number;
  }) {
    const whereClause: any = {};

    if (options?.isActive !== undefined) {
      whereClause.isActive = options.isActive;
    }

    if (options?.specialization) {
      whereClause.specialization = options.specialization;
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctors.findMany({
        where: whereClause,
        include: {
          user: {
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
        orderBy: {
          user: {
            fullName: 'asc'
          }
        }
      }),
      this.prisma.doctors.count({ where: whereClause })
    ]);

    return { doctors, total };
  }

  async findById(id: string) {
    return this.prisma.doctors.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            address: true
          }
        }
      }
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.doctors.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
  }

  async findByLicenseNumber(licenseNumber: string) {
    return this.prisma.doctors.findUnique({
      where: { licenseNumber }
    });
  }

  async findByIdWithUser(id: string) {
    return this.prisma.doctors.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    });
  }

  async getSpecializations(includeInactive = false): Promise<string[]> {
    // Get specializations from departments instead of doctors
    // This ensures all specializations are available even if no doctors have them
    const departments = await this.prisma.departments.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: { name: true },
      orderBy: { name: 'asc' }
    });

    return departments.map(dept => dept.name);
  }

  async create(data: {
    userId: string;
    departmentId?: string;
    specialization: string;
    licenseNumber: string;
    experience?: number;
    bio?: string;
  }): Promise<Doctor> {
    return this.prisma.doctors.create({
      data: {
        ...data,
        isActive: true
      }
    });
  }

  async update(id: string, data: Partial<Doctor>) {
    return this.prisma.doctors.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
  }

  async updateByUserId(userId: string, data: Partial<Doctor>) {
    return this.prisma.doctors.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });
  }

  async deactivate(id: string) {
    return this.prisma.doctors.update({
      where: { id },
      data: { isActive: false },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
  }

  async activate(id: string) {
    return this.prisma.doctors.update({
      where: { id },
      data: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.doctors.count({
      where: { id }
    });
    return count > 0;
  }

  async isActive(id: string): Promise<boolean> {
    const doctor = await this.prisma.doctors.findUnique({
      where: { id },
      select: { isActive: true }
    });
    return doctor?.isActive ?? false;
  }
}
