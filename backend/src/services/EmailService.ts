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
  type: string;
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Xác nhận đặt lịch khám</h2>
        <p>Xin chào <strong>${patientName}</strong>,</p>
        <p>Cảm ơn bạn đã đặt lịch khám tại Med Booking. Lịch hẹn của bạn đã được xác nhận thành công.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Chi tiết lịch hẹn:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Bác sĩ:</strong> ${details.doctorName}</li>
            <li style="margin-bottom: 10px;"><strong>Ngày:</strong> ${this.formatDate(details.date)}</li>
            <li style="margin-bottom: 10px;"><strong>Giờ:</strong> ${details.time}</li>
            <li style="margin-bottom: 10px;"><strong>Loại khám:</strong> ${details.type}</li>
          </ul>
        </div>

        <p>Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục.</p>
        <p>Nếu bạn cần thay đổi hoặc hủy lịch, vui lòng thực hiện trên hệ thống hoặc liên hệ với chúng tôi.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
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
    let color = '#2c3e50';

    switch (status) {
      case 'CANCELLED':
        subject = 'Thông báo hủy lịch khám - Med Booking';
        message = 'Lịch khám của bạn đã bị hủy.';
        color = '#e74c3c';
        break;
      case 'COMPLETED':
        subject = 'Cảm ơn bạn đã sử dụng dịch vụ - Med Booking';
        message = 'Lịch khám của bạn đã hoàn thành.';
        color = '#27ae60';
        break;
      case 'CONFIRMED':
        subject = 'Lịch khám đã được xác nhận - Med Booking';
        message = 'Lịch khám của bạn đã được bác sĩ xác nhận.';
        color = '#2980b9';
        break;
      default:
        subject = 'Cập nhật trạng thái lịch khám - Med Booking';
        message = `Trạng thái lịch khám của bạn đã chuyển sang: ${status}`;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${color};">${subject}</h2>
        <p>Xin chào <strong>${patientName}</strong>,</p>
        <p>${message}</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Chi tiết lịch hẹn:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Bác sĩ:</strong> ${details.doctorName}</li>
            <li style="margin-bottom: 10px;"><strong>Ngày:</strong> ${this.formatDate(details.date)}</li>
            <li style="margin-bottom: 10px;"><strong>Giờ:</strong> ${details.time}</li>
          </ul>
          ${note ? `<p><strong>Ghi chú:</strong> ${note}</p>` : ''}
        </div>

        <p>Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của Med Booking.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
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
}
