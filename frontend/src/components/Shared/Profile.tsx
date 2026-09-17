import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Snackbar } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';
import { validateRequired, validatePhone, validateMaxLength } from '../../utils/validation';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    const errors: Record<string, string> = {};
    errors.fullName = validateRequired(formData.fullName, 'Họ và tên') || validateMaxLength(formData.fullName, 50, 'Họ và tên');
    errors.phone = validateRequired(formData.phone, 'Số điện thoại') || validatePhone(formData.phone);
    
    const activeErrors = Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== ''));
    if (Object.keys(activeErrors).length > 0) {
      setFormErrors(activeErrors);
      return;
    }

    try {
      // Mock response for now (to be implemented in TSK-405/TSK-402)
      const mockResponse = {
        patient: {
          fullName: formData.fullName,
          phone: formData.phone,
        }
      };

      updateUser({
        ...user,
        fullName: mockResponse.patient.fullName,
        phone: mockResponse.patient.phone || undefined
      });

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công' });
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật thông tin' });
    }
  };

  return (
    <Box sx={{ padding: 3, maxWidth: 800, margin: '0 auto' }}>
      <Paper sx={{ padding: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Hồ sơ cá nhân
          </Typography>
          {!isEditing ? (
            <Button variant="contained" onClick={() => setIsEditing(true)}>
              Chỉnh sửa
            </Button>
          ) : (
            <Box>
              <Button variant="outlined" onClick={() => {
                setIsEditing(false);
                setFormErrors({});
                if (user) {
                  setFormData({ fullName: user.fullName || '', phone: user.phone || '' });
                }
              }} sx={{ mr: 1 }}>
                Hủy
              </Button>
              <Button variant="contained" onClick={handleSubmit}>
                Lưu thay đổi
              </Button>
            </Box>
          )}
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Họ và tên"
              name="fullName"
              value={isEditing ? formData.fullName : (user?.fullName || '')}
              onChange={handleChange}
              InputProps={{ readOnly: !isEditing }}
              error={!!formErrors.fullName}
              helperText={formErrors.fullName}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Email"
              value={user?.email || ''}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Số điện thoại"
              name="phone"
              value={isEditing ? formData.phone : (user?.phone || 'Chưa cập nhật')}
              onChange={handleChange}
              InputProps={{ readOnly: !isEditing }}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              label="Vai trò"
              value={user?.role === USER_ROLES.DOCTOR ? 'Bác sĩ' : user?.role === USER_ROLES.PATIENT ? 'Bệnh nhân' : user?.role === USER_ROLES.ADMIN ? 'Quản trị viên' : user?.role || ''}
              InputProps={{ readOnly: true }}
              disabled
            />
          </Box>
        </Box>
      </Paper>
      
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
        message={message?.text}
      />
    </Box>
  );
};

export default Profile;
