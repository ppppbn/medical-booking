import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { patientsService, MedicalRecord } from '../../services/patients';
import { APPOINTMENT_STATUS } from '../../constants/roles';

type Order = 'asc' | 'desc';

const MyRecords: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof MedicalRecord>('date');
  const { user } = useAuth();

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  useEffect(() => {
    filterAndSortRecords();
  }, [records, searchTerm, order, orderBy]);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const { medicalRecords } = await patientsService.getPatientRecords(user!.id);
      setRecords(medicalRecords);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Không thể tải hồ sơ bệnh án');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRecords = () => {
    let filtered = records.filter(record =>
      (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.doctor.user?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (record.symptoms && record.symptoms.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aValue: any = a[orderBy];
      let bValue: any = b[orderBy];

      if (orderBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRecords(filtered);
  };

  const handleRequestSort = (property: keyof MedicalRecord) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Add timezone offset to prevent date shifting
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utcDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
        <Box sx={{ p: 4, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
            Hồ Sơ Bệnh Án
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Lịch sử các lần khám bệnh và chẩn đoán của bạn
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search Bar */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Tìm kiếm theo chẩn đoán, tên bác sĩ hoặc triệu chứng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {filteredRecords.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm ? 'Không tìm thấy hồ sơ bệnh án nào' : 'Bạn chưa có hồ sơ bệnh án nào'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {searchTerm ? 'Hãy thử từ khóa khác' : 'Hồ sơ bệnh án sẽ xuất hiện sau khi bạn hoàn thành các lần khám'}
                </Typography>
              </Box>
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'date'}
                        direction={orderBy === 'date' ? order : 'asc'}
                        onClick={() => handleRequestSort('date')}
                        component="span"
                        style={{ cursor: 'pointer' }}
                      >
                        Ngày khám
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Giờ</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'doctor'}
                        direction={orderBy === 'doctor' ? order : 'asc'}
                        onClick={() => handleRequestSort('doctor' as keyof MedicalRecord)}
                        component="span"
                        style={{ cursor: 'pointer' }}
                      >
                        Bác sĩ
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Chuyên khoa</TableCell>
                    <TableCell>Triệu chứng</TableCell>
                    <TableCell>Chẩn đoán</TableCell>
                    <TableCell>Điều trị</TableCell>
                    <TableCell>Đơn thuốc</TableCell>
                    <TableCell>Kết quả xét nghiệm</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell>{record.doctor.user?.fullName}</TableCell>
                      <TableCell>{record.doctor.specialization}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>
                          {record.symptoms || 'Không có'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>
                          {record.diagnosis || 'Chưa có'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>
                          {record.treatment || 'Chưa có'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>
                          {record.prescription || 'Không có'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap>
                          {record.testResults || 'Không có'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MyRecords;
