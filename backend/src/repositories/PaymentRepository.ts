import { PrismaClient, Payments as Payment } from '@prisma/client';
import { APPOINTMENT_STATUS } from '../constants/roles';

export class PaymentRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findByAppointmentId(appointmentId: string): Promise<Payment | null> {
    return this.prisma.payments.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            patient: {
              select: { id: true, fullName: true, email: true, phone: true }
            },
            doctor: {
              select: {
                id: true,
                specialization: true,
                user: { select: { fullName: true } }
              }
            }
          }
        }
      }
    });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payments.findUnique({
      where: { id },
      include: {
        appointment: true
      }
    });
  }

  async createOrUpdatePayment(data: {
    appointmentId: string;
    amount: number;
    paymentMethod?: string;
    paymentStatus?: string;
    transactionId?: string;
  }): Promise<Payment> {
    const existing = await this.prisma.payments.findUnique({
      where: { appointmentId: data.appointmentId }
    });

    if (existing) {
      return this.prisma.payments.update({
        where: { appointmentId: data.appointmentId },
        data: {
          amount: data.amount,
          paymentMethod: data.paymentMethod || existing.paymentMethod,
          paymentStatus: data.paymentStatus || existing.paymentStatus,
          transactionId: data.transactionId || existing.transactionId
        }
      });
    }

    return this.prisma.payments.create({
      data: {
        appointmentId: data.appointmentId,
        amount: data.amount,
        paymentMethod: data.paymentMethod || 'VNPAY',
        paymentStatus: data.paymentStatus || 'PENDING',
        transactionId: data.transactionId
      }
    });
  }

  async updateSuccess(paymentIdOrAppointmentId: string, transactionNo?: string): Promise<Payment> {
    let payment = await this.prisma.payments.findUnique({
      where: { id: paymentIdOrAppointmentId }
    });

    if (!payment) {
      payment = await this.prisma.payments.findUnique({
        where: { appointmentId: paymentIdOrAppointmentId }
      });
    }

    if (!payment) {
      throw new Error('Payment record not found');
    }

    const updatedPayment = await this.prisma.payments.update({
      where: { id: payment.id },
      data: {
        paymentStatus: 'SUCCESS',
        transactionId: transactionNo || payment.transactionId
      }
    });

    // Update appointment paymentStatus to PAID and status to CONFIRMED
    await this.prisma.appointments.update({
      where: { id: payment.appointmentId },
      data: {
        paymentStatus: 'PAID',
        status: APPOINTMENT_STATUS.CONFIRMED
      }
    });

    return updatedPayment;
  }

  async updateFailed(paymentIdOrAppointmentId: string, transactionNo?: string): Promise<Payment> {
    let payment = await this.prisma.payments.findUnique({
      where: { id: paymentIdOrAppointmentId }
    });

    if (!payment) {
      payment = await this.prisma.payments.findUnique({
        where: { appointmentId: paymentIdOrAppointmentId }
      });
    }

    if (!payment) {
      throw new Error('Payment record not found');
    }

    const updatedPayment = await this.prisma.payments.update({
      where: { id: payment.id },
      data: {
        paymentStatus: 'FAILED',
        transactionId: transactionNo || payment.transactionId
      }
    });

    await this.prisma.appointments.update({
      where: { id: payment.appointmentId },
      data: {
        paymentStatus: 'FAILED'
      }
    });

    return updatedPayment;
  }
}
