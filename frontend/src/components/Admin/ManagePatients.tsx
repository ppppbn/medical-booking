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
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  PersonOff as DeactivateIcon,
  Person as ActivateIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { patientsService, Patient } from '../../services/patients';

type Order = 'asc' | 'desc';

interface PatientFormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dateOfBirth: Date | null;
  address: string;
}

const ManagePatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Patient>('fullName');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form state
  const [formData, setFormData] = useState<PatientFormData>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    dateOfBirth: null,
    address: '',
  });

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    activePatients: 0,
    inactivePatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPatientsAndStatistics();
  }, []);

  useEffect(() => {
    filterAndSortPatients();
  }, [patients, searchTerm, order, orderBy]);

  const fetchPatientsAndStatistics = async () => {
    try {
      setLoading(true);
      const [patientsResponse, statisticsResponse] = await Promise.all([
        patientsService.getPatients(),
        patientsService.getPatientStatistics()
      ]);
      setPatients(patientsResponse.patients);
      setStatistics(statisticsResponse);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = patients.filter(patient => {
      const matchesSearch = !searchTerm ||
        patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.phone && patient.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[orderBy];
      let bValue: any = b[orderBy];

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPatients(filtered);
  };

  const handleRequestSort = (property: keyof Patient) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleAddPatient = async () => {
    try {
      await patientsService.createPatient({
        ...formData,
        dateOfBirth: formData.dateOfBirth && !isNaN(formData.dateOfBirth.getTime())
          ? `${formData.dateOfBirth.getFullYear()}-${String(formData.dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(formData.dateOfBirth.getDate()).padStart(2, '0')}T00:00:00.000Z` 
          : undefined,
      });
      await fetchPatientsAndStatistics();
      setAddDialogOpen(false);
      resetForm();
      setSnackbar({
        open: true,
        message: 'Thêm bệnh nhân thành công',
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Thêm bệnh nhân thất bại',
        severity: 'error'
      });
    }
  };

  const handleEditPatient = async () => {
    if (!selectedPatient) return;

    try {
      await patientsService.updatePatient(selectedPatient.id, {
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth && !isNaN(formData.dateOfBirth.getTime())
          ? `${formData.dateOfBirth.getFullYear()}-${String(formData.dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(formData.dateOfBirth.getDate()).padStart(2, '0')}T00:00:00.000Z` 
          : undefined,
        address: formData.address || undefined,
      });
      await fetchPatientsAndStatistics();
      setEditDialogOpen(false);
      setSelectedPatient(null);
      resetForm();
      setSnackbar({
        open: true,
        message: 'Cập nhật bệnh nhân thành công',
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Cập nhật bệnh nhân thất bại',
        severity: 'error'
      });
    }
  };

  const handleTogglePatientStatus = (patient: Patient) => {
    setSelectedPatient(patient);
    setConfirmToggleOpen(true);
  };

  const executeTogglePatientStatus = async () => {
    if (!selectedPatient) return;
    try {
      await patientsService.togglePatientStatus(selectedPatient.id);
      await fetchPatientsAndStatistics();
      setSnackbar({
        open: true,
        message: `Bệnh nhân đã ${selectedPatient.isActive ? 'vô hiệu hóa' : 'kích hoạt'} thành công`,
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Thao tác thất bại',
        severity: 'error'
      });
    } finally {
      setConfirmToggleOpen(false);
      setSelectedPatient(null);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewDialogOpen(true);
  };

  const handleEditClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      email: patient.email,
      password: '',
      fullName: patient.fullName,
      phone: patient.phone || '',
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : null,
      address: patient.address || '',
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      dateOfBirth: null,
      address: '',
    });
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
              Quản lý bệnh nhân
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Thêm bệnh nhân
            </Button>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Quản lý thông tin và tài khoản của các bệnh nhân trong hệ thống
          </Typography>

          {/* Statistics Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {statistics.totalPatients}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng số bệnh nhân
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {statistics.activePatients}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bệnh nhân hoạt động
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {statistics.inactivePatients}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bệnh nhân không hoạt động
                </Typography>
              </CardContent>
            </Card>
          </Box>



          {/* Filters */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 2, mb: 2 }}>
            <TextField
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
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
          </Box>

          {/* Table */}
          <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'fullName'}
                      direction={orderBy === 'fullName' ? order : 'asc'}
                      onClick={() => handleRequestSort('fullName')}
                      component="span"
                      style={{ cursor: 'pointer' }}
                    >
                      Bệnh nhân
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                  <TableCell>Ngày sinh</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(patient.fullName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {patient.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {patient.id.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone || 'Chưa cập nhật'}</TableCell>
                    <TableCell>
                      {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={patient.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        color={patient.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewPatient(patient)}
                        title="Xem chi tiết"
                      >
                        <PersonIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(patient)}
                        title="Chỉnh sửa"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleTogglePatientStatus(patient)}
                        title={patient.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        color={patient.isActive ? 'error' : 'success'}
                      >
                        {patient.isActive ? <DeactivateIcon /> : <ActivateIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Floating Action Button for mobile */}
      <Tooltip title="Thêm bệnh nhân">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setAddDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Add Patient Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Thêm bệnh nhân mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Mật khẩu"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Họ và tên"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <DatePicker
              label="Ngày sinh"
              format="dd/MM/yyyy"
              value={formData.dateOfBirth}
              onChange={(newDate: Date | null) => {
                setFormData({ ...formData, dateOfBirth: newDate });
              }}
              slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
            />
            <TextField
              label="Địa chỉ"
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddDialogOpen(false);
            resetForm();
          }}>
            Hủy
          </Button>
          <Button
            onClick={handleAddPatient}
            variant="contained"
            disabled={!formData.email || !formData.password || !formData.fullName}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedPatient(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa bệnh nhân</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <TextField
              label="Email"
              value={formData.email}
              disabled
              fullWidth
            />
            <TextField
              label="Họ và tên"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <DatePicker
              label="Ngày sinh"
              format="dd/MM/yyyy"
              value={formData.dateOfBirth}
              onChange={(newDate: Date | null) => {
                setFormData({ ...formData, dateOfBirth: newDate });
              }}
              slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
            />
            <TextField
              label="Địa chỉ"
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setSelectedPatient(null);
            resetForm();
          }}>
            Hủy
          </Button>
          <Button
            onClick={handleEditPatient}
            variant="contained"
            disabled={!formData.fullName}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedPatient(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết bệnh nhân</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                  {getInitials(selectedPatient.fullName)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedPatient.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatient.email}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Email"
                  value={selectedPatient.email}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Số điện thoại"
                  value={selectedPatient.phone || 'Chưa cập nhật'}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Ngày sinh"
                  value={selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Trạng thái"
                  value={selectedPatient.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Box>
              <TextField
                label="Địa chỉ"
                value={selectedPatient.address || 'Chưa cập nhật'}
                InputProps={{ readOnly: true }}
                multiline
                rows={3}
                fullWidth
              />
              <TextField
                label="Ngày tạo tài khoản"
                value={new Date(selectedPatient.createdAt).toLocaleString('vi-VN')}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialogOpen(false);
            setSelectedPatient(null);
          }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Toggle Dialog */}
      <Dialog
        open={confirmToggleOpen}
        onClose={() => setConfirmToggleOpen(false)}
      >
        <DialogTitle>Xác nhận {selectedPatient?.isActive ? 'vô hiệu hóa' : 'kích hoạt'}</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn {selectedPatient?.isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản của bệnh nhân <strong>{selectedPatient?.fullName}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmToggleOpen(false)}>Hủy</Button>
          <Button
            onClick={executeTogglePatientStatus}
            color={selectedPatient?.isActive ? "error" : "success"}
            variant="contained"
          >
            Đồng ý
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

export default ManagePatients;
