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
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentsService } from '../../services/appointments';
import { patientsService } from '../../services/patients';

interface PatientSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  lastAppointmentDate: string;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
}

type Order = 'asc' | 'desc';

const DoctorPatients: React.FC = () => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof PatientSummary>('lastAppointmentDate');
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [patientDialog, setPatientDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterAndSortPatients();
  }, [patients, searchTerm, order, orderBy]);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      // Get all appointments for this doctor (backend automatically filters by authenticated user role)
      const { appointments } = await appointmentsService.getAppointments({
        limit: 10000 // Get all to aggregate patient data
      });

      // Aggregate patient data from appointments
      const patientMap = new Map<string, PatientSummary>();

      appointments.forEach(appointment => {
        const patientId = appointment.patient.id;

        if (!patientMap.has(patientId)) {
          patientMap.set(patientId, {
            id: patientId,
            fullName: appointment.patient.fullName,
            email: appointment.patient.email,
            phone: appointment.patient.phone || '',
            lastAppointmentDate: appointment.date,
            totalAppointments: 0,
            upcomingAppointments: 0,
            completedAppointments: 0,
          });
        }

        const patient = patientMap.get(patientId)!;
        patient.totalAppointments++;

        if (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') {
          patient.upcomingAppointments++;
        } else if (appointment.status === 'COMPLETED') {
          patient.completedAppointments++;
        }

        // Update last appointment date if this is more recent
        if (appointment.date > patient.lastAppointmentDate) {
          patient.lastAppointmentDate = appointment.date;
        }
      });

      const patientList = Array.from(patientMap.values());
      setPatients(patientList);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = patients.filter(patient =>
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm))
    );

    filtered.sort((a, b) => {
      let aValue: any = a[orderBy];
      let bValue: any = b[orderBy];

      if (orderBy === 'lastAppointmentDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPatients(filtered);
  };

  const handleRequestSort = (property: keyof PatientSummary) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleViewPatient = (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setPatientDialog(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utcDate.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPatientInitials = (fullName: string) => {
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
        <Box sx={{ p: 4, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
            Danh Sách Bệnh Nhân
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Quản lý thông tin các bệnh nhân đã từng khám của bạn
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
              placeholder="Tìm kiếm theo tên bệnh nhân, email hoặc số điện thoại..."
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
          {filteredPatients.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm ? 'Không tìm thấy bệnh nhân nào' : 'Chưa có bệnh nhân nào'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {searchTerm ? 'Hãy thử từ khóa khác' : 'Bệnh nhân sẽ xuất hiện sau khi có lịch hẹn'}
                </Typography>
              </Box>
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Bệnh nhân</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'lastAppointmentDate'}
                        direction={orderBy === 'lastAppointmentDate' ? order : 'asc'}
                        onClick={() => handleRequestSort('lastAppointmentDate')}
                        component="span"
                        style={{ cursor: 'pointer' }}
                      >
                        Lần khám cuối
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Tổng lịch hẹn</TableCell>
                    <TableCell>Sắp tới</TableCell>
                    <TableCell>Hoàn thành</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getPatientInitials(patient.fullName)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {patient.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {patient.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(patient.lastAppointmentDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={patient.totalAppointments}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={patient.upcomingAppointments}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={patient.completedAppointments}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewPatient(patient)}
                          title="Xem chi tiết"
                        >
                          <PersonIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Patient Details Dialog */}
      <Dialog
        open={patientDialog}
        onClose={() => setPatientDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedPatient && getPatientInitials(selectedPatient.fullName)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedPatient?.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chi tiết bệnh nhân
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Thông tin liên hệ
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{selectedPatient.email}</Typography>
                </Box>
                {selectedPatient.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{selectedPatient.phone}</Typography>
                  </Box>
                )}
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Thống kê lịch hẹn
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Tổng số:</strong> {selectedPatient.totalAppointments} lịch hẹn
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Sắp tới:</strong> {selectedPatient.upcomingAppointments} lịch hẹn
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Hoàn thành:</strong> {selectedPatient.completedAppointments} lịch hẹn
                </Typography>
                <Typography variant="body2">
                  <strong>Lần cuối:</strong> {formatDate(selectedPatient.lastAppointmentDate)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorPatients;
