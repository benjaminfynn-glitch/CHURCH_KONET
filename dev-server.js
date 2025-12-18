import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes - using tsx to run TypeScript files
import balanceRouter from './api/balance-express.ts';
import sendSMSHandler from './api/send-sms.ts';
import sendPersonalisedSMSHandler from './api/send-personalised-sms.ts';
import broadcastRouter from './api/broadcast-express.ts';
import scheduleSMSHandler from './api/schedule-sms.ts';
import deliveryPushHandler from './api/delivery-push.ts';
import testSMSConnectivityHandler from './api/test-sms-connectivity.ts';

// API routes
app.use('/api/balance', balanceRouter);
app.post('/api/send-sms', sendSMSHandler);
app.post('/api/send-personalised-sms', sendPersonalisedSMSHandler);
app.use('/api/broadcast', broadcastRouter);
app.post('/api/schedule-sms', scheduleSMSHandler);
app.post('/api/delivery-push', deliveryPushHandler);
app.post('/api/test-sms-connectivity', testSMSConnectivityHandler);

// Serve static files from the dist directory (for production build)
app.use(express.static(join(__dirname, 'dist')));

// For any other route, serve the index.html (for React Router)
app.use((req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Development server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 API endpoints available at http://0.0.0.0:${PORT}/api/*`);
  console.log(`🌐 Accessible from network at http://<your-ip>:${PORT}`);
});