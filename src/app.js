import express from 'express';
import  pkg  from 'body-parser';
import cors from 'cors';
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
import btemplate from './services/btemplateService.js'
import {sequelize} from './db.js';
import btemplateRoutes from './routes/btemplateRoutes.js';
import { Agent, run } from '@openai/agents';
import getAgentResponse from './ai/responsesService.js';
import { getBusinessClientSchedule, scheduleAppointment } from './ai/tools.js';
import businessService from './services/businessService.js';
import webhookController from './controllers/webhookController.js';
import { chat } from 'googleapis/build/src/apis/chat/index.js';
import chatService from './services/chatService.js';
import messageService from './services/messageService.js';

// import whatsappRoutes from './routes/whatsappRoutes.js';

const {json} = pkg;

await sequelize.sync({alter: true})
const app = express();

const allowedOrigins = ['https://app.bizmitra-ai.com', 'https://widget.bizmitra-ai.com', ]; //'http://localhost:5173', 'http://localhost:3000',

const corsOptions = {
  origin: true,
  credentials: true, // required if you handle cookies or Auth headers
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(json());

app.use('/api/business', businessRoutes);
app.use('/api/businessProfile', businessProfileRoutes);
app.use('/api/btemplates', btemplateRoutes);
app.use('/webhook', webhookRoutes); // Incoming WhatsApp messages
app.use('/api/messages', messageRoutes);
app.use('/api/threads',threadRoutes);
app.use('/api/assistants', assisstantRoutes);
app.use('/auth', authRoutes);
app.use('/api/bclients', bclientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/btasks', btaskRoutes);
app.use('/api/chat', chatRoutes);
// app.use('/api/whatsapp', whatsappRoutes);

// async function main() {

//   const text = await businessProfileService.scrapeWebsiteText('https://mithylldave.com/');
//   console.log('Scraped website text:', text);
 
// }

//  main().catch((err) => console.error(err));
// async function main() {
// testMetaAppConfiguration().catch(console.error);
// }
//main();

export default app;
