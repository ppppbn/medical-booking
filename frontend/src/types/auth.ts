export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string; // PATIENT | DOCTOR | ADMIN | STAFF
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasRole: (role: string | string[]) => boolean;
  isDoctor: boolean;
  isPatient: boolean;
  isAdmin: boolean;
  getUserRole: () => string | null;
  updateUser: (user: User) => void; // Method to update user state locally
}
