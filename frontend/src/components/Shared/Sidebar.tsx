import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  LocalHospital as HospitalIcon,
  CalendarMonth as CalendarMonthIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';
import UserPopover from './UserPopover';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
  roles: string[];
}

const drawerWidth = 280;

const sidebarGroups: SidebarGroup[] = [
  {
    title: 'Quản trị hệ thống',
    roles: [USER_ROLES.ADMIN],
    items: [
      { label: 'Thống kê', path: '/admin/statistics', icon: <BarChartIcon /> },
      { label: 'Quản lý Bác sĩ', path: '/admin/doctors', icon: <MedicalServicesIcon /> },
      { label: 'Quản lý Bệnh nhân', path: '/admin/patients', icon: <PeopleIcon /> },
      { label: 'Quản lý Lịch hẹn', path: '/admin/appointments', icon: <CalendarMonthIcon /> },
    ],
  },
  {
    title: 'Cổng thông tin Bác sĩ',
    roles: [USER_ROLES.DOCTOR],
    items: [
      { label: 'Bảng điều khiển', path: '/dashboard', icon: <DashboardIcon /> },
      { label: 'Lịch hẹn', path: '/doctor-appointments', icon: <CalendarMonthIcon /> },
      { label: 'Danh sách bệnh nhân', path: '/patients', icon: <PeopleIcon /> },
    ],
  },
  {
    title: 'Dịch vụ bệnh nhân',
    roles: [USER_ROLES.PATIENT],
    items: [
      { label: 'Bảng điều khiển', path: '/dashboard', icon: <DashboardIcon /> },
      { label: 'Đặt lịch khám', path: '/booking', icon: <CalendarMonthIcon /> },
      { label: 'Lịch hẹn của tôi', path: '/appointments', icon: <CalendarMonthIcon /> },
      { label: 'Hồ sơ bệnh án', path: '/my-records', icon: <AssignmentIcon /> },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(true);

  const filteredGroups = sidebarGroups.filter(group =>
    user && group.roles.includes(user.role)
  );

  const isActive = (path: string) => {
    return location.pathname === path ||
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HospitalIcon sx={{ mr: 1, color: 'primary.main' }} />
          {open && (
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Bệnh viện
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleDrawerToggle}>
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      {/* Menu Items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {filteredGroups.map((group, groupIndex) => (
          <Box key={groupIndex} sx={{ mb: 3 }}>
            {open && (
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  py: 1,
                  color: 'text.secondary',
                  fontWeight: 'bold',
                  display: 'block',
                }}
              >
                {group.title}
              </Typography>
            )}
            {group.items.map((item, itemIndex) => (
              <ListItem key={itemIndex} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive(item.path)}
                  sx={{
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 1,
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white',
                        fontWeight: 'medium',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && <ListItemText primary={item.label} />}
                </ListItemButton>
              </ListItem>
            ))}
          </Box>
        ))}
      </Box>

      {/* User Section */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <UserPopover isCollapsed={!open} />
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 64,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 64,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease-in-out',
          overflow: 'hidden',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
