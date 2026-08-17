# Forma AI - AI-Augmented Dynamic Form Engine

Forma AI is an enterprise-grade, AI-powered dynamic form builder and rendering engine designed for InsurTech, healthcare, and workflow automation. It leverages Large Language Models (LLMs) to parse unstructured user input (narratives) and automatically pre-fill structured form fields. Additionally, it dynamically evaluates backend-defined rules to show branching questions based on user inputs.

## Project Architecture

```
forma-ai/
├── backend/            # Express, TypeScript, LangChain (Node LLM Extraction API & Schema Store)
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── services/
│   ├── tsconfig.json
│   └── package.json
└── frontend/           # React, TypeScript, Zustand, Vanilla CSS (Dynamic Form Renderer & UI)
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── components/
    │   ├── store/
    │   └── styles/
    ├── tsconfig.json
    └── package.json
```

## Features

- **LLM Extraction API**: Parses unstructured user narratives (e.g. "I hit a deer yesterday on I-95 in my Honda") and transforms it into structured form inputs.
- **Dynamic Form Renderer**: Generates complex, nested form fields on the fly using standard JSON schemas.
- **Branching Decisions**: Evaluates conditional field-revealing logic in real-time.
- **Zustand State Store**: Manages nested/hierarchical state safely and reactively.
- **Modern UI/UX**: Premium dark mode design with sleek CSS variables and smooth transitions.

## Quick Start (Coming Soon)

1. Clone repository:
   ```bash
   git clone https://github.com/ASIM-05/forma-ai.git
   cd forma-ai
   ```
2. Set up dependencies:
   ```bash
   npm install --workspaces
   ```
3. Run project:
   ```bash
   npm run dev
   ```
