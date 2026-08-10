import { Request, Response } from 'express';
import { VNPayService } from '../services/VNPayService';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { EmailService } from '../services/EmailService';
import { USER_ROLES } from '../constants/roles';

export class PaymentsController {
  private vnpayService: VNPayService;
  private paymentRepository: PaymentRepository;
  private appointmentRepository: AppointmentRepository;
  private emailService: EmailService;

  constructor() {
    this.vnpayService = new VNPayService();
    this.paymentRepository = new PaymentRepository();
    this.appointmentRepository = new AppointmentRepository();
    this.emailService = new EmailService();
  }

  async createVNPayUrl(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId, fee, returnUrl } = req.body;

      if (!appointmentId) {
        res.status(400).json({ error: 'ID lịch khám là bắt buộc' });
        return;
      }

      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        res.status(404).json({ error: 'Không tìm thấy lịch khám' });
        return;
      }

      // Authorization check
      const isAdmin = req.user?.role === USER_ROLES.ADMIN;
      const isPatientOwner = req.user?.id === appointment.patientId;
      if (!isAdmin && !isPatientOwner) {
        res.status(403).json({ error: 'Truy cập bị từ chối' });
        return;
      }

      // Determine fee: prioritize appointment.fee, fallback to req.body.fee
      const rawFee = appointment.fee !== null && appointment.fee !== undefined ? appointment.fee : fee;
      const amount = rawFee !== null && rawFee !== undefined ? Number(rawFee) : NaN;

      if (isNaN(amount) || amount <= 0) {
        res.status(400).json({ error: 'Chi phí khám bệnh không xác định hoặc không hợp lệ (fee is required)' });
        return;
      }

      // Create or update payment record
      const payment = await this.paymentRepository.createOrUpdatePayment({
        appointmentId,
        amount,
        paymentMethod: 'VNPAY',
        paymentStatus: 'PENDING'
      });

      // Get IP address of client
      const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      // Create VNPay Payment URL
      const paymentUrl = this.vnpayService.createPaymentUrl({
        orderId: payment.id,
        amount,
        orderInfo: `Thanh toan phi kham benh - Lich hen ${appointmentId.slice(-6)}`,
        ipAddr,
        returnUrl
      });

      res.json({
        message: 'Tạo đường dẫn thanh toán VNPay thành công',
        paymentId: payment.id,
        appointmentId,
        amount,
        paymentUrl
      });
    } catch (error) {
      console.error('Create VNPay URL error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  // Phản hồi điều hướng từ VNPay về giao diện
  async handleVNPayReturn(req: Request, res: Response): Promise<void> {
    try {
      const verifyResult = this.vnpayService.verifyReturnUrl(req.query);

      if (!verifyResult.isValid) {
        res.status(400).json({
          isSuccess: false,
          message: 'Mã chữ ký Checksum VNPay không hợp lệ (Invalid Checksum)',
          responseCode: verifyResult.responseCode
        });
        return;
      }

      const payment = await this.paymentRepository.findById(verifyResult.txnRef);
      if (!payment) {
        res.status(404).json({ error: 'Không tìm thấy đơn hàng thanh toán' });
        return;
      }

      if (verifyResult.isSuccess) {
        const updatedPayment = await this.paymentRepository.updateSuccess(
          payment.id,
          (req.query['vnp_TransactionNo'] as string) || undefined
        );

        // Fetch appointment for confirmation email
        const appointment = await this.appointmentRepository.findById(payment.appointmentId);
        if (appointment && appointment.patient?.email) {
          await this.emailService.sendAppointmentStatusUpdate(
            appointment.patient.email,
            appointment.patient.fullName,
            {
              date: appointment.date,
              time: appointment.time,
              doctorName: appointment.doctor?.fullName || 'Bác sĩ',
              type: appointment.appointmentType || 'Khám bệnh'
            },
            'CONFIRMED',
            `Thanh toán trực tuyến thành công qua VNPay (${verifyResult.amount.toLocaleString('vi-VN')} VND)`
          );
        }

        res.json({
          isSuccess: true,
          message: 'Thanh toán VNPay thành công. Lịch hẹn đã được xác nhận.',
          appointmentId: payment.appointmentId,
          amount: verifyResult.amount,
          payment: updatedPayment
        });
      } else {
        const updatedPayment = await this.paymentRepository.updateFailed(
          payment.id,
          (req.query['vnp_TransactionNo'] as string) || undefined
        );

        res.json({
          isSuccess: false,
          message: `Thanh toán VNPay không thành công (Mã lỗi: ${verifyResult.responseCode})`,
          appointmentId: payment.appointmentId,
          payment: updatedPayment
        });
      }
    } catch (error) {
      console.error('VNPay return error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }

  // Webhook IPN xử lý ngầm từ VNPay Server
  async handleVNPayIPN(req: Request, res: Response): Promise<void> {
    try {
      const verifyResult = this.vnpayService.verifyReturnUrl(req.query);

      if (!verifyResult.isValid) {
        res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
        return;
      }

      const payment = await this.paymentRepository.findById(verifyResult.txnRef);
      if (!payment) {
        res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        return;
      }

      if (payment.amount && Number(payment.amount) !== verifyResult.amount) {
        res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        return;
      }

      if (payment.paymentStatus === 'SUCCESS') {
        res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        return;
      }

      if (verifyResult.isSuccess) {
        await this.paymentRepository.updateSuccess(
          payment.id,
          (req.query['vnp_TransactionNo'] as string) || undefined
        );
      } else {
        await this.paymentRepository.updateFailed(
          payment.id,
          (req.query['vnp_TransactionNo'] as string) || undefined
        );
      }

      res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (error) {
      console.error('VNPay IPN error:', error);
      res.status(200).json({ RspCode: '99', Message: 'Uncertain error' });
    }
  }

  async getPaymentByAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      const payment = await this.paymentRepository.findByAppointmentId(appointmentId);
      if (!payment) {
        res.status(404).json({ error: 'Không tìm thấy thông tin thanh toán cho lịch khám này' });
        return;
      }

      res.json({ payment });
    } catch (error) {
      console.error('Get payment by appointment error:', error);
      res.status(500).json({ error: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
  }
}
