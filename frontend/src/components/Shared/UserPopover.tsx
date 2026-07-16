import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';

interface UserPopoverProps {
  isCollapsed: boolean;
}

const UserPopover: React.FC<UserPopoverProps> = ({ isCollapsed }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'Quản trị viên';
      case USER_ROLES.DOCTOR:
        return 'Bác sĩ';
      case USER_ROLES.PATIENT:
        return 'Bệnh nhân';
      default:
        return role;
    }
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

  if (!user) return null;

  return (
    <Box>
      <Button
        onClick={handleClick}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          p: 1.5,
          borderRadius: 1,
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
            fontWeight: 'bold',
          }}
        >
          {getInitials(user.fullName)}
        </Avatar>
        {!isCollapsed && (
          <Box sx={{ ml: 2, flex: 1, textAlign: 'left' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.fullName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.2,
              }}
            >
              {getRoleLabel(user.role)}
            </Typography>
          </Box>
        )}
        {!isCollapsed && (
          <IconButton size="small" sx={{ ml: 1 }}>
            <ExpandMoreIcon
              sx={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
        )}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1.5,
            minWidth: 180,
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
          <PersonIcon sx={{ mr: 2, fontSize: '1.25rem' }} />
          <Typography variant="body2">Tài khoản</Typography>
        </MenuItem>
        <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
          <SettingsIcon sx={{ mr: 2, fontSize: '1.25rem' }} />
          <Typography variant="body2">Cài đặt</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 2, fontSize: '1.25rem' }} />
          <Typography variant="body2">Đăng xuất</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserPopover;
