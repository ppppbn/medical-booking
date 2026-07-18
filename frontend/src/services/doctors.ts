import { axiosInstance } from './auth';

export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  experience: number;
  bio: string;
  isActive: boolean;
  createdAt: string;
}

export interface DoctorListResponse {
  doctors: Doctor[];
  specializations: string[];
}

export interface DoctorAvailabilityResponse {
  doctorId: string;
  date: string;
  availableSlots: string[];
  bookedSlots: string[];
}

export const doctorsService = {
  async getDoctors(specialization?: string): Promise<DoctorListResponse> {
    const params = specialization ? { specialization } : {};
    const response = await axiosInstance.get('/doctors', { params });
    return response.data;
  },

  async getDoctor(id: string): Promise<{ doctor: Doctor }> {
    const response = await axiosInstance.get(`/doctors/${id}`);
    return response.data;
  },

  async getDoctorAvailability(doctorId: string, date: string): Promise<DoctorAvailabilityResponse> {
    const response = await axiosInstance.get(`/doctors/${doctorId}/availability`, {
      params: { date }
    });
    return response.data;
  },

  async getDoctorAppointments(doctorId: string, params?: {
    date?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ appointments: any[] }> {
    const response = await axiosInstance.get(`/doctors/${doctorId}/appointments`, { params });
    return response.data;
  },

  async updateDoctorProfile(doctorId: string, data: {
    specialization?: string;
    licenseNumber?: string;
    experience?: number;
    bio?: string;
    fullName?: string;
  }): Promise<{ message: string; doctor: Partial<Doctor> }> {
    const response = await axiosInstance.put(`/doctors/${doctorId}`, data);
    return response.data;
  },

  async createDoctor(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    specialization: string;
    licenseNumber: string;
    experience?: number;
    bio?: string;
  }): Promise<{ message: string; doctor: Doctor }> {
    const response = await axiosInstance.post('/doctors', data);
    return response.data;
  },

  async deactivateDoctor(doctorId: string): Promise<{ message: string; isActive: boolean }> {
    const response = await axiosInstance.delete(`/doctors/${doctorId}`);
    return response.data;
  }
};
