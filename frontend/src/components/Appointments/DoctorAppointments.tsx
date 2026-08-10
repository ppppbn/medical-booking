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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentsService, Appointment } from '../../services/appointments';
import { APPOINTMENT_STATUS } from '../../constants/roles';

type Order = 'asc' | 'desc';
type TabValue = 'all' | 'today' | 'pending' | 'confirmed' | 'completed';

const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Appointment>('date');
  const [tabValue, setTabValue] = useState<TabValue>('all');
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    appointment: Appointment | null;
    newStatus: string;
    diagnosis: string;
    treatment: string;
    prescription: string;
    testResults: string;
    followUpInstructions: string;
    nextAppointmentDate: string;
  }>({
    open: false,
    appointment: null,
    newStatus: '',
    diagnosis: '',
    treatment: '',
    prescription: '',
    testResults: '',
    followUpInstructions: '',
    nextAppointmentDate: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAndSortAppointments();
  }, [appointments, searchTerm, order, orderBy, tabValue]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Don't pass doctorId for doctor's own appointments - let backend handle role-based filtering
      const { appointments } = await appointmentsService.getAppointments({
        limit: 1000 // Get all appointments for the doctor
      });
      setAppointments(appointments);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể tải lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAppointments = () => {
    let filtered = appointments.filter(appointment => {
      // Filter by search term
      const matchesSearch = !searchTerm ||
        appointment.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by tab
      const matchesTab = (() => {
        const now = new Date();
        const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayIso = now.toISOString().split('T')[0];

        const appointmentDateStr = typeof appointment.date === 'string'
          ? appointment.date.split('T')[0]
          : (appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '');

        switch (tabValue) {
          case 'today':
            return appointmentDateStr === todayLocal || appointmentDateStr === todayIso;
          case 'pending':
            return appointment.status === APPOINTMENT_STATUS.PENDING;
          case 'confirmed':
            return appointment.status === APPOINTMENT_STATUS.CONFIRMED;
          case 'completed':
            return appointment.status === APPOINTMENT_STATUS.COMPLETED;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesTab;
    });

    // Sort appointments
    filtered.sort((a, b) => {
      let aValue: any = a[orderBy];
      let bValue: any = b[orderBy];

      if (orderBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAppointments(filtered);
  };

  const handleRequestSort = (property: keyof Appointment) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleUpdateStatus = async (appointment: Appointment, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      // If completing the appointment, include medical record data
      if (newStatus === APPOINTMENT_STATUS.COMPLETED) {
        if (statusDialog.diagnosis) updateData.diagnosis = statusDialog.diagnosis;
        if (statusDialog.treatment) updateData.treatment = statusDialog.treatment;
        if (statusDialog.prescription) updateData.prescription = statusDialog.prescription;
        if (statusDialog.testResults) updateData.testResults = statusDialog.testResults;
        if (statusDialog.followUpInstructions) updateData.followUpInstructions = statusDialog.followUpInstructions;
        if (statusDialog.nextAppointmentDate) updateData.nextAppointmentDate = statusDialog.nextAppointmentDate;
      }

      await appointmentsService.updateAppointment(appointment.id, updateData);
      setAppointments(appointments.map(app =>
        app.id === appointment.id
          ? { ...app, status: newStatus }
          : app
      ));
      setStatusDialog({
        open: false,
        appointment: null,
        newStatus: '',
        diagnosis: '',
        treatment: '',
        prescription: '',
        testResults: '',
        followUpInstructions: '',
        nextAppointmentDate: '',
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể cập nhật trạng thái');
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
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utcDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAvailableStatusChanges = (currentStatus: string) => {
    const options = [];

    if (currentStatus === APPOINTMENT_STATUS.PENDING) {
      options.push({ value: APPOINTMENT_STATUS.CONFIRMED, label: 'Xác nhận' });
      options.push({ value: APPOINTMENT_STATUS.CANCELLED, label: 'Hủy' });
    } else if (currentStatus === APPOINTMENT_STATUS.CONFIRMED) {
      options.push({ value: APPOINTMENT_STATUS.COMPLETED, label: 'Hoàn thành' });
      options.push({ value: APPOINTMENT_STATUS.CANCELLED, label: 'Hủy' });
    }

    return options;
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
        <Box sx={{ p: 4, pb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
            Quản Lý Lịch Hẹn
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Xem và quản lý tất cả lịch hẹn của bạn
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Tabs for filtering */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Tất cả" value="all" />
              <Tab label="Hôm nay" value="today" />
              <Tab label="Chờ xác nhận" value="pending" />
              <Tab label="Đã xác nhận" value="confirmed" />
              <Tab label="Hoàn thành" value="completed" />
            </Tabs>
          </Box>

          {/* Search Bar */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo tên bệnh nhân, email hoặc triệu chứng..."
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
          {filteredAppointments.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm || tabValue !== 'all' ? 'Không tìm thấy lịch hẹn nào' : 'Bạn chưa có lịch hẹn nào'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {searchTerm || tabValue !== 'all' ? 'Hãy thử từ khóa hoặc bộ lọc khác' : 'Các bệnh nhân sẽ đặt lịch hẹn với bạn'}
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
                        active={orderBy === 'patient'}
                        direction={orderBy === 'patient' ? order : 'asc'}
                        onClick={() => handleRequestSort('patient' as keyof Appointment)}
                        component="span"
                        style={{ cursor: 'pointer' }}
                      >
                        Bệnh nhân
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Triệu chứng</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>{formatDate(appointment.date)}</TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {appointment.patient.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.patient.email}
                          </Typography>
                        </Box>
                      </TableCell>
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
                        {getAvailableStatusChanges(appointment.status).length > 0 && (
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => setStatusDialog({
                              open: true,
                              appointment,
                              newStatus: getAvailableStatusChanges(appointment.status)[0]?.value || '',
                              diagnosis: '',
                              treatment: '',
                              prescription: '',
                              testResults: '',
                              followUpInstructions: '',
                              nextAppointmentDate: '',
                            })}
                            title="Cập nhật trạng thái"
                          >
                            <ScheduleIcon />
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

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({
          open: false,
          appointment: null,
          newStatus: '',
          diagnosis: '',
          treatment: '',
          prescription: '',
          testResults: '',
          followUpInstructions: '',
          nextAppointmentDate: '',
        })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Cập nhật trạng thái lịch hẹn</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Cập nhật trạng thái cho lịch hẹn của{' '}
            <strong>{statusDialog.appointment?.patient.fullName}</strong> vào ngày{' '}
            <strong>{statusDialog.appointment && formatDate(statusDialog.appointment.date)}</strong>
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trạng thái mới</InputLabel>
            <Select
              value={statusDialog.newStatus}
              onChange={(e) => setStatusDialog(prev => ({ ...prev, newStatus: e.target.value }))}
              label="Trạng thái mới"
            >
              {statusDialog.appointment && getAvailableStatusChanges(statusDialog.appointment.status).map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Medical Record Fields - Only show when completing appointment */}
          {statusDialog.newStatus === APPOINTMENT_STATUS.COMPLETED && (
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
                value={statusDialog.diagnosis}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Nhập chẩn đoán bệnh..."
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Điều trị"
                multiline
                rows={2}
                value={statusDialog.treatment}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, treatment: e.target.value }))}
                placeholder="Mô tả phương pháp điều trị..."
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Đơn thuốc"
                multiline
                rows={3}
                value={statusDialog.prescription}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, prescription: e.target.value }))}
                placeholder="Liệt kê các loại thuốc và liều lượng..."
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Kết quả xét nghiệm"
                multiline
                rows={2}
                value={statusDialog.testResults}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, testResults: e.target.value }))}
                placeholder="Kết quả các xét nghiệm (nếu có)..."
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Hướng dẫn theo dõi"
                multiline
                rows={2}
                value={statusDialog.followUpInstructions}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, followUpInstructions: e.target.value }))}
                placeholder="Hướng dẫn cho bệnh nhân sau khi khám..."
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Lịch hẹn tiếp theo"
                type="date"
                value={statusDialog.nextAppointmentDate}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, nextAppointmentDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({
            open: false,
            appointment: null,
            newStatus: '',
            diagnosis: '',
            treatment: '',
            prescription: '',
            testResults: '',
            followUpInstructions: '',
            nextAppointmentDate: '',
          })}>
            Hủy
          </Button>
          <Button
            onClick={() => statusDialog.appointment && handleUpdateStatus(statusDialog.appointment, statusDialog.newStatus)}
            variant="contained"
            disabled={!statusDialog.newStatus}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorAppointments;
