// Department and specialization mappings
export const DEPARTMENT_SPECIALIZATIONS = {
  'Nội khoa': 'dept-internal-medicine',
  'Phẫu thuật chỉnh hình': 'dept-orthopedics',
  'Nhi khoa': 'dept-pediatrics',
  'Tim mạch': 'dept-cardiology',
  'Sản phụ khoa': 'dept-obstetrics',
  'Da liễu': 'dept-dermatology',
  'Mắt': 'dept-ophthalmology',
  'Tai mũi họng': 'dept-ent'
} as const;

export type Specialization = keyof typeof DEPARTMENT_SPECIALIZATIONS;

// Helper function to get department ID from specialization
export function getDepartmentIdFromSpecialization(specialization: string): string | undefined {
  return DEPARTMENT_SPECIALIZATIONS[specialization as Specialization] || undefined;
}

// Helper function to get specialization from department ID
export function getSpecializationFromDepartmentId(departmentId: string): string | undefined {
  const entry = Object.entries(DEPARTMENT_SPECIALIZATIONS).find(
    ([, deptId]) => deptId === departmentId
  );
  return entry ? entry[0] : undefined;
}

// Get all available specializations
export function getAllSpecializations(): string[] {
  return Object.keys(DEPARTMENT_SPECIALIZATIONS);
}
