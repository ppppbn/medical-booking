import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Shared Components
import Profile from './components/Shared/Profile';
import Dashboard from './components/Shared/Dashboard';
import AppLayout from './components/Shared/AppLayout';

// Utilities
import ProtectedRoute from './components/ProtectedRoute';

// Material UI theme with Vietnamese font support
const theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
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
  const { isAuthenticated, user } = useAuth();

  const getDefaultDashboard = () => {
    if (!user) return '/login';
    return '/dashboard';
  };

  return (
    <AppLayout>
      <Routes>
        {/* Placeholder Login/Register routes to be implemented in TSK-402 */}
        <Route
          path="/login"
          element={<div className="flex justify-center p-10"><h1 className="text-2xl">Login Page (Pending TSK-402)</h1></div>}
        />
        <Route
          path="/register"
          element={<div className="flex justify-center p-10"><h1 className="text-2xl">Register Page (Pending TSK-402)</h1></div>}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Shared routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Cài đặt</h2>
                <p className="text-gray-600">Chức năng cài đặt tài khoản và ứng dụng.</p>
              </div>
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
    </AppLayout>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
