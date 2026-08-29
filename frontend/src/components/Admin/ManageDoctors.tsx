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
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  PersonOff as DeactivateIcon,
  Person as ActivateIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { doctorsService, Doctor } from '../../services/doctors';

type Order = 'asc' | 'desc';

interface DoctorFormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  experience: number;
  bio: string;
}

const ManageDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Doctor>('fullName');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Form state
  const [formData, setFormData] = useState<DoctorFormData>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    experience: 0,
    bio: '',
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterAndSortDoctors();
  }, [doctors, searchTerm, specializationFilter, order, orderBy]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { doctors, specializations } = await doctorsService.getDoctors();
      setDoctors(doctors);
      setSpecializations(specializations);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDoctors = () => {
    let filtered = doctors.filter(doctor => {
      const matchesSearch = !searchTerm ||
        doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpecialization = !specializationFilter ||
        doctor.specialization === specializationFilter;

      return matchesSearch && matchesSpecialization;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[orderBy];
      let bValue: any = b[orderBy];

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDoctors(filtered);
  };

  const handleRequestSort = (property: keyof Doctor) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleAddDoctor = async () => {
    try {
      await doctorsService.createDoctor(formData);
      await fetchDoctors();
      setAddDialogOpen(false);
      resetForm();
      setSnackbar({
        open: true,
        message: 'Thêm bác sĩ thành công!',
        severity: 'success'
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể thêm bác sĩ');
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Không thể thêm bác sĩ',
        severity: 'error'
      });
    }
  };

  const handleEditDoctor = async () => {
    if (!selectedDoctor) return;

    try {
      await doctorsService.updateDoctorProfile(selectedDoctor.id, {
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        experience: formData.experience,
        bio: formData.bio,
        fullName: formData.fullName,
      });
      await fetchDoctors();
      setEditDialogOpen(false);
      setSelectedDoctor(null);
      resetForm();
      setSnackbar({
        open: true,
        message: 'Cập nhật bác sĩ thành công!',
        severity: 'success'
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể cập nhật bác sĩ');
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Không thể cập nhật bác sĩ',
        severity: 'error'
      });
    }
  };

  const handleToggleDoctorStatus = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setConfirmToggleOpen(true);
  };

  const executeToggleDoctorStatus = async () => {
    if (!selectedDoctor) return;
    try {
      const response = await doctorsService.deactivateDoctor(selectedDoctor.id); // This now toggles status
      // Update the doctor in the local state
      setDoctors(doctors.map(d =>
        d.id === selectedDoctor.id
          ? { ...d, isActive: response.isActive }
          : d
      ));
      // Update filtered doctors as well
      setFilteredDoctors(filteredDoctors.map(d =>
        d.id === selectedDoctor.id
          ? { ...d, isActive: response.isActive }
          : d
      ));
      setSnackbar({
        open: true,
        message: response.message,
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Không thể thay đổi trạng thái bác sĩ',
        severity: 'error'
      });
    } finally {
      setConfirmToggleOpen(false);
      setSelectedDoctor(null);
    }
  };

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setViewDialogOpen(true);
  };

  const handleEditClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      email: doctor.email,
      password: '',
      fullName: doctor.fullName,
      phone: doctor.phone || '',
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      experience: doctor.experience || 0,
      bio: doctor.bio || '',
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      specialization: '',
      licenseNumber: '',
      experience: 0,
      bio: '',
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
              Quản lý bác sĩ
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Thêm bác sĩ
            </Button>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Quản lý thông tin và tài khoản của các bác sĩ trong hệ thống
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {doctors.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng số bác sĩ
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {doctors.filter(d => d.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bác sĩ hoạt động
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {doctors.filter(d => !d.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bác sĩ không hoạt động
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {specializations.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chuyên khoa
                </Typography>
              </CardContent>
            </Card>
          </Box>



          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo tên, email, chuyên khoa..."
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
            <FormControl fullWidth>
              <InputLabel>Lọc theo chuyên khoa</InputLabel>
              <Select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                label="Lọc theo chuyên khoa"
              >
                <MenuItem value="">Tất cả chuyên khoa</MenuItem>
                {specializations.map(specialization => (
                  <MenuItem key={specialization} value={specialization}>
                    {specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {filteredDoctors.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm || specializationFilter ? 'Không tìm thấy bác sĩ nào' : 'Chưa có bác sĩ nào'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {searchTerm || specializationFilter ? 'Hãy thử từ khóa khác' : 'Hãy thêm bác sĩ đầu tiên'}
                </Typography>
              </Box>
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Bác sĩ</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'specialization'}
                        direction={orderBy === 'specialization' ? order : 'asc'}
                        onClick={() => handleRequestSort('specialization')}
                        component="span"
                        style={{ cursor: 'pointer' }}
                      >
                        Chuyên khoa
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Giấy phép</TableCell>
                    <TableCell>Kinh nghiệm</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getInitials(doctor.fullName)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {doctor.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doctor.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{doctor.specialization}</TableCell>
                      <TableCell>{doctor.licenseNumber}</TableCell>
                      <TableCell>{doctor.experience || 0} năm</TableCell>
                      <TableCell>
                        <Chip
                          label={doctor.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          color={doctor.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewDoctor(doctor)}
                          title="Xem chi tiết"
                        >
                          <PersonIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(doctor)}
                          title="Chỉnh sửa"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleDoctorStatus(doctor)}
                          title={doctor.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          color={doctor.isActive ? 'error' : 'success'}
                        >
                          {doctor.isActive ? <DeactivateIcon /> : <ActivateIcon />}
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

      <Tooltip title="Thêm bác sĩ">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setAddDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Thêm bác sĩ mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Họ tên"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <FormControl fullWidth required>
              <InputLabel>Chuyên khoa</InputLabel>
              <Select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                label="Chuyên khoa"
              >
                {specializations.map(specialization => (
                  <MenuItem key={specialization} value={specialization}>
                    {specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Giấy phép hành nghề"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Số năm kinh nghiệm"
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
            />
            <TextField
              fullWidth
              label="Tiểu sử"
              multiline
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
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
            onClick={handleAddDoctor}
            variant="contained"
            disabled={!formData.email || !formData.password || !formData.fullName || !formData.specialization || !formData.licenseNumber}
          >
            Thêm bác sĩ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedDoctor(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa thông tin bác sĩ</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              disabled
              helperText="Email không thể thay đổi"
            />
            <TextField
              fullWidth
              label="Họ tên"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <FormControl fullWidth required>
              <InputLabel>Chuyên khoa</InputLabel>
              <Select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                label="Chuyên khoa"
              >
                {specializations.map(specialization => (
                  <MenuItem key={specialization} value={specialization}>
                    {specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Giấy phép hành nghề"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Số năm kinh nghiệm"
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
            />
            <TextField
              fullWidth
              label="Tiểu sử"
              multiline
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setSelectedDoctor(null);
            resetForm();
          }}>
            Hủy
          </Button>
          <Button
            onClick={handleEditDoctor}
            variant="contained"
            disabled={!formData.specialization || !formData.licenseNumber}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Doctor Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedDoctor(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              {selectedDoctor && getInitials(selectedDoctor.fullName)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedDoctor?.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chi tiết bác sĩ
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDoctor && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Thông tin cá nhân
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Email:</strong> {selectedDoctor.email}</Typography>
                  <Typography><strong>Số điện thoại:</strong> {selectedDoctor.phone || 'Chưa cập nhật'}</Typography>
                  <Typography><strong>Trạng thái:</strong>
                    <Chip
                      label={selectedDoctor.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      color={selectedDoctor.isActive ? 'success' : 'error'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Thông tin chuyên môn
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Chuyên khoa:</strong> {selectedDoctor.specialization}</Typography>
                  <Typography><strong>Giấy phép:</strong> {selectedDoctor.licenseNumber}</Typography>
                  <Typography><strong>Kinh nghiệm:</strong> {selectedDoctor.experience || 0} năm</Typography>
                </Box>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="h6" gutterBottom>
                  Tiểu sử
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDoctor.bio || 'Chưa có tiểu sử'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialogOpen(false);
            setSelectedDoctor(null);
          }}>
            Đóng
          </Button>
          {selectedDoctor && (
            <Button
              variant="contained"
              onClick={() => {
                setViewDialogOpen(false);
                handleEditClick(selectedDoctor);
              }}
            >
              Chỉnh sửa
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm Toggle Dialog */}
      <Dialog
        open={confirmToggleOpen}
        onClose={() => setConfirmToggleOpen(false)}
      >
        <DialogTitle>Xác nhận {selectedDoctor?.isActive ? 'vô hiệu hóa' : 'kích hoạt'}</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn {selectedDoctor?.isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản của bác sĩ <strong>{selectedDoctor?.fullName}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmToggleOpen(false)}>Hủy</Button>
          <Button
            onClick={executeToggleDoctorStatus}
            color={selectedDoctor?.isActive ? "error" : "success"}
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

export default ManageDoctors;
