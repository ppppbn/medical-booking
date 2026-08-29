import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  TextField,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  People as PeopleIcon,
  MedicalServices as MedicalIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { appointmentsService } from '../../services/appointments';
import { doctorsService } from '../../services/doctors';
import { patientsService } from '../../services/patients';
import { APPOINTMENT_STATUS } from '../../constants/roles';
import DoctorCalendar from './DoctorCalendar';

interface SystemStats {
  totalUsers: number;
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  activePatients: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

interface DoctorPerformance {
  id: string;
  fullName: string;
  specialization: string;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  completionRate: number;
}

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerformance[]>([]);
  const [appointmentTrends, setAppointmentTrends] = useState<{ month: string; appointments: number }[]>([]);
  const [specializationPerformance, setSpecializationPerformance] = useState<{ specialization: string; completionRate: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Date range filter
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Tab for switching between overview and charts
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async (range = dateRange) => {
    try {
      setLoading(true);

      const params: { startDate?: string; endDate?: string } = {};
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate) params.endDate = range.endDate;

      // Fetch all statistics in parallel
      const [
        appointmentStats,
        doctorsData,
        patientsData,
        doctorPerformanceData,
        appointmentTrendsData,
        specializationPerformanceData,
      ] = await Promise.all([
        appointmentsService.getAppointmentStatistics(params),
        doctorsService.getDoctors(),
        patientsService.getPatientStatistics(params),
        appointmentsService.getDoctorPerformance(params),
        appointmentsService.getAppointmentTrends(params),
        appointmentsService.getSpecializationPerformance(params),
      ]);

      // Combine all stats
      const combinedStats: SystemStats = {
        totalUsers: doctorsData.doctors.length + patientsData.totalPatients,
        totalDoctors: doctorsData.doctors.length,
        activeDoctors: doctorsData.doctors.filter(d => d.isActive).length,
        totalPatients: patientsData.totalPatients,
        activePatients: patientsData.activePatients,
        totalAppointments: appointmentStats.statistics.total,
        pendingAppointments: appointmentStats.statistics.pending,
        confirmedAppointments: appointmentStats.statistics.confirmed,
        completedAppointments: appointmentStats.statistics.completed,
        cancelledAppointments: appointmentStats.statistics.cancelled,
      };

      setStats(combinedStats);
      setDoctorPerformance(doctorPerformanceData.performance);
      setAppointmentTrends(appointmentTrendsData.trends);
      setSpecializationPerformance(specializationPerformanceData.performance.map(spec => ({
        specialization: spec.specialization,
        completionRate: Math.round(spec.completionRate)
      })));

    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
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

  // Prepare chart data
  const getAppointmentStatusData = () => {
    if (!stats) return [];
    return [
      { name: 'Chờ xác nhận', value: stats.pendingAppointments, color: '#ff9800' },
      { name: 'Đã xác nhận', value: stats.confirmedAppointments, color: '#2196f3' },
      { name: 'Hoàn thành', value: stats.completedAppointments, color: '#4caf50' },
      { name: 'Đã hủy', value: stats.cancelledAppointments, color: '#f44336' },
    ];
  };

  const getTopSpecializationsData = () => {
    return specializationPerformance.slice(0, 5).map(spec => ({
      name: spec.specialization,
      completionRate: spec.completionRate,
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleDateFilter = () => {
    fetchStatistics(dateRange);
  };

  const clearDateFilter = () => {
    const emptyRange = { startDate: '', endDate: '' };
    setDateRange(emptyRange);
    fetchStatistics(emptyRange);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Không thể tải dữ liệu thống kê'}</Alert>
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
              Thống kê hệ thống
            </Typography>

            {/* Date Range Filter */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <DatePicker
                label="Từ ngày"
                format="dd/MM/yyyy"
                value={dateRange.startDate ? new Date(dateRange.startDate) : null}
                onChange={(newDate: Date | null) => {
                  const dateString = newDate && !isNaN(newDate.getTime()) 
                    ? `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`
                    : '';
                  setDateRange({ ...dateRange, startDate: dateString });
                }}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="Đến ngày"
                format="dd/MM/yyyy"
                value={dateRange.endDate ? new Date(dateRange.endDate) : null}
                onChange={(newDate: Date | null) => {
                  const dateString = newDate && !isNaN(newDate.getTime()) 
                    ? `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`
                    : '';
                  setDateRange({ ...dateRange, endDate: dateString });
                }}
                slotProps={{ textField: { size: 'small' } }}
              />
              <Button variant="contained" onClick={handleDateFilter} size="small">
                Lọc
              </Button>
              <Button variant="outlined" onClick={clearDateFilter} size="small">
                Xóa
              </Button>
            </Box>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Tổng quan về hoạt động của hệ thống đặt lịch khám bệnh
          </Typography>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Tổng quan" />
              <Tab label="Biểu đồ" />
              <Tab label="Lịch bác sĩ" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {tabValue === 0 && (
            <>
              {/* Key Metrics Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
            {/* User Statistics */}
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng người dùng
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                  <MedicalIcon />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {stats.activeDoctors}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bác sĩ hoạt động
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  / {stats.totalDoctors} tổng số
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: 'info.light', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <PeopleIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                {stats.activePatients}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bệnh nhân hoạt động
              </Typography>
              <Typography variant="caption" color="text.secondary">
                / {stats.totalPatients} tổng số
              </Typography>
            </CardContent>
          </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                  <EventIcon />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {stats.totalAppointments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng lịch hẹn
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Appointment Status Breakdown */}
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Thống kê lịch hẹn theo trạng thái
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {stats.pendingAppointments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chờ xác nhận
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <EventIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {stats.confirmedAppointments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đã xác nhận
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {stats.completedAppointments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hoàn thành
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CancelIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {stats.cancelledAppointments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đã hủy
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Doctor Performance Table */}
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Hiệu suất bác sĩ
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: '400px' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Bác sĩ</TableCell>
                  <TableCell>Chuyên khoa</TableCell>
                  <TableCell align="right">Tổng lịch hẹn</TableCell>
                  <TableCell align="right">Hoàn thành</TableCell>
                  <TableCell align="right">Đang chờ</TableCell>
                  <TableCell align="right">Tỷ lệ hoàn thành</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctorPerformance.map((doctor) => (
                  <TableRow key={doctor.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(doctor.fullName)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {doctor.fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell align="right">{doctor.totalAppointments}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={doctor.completedAppointments}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={doctor.pendingAppointments}
                        color="warning"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${doctor.completionRate.toFixed(1)}%`}
                        color={doctor.completionRate >= 80 ? 'success' : doctor.completionRate >= 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
            </>
          )}

          {/* Charts Tab */}
          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* First Row: Pie Chart and Placeholder for balance */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Appointment Status Pie Chart */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Phân bố trạng thái lịch hẹn
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getAppointmentStatusData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getAppointmentStatusData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>

                {/* Empty space for visual balance */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }} />
              </Box>

              {/* Second Row: Full-width Specialization Bar Chart */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tỷ lệ hoàn thành của chuyên khoa
                  </Typography>
                  <Box sx={{ height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getTopSpecializationsData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completionRate" fill="#8884d8" name="Tỷ lệ hoàn thành (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              {/* Third Row: Full-width Appointments Trend Line Chart */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Xu hướng lịch hẹn theo thời gian (6 tháng gần nhất)
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={appointmentTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="appointments" stroke="#8884d8" name="Số lịch hẹn" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Doctor Calendar Tab */}
          {tabValue === 2 && (
            <DoctorCalendar />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Statistics;
