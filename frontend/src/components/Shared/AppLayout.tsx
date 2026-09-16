import React from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: 'margin-left 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header />
        <Box sx={{ flexGrow: 1, p: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
