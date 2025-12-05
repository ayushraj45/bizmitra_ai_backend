import express from 'express';
import cors from 'cors';
import { sequelize } from './db.js';
import webhookRoutes from './routes/webhookRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import bclientRoutes from './routes/bclientRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import btaskRoutes from './routes/btaskRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import assisstantRoutes from './routes/assisstantRoutes.js';
import businessProfileRoutes from './routes/businessProfileRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import btemplateRoutes from './routes/btemplateRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = [
  'https://app.bizmitra-ai.com', 
  'https://widget.bizmitra-ai.com',
  // 'http://localhost:5173', 
  // 'http://localhost:3000'
];

const corsOptions = {
  origin: true, // Reflects the request origin, or use logic to validate against allowedOrigins
  credentials: true,
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/business', businessRoutes);
app.use('/api/businessProfile', businessProfileRoutes);
app.use('/api/btemplates', btemplateRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/assistants', assisstantRoutes);
app.use('/auth', authRoutes);
app.use('/api/bclients', bclientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/btasks', btaskRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler (Must be last)
app.use(errorHandler);

// Database Sync
const initDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to synchronize the database:', error);
  }
};

initDb();

export default app;