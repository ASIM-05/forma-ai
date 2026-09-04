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
    id: 'water-leak',
    label: '🌊 Commercial Water Leak',
    narrative: 'A heavy water pipe burst on the 3rd floor of our commercial office building in Chicago, causing water to cascade down into the 2nd floor server room.',
    fields: {
      incidentType: 'Water Damage',
      location: 'Commercial Office Tower, Chicago',
      description: 'Pipe burst on 3rd floor leaking water into 2nd floor server room.',
      urgency: 'High'
    },
    revealedQuestion: {
      label: 'Has water source been stopped and isolated?',
      value: 'Yes (Main shutoff valve closed)'
    }
  },
  {
    id: 'storefront-burglary',
    label: '🔒 Storefront Burglary',
    narrative: 'Our storefront glass window in downtown Boston was smashed over the weekend. Laptops, camera gear, and retail inventory were stolen. Police report #4920 filed.',
    fields: {
      incidentType: 'Theft/Burglary',
      location: 'Downtown Storefront, Boston',
      description: 'Smashed glass window entry. Stolen electronics and retail inventory.',
      urgency: 'Medium'
    },
    revealedQuestion: {
      label: 'Was a police report filed and documented?',
      value: 'Yes (Report #4920)'
    }
  },
  {
    id: 'slip-fall-injury',
    label: '⚠️ Liability / Slip & Fall',
    narrative: 'A customer slipped on an uncleaned liquid spill in Aisle 4 of our grocery store and injured their knee. No warning sign was posted.',
    fields: {
      incidentType: 'Liability/Injury',
      location: 'Aisle 4, Grocery Store',
      description: 'Customer slipped on wet liquid spill causing knee injury.',
      urgency: 'High'
    },
    revealedQuestion: {
      label: 'Did the incident occur on public property?',
      value: 'No (Private retail premises)'
    }
  },
  {
    id: 'health-intake',
    label: '⚕️ Medical Intake',
    narrative: 'I need to schedule a consultation. I have been suffering from acute lower back pain for the past three weeks. It becomes severe when I sit down.',
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
  const [view, setView] = useState<'landing' | 'simulator' | 'history'>('landing');
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

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('http://localhost:5000/api/extractions');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('[Forma AI Client] Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Analytics state
  const [analytics, setAnalytics] = useState<{
    totalExtractions: number;
    urgencyCounts: { High: number; Medium: number; Low: number };
    categoryCounts: Record<string, number>;
    topCategory: string;
  } | null>(null);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error('[Forma AI Client] Error fetching analytics:', e);
    }
  };

  useEffect(() => {
    if (view === 'history') {
      fetchHistory();
      fetchAnalytics();
    }
  }, [view]);

  // Gemini health status
  const [geminiActive, setGeminiActive] = useState(false);

  useEffect(() => {
    const checkGeminiStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          const data = await response.json();
          setGeminiActive(!!data.geminiActive);
        }
      } catch (error) {
        console.error('[Forma AI Client] Error checking Gemini server status:', error);
      }
    };
    checkGeminiStatus();
  }, []);

  // CSV and JSON export helpers
  const exportToCSV = () => {
    if (history.length === 0) return;
    const headers = ['ID', 'Incident Type', 'Location', 'Description', 'Urgency', 'Revealed Question Label', 'Revealed Question Value', 'Created At'];
    const rows = history.map(row => [
      `"${row._id || ''}"`,
      `"${(row.incidentType || '').replace(/"/g, '""')}"`,
      `"${(row.location || '').replace(/"/g, '""')}"`,
      `"${(row.description || '').replace(/"/g, '""')}"`,
      `"${(row.urgency || '').replace(/"/g, '""')}"`,
      `"${(row.revealedQuestion?.label || '').replace(/"/g, '""')}"`,
      `"${(row.revealedQuestion?.value || '').replace(/"/g, '""')}"`,
      `"${row.createdAt || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `forma_ai_extractions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (history.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `forma_ai_extractions_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manual schema ingestion state
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);

  // Search & Filtering State for Ingested Claims
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [highUrgencyOnly, setHighUrgencyOnly] = useState(false);

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      (item.incidentType && item.incidentType.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.originalNarrative && item.originalNarrative.toLowerCase().includes(q));

    const matchesCategory =
      categoryFilter === 'All' || item.incidentType === categoryFilter;

    const matchesUrgency = !highUrgencyOnly || item.urgency === 'High';

    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const handleManualIngest = async () => {
    setIsIngesting(true);
    setIngestSuccess(false);
    try {
      const response = await fetch('http://localhost:5000/api/extractions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalNarrative: narrative,
          incidentType: fields.incidentType,
          location: fields.location,
          description: fields.description,
          urgency: fields.urgency,
          revealedQuestion
        })
      });

      if (response.ok) {
        setIngestSuccess(true);
        // Refresh history and analytics
        await fetchHistory();
        await fetchAnalytics();
        // Hide success message after 4s
        setTimeout(() => setIngestSuccess(false), 4000);
      } else {
        console.error('[Forma AI Client] Failed to ingest claims manually.');
      }
    } catch (e) {
      console.error('[Forma AI Client] Error during manual schema ingestion:', e);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPresetId(preset.id);
    setNarrative(preset.narrative);
    handleExtract(preset.narrative);
  };

  const handleExtract = async (text: string) => {
    setIsParsing(true);
    setCurrentStep(0);
    setIngestSuccess(false);
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
        fetchHistory(); // Refresh history cache after extraction
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
          
          <button 
            onClick={() => setView(view === 'simulator' ? 'history' : 'simulator')}
            className={`preset-pill ${view === 'history' ? 'active' : ''}`}
            style={{ 
              background: view === 'history' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)', 
              color: 'white',
              border: view === 'history' ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.06)'
            }}
          >
            {view === 'history' ? '⚡ Active Simulator' : '📓 Extraction History'}
          </button>

          <div className="tech-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: geminiActive ? '#10b981' : '#f59e0b',
              boxShadow: geminiActive ? '0 0 6px #10b981' : '0 0 6px #f59e0b'
            }}></span>
            <span>{geminiActive ? 'Gemini AI Engine: Active' : 'Gemini AI: Simulated'}</span>
          </div>
        </div>
      </header>

      {view === 'simulator' ? (
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
                  onChange={(e) => setFields({ ...fields, incidentType: e.target.value })}
                  placeholder="Extracting event..."
                  disabled={isParsing || currentStep === 0}
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
                  onChange={(e) => setFields({ ...fields, location: e.target.value })}
                  placeholder="Extracting location..."
                  disabled={isParsing || currentStep < 2}
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
                  onChange={(e) => setFields({ ...fields, description: e.target.value })}
                  placeholder="Synthesizing incident logs..."
                  rows={2}
                  disabled={isParsing || currentStep < 3}
                />
              </div>

              {/* Field 4 */}
              <div className="form-group">
                <label className="form-label">
                  Urgency Flag
                  <span className={`form-field-info ${currentStep >= 4 ? 'show' : ''}`}>AI Extracted</span>
                </label>
                <select
                  className={`form-input ${fields.urgency ? 'filled' : ''} ${isParsing && currentStep === 3 ? 'active-fill' : ''}`}
                  value={fields.urgency}
                  onChange={(e) => setFields({ ...fields, urgency: e.target.value })}
                  disabled={isParsing || currentStep < 4}
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <option value="" disabled style={{ background: '#1e293b' }}>Assessing priority...</option>
                  <option value="Low" style={{ background: '#1e293b' }}>Low</option>
                  <option value="Medium" style={{ background: '#1e293b' }}>Medium</option>
                  <option value="High" style={{ background: '#1e293b' }}>High</option>
                </select>
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
                    onChange={(e) => setRevealedQuestion(prev => prev ? { ...prev, value: e.target.value } : null)}
                    disabled={isParsing || currentStep < 4}
                  />
                </div>
              )}

              {/* Conditional Ingest Button */}
              {currentStep >= 4 && !isParsing && (
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: '1px solid #10b981' }}
                    onClick={handleManualIngest}
                    disabled={isIngesting}
                  >
                    {isIngesting ? 'Ingesting Record...' : '✅ Confirm & Ingest Claim'}
                  </button>
                  {ingestSuccess && (
                    <span style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', fontWeight: 'bold' }}>
                      <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                      Claim ingested into database cache successfully!
                    </span>
                  )}
                </div>
              )}
            </form>
          </section>
        </main>
      ) : (
        <main className="main-content-history" style={{ width: '100%', maxWidth: '1200px', zIndex: 2, padding: '1rem 0' }}>
          <section className="glass-card history-container animate-fade-in" style={{ width: '100%', minHeight: '520px', padding: '2rem' }}>
            <div className="preview-header" style={{ marginBottom: '1.5rem', justifyContent: 'space-between', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="section-title">Ingested Claims Database</span>
                <p className="hero-description" style={{ fontSize: '0.9rem', margin: '0.4rem 0 0 0' }}>
                  Real-time database of parsed unstructured text narratives and synthesized JSON form schemas.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={exportToCSV}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                  disabled={history.length === 0}
                  title="Download Claims as CSV Spreadsheet"
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={exportToJSON}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                  disabled={history.length === 0}
                  title="Download Raw Claims as JSON"
                >
                  📄 Export JSON
                </button>
                <button 
                  onClick={() => { fetchHistory(); fetchAnalytics(); }} 
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  disabled={isLoadingHistory}
                >
                  {isLoadingHistory ? 'Refreshing...' : '🔄 Sync Database'}
                </button>
              </div>
            </div>

            {/* KPI Analytics Summary Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  📊
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Ingested Claims</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.2rem' }}>{analytics?.totalExtractions || history.length}</div>
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  🚨
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Urgency Alerts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444', marginTop: '0.2rem' }}>
                    {analytics ? analytics.urgencyCounts.High : history.filter(h => h.urgency === 'High').length}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  🏷️
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Claim Category</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.2rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                    {analytics?.topCategory || 'Auto Accident'}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Urgency Distribution Bar Card */}
            {history.length > 0 && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgency Level Distribution</span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                    High: {history.filter(h => h.urgency === 'High').length} | Medium: {history.filter(h => h.urgency === 'Medium').length} | Low: {history.filter(h => h.urgency === 'Low').length}
                  </span>
                </div>
                <div style={{ height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
                  <div
                    style={{
                      width: `${(history.filter(h => h.urgency === 'High').length / (history.length || 1)) * 100}%`,
                      background: '#ef4444',
                      transition: 'width 0.4s ease'
                    }}
                    title="High Urgency"
                  />
                  <div
                    style={{
                      width: `${(history.filter(h => h.urgency === 'Medium').length / (history.length || 1)) * 100}%`,
                      background: '#f59e0b',
                      transition: 'width 0.4s ease'
                    }}
                    title="Medium Urgency"
                  />
                  <div
                    style={{
                      width: `${(history.filter(h => h.urgency === 'Low').length / (history.length || 1)) * 100}%`,
                      background: '#10b981',
                      transition: 'width 0.4s ease'
                    }}
                    title="Low Urgency"
                  />
                </div>
              </div>
            )}

            {/* Real-Time Search & Category Filter Toolbar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 280px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Search claims by keyword, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 1rem', fontSize: '0.9rem', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-input"
                  style={{ background: '#1e293b', color: 'white', padding: '0.65rem 1rem', fontSize: '0.85rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <option value="All">All Categories</option>
                  <option value="Auto Accident">Auto Accident</option>
                  <option value="Fire/Smoke Damage">Fire/Smoke Damage</option>
                  <option value="Water Damage">Water Damage</option>
                  <option value="Theft/Burglary">Theft/Burglary</option>
                  <option value="Liability/Injury">Liability/Injury</option>
                  <option value="Clinical consultation">Clinical consultation</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setHighUrgencyOnly(!highUrgencyOnly)}
                className="btn"
                style={{
                  background: highUrgencyOnly ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: highUrgencyOnly ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: highUrgencyOnly ? '#ef4444' : 'var(--text-secondary)',
                  padding: '0.65rem 0.9rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: highUrgencyOnly ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                🚨 High Urgency Only {highUrgencyOnly ? '✓' : ''}
              </button>
            </div>

            {isLoadingHistory ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
                <span className="spinner"></span>
                <span style={{ color: 'var(--text-secondary)' }}>Retrieving schema records from backend...</span>
              </div>
            ) : history.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <span style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1rem' }}>No extraction records found.</span>
                <button 
                  onClick={() => setView('simulator')} 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                >
                  Run First Extraction
                </button>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>🔍</span>
                <span style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>No claims matched your search or category filter.</span>
                <button
                  onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }}
                  className="btn btn-secondary"
                  style={{ marginTop: '0.8rem', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="history-table-wrapper" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '1rem' }}>Category</th>
                      <th style={{ padding: '1rem' }}>Extracted Location</th>
                      <th style={{ padding: '1rem' }}>Urgency</th>
                      <th style={{ padding: '1rem' }}>Branch Rule Question</th>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th style={{ padding: '1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => {
                      const isExpanded = expandedHistoryId === item._id;
                      const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      // Tag classes mapping
                      let borderClass = 'rgba(255,255,255,0.06)';
                      let tagColor = '#818cf8';
                      let tagBg = 'rgba(129, 140, 248, 0.1)';
                      if (item.incidentType?.toLowerCase().includes('auto')) {
                        tagColor = '#f43f5e';
                        tagBg = 'rgba(244, 63, 94, 0.1)';
                        borderClass = 'rgba(244,63,94,0.2)';
                      } else if (item.incidentType?.toLowerCase().includes('fire') || item.incidentType?.toLowerCase().includes('smoke')) {
                        tagColor = '#f59e0b';
                        tagBg = 'rgba(245, 158, 17, 0.1)';
                        borderClass = 'rgba(245,158,17,0.2)';
                      } else if (item.incidentType?.toLowerCase().includes('clinic') || item.incidentType?.toLowerCase().includes('medi')) {
                        tagColor = '#10b981';
                        tagBg = 'rgba(16, 185, 129, 0.1)';
                        borderClass = 'rgba(16,185,129,0.2)';
                      }

                      return (
                        <>
                          <tr 
                            key={item._id} 
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.05)', 
                              cursor: 'pointer',
                              background: isExpanded ? 'rgba(255,255,255,0.015)' : 'transparent',
                              transition: 'background 0.2s ease'
                            }}
                            onClick={() => setExpandedHistoryId(isExpanded ? null : item._id)}
                          >
                            <td style={{ padding: '1.2rem 1rem' }}>
                              <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', color: tagColor, background: tagBg, border: `1px solid ${borderClass}`, fontWeight: 600 }}>
                                {item.incidentType || 'General'}
                              </span>
                            </td>
                            <td style={{ padding: '1.2rem 1rem', color: 'white', fontWeight: 500 }}>
                              {item.location || 'Unknown'}
                            </td>
                            <td style={{ padding: '1.2rem 1rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: item.urgency === 'High' ? 'var(--accent-high)' : item.urgency === 'Medium' ? 'var(--accent-medium)' : 'var(--accent-low)', fontWeight: 600 }}>
                                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                                {item.urgency || 'Low'}
                              </span>
                            </td>
                            <td style={{ padding: '1.2rem 1rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.originalNarrative}
                            </td>
                            <td style={{ padding: '1.2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {formattedDate}
                            </td>
                            <td style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>
                              <button 
                                className="preset-pill" 
                                style={{ 
                                  background: isExpanded ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', 
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.5rem',
                                  border: '1px solid rgba(255,255,255,0.06)'
                                }}
                              >
                                {isExpanded ? 'Collapse' : 'Details'}
                              </button>
                            </td>
                          </tr>
                          
                          {isExpanded && (
                            <tr style={{ background: 'rgba(0,0,0,0.1)' }}>
                              <td colSpan={6} style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                  <div style={{ flex: 1.2, minWidth: '300px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Raw Narrated Input</span>
                                    <blockquote style={{ margin: '0.5rem 0 0 0', padding: '1rem', background: 'rgba(15, 23, 42, 0.4)', borderLeft: '3px solid var(--accent-primary)', borderRadius: '0 8px 8px 0', color: 'white', lineHeight: '1.5', fontStyle: 'italic', fontSize: '0.92rem' }}>
                                      "{item.originalNarrative}"
                                    </blockquote>
                                  </div>
                                  
                                  <div style={{ flex: 0.8, minWidth: '350px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Extracted JSON Form Schema</span>
                                    <pre style={{ margin: '0.5rem 0 0 0', padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: '#38bdf8', overflowX: 'auto', fontSize: '0.85rem' }}>
                                      <code>
                                        {JSON.stringify({
                                          incidentType: item.incidentType,
                                          location: item.location,
                                          description: item.description,
                                          urgency: item.urgency,
                                          ...(item.revealedQuestion ? { revealedQuestion: item.revealedQuestion } : {})
                                        }, null, 2)}
                                      </code>
                                    </pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      )}

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
