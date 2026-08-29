import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { extractFromNarrative } from './services/geminiService';
import Extraction from './models/Extraction';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Define global in-memory database fallback cache
const dbFallbackCache: any[] = [];

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

    // Persist extraction details inside MongoDB if connection is active
    if (mongoose.connection.readyState === 1) {
      const record = new Extraction({
        originalNarrative: narrative,
        incidentType: extractedData.incidentType,
        location: extractedData.location,
        description: extractedData.description,
        urgency: extractedData.urgency,
        revealedQuestion: extractedData.revealedQuestion
      });
      await record.save();
      console.log('[Forma AI DB] Extraction persisted to MongoDB successfully.');
    } else {
      console.log('[Forma AI DB] Database offline. Simulating extraction save (Outputting to console logs)...');
      console.log('[Forma AI DB Simulated Save]:', {
        originalNarrative: narrative,
        incidentType: extractedData.incidentType,
        location: extractedData.location,
        description: extractedData.description,
        urgency: extractedData.urgency,
        revealedQuestion: extractedData.revealedQuestion
      });
    }

    // Prepend to fallback cache (keep last 50)
    dbFallbackCache.unshift({
      _id: new mongoose.Types.ObjectId().toString(),
      originalNarrative: narrative,
      incidentType: extractedData.incidentType,
      location: extractedData.location,
      description: extractedData.description,
      urgency: extractedData.urgency,
      revealedQuestion: extractedData.revealedQuestion,
      createdAt: new Date().toISOString()
    });
    if (dbFallbackCache.length > 50) {
      dbFallbackCache.pop();
    }

    return res.json(extractedData);
  } catch (error) {
    console.error('[Forma AI Backend] Route extraction error:', error);
    return res.status(500).json({ error: 'Internal server error during data extraction.' });
  }
});

// History retrieval endpoint
app.get('/api/extractions', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const records = await Extraction.find().sort({ createdAt: -1 }).limit(50);
      return res.json(records);
    } else {
      return res.json(dbFallbackCache);
    }
  } catch (error) {
    console.error('[Forma AI Backend] Error fetching extractions:', error);
    return res.status(500).json({ error: 'Failed to retrieve extractions history.' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`[Forma AI Backend] Server is running on http://localhost:${PORT}`);
});
