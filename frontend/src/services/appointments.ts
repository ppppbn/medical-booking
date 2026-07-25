import { axiosInstance } from './auth';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  symptoms: string | null;
  notes: string | null;
  patient: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  doctor: {
    id: string;
    fullName: string;
    specialization: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateAppointmentData {
  doctorId: string;
  date: string;
  time: string;
  symptoms?: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  status?: string;
  symptoms?: string;
  notes?: string;
  date?: string;
  time?: string;
}

export interface AppointmentStatistics {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
}

export const appointmentsService = {
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    doctorId?: string;
    patientId?: string;
  }): Promise<AppointmentListResponse> {
    const response = await axiosInstance.get('/appointments', { params });
    return response.data;
  },

  async getAppointment(id: string): Promise<{ appointment: Appointment }> {
    const response = await axiosInstance.get(`/appointments/${id}`);
    return response.data;
  },

  async createAppointment(data: CreateAppointmentData): Promise<{
    message: string;
    appointment: Appointment;
  }> {
    const response = await axiosInstance.post('/appointments', data);
    return response.data;
  },

  async updateAppointment(id: string, data: UpdateAppointmentData): Promise<{
    message: string;
    appointment: Appointment;
  }> {
    const response = await axiosInstance.put(`/appointments/${id}`, data);
    return response.data;
  },

  async cancelAppointment(id: string, reason?: string): Promise<{ message: string }> {
    const response = await axiosInstance.put(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  async deleteAppointment(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/appointments/${id}`);
    return response.data;
  },

  async getAppointmentStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    statistics: AppointmentStatistics;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  }> {
    const response = await axiosInstance.get('/appointments/stats/overview', { params });
    return response.data;
  },

  async getDoctorAppointmentStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    statistics: AppointmentStatistics;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  }> {
    const response = await axiosInstance.get('/appointments/stats/doctor', { params });
    return response.data;
  },

  async getPatientAppointmentStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    statistics: AppointmentStatistics;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  }> {
    const response = await axiosInstance.get('/appointments/stats/patient', { params });
    return response.data;
  },

  async getDoctorPerformance(): Promise<{
    performance: {
      id: string;
      fullName: string;
      specialization: string;
      totalAppointments: number;
      completedAppointments: number;
      pendingAppointments: number;
      completionRate: number;
    }[];
  }> {
    const response = await axiosInstance.get('/appointments/stats/doctor-performance');
    return response.data;
  },

  async getAppointmentTrends(): Promise<{
    trends: {
      month: string;
      appointments: number;
    }[];
  }> {
    const response = await axiosInstance.get('/appointments/stats/appointment-trends');
    return response.data;
  },

  async getSpecializationPerformance(): Promise<{
    performance: {
      specialization: string;
      totalAppointments: number;
      completedAppointments: number;
      completionRate: number;
    }[];
  }> {
    const response = await axiosInstance.get('/appointments/stats/specialization-performance');
    return response.data;
  }
};
