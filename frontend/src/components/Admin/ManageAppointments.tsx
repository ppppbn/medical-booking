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
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { appointmentsService, Appointment } from '../../services/appointments';
import { doctorsService, Doctor } from '../../services/doctors';
import { APPOINTMENT_STATUS } from '../../constants/roles';

type Order = 'asc' | 'desc';
type TabValue = 'all' | 'today' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const ManageAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Appointment>('date');
  const [tabValue, setTabValue] = useState<TabValue>('all');

  // Filters
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog states
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; appointment: Appointment | null; newStatus: string }>({
    open: false,
    appointment: null,
    newStatus: '',
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; appointment: Appointment | null }>({
    open: false,
    appointment: null,
  });

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchAppointmentsAndDoctors();
  }, []);

  useEffect(() => {
    filterAndSortAppointments();
  }, [appointments, searchTerm, order, orderBy, tabValue, doctorFilter, statusFilter]);

  const fetchAppointmentsAndDoctors = async () => {
    try {
      setLoading(true);
      const [appointmentsResponse, doctorsResponse, statsResponse] = await Promise.all([
        appointmentsService.getAppointments({ limit: 1000 }),
        doctorsService.getDoctors(),
        appointmentsService.getAppointmentStatistics()
      ]);

      setAppointments(appointmentsResponse.appointments);
      setDoctors(doctorsResponse.doctors);
      setStatistics(statsResponse.statistics);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể tải lịch hẹn và bác sĩ');
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
        appointment.doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by doctor
      const matchesDoctor = !doctorFilter || appointment.doctor.id === doctorFilter;

      // Filter by status
      const matchesStatus = !statusFilter || appointment.status === statusFilter;

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
          case 'cancelled':
            return appointment.status === APPOINTMENT_STATUS.CANCELLED;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesDoctor && matchesStatus && matchesTab;
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
      await appointmentsService.updateAppointment(appointment.id, { status: newStatus });
      setAppointments(appointments.map(app =>
        app.id === appointment.id
          ? { ...app, status: newStatus }
          : app
      ));
      setStatusDialog({ open: false, appointment: null, newStatus: '' });
      setSnackbar({
        open: true,
        message: 'Cập nhật trạng thái lịch hẹn thành công',
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Không thể cập nhật trạng thái lịch hẹn',
        severity: 'error'
      });
    }
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    try {
      await appointmentsService.deleteAppointment(appointment.id);
      setAppointments(appointments.filter(app => app.id !== appointment.id));
      setDeleteDialog({ open: false, appointment: null });
      setSnackbar({
        open: true,
        message: 'Xóa lịch hẹn thành công',
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Không thể xóa lịch hẹn',
        severity: 'error'
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDoctorFilter('');
    setStatusFilter('');
    setTabValue('all');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return 'warning';
      case APPOINTMENT_STATUS.CONFIRMED:
        return 'info';
      case APPOINTMENT_STATUS.COMPLETED:
        return 'success';
      case APPOINTMENT_STATUS.CANCELLED:
        return 'error';
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
      case APPOINTMENT_STATUS.COMPLETED:
        return 'Hoàn thành';
      case APPOINTMENT_STATUS.CANCELLED:
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getInitials = (fullName: string | undefined) => {
    if (!fullName) return '?';
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Quản lý lịch hẹn
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Quản lý tất cả lịch hẹn từ tất cả bác sĩ trong hệ thống
          </Typography>

          {/* Statistics Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {statistics.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng lịch hẹn
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {statistics.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chờ xác nhận
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {statistics.confirmed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đã xác nhận
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {statistics.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hoàn thành
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label={`Tất cả (${appointments.length})`} value="all" />
              <Tab label={`Hôm nay (${statistics.today})`} value="today" />
              <Tab label={`Chờ xác nhận (${statistics.pending})`} value="pending" />
              <Tab label={`Đã xác nhận (${statistics.confirmed})`} value="confirmed" />
              <Tab label={`Hoàn thành (${statistics.completed})`} value="completed" />
              <Tab label={`Đã hủy (${statistics.cancelled})`} value="cancelled" />
            </Tabs>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' }, gap: 2, mb: 2 }}>
            <TextField
              placeholder="Tìm kiếm theo tên bệnh nhân, bác sĩ, triệu chứng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
            <FormControl size="small">
              <InputLabel>Lọc theo bác sĩ</InputLabel>
              <Select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                label="Lọc theo bác sĩ"
              >
                <MenuItem value="">
                  <em>Tất cả bác sĩ</em>
                </MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.fullName} - {doctor.specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Lọc theo trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Lọc theo trạng thái"
              >
                <MenuItem value="">
                  <em>Tất cả trạng thái</em>
                </MenuItem>
                <MenuItem value={APPOINTMENT_STATUS.PENDING}>Chờ xác nhận</MenuItem>
                <MenuItem value={APPOINTMENT_STATUS.CONFIRMED}>Đã xác nhận</MenuItem>
                <MenuItem value={APPOINTMENT_STATUS.COMPLETED}>Hoàn thành</MenuItem>
                <MenuItem value={APPOINTMENT_STATUS.CANCELLED}>Đã hủy</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              size="small"
            >
              Xóa bộ lọc
            </Button>
          </Box>

          {/* Table */}
          <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
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
                  <TableCell>Bệnh nhân</TableCell>
                  <TableCell>Bác sĩ</TableCell>
                  <TableCell>Triệu chứng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id} hover>
                    <TableCell>
                      {new Date(appointment.date).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {getInitials(appointment.patient.fullName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {appointment.patient.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.patient.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          {getInitials(appointment.doctor.fullName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {appointment.doctor.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.doctor.specialization}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={appointment.symptoms || 'Không có triệu chứng'}>
                        <Typography variant="body2" sx={{
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {appointment.symptoms || 'Không có triệu chứng'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(appointment.status)}
                        color={getStatusColor(appointment.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {appointment.status === APPOINTMENT_STATUS.PENDING && (
                        <>
                          <Tooltip title="Xác nhận lịch hẹn">
                            <IconButton
                              size="small"
                              onClick={() => setStatusDialog({
                                open: true,
                                appointment,
                                newStatus: APPOINTMENT_STATUS.CONFIRMED
                              })}
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hủy lịch hẹn">
                            <IconButton
                              size="small"
                              onClick={() => setStatusDialog({
                                open: true,
                                appointment,
                                newStatus: APPOINTMENT_STATUS.CANCELLED
                              })}
                              color="error"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                        <>
                          <Tooltip title="Đánh dấu hoàn thành">
                            <IconButton
                              size="small"
                              onClick={() => setStatusDialog({
                                open: true,
                                appointment,
                                newStatus: APPOINTMENT_STATUS.COMPLETED
                              })}
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hủy lịch hẹn">
                            <IconButton
                              size="small"
                              onClick={() => setStatusDialog({
                                open: true,
                                appointment,
                                newStatus: APPOINTMENT_STATUS.CANCELLED
                              })}
                              color="error"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Xóa lịch hẹn">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, appointment })}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, appointment: null, newStatus: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cập nhật trạng thái lịch hẹn</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Bạn có chắc muốn {statusDialog.newStatus === APPOINTMENT_STATUS.CONFIRMED ? 'xác nhận' :
              statusDialog.newStatus === APPOINTMENT_STATUS.COMPLETED ? 'đánh dấu hoàn thành' :
              'hủy'} lịch hẹn này?
          </Typography>
          {statusDialog.appointment && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Bệnh nhân:</strong> {statusDialog.appointment.patient.fullName}
              </Typography>
              <Typography variant="body2">
                <strong>Bác sĩ:</strong> {statusDialog.appointment.doctor.fullName}
              </Typography>
              <Typography variant="body2">
                <strong>Ngày:</strong> {new Date(statusDialog.appointment.date).toLocaleDateString('vi-VN')}
              </Typography>
              <Typography variant="body2">
                <strong>Giờ:</strong> {statusDialog.appointment.time}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, appointment: null, newStatus: '' })}>
            Hủy
          </Button>
          <Button
            onClick={() => statusDialog.appointment && handleUpdateStatus(statusDialog.appointment, statusDialog.newStatus)}
            variant="contained"
            color={statusDialog.newStatus === APPOINTMENT_STATUS.CONFIRMED ? 'success' :
                   statusDialog.newStatus === APPOINTMENT_STATUS.COMPLETED ? 'success' : 'error'}
          >
            {statusDialog.newStatus === APPOINTMENT_STATUS.CONFIRMED ? 'Xác nhận' :
             statusDialog.newStatus === APPOINTMENT_STATUS.COMPLETED ? 'Hoàn thành' : 'Hủy lịch hẹn'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, appointment: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa lịch hẹn</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Bạn có chắc muốn xóa lịch hẹn này? Hành động này không thể hoàn tác.
          </Typography>
          {deleteDialog.appointment && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Bệnh nhân:</strong> {deleteDialog.appointment.patient.fullName}
              </Typography>
              <Typography variant="body2">
                <strong>Bác sĩ:</strong> {deleteDialog.appointment.doctor.fullName}
              </Typography>
              <Typography variant="body2">
                <strong>Ngày:</strong> {new Date(deleteDialog.appointment.date).toLocaleDateString('vi-VN')}
              </Typography>
              <Typography variant="body2">
                <strong>Giờ:</strong> {deleteDialog.appointment.time}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, appointment: null })}>
            Hủy
          </Button>
          <Button
            onClick={() => deleteDialog.appointment && handleDeleteAppointment(deleteDialog.appointment)}
            variant="contained"
            color="error"
          >
            Xóa lịch hẹn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageAppointments;
