import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doctorsService, Doctor, DoctorListResponse, DoctorAvailabilityResponse } from '../../services/doctors';
import { appointmentsService, CreateAppointmentData } from '../../services/appointments';


interface TimeSlot {
  time: string;
  available: boolean;
}

const steps = ['Chọn bác sĩ', 'Chọn ngày', 'Chọn giờ', 'Thông tin khám', 'Xác nhận'];

const BookAppointment: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Reset slots when date changes (user might change date on step 1)
  useEffect(() => {
    if (activeStep === 1) { // Only reset if still on date selection step
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedDate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data: DoctorListResponse = await doctorsService.getDoctors();
      setDoctors(data.doctors);
      setSpecializations(data.specializations);
    } catch (error) {
      setError('Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    try {
      setLoading(true);
      const dateString = formatDateForAPI(selectedDate);
      const data: DoctorAvailabilityResponse = await doctorsService.getDoctorAvailability(selectedDoctor.id, dateString);

      // Convert available slots to TimeSlot objects
      let slots: TimeSlot[] = data.availableSlots.map((time: string) => ({
        time,
        available: true
      }));

      const now = new Date();
      if (selectedDate.getDate() === now.getDate() && 
          selectedDate.getMonth() === now.getMonth() && 
          selectedDate.getFullYear() === now.getFullYear()) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        slots = slots.filter(slot => {
          const [slotHour, slotMinute] = slot.time.split(':').map(Number);
          if (slotHour > currentHour) return true;
          if (slotHour === currentHour && slotMinute > currentMinute) return true;
          return false;
        });
      }

      setAvailableSlots(slots);
    } catch (error) {
      setError('Không thể tải lịch trống');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      // If moving from step 1 (select date) to step 2 (select time), fetch availability
      if (activeStep === 1 && selectedDoctor && selectedDate) {
        try {
          setLoading(true);
          await fetchAvailableSlots();
        } catch (error) {
          // Error is already handled in fetchAvailableSlots
          return; // Don't proceed if fetching failed
        } finally {
          setLoading(false);
        }
      }

      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    const newStep = activeStep - 1;
    setActiveStep(newStep);

    // Reset data when going back to earlier steps
    if (newStep < 2) {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  };

  const formatDateForAPI = (date: Date) => {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const appointmentData: CreateAppointmentData = {
        doctorId: selectedDoctor.id,
        date: formatDateForAPI(selectedDate),
        time: selectedTime,
        symptoms: symptoms.trim(),
        notes: notes.trim()
      };

      await appointmentsService.createAppointment(appointmentData);
      setSuccess(true);
      setConfirmationOpen(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể đặt lịch khám');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = selectedSpecialization
    ? doctors.filter(doctor => doctor.specialization === selectedSpecialization)
    : doctors;

  const canProceed = () => {
    switch (activeStep) {
      case 0: return !!selectedDoctor;
      case 1: return !!selectedDate;
      case 2: return !!selectedTime;
      case 3: return true; // Symptoms and notes are optional
      case 4: return true;
      default: return false;
    }
  };

  if (success) {
    return (
      <Box sx={{ padding: 3, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <Paper sx={{ padding: 4 }}>
          <Typography variant="h4" color="success.main" gutterBottom>
            ✅ Đặt lịch thành công!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Lịch khám của bạn đã được đặt thành công. Bạn sẽ nhận được xác nhận qua email.
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <strong>Chi tiết lịch hẹn:</strong><br /><br />
            Bác sĩ: <strong>{selectedDoctor?.fullName}</strong><br />
            Chuyên khoa: {selectedDoctor?.specialization}<br />
            Ngày: {selectedDate?.toLocaleDateString('vi-VN')}<br />
            Giờ: {selectedTime}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" size="large" sx={{ borderRadius: 2 }} onClick={() => navigate('/dashboard')}>
              Về trang chủ
            </Button>
            <Button variant="outlined" size="large" sx={{ borderRadius: 2 }} onClick={() => navigate('/appointments')}>
              Xem lịch hẹn
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
      <Box sx={{ padding: { xs: 2, md: 4 }, maxWidth: 1000, margin: '0 auto' }}>
        <Paper 
          elevation={0}
          sx={{ 
            padding: { xs: 3, md: 5 }, 
            borderRadius: 3,
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Đặt Lịch Khám Bệnh
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Lựa chọn dịch vụ, bác sĩ và thời gian phù hợp với bạn
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Step 1: Select Doctor */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Chọn chuyên khoa
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Chuyên khoa</InputLabel>
                <Select
                  value={selectedSpecialization}
                  onChange={(e) => {
                    setSelectedSpecialization(e.target.value);
                    setSelectedDoctor(null);
                  }}
                  label="Chuyên khoa"
                >
                  <MenuItem value="">Tất cả chuyên khoa</MenuItem>
                  {specializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="h6" gutterBottom>
                Chọn bác sĩ
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {filteredDoctors.map((doctor) => (
                    <Box key={doctor.id} sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedDoctor?.id === doctor.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          '&:hover': { boxShadow: 3 }
                        }}
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              mx: 'auto',
                              mb: 2,
                              bgcolor: selectedDoctor?.id === doctor.id ? '#1976d2' : '#e0e0e0'
                            }}
                          >
                            {doctor.fullName.charAt(0)}
                          </Avatar>
                          <Typography variant="h6" gutterBottom>
                            {doctor.fullName}
                          </Typography>
                          <Chip
                            label={doctor.specialization}
                            color="primary"
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Kinh nghiệm: {doctor.experience} năm
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {doctor.bio}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Step 2: Select Date */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Chọn ngày khám
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Chọn ngày bạn muốn đến khám
              </Typography>
              <DatePicker
                label="Ngày khám"
                format="dd/MM/yyyy"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                minDate={new Date()}
                maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { maxWidth: 300 }
                  }
                }}
              />
            </Box>
          )}

          {/* Step 3: Select Time */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Chọn giờ khám
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Các giờ trống cho {selectedDate?.toLocaleDateString('vi-VN')}
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5 }}>
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      sx={{ py: 1.5 }}
                    >
                      {slot.time}
                    </Button>
                  ))}
                  {availableSlots.length === 0 && (
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        Không có giờ trống cho ngày này. Vui lòng chọn ngày khác.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Step 4: Symptoms and Notes */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin khám bệnh
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Triệu chứng"
                placeholder="Mô tả triệu chứng bạn đang gặp phải..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Ghi chú thêm (tùy chọn)"
                placeholder="Thông tin bổ sung, lịch sử bệnh, thuốc đang dùng..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>
          )}

          {/* Step 5: Confirmation */}
          {activeStep === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Xác nhận đặt lịch
              </Typography>

              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Bệnh nhân:</strong> {user?.fullName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Bác sĩ:</strong> {selectedDoctor?.fullName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Chuyên khoa:</strong> {selectedDoctor?.specialization}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Ngày:</strong> {selectedDate?.toLocaleDateString('vi-VN')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Giờ:</strong> {selectedTime}
                </Typography>
                {symptoms && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Triệu chứng:</strong> {symptoms}
                  </Typography>
                )}
                {notes && (
                  <Typography variant="body2">
                    <strong>Ghi chú:</strong> {notes}
                  </Typography>
                )}
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                Sau khi đặt lịch thành công, bạn sẽ nhận được xác nhận qua email. Vui lòng đến đúng giờ đã hẹn.
              </Alert>
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4, 
            position: 'sticky', 
            bottom: 0, 
            bgcolor: 'background.paper', 
            p: 2, 
            zIndex: 10,
            borderTop: '1px solid',
            borderColor: 'divider',
            borderRadius: '0 0 8px 8px',
            mx: -3,
            mb: -3
          }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Quay lại
            </Button>

            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              disabled={!canProceed() || loading}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              {loading ? <CircularProgress size={20} /> :
               activeStep === steps.length - 1 ? 'Đặt lịch' : 'Tiếp tục'}
            </Button>
          </Box>
        </Paper>
      </Box>
  );
};

export default BookAppointment;
