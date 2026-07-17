import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { USER_ROLES } from '../constants/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string | string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo
}) => {
  const { isAuthenticated, loading, user, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Đang tải...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && !hasRole(allowedRoles)) {
    // Determine redirect destination based on user role
    let redirectPath = '/dashboard'; // default fallback

    if (redirectTo) {
      redirectPath = redirectTo;
        } else if (user?.role === USER_ROLES.DOCTOR) {
          redirectPath = '/doctor-dashboard';
        } else if (user?.role === USER_ROLES.PATIENT) {
          redirectPath = '/patient-dashboard';
        } else if (user?.role === USER_ROLES.ADMIN) {
          redirectPath = '/admin-dashboard';
    }

    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
