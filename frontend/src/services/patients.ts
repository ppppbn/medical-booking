import { axiosInstance } from './auth';

export interface Patient {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MedicalRecord {
  id: string;
  date: string;
  time: string;
  doctor: {
    id: string;
    specialization: string;
    licenseNumber: string;
    bio: string;
    experience: number;
    user: {
      fullName: string;
    };
  };
  symptoms: string | null;
  notes: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  testResults: string | null;
  followUpInstructions: string | null;
  nextAppointmentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientRecordsResponse {
  medicalRecords: MedicalRecord[];
  totalRecords: number;
}

export const patientsService = {
  async getPatients(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PatientListResponse> {
    const response = await axiosInstance.get('/patients', { params });
    return response.data;
  },

  async getPatient(id: string): Promise<{ patient: Patient }> {
    const response = await axiosInstance.get(`/patients/${id}`);
    return response.data;
  },

  async updatePatient(id: string, data: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
  }): Promise<{ message: string; patient: Patient }> {
    const response = await axiosInstance.put(`/patients/${id}`, data);
    return response.data;
  },

  async getPatientAppointments(id: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    appointments: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await axiosInstance.get(`/patients/${id}/appointments`, { params });
    return response.data;
  },

  async getPatientRecords(id: string): Promise<PatientRecordsResponse> {
    const response = await axiosInstance.get(`/patients/${id}/records`);
    return response.data;
  },

  async createPatient(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
  }): Promise<{ message: string; patient: Patient }> {
    const response = await axiosInstance.post('/patients', data);
    return response.data;
  },

  async deactivatePatient(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/patients/${id}`);
    return response.data;
  },

  async togglePatientStatus(id: string): Promise<{ message: string; patient: Patient }> {
    const response = await axiosInstance.put(`/patients/${id}/status`);
    return response.data;
  },

  async getPatientStatistics(): Promise<{
    totalPatients: number;
    activePatients: number;
    inactivePatients: number;
    totalAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
  }> {
    const response = await axiosInstance.get('/patients/admin/statistics');
    return response.data;
  }
};
