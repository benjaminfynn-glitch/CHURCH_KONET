import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Mock balance endpoint
app.post('/api/test-sms-connectivity', (req, res) => {
  const { action } = req.body;

  console.log('=== SMS MOCK API ===');
  console.log('Action requested:', action);
  console.log('=====================');

  switch (action) {
    case 'balance':
      res.json({
        success: true,
        balance: {
          balance: 100.50,
          currency: 'GHS'
        },
        message: 'Mock balance check successful'
      });
      break;

    case 'send-test':
      const { phone } = req.body;
      res.json({
        success: true,
        response: {
          id: 'mock-sms-' + Date.now(),
          status: 'sent',
          phone: phone,
          message: 'Test message sent successfully'
        },
        message: 'Mock SMS sent successfully'
      });
      break;

    default:
      res.status(400).json({
        error: 'Invalid action. Use "balance" or "send-test"',
        success: false
      });
  }
});

app.listen(port, () => {
  console.log(`Mock SMS API server running at http://localhost:${port}`);
});