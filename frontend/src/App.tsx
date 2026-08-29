import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

// Shared Components
import Profile from './components/Shared/Profile';
import Dashboard from './components/Shared/Dashboard';
import AppLayout from './components/Shared/AppLayout';
import BookingFlow from './components/Booking/BookingFlow';
import PatientAppointments from './components/Appointments/PatientAppointments';
import DoctorAppointments from './components/Appointments/DoctorAppointments';
import PatientRecords from './components/EMR/PatientRecords';
import DoctorPatients from './components/EMR/DoctorPatients';
import AdminStatistics from './components/Admin/Statistics';
import ManageDoctors from './components/Admin/ManageDoctors';
import ManagePatients from './components/Admin/ManagePatients';
import ManageAppointments from './components/Admin/ManageAppointments';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Utilities
import ProtectedRoute from './components/ProtectedRoute';
import { USER_ROLES } from './constants/roles';

// Material UI theme with Vietnamese font support
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
  },
});

// App Routes component
const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  const getDefaultDashboard = () => {
    if (!user) return '/login';
    return '/dashboard';
  };

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
            <AppLayout>
              <BookingFlow />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
            <AppLayout>
              <PatientAppointments />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor-appointments"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
            <AppLayout>
              <DoctorAppointments />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-records"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
            <AppLayout>
              <PatientRecords />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
            <AppLayout>
              <DoctorPatients />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/statistics"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <AppLayout>
              <AdminStatistics />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <AppLayout>
              <ManageDoctors />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <AppLayout>
              <ManagePatients />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <AppLayout>
              <ManageAppointments />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Shared routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Cài đặt</h2>
                <p className="text-gray-600">Chức năng cài đặt tài khoản và ứng dụng.</p>
              </div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={getDefaultDashboard()} />} />

        {/* 404 route */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">404</h2>
                <p className="text-gray-600 mb-8">Trang không tồn tại</p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Quay lại
                </button>
              </div>
            </div>
          }
        />
      </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
