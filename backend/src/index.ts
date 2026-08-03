import express = require('express');
import cors = require('cors');
import dotenv = require('dotenv');
import { PrismaClient } from '@prisma/client';

dotenv.config();

// Import routes
import authRoutes = require('./routes/auth');
import doctorRoutes = require('./routes/doctors');
import appointmentRoutes = require('./routes/appointments');
import patientRoutes = require('./routes/patients');
import paymentRoutes = require('./routes/payments');
import { ReminderService } from './services/ReminderService';
import swaggerUi = require('swagger-ui-express');
import { swaggerSpec } from './config/swagger';

const app = express();
const prisma = new PrismaClient();
const reminderService = new ReminderService();
const PORT = process.env.PORT || 8080;

// Middleware
// Configure CORS to allow multiple origins
const allowedOrigins = [
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:80',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development/docker, allow all localhost origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes.default);
app.use('/api/doctors', doctorRoutes.default);
app.use('/api/appointments', appointmentRoutes.default);
app.use('/api/patients', patientRoutes.default);
app.use('/api/payments', paymentRoutes.default);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 Swagger API Documentation available at http://localhost:${PORT}/api-docs`);
  reminderService.startReminderScheduler();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
