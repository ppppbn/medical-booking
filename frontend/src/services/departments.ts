import { axiosInstance } from './auth';

export interface DepartmentDoctor {
  id: string;
  userId: string;
  departmentId: string | null;
  specialization: string;
  licenseNumber: string;
  experience: number;
  bio: string;
  isActive: boolean;
  user: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  headDoctorId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  doctors: DepartmentDoctor[];
}

export interface DepartmentListResponse {
  departments: Department[];
}

export const departmentsService = {
  async getDepartments(): Promise<DepartmentListResponse> {
    const response = await axiosInstance.get('/departments');
    return response.data;
  },

  async createDepartment(data: { name: string; description?: string }): Promise<{ message: string; department: Department }> {
    const response = await axiosInstance.post('/departments', data);
    return response.data;
  },

  async updateDepartment(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<{ message: string; department: Department }> {
    const response = await axiosInstance.put(`/departments/${id}`, data);
    return response.data;
  },

  async assignDoctor(departmentId: string, doctorId: string): Promise<{ message: string; doctor: any }> {
    const response = await axiosInstance.post(`/departments/${departmentId}/doctors`, { doctorId });
    return response.data;
  },

  async removeDoctor(departmentId: string, doctorId: string): Promise<{ message: string; doctor: any }> {
    const response = await axiosInstance.delete(`/departments/${departmentId}/doctors/${doctorId}`);
    return response.data;
  }
};
