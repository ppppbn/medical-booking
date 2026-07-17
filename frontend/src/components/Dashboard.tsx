import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'PATIENT':
        return 'Bệnh nhân';
      case 'DOCTOR':
        return 'Bác sĩ';
      case 'ADMIN':
        return 'Quản trị viên';
      case 'STAFF':
        return 'Nhân viên';
      default:
        return role;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: 3 }}>
      <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
        <Paper sx={{ padding: 3, marginBottom: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56 }}>
                {user?.fullName?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" component="h1">
                  Xin chào, {user?.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vai trò: {getRoleDisplayName(user?.role || '')}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={logout}
            >
              Đăng xuất
            </Button>
          </Box>

          <Typography variant="body1" sx={{ mb: 2 }}>
            Chào mừng bạn đến với hệ thống quản lý đặt lịch khám bệnh của Bệnh viện Phục hồi chức năng Hà Nội.
          </Typography>
        </Paper>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {user?.role === 'PATIENT' && (
            <>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Paper sx={{ padding: 3, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Đặt lịch khám
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Đặt lịch khám với bác sĩ chuyên khoa
                  </Typography>
                  <Button variant="contained" fullWidth>
                    Đặt lịch ngay
                  </Button>
                </Paper>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Paper sx={{ padding: 3, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Lịch hẹn của tôi
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Xem và quản lý lịch hẹn đã đặt
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Xem lịch hẹn
                  </Button>
                </Paper>
              </Box>
            </>
          )}

          {user?.role === 'DOCTOR' && (
            <>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Paper sx={{ padding: 3, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Danh sách lịch hẹn
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Xem lịch hẹn với bệnh nhân
                  </Typography>
                  <Button variant="contained" fullWidth>
                    Xem lịch hẹn
                  </Button>
                </Paper>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Paper sx={{ padding: 3, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Quản lý bệnh nhân
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Xem thông tin bệnh nhân
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Danh sách bệnh nhân
                  </Button>
                </Paper>
              </Box>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Paper sx={{ padding: 3, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Quản lý bác sĩ
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Thêm, sửa, xóa thông tin bác sĩ
                  </Typography>
                  <Button variant="contained" fullWidth>
                    Quản lý bác sĩ
                  </Button>
                </Paper>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Paper sx={{ padding: 3, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Báo cáo thống kê
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Xem báo cáo và thống kê
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Xem báo cáo
                  </Button>
                </Paper>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
