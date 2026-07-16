import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterRequest } from '../types/auth';
import { USER_ROLES } from '../constants/roles';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const token = localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');

    if (token && savedUserStr) {
      setUser(JSON.parse(savedUserStr));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
      // Placeholder logic until TSK-402
      console.log('Login attempt:', email);
      throw new Error('Not implemented');
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
      // Placeholder logic until TSK-402
      console.log('Register attempt:', userData);
      throw new Error('Not implemented');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Role-based helper functions
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

      const isDoctor = user?.role === USER_ROLES.DOCTOR;
      const isPatient = user?.role === USER_ROLES.PATIENT;
      const isAdmin = user?.role === USER_ROLES.ADMIN;

  const getUserRole = (): string | null => {
    return user?.role || null;
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    hasRole,
    isDoctor,
    isPatient,
    isAdmin,
    getUserRole,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
