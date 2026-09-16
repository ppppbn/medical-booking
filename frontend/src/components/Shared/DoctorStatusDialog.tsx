import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { appointmentsService, Appointment } from '../../services/appointments';
import { APPOINTMENT_STATUS } from '../../constants/roles';

interface DoctorStatusDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: (newStatus: string) => void;
}

const DoctorStatusDialog: React.FC<DoctorStatusDialogProps> = ({
  open,
  onClose,
  appointment,
  onSuccess
}) => {
  const [newStatus, setNewStatus] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [treatment, setTreatment] = useState<string>('');
  const [prescription, setPrescription] = useState<string>('');
  const [testResults, setTestResults] = useState<string>('');
  const [followUpInstructions, setFollowUpInstructions] = useState<string>('');
  const [nextAppointmentDate, setNextAppointmentDate] = useState<Date | null>(null);

  useEffect(() => {
    if (open && appointment) {
      setNewStatus(getAvailableStatusChanges(appointment)[0]?.value || '');
      setDiagnosis('');
      setTreatment('');
      setPrescription('');
      setTestResults('');
      setFollowUpInstructions('');
      setNextAppointmentDate(null);
    }
  }, [open, appointment]);

  const getAvailableStatusChanges = (appt: Appointment) => {
    const options = [];
    const currentStatus = appt.status;

    if (currentStatus === APPOINTMENT_STATUS.PENDING) {
      options.push({ value: APPOINTMENT_STATUS.CONFIRMED, label: 'Xác nhận' });
      options.push({ value: APPOINTMENT_STATUS.CANCELLED, label: 'Hủy' });
    } else if (currentStatus === APPOINTMENT_STATUS.CONFIRMED) {
      const isFuture = new Date(appt.date) > new Date();
      if (!isFuture) {
        options.push({ value: APPOINTMENT_STATUS.COMPLETED, label: 'Hoàn thành' });
      }
      options.push({ value: APPOINTMENT_STATUS.CANCELLED, label: 'Hủy' });
    }

    return options;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utcDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmit = async () => {
    if (!appointment) return;
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === APPOINTMENT_STATUS.COMPLETED) {
        if (diagnosis) updateData.diagnosis = diagnosis;
        if (treatment) updateData.treatment = treatment;
        if (prescription) updateData.prescription = prescription;
        if (testResults) updateData.testResults = testResults;
        if (followUpInstructions) updateData.followUpInstructions = followUpInstructions;
        if (nextAppointmentDate && !isNaN(nextAppointmentDate.getTime())) {
          updateData.nextAppointmentDate = `${nextAppointmentDate.getFullYear()}-${String(nextAppointmentDate.getMonth() + 1).padStart(2, '0')}-${String(nextAppointmentDate.getDate()).padStart(2, '0')}T00:00:00.000Z`;
        }
      }

      await appointmentsService.updateAppointment(appointment.id, updateData);
      onSuccess(newStatus);
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Không thể cập nhật trạng thái');
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Cập nhật trạng thái lịch hẹn</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2, mt: 1 }}>
          Cập nhật trạng thái cho lịch hẹn của{' '}
          <strong>{appointment.patient.fullName}</strong> vào ngày{' '}
          <strong>{formatDate(appointment.date)}</strong>
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Trạng thái mới</InputLabel>
          <Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            label="Trạng thái mới"
            fullWidth
          >
            {getAvailableStatusChanges(appointment).map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {newStatus === APPOINTMENT_STATUS.COMPLETED && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Thông tin y tế
            </Typography>

            <TextField
              fullWidth
              label="Chẩn đoán"
              multiline
              rows={2}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Nhập chẩn đoán bệnh..."
              sx={{ mb: 2 }}
              required
              error={!diagnosis?.trim()}
              helperText={!diagnosis?.trim() ? "Vui lòng nhập chẩn đoán khi hoàn thành khám" : ""}
            />

            <TextField
              fullWidth
              label="Điều trị"
              multiline
              rows={2}
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Mô tả phương pháp điều trị..."
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Đơn thuốc"
              multiline
              rows={3}
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="Liệt kê các loại thuốc và liều lượng..."
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Kết quả xét nghiệm"
              multiline
              rows={2}
              value={testResults}
              onChange={(e) => setTestResults(e.target.value)}
              placeholder="Kết quả các xét nghiệm (nếu có)..."
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Hướng dẫn theo dõi"
              multiline
              rows={2}
              value={followUpInstructions}
              onChange={(e) => setFollowUpInstructions(e.target.value)}
              placeholder="Hướng dẫn cho bệnh nhân sau khi khám..."
              sx={{ mb: 2 }}
            />

            <DatePicker
              label="Lịch hẹn tiếp theo"
              format="dd/MM/yyyy"
              value={nextAppointmentDate}
              onChange={(newDate: Date | null) => setNextAppointmentDate(newDate)}
              slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!newStatus || (newStatus === APPOINTMENT_STATUS.COMPLETED && !diagnosis?.trim())}
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DoctorStatusDialog;
