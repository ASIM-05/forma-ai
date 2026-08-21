import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Define Response Interface
export interface ExtractedFields {
  incidentType: string;
  location: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  revealedQuestion?: {
    label: string;
    value: string;
  };
}

const apiKey = process.env.GEMINI_API_KEY;

// Check if Gemini API key exists: if not, we use mock fallback data to keep system functional
if (!apiKey) {
  console.warn('[Forma AI Backend] WARNING: GEMINI_API_KEY is not defined in environment variables. Falling back to mock extraction mode.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// JSON Schema description for Gemini response formatting
const responseSchema: any = {
  type: 'OBJECT',
  properties: {
    incidentType: {
      type: 'STRING',
      description: 'The category of the incident, e.g. Auto Accident, Fire/Smoke Damage, Clinical consultation, etc.',
    },
    location: {
      type: 'STRING',
      description: 'The location where the incident occurred or is relevant to.',
    },
    description: {
      type: 'STRING',
      description: 'A summary description of what happened, synthesized from the text.',
    },
    urgency: {
      type: 'STRING',
      enum: ['Low', 'Medium', 'High'],
      description: 'Assessed scale of urgency flag based on narrative keywords.',
    },
    revealedQuestion: {
      type: 'OBJECT',
      properties: {
        label: {
          type: 'STRING',
          description: 'A branch-activation question: for Auto Accident use "Is the vehicle drivable?", for Fire/Smoke use "Requires temporary housing assistance?", for Clinical/Medical use "Are you taking pain medication?".',
        },
        value: {
          type: 'STRING',
          description: 'Extract yes/no and detail from text related to the question.',
        },
      },
      required: ['label', 'value'],
      description: 'Optional branching rules triggered by Auto, Fire, or Medical incidents only.',
    },
  },
  required: ['incidentType', 'location', 'description', 'urgency'],
};


export async function extractFromNarrative(narrative: string): Promise<ExtractedFields> {
  // Mock fallback mode if API Key is not configured
  if (!genAI) {
    return simulateExtractionMock(narrative);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const prompt = `
      Analyze the following incident or intake narrative and extract structured fields in JSON format:
      "${narrative}"
      
      Instructions for branching logic:
      1. Classify the incidentType.
      2. If incidentType is related to Auto Accidents / vehicle claims, include revealedQuestion with label "Is the vehicle drivable?" and answer it (yes/no + context) based on the text.
      3. If incidentType is related to Fire / Smoke damage, include revealedQuestion with label "Requires temporary housing assistance?" and answer it (yes/no + context) based on the text.
      4. If incidentType is Clinical or Medical, include revealedQuestion with label "Are you taking pain medication?" and answer it (yes/no + context) based on the text.
      5. For other types of incidents, do not populate revealedQuestion.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText) as ExtractedFields;
  } catch (error) {
    console.error('[Forma AI Backend] Error during Gemini extraction:', error);
    // Graceful fallback to mock data on API failures
    return simulateExtractionMock(narrative);
  }
}

// Simple fallback mock simulation to avoid crash/blocking
function simulateExtractionMock(narrative: string): ExtractedFields {
  const norm = narrative.toLowerCase();
  
  if (norm.includes('deer') || norm.includes('accident') || norm.includes('driv') || norm.includes('bumper')) {
    return {
      incidentType: 'Auto Accident',
      location: norm.includes('boston') ? 'Route 95, Boston' : 'Unknown Highway',
      description: 'Vehicle collided with external object/animal. Bumper or front-end damage occurred.',
      urgency: 'Medium',
      revealedQuestion: {
        label: 'Is the vehicle drivable?',
        value: norm.includes('leak') ? 'No (Leak detected)' : 'Yes'
      }
    };
  }
  
  if (norm.includes('fire') || norm.includes('smoke') || norm.includes('burn')) {
    return {
      incidentType: 'Fire/Smoke Damage',
      location: norm.includes('basement') ? 'Basement' : 'Residential property',
      description: 'Property elements burned or smoke-damaged due to heat/short circuit.',
      urgency: 'High',
      revealedQuestion: {
        label: 'Requires temporary housing assistance?',
        value: norm.includes('housing') || norm.includes('displace') ? 'Yes' : 'No'
      }
    };
  }

  if (norm.includes('pain') || norm.includes('clinic') || norm.includes('doctor') || norm.includes('surgery')) {
    return {
      incidentType: 'Clinical consultation',
      location: 'Outpatient clinic',
      description: 'Patient suffers from physical discomfort requiring checkup/treatment.',
      urgency: 'Low',
      revealedQuestion: {
        label: 'Are you taking pain medication?',
        value: 'Yes'
      }
    };
  }

  return {
    incidentType: 'General Inquiry',
    location: 'Unknown Location',
    description: narrative,
    urgency: 'Low'
  };
}
