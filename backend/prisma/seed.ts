import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Constants (inlined to avoid import issues)
const USER_ROLES = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN'
} as const;

const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
} as const;

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for sample users
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);

  // Helper function to combine date and time
  function combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  // Create sample departments first (before doctors)
  const departments = [
    {
      id: 'dept-internal-medicine',
      name: 'Nội khoa',
      description: 'Khoa Nội tổng hợp'
    },
    {
      id: 'dept-orthopedics',
      name: 'Phẫu thuật chỉnh hình',
      description: 'Khoa Phẫu thuật chỉnh hình và Phục hồi chức năng'
    },
    {
      id: 'dept-pediatrics',
      name: 'Nhi khoa',
      description: 'Khoa Nhi'
    },
    {
      id: 'dept-cardiology',
      name: 'Tim mạch',
      description: 'Khoa Tim mạch'
    },
    {
      id: 'dept-obstetrics',
      name: 'Sản phụ khoa',
      description: 'Khoa Sản phụ'
    },
    {
      id: 'dept-dermatology',
      name: 'Da liễu',
      description: 'Khoa Da liễu'
    },
    {
      id: 'dept-ophthalmology',
      name: 'Mắt',
      description: 'Khoa Mắt'
    },
    {
      id: 'dept-ent',
      name: 'Tai mũi họng',
      description: 'Khoa Tai mũi họng'
    }
  ];

  for (const dept of departments) {
    await prisma.departments.upsert({
      where: { id: dept.id },
      update: {},
      create: dept
    });
  }

  // Create sample patients
  const patient1 = await prisma.users.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      password: hashedPassword,
      fullName: 'Nguyễn Văn An',
      phone: '0123456789',
      address: 'Hà Nội, Việt Nam',
      role: USER_ROLES.PATIENT,
    },
  });

  const patient2 = await prisma.users.upsert({
    where: { email: 'patient2@example.com' },
    update: {},
    create: {
      email: 'patient2@example.com',
      password: hashedPassword,
      fullName: 'Trần Thị Bình',
      phone: '0987654321',
      address: 'Hồ Chí Minh, Việt Nam',
      role: USER_ROLES.PATIENT,
    },
  });

  // Create sample doctors with various specializations
  const doctorsData = [
    {
      email: 'doctor1@hospital.vn',
      fullName: 'PGS.TS. Lê Văn Cường',
      phone: '0111111111',
      specialization: 'Nội khoa',
      licenseNumber: 'VN2024001',
      experience: 15,
      bio: 'Chuyên gia về bệnh nội khoa với hơn 15 năm kinh nghiệm',
      sId: 'dept-internal-medicine'
    },
    {
      email: 'doctor2@hospital.vn',
      fullName: 'ThS. Phạm Thị Dung',
      phone: '0222222222',
      specialization: 'Phẫu thuật chỉnh hình',
      licenseNumber: 'VN2024002',
      experience: 10,
      bio: 'Chuyên gia phẫu thuật chỉnh hình, phục hồi chức năng',
      departmentId: 'dept-orthopedics'
    },
    {
      email: 'doctor3@hospital.vn',
      fullName: 'TS. Nguyễn Thị Lan',
      phone: '0333333333',
      specialization: 'Nhi khoa',
      licenseNumber: 'VN2024003',
      experience: 12,
      bio: 'Bác sĩ chuyên khoa nhi với 12 năm kinh nghiệm',
      departmentId: 'dept-pediatrics'
    },
    {
      email: 'doctor4@hospital.vn',
      fullName: 'PGS. Trần Văn Minh',
      phone: '0444444444',
      specialization: 'Tim mạch',
      licenseNumber: 'VN2024004',
      experience: 18,
      bio: 'Chuyên gia tim mạch với hơn 18 năm kinh nghiệm',
      departmentId: 'dept-cardiology'
    },
    {
      email: 'doctor5@hospital.vn',
      fullName: 'ThS. Hoàng Thị Mai',
      phone: '0555555555',
      specialization: 'Sản phụ khoa',
      licenseNumber: 'VN2024005',
      experience: 14,
      bio: 'Bác sĩ sản phụ khoa với 14 năm kinh nghiệm',
      departmentId: 'dept-obstetrics'
    },
    {
      email: 'doctor6@hospital.vn',
      fullName: 'TS. Võ Văn Tùng',
      phone: '0666666666',
      specialization: 'Da liễu',
      licenseNumber: 'VN2024006',
      experience: 9,
      bio: 'Chuyên gia da liễu với 9 năm kinh nghiệm',
      departmentId: 'dept-dermatology'
    },
    {
      email: 'doctor7@hospital.vn',
      fullName: 'PGS.TS. Đặng Thị Linh',
      phone: '0777777777',
      specialization: 'Mắt',
      licenseNumber: 'VN2024007',
      experience: 16,
      bio: 'Chuyên gia nhãn khoa với 16 năm kinh nghiệm',
      departmentId: 'dept-ophthalmology'
    },
    {
      email: 'doctor8@hospital.vn',
      fullName: 'ThS. Lê Minh Tuấn',
      phone: '0888888888',
      specialization: 'Tai mũi họng',
      licenseNumber: 'VN2024008',
      experience: 11,
      bio: 'Bác sĩ tai mũi họng với 11 năm kinh nghiệm',
      departmentId: 'dept-ent'
    }
  ];

  const doctors = [];
  for (const doctorData of doctorsData) {
    const doctorUser = await prisma.users.upsert({
      where: { email: doctorData.email },
      update: {},
      create: {
        email: doctorData.email,
        password: hashedPassword,
        fullName: doctorData.fullName,
        phone: doctorData.phone,
        role: USER_ROLES.DOCTOR,
      },
    });

    const doctor = await prisma.doctors.upsert({
      where: { userId: doctorUser.id },
      update: {},
      create: {
        userId: doctorUser.id,
        departmentId: doctorData.departmentId,
        specialization: doctorData.specialization,
        licenseNumber: doctorData.licenseNumber,
        experience: doctorData.experience,
        bio: doctorData.bio,
      },
    });

    doctors.push({ user: doctorUser, doctor });
  }

  // Create sample admin
  const admin = await prisma.users.upsert({
    where: { email: 'admin@hospital.vn' },
    update: {},
    create: {
      email: 'admin@hospital.vn',
      password: hashedPassword,
      fullName: 'Admin System',
      phone: '0333333333',
      role: USER_ROLES.ADMIN,
    },
  });

  // Create sample appointments with new schema
  const appointment1 = await prisma.appointments.upsert({
    where: { id: 'sample-appointment-1' },
    update: {},
    create: {
      id: 'sample-appointment-1',
      patientId: patient1.id,
      doctorId: doctors[0].doctor.id, // Nội khoa doctor
      appointmentDateTime: combineDateTime(new Date('2025-01-15'), '09:00'),
      symptoms: 'Đau đầu, chóng mặt',
      notes: 'Khám định kỳ',
    },
  });

  const appointment2 = await prisma.appointments.upsert({
    where: { id: 'sample-appointment-2' },
    update: {},
    create: {
      id: 'sample-appointment-2',
      patientId: patient2.id,
      doctorId: doctors[1].doctor.id, // Phẫu thuật chỉnh hình doctor
      appointmentDateTime: combineDateTime(new Date('2025-01-16'), '14:30'),
      symptoms: 'Đau khớp',
      notes: 'Tái khám',
    },
  });

  // Add more sample appointments
  const sampleAppointments = [
    {
      id: 'sample-appointment-3',
      patientId: patient1.id,
      doctorId: doctors[3].doctor.id, // Tim mạch doctor
      appointmentDateTime: combineDateTime(new Date('2025-01-20'), '10:30'),
      symptoms: 'Đau ngực, khó thở',
      notes: 'Cần khám khẩn cấp'
    },
    {
      id: 'sample-appointment-4',
      patientId: patient2.id,
      doctorId: doctors[2].doctor.id, // Nhi khoa doctor
      appointmentDateTime: combineDateTime(new Date('2025-01-22'), '08:00'),
      symptoms: 'Sốt cao, ho',
      notes: 'Khám cho con'
    }
  ];

  for (const apt of sampleAppointments) {
    await prisma.appointments.upsert({
      where: { id: apt.id },
      update: {},
      create: apt,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('Sample login credentials:');
  console.log('Patient: patient1@example.com / password123');
  console.log('Doctor: doctor1@hospital.vn / password123');
  console.log('Admin: admin@hospital.vn / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
