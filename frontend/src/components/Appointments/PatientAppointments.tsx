import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { patientsService } from '../../services/patients';
import { appointmentsService } from '../../services/appointments';
import { APPOINTMENT_STATUS } from '../../constants/roles';

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  symptoms: string;
  notes: string;
  doctor: {
    id: string;
    specialization: string;
    licenseNumber: string;
    bio: string;
    experience: number;
    user: {
      fullName: string;
    };
  };
  createdAt: string;
}

type Order = 'asc' | 'desc';

const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Appointment>('date');
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; appointment: Appointment | null }>({
    open: false,
    appointment: null,
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, [order, orderBy]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { appointments } = await patientsService.getPatientAppointments(user!.id, {
        search: searchTerm || undefined,
        sortBy: orderBy === 'doctor' ? 'doctor' : orderBy === 'date' ? 'date' : 'date',
        sortOrder: order,
        limit: 100 // Get all appointments for now, could add pagination later
      });
      setAppointments(appointments);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể tải lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (property: keyof Appointment) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAppointments();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      await appointmentsService.cancelAppointment(appointment.id);
      // Refresh the appointments list after cancellation
      await fetchAppointments();
      setCancelDialog({ open: false, appointment: null });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể hủy lịch hẹn');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return 'warning';
      case APPOINTMENT_STATUS.CONFIRMED:
        return 'success';
      case APPOINTMENT_STATUS.CANCELLED:
        return 'error';
      case APPOINTMENT_STATUS.COMPLETED:
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return 'Chờ xác nhận';
      case APPOINTMENT_STATUS.CONFIRMED:
        return 'Đã xác nhận';
      case APPOINTMENT_STATUS.CANCELLED:
        return 'Đã hủy';
      case APPOINTMENT_STATUS.COMPLETED:
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canCancelAppointment = (appointment: Appointment) => {
    return appointment.status === APPOINTMENT_STATUS.PENDING;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
      <Paper 
        elevation={0}
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 3,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 4, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
            Lịch Hẹn Của Tôi
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Quản lý tất cả lịch hẹn đã đặt của bạn
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search Bar */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo tên bác sĩ, chuyên khoa hoặc triệu chứng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {appointments.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {searchTerm ? 'Không tìm thấy lịch hẹn nào' : 'Bạn chưa có lịch hẹn nào'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchTerm ? 'Hãy thử từ khóa khác' : 'Hãy đặt lịch khám để bắt đầu'}
              </Typography>
            </Box>
          </Box>
        ) : (
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'date'}
                      direction={orderBy === 'date' ? order : 'asc'}
                      onClick={() => handleRequestSort('date')}
                      component="span"
                      style={{ cursor: 'pointer' }}
                    >
                      Ngày hẹn
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Giờ</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'doctor'}
                      direction={orderBy === 'doctor' ? order : 'asc'}
                      onClick={() => handleRequestSort('doctor' as keyof Appointment)}
                      component="span"
                      style={{ cursor: 'pointer' }}
                    >
                      Bác sĩ
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Chuyên khoa</TableCell>
                  <TableCell>Triệu chứng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>{formatDate(appointment.date)}</TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>{appointment.doctor.user?.fullName}</TableCell>
                      <TableCell>{appointment.doctor.specialization}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>
                          {appointment.symptoms || 'Không có'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(appointment.status)}
                          color={getStatusColor(appointment.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {canCancelAppointment(appointment) && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelDialog({ open: true, appointment });
                            }}
                            title="Hủy lịch hẹn"
                            component="button"
                            type="button"
                          >
                            <CancelIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Cancel Appointment Dialog */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, appointment: null })}
      >
        <DialogTitle>Xác nhận hủy lịch hẹn</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn hủy lịch hẹn với bác sĩ{' '}
            <strong>{cancelDialog.appointment?.doctor.user?.fullName}</strong> vào ngày{' '}
            <strong>{cancelDialog.appointment && formatDate(cancelDialog.appointment.date)}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, appointment: null })}>
            Hủy
          </Button>
          <Button
            onClick={() => cancelDialog.appointment && handleCancelAppointment(cancelDialog.appointment)}
            color="error"
            variant="contained"
          >
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyAppointments;
