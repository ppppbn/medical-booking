import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';

const Navigation: React.FC = () => {
  const { user, logout, isDoctor, isPatient, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    const commonItems = [
      { label: 'Hồ sơ cá nhân', path: '/profile' },
    ];

    if (isDoctor) {
      return [
        { label: 'Bảng điều khiển', path: '/doctor-dashboard' },
        { label: 'Lịch hẹn', path: '/appointments' },
        { label: 'Bệnh nhân', path: '/patients' },
        ...commonItems,
      ];
    }

    if (isPatient) {
      return [
        { label: 'Bảng điều khiển', path: '/patient-dashboard' },
        { label: 'Đặt lịch khám', path: '/book-appointment' },
        { label: 'Hồ sơ bệnh án', path: '/my-records' },
        ...commonItems,
      ];
    }

    if (isAdmin) {
      return [
        { label: 'Bảng điều khiển', path: '/admin-dashboard' },
        { label: 'Quản lý bác sĩ', path: '/manage-doctors' },
        { label: 'Quản lý bệnh nhân', path: '/manage-patients' },
        { label: 'Thống kê', path: '/statistics' },
        ...commonItems,
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Bệnh viện Phục hồi chức năng Hà Nội
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}

          <Typography variant="body1" sx={{ ml: 2 }}>
            Xin chào, {user?.fullName}
          </Typography>

          <Button color="inherit" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </Box>

        {/* Mobile menu */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {navigationItems.map((item) => (
              <MenuItem
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  handleClose();
                }}
              >
                {item.label}
              </MenuItem>
            ))}
            <MenuItem onClick={handleLogout}>
              <Typography>Đăng xuất</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
