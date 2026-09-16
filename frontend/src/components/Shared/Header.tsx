import React from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsMenu from './NotificationsMenu';
import UserPopover from './UserPopover';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer - 1
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {user?.role === 'ADMIN' && 'Trang Quản Trị'}
            {user?.role === 'DOCTOR' && 'Cổng Bác Sĩ'}
            {user?.role === 'PATIENT' && 'Cổng Bệnh Nhân'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsMenu isCollapsed={false} />
          <UserPopover isCollapsed={false} />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
