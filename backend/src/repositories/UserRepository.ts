import { PrismaClient, Users as User } from '@prisma/client';
import { USER_ROLES } from '../constants/roles';

export class UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.users.findUnique({
      where: { email }
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.users.findFirst({
      where: { phone }
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.users.findUnique({
      where: { id }
    });
  }

  async findByIdWithDoctor(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        doctor: true
      }
    });
  }

  async findByRole(role: string, options?: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const whereClause: any = { role };

    if (options?.isActive !== undefined) {
      whereClause.isActive = options.isActive;
    }

    if (options?.search) {
      whereClause.OR = [
        { fullName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search } }
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where: whereClause,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.users.count({ where: whereClause })
    ]);

    return { users, total };
  }

  async create(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
    role?: string;
  }): Promise<User> {
    return this.prisma.users.create({
      data: {
        ...data,
        role: data.role || USER_ROLES.PATIENT
      }
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.users.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.users.update({
      where: { id },
      data: { role: 'DEACTIVATED_PATIENT' }
    });
  }

  async activate(id: string): Promise<User> {
    return this.prisma.users.update({
      where: { id },
      data: { isActive: true }
    });
  }

  async deactivate(id: string): Promise<User> {
    return this.prisma.users.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async countByRole(role: string): Promise<number> {
    return this.prisma.users.count({
      where: { role }
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.users.count({
      where: { id }
    });
    return count > 0;
  }
}
