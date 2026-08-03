import { PrismaClient } from '@prisma/client';
import { EmailService } from './EmailService';
import { APPOINTMENT_STATUS } from '../constants/roles';

export class ReminderService {
  private prisma: PrismaClient;
  private emailService: EmailService;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
  }

  // Quét các lịch hẹn trong vòng 24 giờ tới và gửi email nhắc lịch
  async checkAndSendReminders(): Promise<{ sentCount: number; errors: number }> {
    console.log('🔍 Running automatic appointment reminder check...');
    let sentCount = 0;
    let errors = 0;

    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Tra cứu các lịch hẹn sắp diễn ra trong vòng 24 giờ tới chưa được gửi nhắc nhở
      const upcomingAppointments = await this.prisma.appointments.findMany({
        where: {
          appointmentDateTime: {
            gte: now,
            lte: next24Hours
          },
          reminderSentAt: null,
          status: {
            in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.PENDING]
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true
                }
              }
            }
          }
        }
      });

      console.log(`📋 Found ${upcomingAppointments.length} upcoming appointment(s) needing reminders.`);

      for (const appt of upcomingAppointments) {
        if (!appt.patient?.email) continue;

        try {
          const hours = appt.appointmentDateTime.getHours().toString().padStart(2, '0');
          const minutes = appt.appointmentDateTime.getMinutes().toString().padStart(2, '0');
          const timeStr = `${hours}:${minutes}`;

          // Gửi email nhắc lịch
          await this.emailService.sendAppointmentReminder(
            appt.patient.email,
            appt.patient.fullName,
            {
              date: appt.appointmentDateTime,
              time: timeStr,
              doctorName: appt.doctor?.user?.fullName || 'Bác sĩ',
              type: appt.appointmentType || 'Khám bệnh'
            }
          );

          // Đánh dấu thời gian đã gửi nhắc lịch để tránh gửi lặp lại
          await this.prisma.appointments.update({
            where: { id: appt.id },
            data: { reminderSentAt: new Date() }
          });

          sentCount++;
        } catch (error) {
          console.error(`Error sending reminder for appointment ${appt.id}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error('Error during reminder check:', error);
    }

    console.log(`✅ Reminder check finished. Sent: ${sentCount}, Errors: ${errors}`);
    return { sentCount, errors };
  }

  // Khởi chạy scheduler ngầm định kỳ (mặc định 60 phút / lần)
  startReminderScheduler(intervalMs = 60 * 60 * 1000): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(`🚀 Automatic Reminder Scheduler started (Interval: ${intervalMs / 1000}s)`);

    // Run first check after 10 seconds startup delay
    setTimeout(() => {
      this.checkAndSendReminders().catch(err => console.error('Initial reminder check error:', err));
    }, 10000);

    // Schedule periodic execution
    this.timer = setInterval(() => {
      this.checkAndSendReminders().catch(err => console.error('Scheduled reminder check error:', err));
    }, intervalMs);
  }

  stopReminderScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('🛑 Reminder Scheduler stopped.');
    }
  }
}
