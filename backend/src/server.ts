import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { extractFromNarrative } from './services/geminiService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Track backend start time
const startTime = Date.now();

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'ok',
    uptime: `${uptime}s`,
    timestamp: new Date().toISOString(),
    message: 'Backend Express server is running smoothly.'
  });
});

// Extraction endpoint
app.post('/api/extract', async (req: Request, res: Response) => {
  const { narrative } = req.body;
  if (!narrative || typeof narrative !== 'string') {
    return res.status(400).json({ error: 'Request body must contain a "narrative" string.' });
  }

  try {
    const extractedData = await extractFromNarrative(narrative);
    return res.json(extractedData);
  } catch (error) {
    console.error('[Forma AI Backend] Route extraction error:', error);
    return res.status(500).json({ error: 'Internal server error during data extraction.' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`[Forma AI Backend] Server is running on http://localhost:${PORT}`);
});
