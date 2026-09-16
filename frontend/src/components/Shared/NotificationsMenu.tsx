import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../../hooks/useNotifications';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';

const NotificationsMenu: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications(30000); // 30s poll
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    handleClose();
    
    if (notification.appointmentId) {
      navigate(`/appointments/${notification.appointmentId}`);
    } else if (notification.type.includes('APPOINTMENT')) {
      if (user?.role === USER_ROLES.PATIENT) {
        navigate('/appointments');
      } else if (user?.role === USER_ROLES.DOCTOR) {
        navigate('/doctor-appointments');
      } else if (user?.role === USER_ROLES.ADMIN) {
        navigate('/admin/appointments');
      }
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} sx={{ mx: isCollapsed ? 0 : 1 }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400, mt: 1 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Thông báo
          </Typography>
          {unreadCount > 0 && (
            <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
              {unreadCount} chưa đọc
            </Typography>
          )}
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary={<Typography variant="body2" color="text.secondary" align="center">Không có thông báo mới</Typography>} 
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => handleNotificationClick(notification)}
                    sx={{ bgcolor: notification.isRead ? 'transparent' : 'action.hover' }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                            {format(new Date(notification.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationsMenu;
