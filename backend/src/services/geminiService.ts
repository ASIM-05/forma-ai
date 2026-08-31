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
          description: 'A branch-activation question: for Auto Accident use "Is the vehicle drivable?", for Fire/Smoke use "Requires temporary housing assistance?", for Clinical/Medical use "Are you taking pain medication?", for Water Damage use "Has water source been stopped and isolated?", for Theft/Burglary use "Was a police report filed and documented?", for Liability/Injury use "Did the incident occur on public property?".',
        },
        value: {
          type: 'STRING',
          description: 'Extract yes/no and detail from text related to the question.',
        },
      },
      required: ['label', 'value'],
      description: 'Optional branching rules triggered by Auto, Fire, Medical, Water, Theft, or Injury incidents only.',
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
      5. If incidentType is Water Damage, include revealedQuestion with label "Has water source been stopped and isolated?" and answer it (yes/no + context) based on the text.
      6. If incidentType is Theft/Burglary, include revealedQuestion with label "Was a police report filed and documented?" and answer it (yes/no + context) based on the text.
      7. If incidentType is Liability/Injury, include revealedQuestion with label "Did the incident occur on public property?" and answer it (yes/no + context) based on the text.
      8. For other types of incidents, do not populate revealedQuestion.
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

  if (norm.includes('water') || norm.includes('pipe') || norm.includes('flood') || (norm.includes('leak') && !norm.includes('driv'))) {
    return {
      incidentType: 'Water Damage',
      location: norm.includes('basement') ? 'Basement' : 'Residential property',
      description: 'Water leak or pipe burst causing potential property flooding.',
      urgency: 'Medium',
      revealedQuestion: {
        label: 'Has water source been stopped and isolated?',
        value: norm.includes('valve') || norm.includes('shut') || norm.includes('closed') ? 'Yes' : 'No'
      }
    };
  }

  if (norm.includes('theft') || norm.includes('stolen') || norm.includes('rob') || norm.includes('break-in') || norm.includes('steal') || norm.includes('smashed') || norm.includes('stole')) {
    return {
      incidentType: 'Theft/Burglary',
      location: norm.includes('store') || norm.includes('shop') ? 'Commercial storefront' : 'Residential property',
      description: 'Unauthorized entry and loss of physical inventory or property damage.',
      urgency: 'Medium',
      revealedQuestion: {
        label: 'Was a police report filed and documented?',
        value: norm.includes('police') || norm.includes('report') ? 'Yes' : 'No'
      }
    };
  }

  if (norm.includes('slip') || norm.includes('fall') || norm.includes('hurt') || norm.includes('injury') || norm.includes('slipped')) {
    return {
      incidentType: 'Liability/Injury',
      location: norm.includes('aisle') || norm.includes('retail') ? 'Retail aisle' : 'Unknown Location',
      description: 'Physical slip, fall, or injury occurring at commercial or public premises.',
      urgency: 'High',
      revealedQuestion: {
        label: 'Did the incident occur on public property?',
        value: norm.includes('public') || norm.includes('street') ? 'Yes' : 'No'
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

