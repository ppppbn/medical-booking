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
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Fab,
  Tooltip,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  DomainDisabled as DeactivateIcon,
  Domain as ActivateIcon,
  Group as GroupIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { departmentsService, Department, DepartmentDoctor } from '../../services/departments';
import { doctorsService, Doctor } from '../../services/doctors';

const ManageDepartments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageDoctorsDialogOpen, setManageDoctorsDialogOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDoctorToAssign, setSelectedDoctorToAssign] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterDepartments();
  }, [departments, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, docsRes] = await Promise.all([
        departmentsService.getDepartments(),
        doctorsService.getDoctors()
      ]);
      setDepartments(deptRes.departments);
      setAllDoctors(docsRes.doctors);
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterDepartments = () => {
    const filtered = departments.filter(dept => 
      !searchTerm || dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepartments(filtered);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddDepartment = async () => {
    try {
      await departmentsService.createDepartment(formData);
      await fetchData();
      setAddDialogOpen(false);
      resetForm();
      showSnackbar('Thêm chuyên khoa thành công!', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Không thể thêm chuyên khoa', 'error');
    }
  };

  const handleEditDepartment = async () => {
    if (!selectedDepartment) return;
    try {
      await departmentsService.updateDepartment(selectedDepartment.id, formData);
      await fetchData();
      setEditDialogOpen(false);
      setSelectedDepartment(null);
      resetForm();
      showSnackbar('Cập nhật chuyên khoa thành công!', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Không thể cập nhật chuyên khoa', 'error');
    }
  };

  const executeToggleStatus = async () => {
    if (!selectedDepartment) return;
    try {
      await departmentsService.updateDepartment(selectedDepartment.id, { isActive: !selectedDepartment.isActive });
      await fetchData();
      showSnackbar(`Đã ${selectedDepartment.isActive ? 'vô hiệu hóa' : 'kích hoạt'} chuyên khoa thành công`, 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Không thể thay đổi trạng thái', 'error');
    } finally {
      setConfirmToggleOpen(false);
      setSelectedDepartment(null);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedDepartment || !selectedDoctorToAssign) return;
    try {
      await departmentsService.assignDoctor(selectedDepartment.id, selectedDoctorToAssign);
      await fetchData();
      // Update selectedDepartment in state to reflect the new doctor immediately in dialog
      const updatedDept = await departmentsService.getDepartments().then(res => res.departments.find(d => d.id === selectedDepartment.id));
      if (updatedDept) setSelectedDepartment(updatedDept);
      
      setSelectedDoctorToAssign('');
      showSnackbar('Gán bác sĩ thành công!', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Không thể gán bác sĩ', 'error');
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    if (!selectedDepartment) return;
    try {
      await departmentsService.removeDoctor(selectedDepartment.id, doctorId);
      await fetchData();
      const updatedDept = await departmentsService.getDepartments().then(res => res.departments.find(d => d.id === selectedDepartment.id));
      if (updatedDept) setSelectedDepartment(updatedDept);

      showSnackbar('Đã gỡ bác sĩ khỏi chuyên khoa', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Không thể gỡ bác sĩ', 'error');
    }
  };

  const openEditDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setEditDialogOpen(true);
  };

  const openManageDoctorsDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setManageDoctorsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  const getInitials = (fullName: string | undefined) => {
    if (!fullName) return '?';
    return fullName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate available doctors to assign (doctors not already in this department)
  const availableDoctors = allDoctors.filter(doc => 
    !selectedDepartment?.doctors.find(d => d.id === doc.id)
  );

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
              Quản lý Chuyên khoa
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Thêm chuyên khoa
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {departments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng số chuyên khoa
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {departments.filter(d => d.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chuyên khoa đang hoạt động
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo tên chuyên khoa..."
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
          {filteredDepartments.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
              <Typography variant="h6" color="text.secondary">
                Không tìm thấy chuyên khoa nào
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên chuyên khoa</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell align="center">Số lượng bác sĩ</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDepartments.map((dept) => (
                    <TableRow key={dept.id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{dept.name}</TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dept.description || 'Chưa có mô tả'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={dept.doctors?.length || 0} color="primary" variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={dept.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          color={dept.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Quản lý bác sĩ">
                          <IconButton size="small" onClick={() => openManageDoctorsDialog(dept)} color="primary">
                            <GroupIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" onClick={() => openEditDialog(dept)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={dept.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedDepartment(dept);
                              setConfirmToggleOpen(true);
                            }}
                            color={dept.isActive ? 'error' : 'success'}
                          >
                            {dept.isActive ? <DeactivateIcon /> : <ActivateIcon />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <Tooltip title="Thêm chuyên khoa">
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setAddDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => { setAddDialogOpen(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm chuyên khoa mới</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Tên chuyên khoa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialogOpen(false); resetForm(); }}>Hủy</Button>
          <Button onClick={handleAddDepartment} variant="contained" disabled={!formData.name}>Thêm</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => { setEditDialogOpen(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa chuyên khoa</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Tên chuyên khoa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditDialogOpen(false); resetForm(); }}>Hủy</Button>
          <Button onClick={handleEditDepartment} variant="contained" disabled={!formData.name}>Cập nhật</Button>
        </DialogActions>
      </Dialog>

      {/* Manage Doctors Dialog */}
      <Dialog open={manageDoctorsDialogOpen} onClose={() => setManageDoctorsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bác sĩ thuộc khoa: {selectedDepartment?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1, display: 'flex', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Chọn bác sĩ để gán</InputLabel>
              <Select
                value={selectedDoctorToAssign}
                label="Chọn bác sĩ để gán"
                onChange={(e) => setSelectedDoctorToAssign(e.target.value)}
              >
                {availableDoctors.length === 0 && <MenuItem disabled>Không có bác sĩ nào</MenuItem>}
                {availableDoctors.map(doc => (
                  <MenuItem key={doc.id} value={doc.id}>
                    {doc.fullName} ({doc.specialization}) - {doc.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              onClick={handleAssignDoctor}
              disabled={!selectedDoctorToAssign}
              sx={{ minWidth: 120 }}
            >
              Gán bác sĩ
            </Button>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Danh sách bác sĩ trong khoa ({selectedDepartment?.doctors.length || 0})
          </Typography>
          
          <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
            {selectedDepartment?.doctors.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">Chưa có bác sĩ nào trong khoa này.</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {selectedDepartment?.doctors.map((doctor, idx) => (
                  <React.Fragment key={doctor.id}>
                    <ListItem>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          {getInitials(doctor.user?.fullName)}
                        </Avatar>
                        <ListItemText
                          primary={doctor.user?.fullName || 'N/A'}
                          secondary={
                            <>
                              <Typography variant="caption" display="block">Email: {doctor.user?.email}</Typography>
                              <Typography variant="caption" display="block">Chuyên môn: {doctor.specialization}</Typography>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Gỡ khỏi khoa">
                            <IconButton edge="end" color="error" onClick={() => handleRemoveDoctor(doctor.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </Box>
                    </ListItem>
                    {idx < selectedDepartment.doctors.length - 1 && <Box sx={{ borderBottom: '1px solid #eee' }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageDoctorsDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Toggle Dialog */}
      <Dialog open={confirmToggleOpen} onClose={() => setConfirmToggleOpen(false)}>
        <DialogTitle>Xác nhận {selectedDepartment?.isActive ? 'vô hiệu hóa' : 'kích hoạt'}</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn {selectedDepartment?.isActive ? 'vô hiệu hóa' : 'kích hoạt'} chuyên khoa <strong>{selectedDepartment?.name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmToggleOpen(false)}>Hủy</Button>
          <Button onClick={executeToggleStatus} color={selectedDepartment?.isActive ? "error" : "success"} variant="contained">
            Đồng ý
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box>
          <Chip
            label={snackbar.message}
            color={snackbar.severity}
            sx={{
              bgcolor: `${snackbar.severity}.main`,
              color: 'white',
              '& .MuiChip-icon': { color: 'white' },
              fontSize: '1rem',
              py: 2.5,
              px: 1,
              borderRadius: 2
            }}
          />
        </Box>
      </Snackbar>
    </Box>
  );
};

export default ManageDepartments;
