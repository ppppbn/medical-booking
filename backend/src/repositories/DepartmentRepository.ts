import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DepartmentRepository {
  async findAll() {
    return await prisma.departments.findMany({
      include: {
        doctors: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              }
            }
          }
        },
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findById(id: string) {
    return await prisma.departments.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              }
            }
          }
        },
      }
    });
  }

  async create(data: { name: string; description?: string }) {
    return await prisma.departments.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: true,
      }
    });
  }

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    return await prisma.departments.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return await prisma.departments.delete({
      where: { id }
    });
  }

  async assignDoctor(doctorId: string, departmentId: string) {
    return await prisma.doctors.update({
      where: { id: doctorId },
      data: { departmentId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          }
        }
      }
    });
  }

  async removeDoctor(doctorId: string) {
    return await prisma.doctors.update({
      where: { id: doctorId },
      data: { departmentId: null },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          }
        }
      }
    });
  }
}
