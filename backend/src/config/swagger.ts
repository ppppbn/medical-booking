import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Medical Appointment Booking System API Documentation',
      version: '1.0.0',
      description: 'Hệ thống API quản lý và đặt lịch khám bệnh trực tuyến (Medical Booking System)',
      contact: {
        name: 'DeepMind Team Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT Token của bạn (không cần gõ chuỗi Bearer)'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string' },
            phone: { type: 'string', nullable: true },
            dateOfBirth: { type: 'string', format: 'date', nullable: true },
            address: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'ADMIN'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Doctor: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            specialization: { type: 'string' },
            departmentId: { type: 'string', nullable: true },
            licenseNumber: { type: 'string' },
            experience: { type: 'integer', nullable: true },
            bio: { type: 'string', nullable: true },
            education: { type: 'string', nullable: true },
            certifications: { type: 'string', nullable: true },
            consultationFee: { type: 'number', nullable: true },
            consultationDuration: { type: 'integer', default: 30 },
            isActive: { type: 'boolean' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            patientId: { type: 'string' },
            doctorId: { type: 'string' },
            appointmentDateTime: { type: 'string', format: 'date-time' },
            date: { type: 'string', format: 'date' },
            time: { type: 'string', example: '09:00' },
            duration: { type: 'integer', default: 30 },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] },
            appointmentType: { type: 'string', enum: ['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY'] },
            symptoms: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            fee: { type: 'number', nullable: true },
            paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED'] }
          }
        },
        MedicalRecord: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            patientId: { type: 'string' },
            doctorId: { type: 'string' },
            appointmentId: { type: 'string', nullable: true },
            diagnosis: { type: 'string', nullable: true },
            treatment: { type: 'string', nullable: true },
            prescription: { type: 'string', nullable: true },
            testResults: { type: 'string', nullable: true },
            followUpInstructions: { type: 'string', nullable: true },
            nextAppointmentDate: { type: 'string', format: 'date', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            appointmentId: { type: 'string' },
            amount: { type: 'number' },
            paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER', 'CARD', 'VNPAY'] },
            paymentStatus: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
            transactionId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      { name: 'Auth', description: 'Xác thực & Quản lý Tài khoản' },
      { name: 'Doctors', description: 'Quản lý Bác sĩ & Khung giờ rảnh' },
      { name: 'Patients', description: 'Quản lý Bệnh nhân & Hồ sơ Bệnh án' },
      { name: 'Appointments', description: 'Quản lý Lịch hẹn & Đặt lịch lặp lại' },
      { name: 'Payments', description: 'Cổng thanh toán VNPay & Webhook' }
    ],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng ký tài khoản bệnh nhân',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'fullName'],
                  properties: {
                    email: { type: 'string', example: 'patient@example.com' },
                    password: { type: 'string', example: 'Password123' },
                    fullName: { type: 'string', example: 'Nguyễn Văn A' },
                    phone: { type: 'string', example: '0912345678' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Đăng ký thành công' },
            400: { description: 'Dữ liệu không hợp lệ' },
            409: { description: 'Email đã tồn tại' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng nhập hệ thống',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'patient@example.com' },
                    password: { type: 'string', example: 'Password123' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Đăng nhập thành công, trả về JWT Token' },
            401: { description: 'Sai email hoặc mật khẩu' }
          }
        }
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Lấy thông tin tài khoản hiện tại',
          responses: {
            200: { description: 'Thông tin tài khoản' },
            401: { description: 'Chưa xác thực' }
          }
        }
      },
      '/api/doctors': {
        get: {
          tags: ['Doctors'],
          summary: 'Danh sách bác sĩ',
          parameters: [
            { name: 'specialization', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            200: { description: 'Danh sách bác sĩ' }
          }
        },
        post: {
          tags: ['Doctors'],
          summary: 'Tạo tài khoản Bác sĩ (Admin)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'fullName', 'specialization', 'licenseNumber'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    fullName: { type: 'string' },
                    specialization: { type: 'string' },
                    licenseNumber: { type: 'string' },
                    experience: { type: 'integer' },
                    bio: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Tạo tài khoản bác sĩ thành công' }
          }
        }
      },
      '/api/doctors/{id}': {
        get: {
          tags: ['Doctors'],
          summary: 'Chi tiết thông tin bác sĩ',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Thông tin bác sĩ' },
            404: { description: 'Không tìm thấy bác sĩ' }
          }
        },
        put: {
          tags: ['Doctors'],
          summary: 'Cập nhật hồ sơ bác sĩ',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Cập nhật thành công' }
          }
        },
        delete: {
          tags: ['Doctors'],
          summary: 'Đổi trạng thái kích hoạt bác sĩ (Admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Thao tác thành công' }
          }
        }
      },
      '/api/doctors/{id}/availability': {
        get: {
          tags: ['Doctors'],
          summary: 'Sinh khung giờ rảnh tự động của bác sĩ',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date', example: '2026-08-10' } }
          ],
          responses: {
            200: { description: 'Danh sách các khung giờ trống khả dụng' }
          }
        }
      },
      '/api/patients': {
        get: {
          tags: ['Patients'],
          summary: 'Danh sách bệnh nhân (Admin/Doctor)',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            200: { description: 'Danh sách bệnh nhân' }
          }
        }
      },
      '/api/patients/{id}/records': {
        get: {
          tags: ['Patients'],
          summary: 'Hồ sơ bệnh án & Tiến trình trị liệu qua từng buổi',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Lịch sử hồ sơ trị liệu theo thời gian' }
          }
        }
      },
      '/api/appointments': {
        get: {
          tags: ['Appointments'],
          summary: 'Danh sách lịch hẹn',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            200: { description: 'Danh sách lịch hẹn' }
          }
        },
        post: {
          tags: ['Appointments'],
          summary: 'Đặt lịch khám (Hỗ trợ đặt đơn lẻ hoặc lặp lại N tuần)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['doctorId', 'date', 'time'],
                  properties: {
                    doctorId: { type: 'string' },
                    date: { type: 'string', format: 'date', example: '2026-08-10' },
                    time: { type: 'string', example: '09:00' },
                    symptoms: { type: 'string' },
                    notes: { type: 'string' },
                    isRecurring: { type: 'boolean', default: false },
                    recurringWeeks: { type: 'integer', example: 4 }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Đặt lịch hẹn thành công' },
            409: { description: 'Xung đột trùng khung giờ khám' }
          }
        }
      },
      '/api/appointments/{id}': {
        get: {
          tags: ['Appointments'],
          summary: 'Chi tiết lịch hẹn',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Chi tiết lịch hẹn' }
          }
        },
        put: {
          tags: ['Appointments'],
          summary: 'Cập nhật trạng thái / Lưu kết quả chẩn đoán buổi khám',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] },
                    diagnosis: { type: 'string' },
                    treatment: { type: 'string' },
                    prescription: { type: 'string' },
                    testResults: { type: 'string' },
                    followUpInstructions: { type: 'string' },
                    nextAppointmentDate: { type: 'string', format: 'date' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Cập nhật lịch hẹn thành công' }
          }
        }
      },
      '/api/appointments/{id}/cancel': {
        put: {
          tags: ['Appointments'],
          summary: 'Hủy lịch hẹn',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string', example: 'Có việc bận đột xuất' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Hủy lịch hẹn thành công' }
          }
        }
      },
      '/api/payments/vnpay/create-url': {
        post: {
          tags: ['Payments'],
          summary: 'Khởi tạo đường dẫn thanh toán VNPay',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['appointmentId'],
                  properties: {
                    appointmentId: { type: 'string' },
                    fee: { type: 'number', example: 300000 },
                    returnUrl: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Trả về VNPay paymentUrl' },
            400: { description: 'Chi phí không xác định' }
          }
        }
      },
      '/api/payments/vnpay/return': {
        get: {
          tags: ['Payments'],
          summary: 'Callback chuyển hướng kết quả thanh toán từ VNPay',
          security: [],
          responses: {
            200: { description: 'Kết quả thanh toán' }
          }
        }
      },
      '/api/payments/vnpay/ipn': {
        get: {
          tags: ['Payments'],
          summary: 'Webhook IPN phản hồi ngầm từ server VNPay',
          security: [],
          responses: {
            200: { description: 'Phản hồi JSON chuẩn VNPay (RspCode)' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options);
