import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Start server
app.listen(PORT, () => {
  console.log(`[Forma AI Backend] Server is running on http://localhost:${PORT}`);
});
