import express from 'express';
import broadcastHandler from './broadcast.ts';

const router = express.Router();

// Convert Express req/res to Vercel format and call the handler
router.post('/', async (req: any, res: any) => {
  try {
    // Create Vercel-compatible request and response objects
    const vercelReq = {
      method: 'POST',
      body: req.body,
      headers: req.headers,
      query: req.query,
    } as any;

    const vercelRes = {
      status: (code: number) => ({
        json: (data: any) => res.status(code).json(data),
        end: () => res.end()
      }),
      json: (data: any) => res.json(data),
      setHeader: (name: string, value: string) => res.header(name, value),
      end: () => res.end()
    } as any;

    // Call the original Vercel handler
    await broadcastHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Express broadcast error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: String(error) });
  }
});

export default router;