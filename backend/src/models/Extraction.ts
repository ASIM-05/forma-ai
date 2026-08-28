import mongoose, { Schema, Document } from 'mongoose';

export interface IExtraction extends Document {
  originalNarrative: string;
  incidentType: string;
  location: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  revealedQuestion?: {
    label: string;
    value: string;
  };
  createdAt: Date;
}

const ExtractionSchema: Schema = new Schema({
  originalNarrative: { type: String, required: true },
  incidentType: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  revealedQuestion: {
    label: { type: String },
    value: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IExtraction>('Extraction', ExtractionSchema);
