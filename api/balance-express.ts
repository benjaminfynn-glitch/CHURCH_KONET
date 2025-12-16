import express from 'express';
import balanceHandler from './balance.ts';

const router = express.Router();

// Convert Express req/res to Vercel format and call the handler
router.get('/', async (req: any, res: any) => {
  try {
    // Create Vercel-compatible request and response objects
    const vercelReq = {
      method: 'GET',
      headers: req.headers,
      query: req.query,
    } as any;

    const vercelRes = {
      status: (code: number) => {
        return {
          json: (data: any) => {
            res.status(code).json(data);
          },
          end: () => {
            res.end();
          },
        };
      },
    } as any;

    // Call the original Vercel handler
    await balanceHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Express balance error:', error);
    res.status(500).json({ error: String(error) });
  }
});

export default router;