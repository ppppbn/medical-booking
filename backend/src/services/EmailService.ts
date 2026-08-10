import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
}

interface AppointmentDetails {
  date: Date;
  time: string;
  doctorName: string;
  departmentName?: string;
  type?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async sendAppointmentConfirmation(
    to: string,
    patientName: string,
    details: AppointmentDetails
  ): Promise<void> {
    const subject = 'Xác nhận đặt lịch khám thành công - Med Booking';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">Xác nhận đặt lịch khám</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #334155;">Xin chào <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">Cảm ơn bạn đã đặt lịch khám tại Med Booking. Lịch hẹn của bạn đã được xác nhận thành công.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 16px;">Chi tiết lịch hẹn:</h3>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; color: #475569;">
              <li style="margin-bottom: 8px;"><strong>Bác sĩ:</strong> ${details.doctorName}</li>
              <li style="margin-bottom: 8px;"><strong>Ngày khám:</strong> ${this.formatDate(details.date)}</li>
              <li style="margin-bottom: 8px;"><strong>Giờ khám:</strong> ${details.time}</li>
              <li style="margin-bottom: 8px;"><strong>Loại khám:</strong> ${
                details.type === 'CONSULTATION' ? 'Khám mới' :
                details.type === 'FOLLOW_UP' ? 'Tái khám' :
                details.type === 'EMERGENCY' ? 'Khám cấp cứu' :
                details.type || 'Khám bệnh'
              }</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #64748b;">⚠️ <em>Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục.</em></p>
          <p style="font-size: 14px; color: #64748b;">Nếu cần hủy hoặc đổi giờ hẹn, vui lòng thực hiện trên hệ thống trước 2 tiếng.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          Email này được gửi tự động từ hệ thống Med Booking, vui lòng không trả lời.
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
      console.log(`Confirmation email sent to ${to}`);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  }

  async sendAppointmentStatusUpdate(
    to: string,
    patientName: string,
    details: AppointmentDetails,
    status: string,
    note?: string
  ): Promise<void> {
    let subject = '';
    let message = '';
    let color = '#2563eb';

    switch (status) {
      case 'CANCELLED':
        subject = 'Thông báo hủy lịch khám - Med Booking';
        message = 'Lịch khám của bạn đã bị hủy.';
        color = '#ef4444';
        break;
      case 'COMPLETED':
        subject = 'Cảm ơn bạn đã sử dụng dịch vụ - Med Booking';
        message = 'Lịch khám của bạn đã hoàn thành.';
        color = '#10b981';
        break;
      case 'CONFIRMED':
        subject = 'Lịch khám đã được xác nhận - Med Booking';
        message = 'Lịch khám của bạn đã được bác sĩ xác nhận thành công.';
        color = '#2563eb';
        break;
      default:
        subject = 'Cập nhật trạng thái lịch khám - Med Booking';
        message = `Trạng thái lịch khám của bạn đã được cập nhật sang: ${status}`;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${color}; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px;">${subject}</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #334155;">Xin chào <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #334155;">${message}</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid ${color}; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 16px;">Chi tiết lịch hẹn:</h3>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; color: #475569;">
              <li style="margin-bottom: 8px;"><strong>Bác sĩ:</strong> ${details.doctorName}</li>
              <li style="margin-bottom: 8px;"><strong>Ngày khám:</strong> ${this.formatDate(details.date)}</li>
              <li style="margin-bottom: 8px;"><strong>Giờ khám:</strong> ${details.time}</li>
            </ul>
            ${note ? `<p style="margin-top: 12px; font-size: 14px; color: #475569;"><strong>Ghi chú:</strong> ${note}</p>` : ''}
          </div>

          <p style="font-size: 14px; color: #64748b;">Cảm ơn bạn đã tin tưởng dịch vụ của Med Booking.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          Email này được gửi tự động từ hệ thống Med Booking, vui lòng không trả lời.
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
      console.log(`Status update email sent to ${to}`);
    } catch (error) {
      console.error('Error sending status update email:', error);
    }
  }

  // Nhắc lịch tự động (Automatic Appointment Reminder)
  async sendAppointmentReminder(
    to: string,
    patientName: string,
    details: AppointmentDetails
  ): Promise<void> {
    const subject = '⏰ Nhắc lịch khám bệnh sắp tới - Med Booking';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f59e0b; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px;">⏰ Nhắc lịch khám bệnh</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #334155;">Xin chào <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">Đây là email nhắc nhở về lịch khám bệnh sắp tới của bạn tại hệ thống Med Booking.</p>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Chi tiết lịch hẹn:</h3>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; color: #78350f;">
              <li style="margin-bottom: 8px;"><strong>Bác sĩ:</strong> ${details.doctorName}</li>
              <li style="margin-bottom: 8px;"><strong>Ngày khám:</strong> ${this.formatDate(details.date)}</li>
              <li style="margin-bottom: 8px;"><strong>Giờ khám:</strong> ${details.time}</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #d97706; font-weight: bold;">⚠️ Vui lòng lưu ý đến trước giờ hẹn 15 phút để làm thủ tục tiếp đón.</p>
          <p style="font-size: 14px; color: #64748b;">Chúc bạn có một buổi khám bệnh thuận lợi và sức khỏe tốt!</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">
          Email này được gửi tự động từ hệ thống Med Booking, vui lòng không trả lời.
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
      console.log(`Reminder email sent to ${to}`);
    } catch (error) {
      console.error('Error sending reminder email:', error);
    }
  }
}
