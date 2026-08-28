import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/forma-ai';
    console.log(`[Forma AI DB] Connecting to database...`);
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Forma AI DB] MongoDB connected successfully to: ${conn.connection.name}`);
  } catch (error) {
    console.log('[Forma AI DB] WARNING: MongoDB is not running or unreachable on port 27017.');
    console.log('[Forma AI DB] Express backend will continue operating in offline database simulation mode.');
  }
}
