import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  MedicalServices as MedicalIcon,
  Analytics as AnalyticsIcon,
  Event as EventIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';
import { appointmentsService } from '../../services/appointments';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchAppointmentStatistics();
  }, []);

  const fetchAppointmentStatistics = async () => {
    try {
      let response;

      // Use role-specific statistics endpoints
      switch (user?.role) {
        case USER_ROLES.ADMIN:
          response = await appointmentsService.getAppointmentStatistics();
          break;
        case USER_ROLES.DOCTOR:
          response = await appointmentsService.getDoctorAppointmentStatistics();
          break;
        case USER_ROLES.PATIENT:
          response = await appointmentsService.getPatientAppointmentStatistics();
          break;
        default:
          // No statistics for unknown roles
          setAppointmentStats({
            total: 0,
            completed: 0,
            pending: 0,
          });
          return;
      }

      setAppointmentStats({
        total: response.statistics.total,
        completed: response.statistics.completed,
        pending: response.statistics.pending,
      });
    } catch (error) {
      console.error('Failed to fetch appointment statistics:', error);
      // Keep default values (0) on error
    }
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

  const getRoleCards = (): DashboardCard[] => {
    if (!user) return [];

    switch (user.role) {
      case USER_ROLES.ADMIN:
        return [
          {
            title: 'Quản lý bác sĩ',
            description: 'Thêm, sửa, xóa thông tin bác sĩ',
            icon: <MedicalIcon />,
            path: '/manage-doctors',
            color: 'primary'
          },
          {
            title: 'Quản lý bệnh nhân',
            description: 'Xem và quản lý thông tin bệnh nhân',
            icon: <PeopleIcon />,
            path: '/manage-patients',
            color: 'success'
          },
          {
            title: 'Báo cáo thống kê',
            description: 'Xem báo cáo và thống kê hệ thống',
            icon: <AnalyticsIcon />,
            path: '/statistics',
            color: 'info'
          },
          {
            title: 'Cài đặt hệ thống',
            description: 'Cấu hình và quản lý hệ thống',
            icon: <SettingsIcon />,
            path: '/settings',
            color: 'warning'
          }
        ];

      case USER_ROLES.DOCTOR:
        return [
          {
            title: 'Lịch hẹn hôm nay',
            description: 'Xem lịch hẹn với bệnh nhân',
            icon: <EventIcon />,
            path: '/appointments',
            color: 'primary'
          },
          {
            title: 'Danh sách bệnh nhân',
            description: 'Quản lý thông tin bệnh nhân',
            icon: <PeopleIcon />,
            path: '/patients',
            color: 'success'
          },
          {
            title: 'Lịch trình làm việc',
            description: 'Xem và cập nhật lịch làm việc',
            icon: <ScheduleIcon />,
            path: '/schedule',
            color: 'info'
          },
          {
            title: 'Hồ sơ cá nhân',
            description: 'Cập nhật thông tin cá nhân',
            icon: <PersonIcon />,
            path: '/profile',
            color: 'warning'
          }
        ];

      case USER_ROLES.PATIENT:
        return [
          {
            title: 'Đặt lịch khám',
            description: 'Đặt lịch khám với bác sĩ chuyên khoa',
            icon: <EventIcon />,
            path: '/book-appointment',
            color: 'primary'
          },
          {
            title: 'Lịch hẹn của tôi',
            description: 'Xem và quản lý lịch hẹn đã đặt',
            icon: <FolderIcon />,
            path: '/my-appointments',
            color: 'success'
          },
          {
            title: 'Hồ sơ bệnh án',
            description: 'Xem lịch sử khám bệnh và kết quả',
            icon: <AssessmentIcon />,
            path: '/my-records',
            color: 'info'
          },
          {
            title: 'Thông tin cá nhân',
            description: 'Cập nhật thông tin cá nhân',
            icon: <PersonIcon />,
            path: '/profile',
            color: 'warning'
          }
        ];

      default:
        return [];
    }
  };

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Đang tải...
          </Typography>
        </Box>
      </Box>
    );
  }

  const cards = getRoleCards();

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Welcome Header */}
        <Paper
          elevation={1}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                }}
              >
                {getInitials(user.fullName)}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Xin chào, {user.fullName}
                </Typography>
                <Chip
                  label={getRoleLabel(user.role)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Chào mừng bạn đến với hệ thống quản lý đặt lịch khám bệnh của Bệnh viện Phục hồi chức năng Hà Nội.
            </Typography>
          </Box>
        </Paper>

        {/* Dashboard Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {cards.map((card, index) => (
            <Card
              key={index}
              onClick={() => navigate(card.path)}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `${card.color}.main`,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    mb: 1,
                    color: 'text.primary',
                  }}
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.5 }}
                >
                  {card.description}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: `${card.color}.main`,
                    fontWeight: 'medium',
                  }}
                >
                  <Typography variant="body2">Xem chi tiết</Typography>
                  <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Quick Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
            mt: 2,
          }}
        >
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
            }}
          >
            <Avatar sx={{ bgcolor: 'primary.light', mr: 3 }}>
              <DashboardIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tổng lịch hẹn
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {appointmentStats.total}
              </Typography>
            </Box>
          </Paper>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
            }}
          >
            <Avatar sx={{ bgcolor: 'success.light', mr: 3 }}>
              <CheckCircleIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Đã hoàn thành
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {appointmentStats.completed}
              </Typography>
            </Box>
          </Paper>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 2,
            }}
          >
            <Avatar sx={{ bgcolor: 'warning.light', mr: 3 }}>
              <ScheduleIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Đang chờ
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {appointmentStats.pending}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
