import { useState } from 'react';
import '../styles/LandingPage.css';

interface LandingPageProps {
  onLaunchSimulator: () => void;
}

const STATIC_PRESETS = [
  {
    id: 'water-damage',
    label: '💧 Water Damage',
    narrative: 'Yesterday my basement flooded because the main water line burst. We have 3 inches of standing water and need immediate plumbing repair.',
    result: {
      type: 'Property Claim',
      site: 'Basement / Internal Plumbing',
      severity: 'High/Urgent',
      details: 'Burst water line causing 3 inches of standing water.',
      branchRule: 'Activate Emergency Water Extraction Vendor'
    }
  },
  {
    id: 'medical-consult',
    label: '🩺 Clinic Booking',
    narrative: 'I would like to schedule an appointment with a cardiologist. I have had frequent palpitations and slight shortness of breath when exercising over the past week.',
    result: {
      type: 'Medical Consultation',
      site: 'Cardiology Clinic',
      severity: 'Medium',
      details: 'Palpitations and shortness of breath during exertion for 1 week.',
      branchRule: 'Require Electrocardiogram (ECG) Pre-screening'
    }
  }
];

export default function LandingPage({ onLaunchSimulator }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'architecture' | 'tech'>('features');
  const [sandboxPreset, setSandboxPreset] = useState(STATIC_PRESETS[0]);
  const [sandboxNarrative, setSandboxNarrative] = useState(STATIC_PRESETS[0].narrative);
  const [isSandboxParsing, setIsSandboxParsing] = useState(false);
  const [sandboxFields, setSandboxFields] = useState<typeof STATIC_PRESETS[0]['result'] | null>(STATIC_PRESETS[0].result);
  const [sandboxStep, setSandboxStep] = useState(3); // Fully generated initially

  const handleSelectPreset = (preset: typeof STATIC_PRESETS[0]) => {
    setSandboxPreset(preset);
    setSandboxNarrative(preset.narrative);
    triggerSandboxParse(preset);
  };

  const triggerSandboxParse = (preset: typeof STATIC_PRESETS[0]) => {
    setIsSandboxParsing(true);
    setSandboxFields(null);
    setSandboxStep(0);

    setTimeout(() => {
      setSandboxStep(1);
    }, 450);

    setTimeout(() => {
      setSandboxStep(2);
    }, 900);

    setTimeout(() => {
      setSandboxStep(3);
      setSandboxFields(preset.result);
      setIsSandboxParsing(false);
    }, 1400);
  };

  // Scroll to section helper
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-wrapper">
      {/* Decorative Blur Backdrops */}
      <div className="landing-glow landing-glow-1"></div>
      <div className="landing-glow landing-glow-2"></div>
      <div className="landing-glow landing-glow-3"></div>

      {/* Floating Navbar */}
      <nav className="landing-nav glass">
        <div className="landing-nav-logo">
          <div className="landing-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <span className="logo-brand gradient-accent-text">Forma AI</span>
        </div>

        <ul className="landing-nav-links">
          <li><button onClick={() => scrollToId('features-section')} className="nav-link-btn">Features</button></li>
          <li><button onClick={() => scrollToId('sandbox-section')} className="nav-link-btn">Interactive Demo</button></li>
          <li><button onClick={() => scrollToId('architecture-section')} className="nav-link-btn">Architecture</button></li>
          <li><button onClick={() => scrollToId('tech-section')} className="nav-link-btn">Tech Stack</button></li>
        </ul>

        <div className="nav-actions">
          <button className="btn nav-cta-btn" onClick={onLaunchSimulator}>
            <span>Launch Engine</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero-section">
        <div className="hero-content animate-fade-in">
          <div className="hero-tag">
            <span className="tag-sparkle">✨</span>
            <span>Unstructured Narratives to Structured Forms</span>
          </div>

          <h1 className="hero-main-title">
            The AI-Augmented <br />
            <span className="gradient-accent-text font-glowing">Dynamic Form Engine</span>
          </h1>

          <p className="hero-subtext">
            Forma AI parses complex human stories and documents into rich, schema-compliant JSON forms in real-time. Automatically reveal conditional follow-up logic, validate rules, and eliminate manual entry friction.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-hero-primary" onClick={onLaunchSimulator}>
              <span className="btn-glow-effect"></span>
              <span>Launch Live Simulator</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button className="btn btn-secondary btn-hero-secondary" onClick={() => scrollToId('sandbox-section')}>
              Explore Live Demo
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-num">95%</span>
              <span className="stat-label">Reduction in Manual Filing</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card">
              <span className="stat-num">&lt;1.8s</span>
              <span className="stat-label">LLM Extraction Pipeline</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-card">
              <span className="stat-num">100%</span>
              <span className="stat-label">Dynamic JSON Schema Native</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="hero-visual-card-wrapper animate-fade-in">
          <div className="hero-visual-glass-card glass">
            <div className="visual-header">
              <div className="visual-window-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="visual-title-badge">forma-engine-core.json</div>
            </div>

            <div className="visual-code-grid">
              <div className="code-block-header">AI Extraction Rules Configuration</div>
              <pre className="code-display">
                <code>
{`{
  "engine": "FormaAI-v1.0",
  "rules": [
    {
      "trigger": "narrative_contains('radiator leaking')",
      "action": "reveal_field('car_drivable', 'boolean')",
      "required": true
    },
    {
      "trigger": "severity === 'High'",
      "action": "inject_notice('Immediate inspection required')",
      "priority": 1
    }
  ]
}`}
                </code>
              </pre>
            </div>
            
            <div className="visual-floating-badge-1 glass-card">
              <div className="pulse-indicator-circle"></div>
              <span>Gemini Parsing Active</span>
            </div>
            <div className="visual-floating-badge-2 glass-card">
              <span>Dynamic Rules Injected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Grid of Key Features */}
      <section id="features-section" className="landing-section features-interactive-section">
        <div className="section-header-box">
          <h2 className="section-title-label">Core Capabilities</h2>
          <p className="section-description-text">
            Enterprise-ready features built to handle complex customer workflows and claims processing.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon-box bg-indigo-glow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.758a.98.98 0 00-.323-1.572l-5.63-2.584a.979.979 0 00-1.282.88l-.758 5.753a.98.98 0 001.214 1.082l5.63-2.583" />
              </svg>
            </div>
            <h3>LLM Narrative Extraction</h3>
            <p>Converts raw paragraphs, phone records, or client email submissions into fields with key values validated via Google Gemini API.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-box bg-purple-glow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3>Dynamic JSON Schema Rendering</h3>
            <p>Instantly compile data templates into responsive React UI fields (text inputs, selects, toggles) without server restarts.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-box bg-emerald-glow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3>Conditional Branching Engine</h3>
            <p>Define rules to trigger dynamic follow-ups based on AI data outputs or user actions on prior questions. Keep forms compact and relevant.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-box bg-amber-glow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.168.477-4.5 1.253" />
              </svg>
            </div>
            <h3>Zustand Reactive State</h3>
            <p>Zero-overhead state management keeps form states synchronized, tracking validation logs across multi-stage fields seamlessly.</p>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section id="sandbox-section" className="landing-section sandbox-section-container">
        <div className="section-header-box">
          <h2 className="section-title-label">Interactive Playground</h2>
          <p className="section-description-text">
            Test the AI parser below. Select a preset and see the fields map dynamically on the fly.
          </p>
        </div>

        <div className="sandbox-interface glass">
          <div className="sandbox-control-panel">
            <div className="sandbox-panel-header">
              <span>1. Enter Customer Narrative</span>
              <div className="sandbox-presets">
                {STATIC_PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`sandbox-preset-btn ${sandboxPreset.id === p.id ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(p)}
                    disabled={isSandboxParsing}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="sandbox-textarea"
              value={sandboxNarrative}
              onChange={(e) => setSandboxNarrative(e.target.value)}
              disabled={isSandboxParsing}
              placeholder="Type or customize narrative here..."
            />

            <button
              className="btn btn-primary sandbox-action-btn"
              onClick={() => triggerSandboxParse(sandboxPreset)}
              disabled={isSandboxParsing}
            >
              {isSandboxParsing ? (
                <>
                  <span className="spinner"></span>
                  <span>AI Parsing Narrative...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.758a.98.98 0 00-.323-1.572l-5.63-2.584a.979.979 0 00-1.282.88l-.758 5.753a.98.98 0 001.214 1.082l5.63-2.583" />
                  </svg>
                  <span>Re-parse Prompt Narrative</span>
                </>
              )}
            </button>
          </div>

          <div className="sandbox-output-panel">
            <div className="sandbox-panel-header">
              <span>2. Generated Schema UI Fields</span>
              <span className="schema-badge">Forma schema output</span>
            </div>

            <div className="sandbox-fields-grid">
              {sandboxStep >= 1 ? (
                <div className="sandbox-form-group animate-slide-in">
                  <label>Service Category <span className="ai-extracted-tag">AI-Extracted</span></label>
                  <input
                    type="text"
                    value={sandboxFields?.type || 'Extracting value...'}
                    disabled
                    className="sandbox-input filled-success"
                  />
                </div>
              ) : (
                <div className="sandbox-form-group-skeleton"></div>
              )}

              {sandboxStep >= 2 ? (
                <div className="sandbox-form-group animate-slide-in">
                  <label>Affected Asset / Location <span className="ai-extracted-tag">AI-Extracted</span></label>
                  <input
                    type="text"
                    value={sandboxFields?.site || 'Identifying site...'}
                    disabled
                    className="sandbox-input filled-success"
                  />
                </div>
              ) : (
                <div className="sandbox-form-group-skeleton"></div>
              )}

              {sandboxStep >= 3 ? (
                <>
                  <div className="sandbox-form-group animate-slide-in">
                    <label>Severity Level <span className="ai-extracted-tag">AI-Extracted</span></label>
                    <input
                      type="text"
                      className="sandbox-input filled-success"
                      value={sandboxFields?.severity || ''}
                      disabled
                    />
                  </div>

                  <div className="sandbox-form-group animate-slide-in">
                    <label>Synthesized Issue Log <span className="ai-extracted-tag">AI-Extracted</span></label>
                    <textarea
                      className="sandbox-input filled-success"
                      value={sandboxFields?.details || ''}
                      rows={2}
                      disabled
                    />
                  </div>

                  <div className="sandbox-form-group conditional-group animate-slide-in">
                    <label>Branching Action Required <span className="conditional-branch-tag">Branch Active</span></label>
                    <input
                      type="text"
                      className="sandbox-input conditional-input"
                      value={sandboxFields?.branchRule || ''}
                      disabled
                    />
                  </div>
                </>
              ) : (
                <>
                  {sandboxStep >= 1 && <div className="sandbox-form-group-skeleton"></div>}
                  {sandboxStep >= 2 && <div className="sandbox-form-group-skeleton"></div>}
                </>
              )}

              {isSandboxParsing && (
                <div className="parsing-loader-overlay">
                  <div className="loader-laser"></div>
                  <span className="parsing-text">Retrieving GEMINI Schema Model...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Detail Section */}
      <section id="architecture-section" className="landing-section architecture-section-view">
        <div className="section-header-box">
          <h2 className="section-title-label">System Architecture</h2>
          <p className="section-description-text">
            Forma AI utilizes a decoupled pipeline from narrative ingestion to dynamic client-side rendering.
          </p>
        </div>

        <div className="architecture-tabs-container">
          <div className="architecture-tabs">
            <button className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`} onClick={() => setActiveTab('features')}>1. Ingestion & NLP</button>
            <button className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`} onClick={() => setActiveTab('architecture')}>2. Conditionals Evaluator</button>
            <button className={`tab-btn ${activeTab === 'tech' ? 'active' : ''}`} onClick={() => setActiveTab('tech')}>3. UI Schema Compile</button>
          </div>

          <div className="architecture-tab-content glass-card">
            {activeTab === 'features' && (
              <div className="tab-slide">
                <h3>NLP Extraction Pipeline</h3>
                <p>When the unstructured text is submitted, it lands on the backend endpoints. The Node.js Express server routes the payload to the <strong>Google Gemini API</strong> using structured JSON generation modes, compiling data keys (e.g. location, description, severity flags) without heavy parsing templates.</p>
                <ul className="details-list">
                  <li>🤖 Powered by GenAI structured output parsing schema templates.</li>
                  <li>⚡ Multi-threading safety with atomic response caches.</li>
                  <li>🛡️ Built-in toxicity and sanitization filters prior to analysis.</li>
                </ul>
              </div>
            )}

            {activeTab === 'architecture' && (
              <div className="tab-slide">
                <h3>Dynamic Rules branching engine</h3>
                <p>The schema definition includes embedded rules that run both on the server (for validation) and real-time on the client. If an auto claim registers <code>radiator leaking = Yes</code>, the engine dynamically injects a conditional Boolean response block asking if a towing service is required.</p>
                <ul className="details-list">
                  <li>🔀 Branching logic runs in &lt;1ms inside React context.</li>
                  <li>🔧 Support for nesting schema rules up to 3 levels deep.</li>
                  <li>📓 Easy declarative schema authoring in JSON.</li>
                </ul>
              </div>
            )}

            {activeTab === 'tech' && (
              <div className="tab-slide">
                <h3>Client-Side State Compilation</h3>
                <p>React renders fields based strictly on active JSON schema definitions. Zustand coordinates the complex, nested state changes dynamically. Any change in an entry element executes validation constraints immediately, showing alerts inline without trigger lag.</p>
                <ul className="details-list">
                  <li>📱 Fully responsive layout styling targeting Grid and Flex containers.</li>
                  <li>💾 Zustand stores persist state schemas when fields are added or hidden.</li>
                  <li>💅 Custom styling matching enterprise theme patterns.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tech Stack Grid */}
      <section id="tech-section" className="landing-section tech-stack-section">
        <div className="section-header-box">
          <h2 className="section-title-label font-title">Modern Enterprise Tech-Stack</h2>
          <p className="section-description-text">
            Forma AI relies on state-of-the-art libraries that ensure long-term stability and fast execution.
          </p>
        </div>

        <div className="tech-stack-row">
          <div className="tech-stack-card glass">
            <h4>React 19 & Vite</h4>
            <p>Fast refresh and lightweight hydration using React 19 concurrent features. Vite serves as the zero-config build server.</p>
          </div>
          <div className="tech-stack-card glass">
            <h4>TypeScript</h4>
            <p>Complete static typing across schemas, actions, and backend controllers prevents component data loss.</p>
          </div>
          <div className="tech-stack-card glass">
            <h4>Google Gemini API</h4>
            <p>Advanced LLM queries that instantly parse natural grammar structures into deterministic schema components.</p>
          </div>
          <div className="tech-stack-card glass">
            <h4>Zustand Store</h4>
            <p>Super-reactive, non-bloated client state management. Safely isolates dynamic fields and branching status flags.</p>
          </div>
        </div>
      </section>

      {/* Conversion / Launch CTA Footer Section */}
      <footer className="landing-footer-banner glass-card">
        <div className="footer-cta-container">
          <h2>Ready to experience autonomous form rendering?</h2>
          <p>Launch the interactive runtime simulator to test customizable templates and claim scenarios step-by-step.</p>
          <button className="btn btn-primary footer-cta-btn" onClick={onLaunchSimulator}>
            <span>Launch Runtime Simulator Now</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
        <div className="footer-credits">
          <span className="footer-tagline">Forma AI Platform • Developed for Enterprise Workflows</span>
          <span className="footer-copy">© 2026 Sandbox Environment. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
