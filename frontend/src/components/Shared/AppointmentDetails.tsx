import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip, 
  Divider, 
  CircularProgress,
  Button,
  Paper,
  IconButton
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { appointmentsService, Appointment } from '../../services/appointments';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';
import DoctorStatusDialog from './DoctorStatusDialog';

const statusConfig: Record<string, { label: string; color: 'warning' | 'info' | 'success' | 'error' | 'default' }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'info' },
  COMPLETED: { label: 'Đã hoàn thành', color: 'success' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
};

const AppointmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await appointmentsService.getAppointment(id);
        setAppointment(data.appointment);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load appointment details:', err);
        setError('Không thể tải thông tin lịch hẹn. Lịch hẹn có thể không tồn tại hoặc bạn không có quyền truy cập.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const handleBack = () => {
    if (user?.role === USER_ROLES.PATIENT) {
      navigate('/appointments');
    } else if (user?.role === USER_ROLES.DOCTOR) {
      navigate('/doctor-appointments');
    } else {
      navigate('/admin/appointments');
    }
  };

  const handleCancelSubmit = async () => {
    if (!appointment) return;
    try {
      await appointmentsService.cancelAppointment(appointment.id);
      setAppointment(prev => prev ? { ...prev, status: 'CANCELLED' } : prev);
      setCancelDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Không thể hủy lịch hẹn');
    }
  };

  const handleStatusUpdateSuccess = (newStatus: string) => {
    setAppointment(prev => prev ? { ...prev, status: newStatus } : prev);
  };

  const canDoctorUpdate = appointment && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED');
  const canPatientCancel = appointment && appointment.status === 'PENDING';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !appointment) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Không tìm thấy lịch hẹn'}</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const statusInfo = statusConfig[appointment.status] || { label: appointment.status, color: 'default' };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Chi tiết Lịch hẹn
        </Typography>
      </Box>

      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          {/* Status Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h6" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1 }} />
                {format(new Date(appointment.date), 'EEEE, dd MMMM yyyy', { locale: vi })}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon sx={{ mr: 1 }} />
                {appointment.time}
              </Typography>
            </Box>
            <Chip 
              label={statusInfo.label} 
              color={statusInfo.color} 
              size="medium"
              sx={{ fontWeight: 'bold', px: 1 }} 
            />
          </Box>

          {/* Actions */}
          <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {user?.role === USER_ROLES.PATIENT && canPatientCancel && (
              <Button variant="outlined" color="error" onClick={() => setCancelDialogOpen(true)}>
                Hủy lịch hẹn
              </Button>
            )}
            
            {user?.role === USER_ROLES.ADMIN && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
              <Button variant="outlined" color="error" onClick={() => setCancelDialogOpen(true)}>
                Hủy lịch hẹn (Admin)
              </Button>
            )}

            {user?.role === USER_ROLES.DOCTOR && canDoctorUpdate && (
              <Button variant="contained" color="primary" onClick={() => setStatusDialogOpen(true)}>
                Cập nhật trạng thái
              </Button>
            )}
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={4}>
            {/* Patient Info */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                  THÔNG TIN BỆNH NHÂN
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {appointment.patient.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  SĐT: {appointment.patient.phone || 'Chưa cập nhật'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {appointment.patient.email}
                </Typography>
              </Paper>
            </Grid>

            {/* Doctor Info */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MedicalIcon sx={{ mr: 1, fontSize: 20 }} />
                  THÔNG TIN BÁC SĨ
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  BS. {appointment.doctor.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chuyên khoa: {appointment.doctor.specialization}
                </Typography>
              </Paper>
            </Grid>

            {/* Notes & Symptoms */}
            <Grid size={{ xs: 12 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NotesIcon sx={{ mr: 1, fontSize: 20 }} />
                  LÝ DO KHÁM & GHI CHÚ
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Triệu chứng / Lý do khám:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                    {appointment.symptoms || 'Không có thông tin'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Ghi chú thêm:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                    {appointment.notes || 'Không có ghi chú'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cancel Dialog for Patient / Admin */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Hủy lịch hẹn</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn hủy lịch hẹn này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Đóng</Button>
          <Button onClick={handleCancelSubmit} color="error" variant="contained">
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog for Doctor */}
      <DoctorStatusDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        appointment={appointment}
        onSuccess={handleStatusUpdateSuccess}
      />
    </Box>
  );
};

export default AppointmentDetails;
