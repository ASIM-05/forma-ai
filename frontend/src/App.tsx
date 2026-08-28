import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import './styles/App.css';

// Preset Narratives
interface Preset {
  id: string;
  label: string;
  narrative: string;
  fields: {
    incidentType: string;
    location: string;
    description: string;
    urgency: string;
    [key: string]: string; // for custom conditional questions
  };
  revealedQuestion?: {
    label: string;
    value: string;
  };
}

const PRESETS: Preset[] = [
  {
    id: 'auto-claim',
    label: '🚗 Auto Accident',
    narrative: 'I was driving my white Honda Civic on Route 95 near Boston yesterday. A deer jumped out and hit my front bumper. Thankfully nobody was hurt, but my radiator is leaking.',
    fields: {
      incidentType: 'Auto Accident',
      location: 'Route 95, Boston',
      description: 'Collided with deer. Front bumper cracked, leaking radiator.',
      urgency: 'Medium'
    },
    revealedQuestion: {
      label: 'Is the vehicle drivable?',
      value: 'No (Radiator leaking)'
    }
  },
  {
    id: 'property-fire',
    label: '🔥 Residential Fire',
    narrative: 'My basement caught fire due to an electrical short in the water heater this morning. The floor and drywall are badly burned. No structure collapse yet.',
    fields: {
      incidentType: 'Fire/Smoke Damage',
      location: 'Basement',
      description: 'Electrical short in water heater caused basement fire. Burned floor and drywall.',
      urgency: 'High'
    },
    revealedQuestion: {
      label: 'Requires temporary housing assistance?',
      value: 'Yes'
    }
  },
  {
    id: 'health-intake',
    label: '⚕️ Medical Intake',
    narrative: 'I need to schedule a consultation. I have been suffering from acute lower back pain for the past three weeks. It becomes severe when I sit down. No history of major surgeries.',
    fields: {
      incidentType: 'Clinical consultation',
      location: 'Outpatient clinic',
      description: 'Acute lower back pain for 3 weeks, worse when sitting.',
      urgency: 'Low'
    },
    revealedQuestion: {
      label: 'Are you taking pain medication?',
      value: 'Yes'
    }
  }
];

function App() {
  const [view, setView] = useState<'landing' | 'simulator'>('landing');
  const [narrative, setNarrative] = useState(PRESETS[0].narrative);
  const [selectedPresetId, setSelectedPresetId] = useState('auto-claim');
  const [isParsing, setIsParsing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // For simulation stages
  
  // Form Field States
  const [fields, setFields] = useState({
    incidentType: '',
    location: '',
    description: '',
    urgency: ''
  });
  
  // Conditional question state
  const [revealedQuestion, setRevealedQuestion] = useState<{label: string, value: string} | null>(null);

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPresetId(preset.id);
    setNarrative(preset.narrative);
    handleExtract(preset.narrative);
  };

  const handleExtract = async (text: string) => {
    setIsParsing(true);
    setCurrentStep(0);
    setFields({
      incidentType: '',
      location: '',
      description: '',
      urgency: ''
    });
    setRevealedQuestion(null);

    try {
      const response = await fetch('http://localhost:5000/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ narrative: text })
      });

      if (!response.ok) {
        throw new Error('Backend API extraction failed.');
      }

      const data = await response.json();

      // Stage 1: Incident Type (300ms)
      setTimeout(() => {
        setFields((f) => ({ ...f, incidentType: data.incidentType || 'Unknown' }));
        setCurrentStep(1);
      }, 300);

      // Stage 2: Location (600ms)
      setTimeout(() => {
        setFields((f) => ({ ...f, location: data.location || 'Unknown' }));
        setCurrentStep(2);
      }, 600);

      // Stage 3: Description (900ms)
      setTimeout(() => {
        setFields((f) => ({ ...f, description: data.description || 'Unknown' }));
        setCurrentStep(3);
      }, 900);

      // Stage 4: Urgency & evaluate conditional questions (1200ms)
      setTimeout(() => {
        setFields((f) => ({ ...f, urgency: data.urgency || 'Low' }));
        setCurrentStep(4);
        if (data.revealedQuestion && data.revealedQuestion.label) {
          setRevealedQuestion(data.revealedQuestion);
        }
        setIsParsing(false);
      }, 1200);

    } catch (error) {
      console.error('[Forma AI Client] API request failed, using demo fallback:', error);
      // Staggered fallback to demo data if backend connection fails (e.g. offline)
      const cachedPreset = PRESETS.find(p => p.narrative === text) || PRESETS[0];
      
      setTimeout(() => {
        setFields((f) => ({ ...f, incidentType: cachedPreset.fields.incidentType }));
        setCurrentStep(1);
      }, 300);

      setTimeout(() => {
        setFields((f) => ({ ...f, location: cachedPreset.fields.location }));
        setCurrentStep(2);
      }, 600);

      setTimeout(() => {
        setFields((f) => ({ ...f, description: cachedPreset.fields.description }));
        setCurrentStep(3);
      }, 900);

      setTimeout(() => {
        setFields((f) => ({ ...f, urgency: cachedPreset.fields.urgency }));
        setCurrentStep(4);
        if (cachedPreset.revealedQuestion) {
          setRevealedQuestion(cachedPreset.revealedQuestion);
        }
        setIsParsing(false);
      }, 1200);
    }
  };

  // Pre-fill initial preset values
  useEffect(() => {
    handleExtract(PRESETS[0].narrative);
  }, []);

  if (view === 'landing') {
    return <LandingPage onLaunchSimulator={() => setView('simulator')} />;
  }

  return (
    <div className="app-container">
      <div className="radial-glow" style={{ top: '-10%', left: '10%' }}></div>
      <div className="radial-glow" style={{ bottom: '-10%', right: '10%' }}></div>

      <header>
        <div className="logo-container" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <span className="logo-text gradient-text">Forma AI</span>
          <span className="badge">Engine v1.0</span>
        </div>
        <div className="tech-badges" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setView('landing')} 
            className="preset-pill" 
            style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}
          >
            ← Back to Home
          </button>
          <div className="tech-badge">
            <span className="dot-indicator active"></span>
            <span>Client Simulator Active</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Left column: Hero & Narrative Input */}
        <section className="hero-section animate-fade-in">
          <h1 className="hero-title">
            AI-Augmented <br />
            <span className="gradient-accent-text">Dynamic Form Engine</span>
          </h1>
          <p className="hero-description">
            Forma AI transforms unstructured user narratives directly into highly structured schema forms. 
            It automatically evaluates backend-defined rules to show branching questions on the fly, 
            minimizing human entry effort while securing clean data integration.
          </p>

          <div className="interactive-panel">
            <div className="input-header">
              <span className="section-title">Step 1: Input Narrative</span>
              {isParsing && <span className="pulse-indicator"><span className="pulse-dot"></span>LLM Extraction...</span>}
            </div>

            <textarea
              className="narrative-textarea"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="e.g. Describe your claim, symptom, or request..."
              disabled={isParsing}
            />

            <div className="presets-container">
              <span className="presets-label">Select Demo Presets:</span>
              <div className="preset-pills">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className={`preset-pill ${selectedPresetId === p.id ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(p)}
                    disabled={isParsing}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="action-bar">
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleExtract(narrative);
                }}
                disabled={isParsing}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3M3 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M3 12l-3 3m3-3l3 3" />
                </svg>
                {isParsing ? 'Extracting...' : 'Simulate AI Extraction'}
              </button>
            </div>
          </div>
        </section>

        {/* Right column: Dynamic Form Preview */}
        <section className="glass-card form-preview-card animate-fade-in">
          <div className="preview-header">
            <span className="section-title">Step 2: Schema Output</span>
            <div className="pulse-indicator">
              <span className="pulse-dot"></span>
              <span>Dynamic Form Renderer</span>
            </div>
          </div>

          <form className="mock-form" onSubmit={(e) => e.preventDefault()}>
            {/* Field 1 */}
            <div className="form-group">
              <label className="form-label">
                Incident/Request Type
                <span className={`form-field-info ${currentStep >= 1 ? 'show' : ''}`}>AI Extracted</span>
              </label>
              <input
                type="text"
                className={`form-input ${fields.incidentType ? 'filled' : ''} ${isParsing && currentStep === 0 ? 'active-fill' : ''}`}
                value={fields.incidentType}
                placeholder="Extracting event..."
                disabled
              />
            </div>

            {/* Field 2 */}
            <div className="form-group">
              <label className="form-label">
                Extracted Location
                <span className={`form-field-info ${currentStep >= 2 ? 'show' : ''}`}>AI Extracted</span>
              </label>
              <input
                type="text"
                className={`form-input ${fields.location ? 'filled' : ''} ${isParsing && currentStep === 1 ? 'active-fill' : ''}`}
                value={fields.location}
                placeholder="Extracting location..."
                disabled
              />
            </div>

            {/* Field 3 */}
            <div className="form-group">
              <label className="form-label">
                Structured Description
                <span className={`form-field-info ${currentStep >= 3 ? 'show' : ''}`}>AI Extracted</span>
              </label>
              <textarea
                className={`form-input ${fields.description ? 'filled' : ''} ${isParsing && currentStep === 2 ? 'active-fill' : ''}`}
                value={fields.description}
                placeholder="Synthesizing incident logs..."
                rows={2}
                disabled
              />
            </div>

            {/* Field 4 */}
            <div className="form-group">
              <label className="form-label">
                Urgency Flag
                <span className={`form-field-info ${currentStep >= 4 ? 'show' : ''}`}>AI Extracted</span>
              </label>
              <input
                type="text"
                className={`form-input ${fields.urgency ? 'filled' : ''} ${isParsing && currentStep === 3 ? 'active-fill' : ''}`}
                value={fields.urgency}
                placeholder="Assessing priority..."
                disabled
              />
            </div>

            {/* Conditional Branching Fields */}
            {revealedQuestion && (
              <div className="form-group">
                <label className="form-label">
                  {revealedQuestion.label}
                  <span className="conditional-logic-badge">Rule branch activated</span>
                </label>
                <input
                  type="text"
                  className="form-input filled"
                  style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.02)' }}
                  value={revealedQuestion.value}
                  disabled
                />
              </div>
            )}
          </form>
        </section>
      </main>

      <footer>
        <div className="footer-top">
          <span className="footer-text">Forma AI Framework • 2026 Sandbox Environment</span>
          <div className="tech-badges">
            <span className="tech-badge">
              <span className="dot-indicator active"></span>
              <span>React V19</span>
            </span>
            <span className="tech-badge">
              <span className="dot-indicator active"></span>
              <span>TypeScript</span>
            </span>
            <span className="tech-badge">
              <span className="dot-indicator active"></span>
              <span>Zustand State</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
