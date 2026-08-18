import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { doctorsService, Doctor } from '../../services/doctors';
import { appointmentsService } from '../../services/appointments';

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: {
    id: string;
    patientName: string;
    status: string;
    symptoms?: string;
  };
}

const DoctorCalendar: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorSchedule();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const response = await doctorsService.getDoctors();
      setDoctors(response.doctors);
      // Auto-select first doctor
      if (response.doctors.length > 0) {
        setSelectedDoctor(response.doctors[0]);
      }
    } catch (error: any) {
      setError('Không thể tải danh sách bác sĩ');
    }
  };

  const fetchDoctorSchedule = async () => {
    if (!selectedDoctor) return;

    try {
      setLoading(true);
      setError('');

      // Get available slots for the doctor on selected date
      const availabilityResponse = await doctorsService.getDoctorAvailability(
        selectedDoctor.id,
        selectedDate
      );

      // Get existing appointments for the doctor on selected date
      const appointmentsResponse = await appointmentsService.getAppointments({
        doctorId: selectedDoctor.id,
        limit: 100
      });

      // Filter appointments for selected date
      const dateAppointments = appointmentsResponse.appointments.filter(
        apt => apt.date === selectedDate
      );

      // Create time slots from 8 AM to 5 PM (30-minute intervals)
      const slots: TimeSlot[] = [];
      for (let hour = 8; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Check if slot is available
          const isAvailable = availabilityResponse.availableSlots.includes(timeString);

          // Find appointment for this time slot
          const appointment = dateAppointments.find(apt => apt.time === timeString);

          slots.push({
            time: timeString,
            available: isAvailable,
            appointment: appointment ? {
              id: appointment.id,
              patientName: appointment.patient.fullName,
              status: appointment.status,
              symptoms: appointment.symptoms || undefined,
            } : undefined,
          });
        }
      }

      setTimeSlots(slots);
    } catch (error: any) {
      setError('Không thể tải lịch làm việc của bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlotStatus = (slot: TimeSlot) => {
    if (slot.appointment) {
      switch (slot.appointment.status) {
        case 'confirmed':
          return { label: 'Đã xác nhận', color: 'success' as const, icon: <CheckCircleIcon /> };
        case 'pending':
          return { label: 'Chờ xác nhận', color: 'warning' as const, icon: <ScheduleIcon /> };
        case 'cancelled':
          return { label: 'Đã hủy', color: 'error' as const, icon: <CancelIcon /> };
        case 'completed':
          return { label: 'Hoàn thành', color: 'info' as const, icon: <CheckCircleIcon /> };
        default:
          return { label: 'Có lịch hẹn', color: 'primary' as const, icon: <EventIcon /> };
      }
    }
    return slot.available
      ? { label: 'Trống', color: 'default' as const, icon: <ScheduleIcon /> }
      : { label: 'Không khả dụng', color: 'error' as const, icon: <CancelIcon /> };
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
          <Typography variant="h4" gutterBottom>
            Lịch làm việc bác sĩ
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Xem lịch làm việc và các cuộc hẹn của bác sĩ
          </Typography>

          {/* Controls */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Chọn bác sĩ</InputLabel>
              <Select
                value={selectedDoctor?.id || ''}
                onChange={(e) => {
                  const doctor = doctors.find(d => d.id === e.target.value);
                  setSelectedDoctor(doctor || null);
                }}
                label="Chọn bác sĩ"
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getInitials(doctor.fullName)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{doctor.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doctor.specialization}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Chọn ngày"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Doctor Info Card */}
          {selectedDoctor && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    {getInitials(selectedDoctor.fullName)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {selectedDoctor.fullName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {selectedDoctor.specialization}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Email: {selectedDoctor.email}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Trạng thái
                    </Typography>
                    <Chip
                      label={selectedDoctor.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      color={selectedDoctor.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Time Slots Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Lịch làm việc ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                {timeSlots.map((slot, index) => {
                  const status = getTimeSlotStatus(slot);
                  return (
                    <Box key={index}>
                      <Card
                        sx={{
                          height: '100%',
                          cursor: slot.appointment ? 'pointer' : 'default',
                          border: slot.appointment ? '2px solid' : '1px solid',
                          borderColor: slot.appointment ? status.color + '.main' : 'divider',
                          '&:hover': {
                            boxShadow: slot.appointment ? 3 : 1,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {slot.time}
                            </Typography>
                            <Box sx={{ color: status.color + '.main' }}>
                              {status.icon}
                            </Box>
                          </Box>

                          <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                            sx={{ mb: slot.appointment ? 2 : 0 }}
                          />

                          {slot.appointment && (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                {slot.appointment.patientName}
                              </Typography>
                              {slot.appointment.symptoms && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Triệu chứng: {slot.appointment.symptoms}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DoctorCalendar;
