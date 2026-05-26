import express from 'express';
import { createServer } from 'http';
import { join } from 'path';
import 'dotenv/config';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiPaths = [
  'broadcast',
  'send-sms',
  'send-personalised-sms',
  'balance',
  'schedule-sms',
  'test-sms-connectivity',
  'delivery-push',
  'birthday',
];

async function loadHandler(path: string) {
  try {
    const module = await import(`./api/${path}.ts`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load handler for ${path}:`, error);
    return null;
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    smsService: 'connected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    smsService: 'connected',
    timestamp: new Date().toISOString(),
  });
});

for (const path of apiPaths) {
  const handler = await loadHandler(path);
  if (handler) {
    app.use(`/api/${path}`, async (req, res) => {
      const vercelReq: any = {
        method: req.method,
        body: req.body,
        headers: req.headers,
        query: req.query,
        path: req.path,
      };

      const vercelRes: any = {
        status: (code: number) => ({
          json: (data: any) => res.status(code).json(data),
          end: () => res.end(),
        }),
        json: (data: any) => res.json(data),
        setHeader: (name: string, value: string) => res.setHeader(name, value),
        end: () => res.end(),
      };

      try {
        await handler(vercelReq, vercelRes);
      } catch (error: any) {
        console.error(`Error in ${path} handler:`, error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
      }
    });
    console.log(`Loaded API handler: /api/${path}`);
  }
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const server = createServer(app);

server.listen(port, () => {
  console.log(`SMS API Server running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API endpoints available at http://localhost:${port}/api/`);
});