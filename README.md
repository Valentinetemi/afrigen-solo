# AfriGen - African Synthetic Data Infrastructure

> AfriGen is a synthetic data infrastructure platform for African ML engineers, designed to generate, govern, and validate high-fidelity datasets grounded in real-world statistics.

## AfriGen Demo[https://youtu.be/nggaI87IDts]

## 🌐 Live Demo [https://afrigen-gtht.onrender.com](https://afrigen-gtht.onrender.com)

> Note: First load may take 30–60 seconds (Render free tier spins down when inactive).
> For full OpenMetadata catalog integration, run locally with your own instance.

## 🌍 The Problem

African machine learning engineers face a critical data gap. There is almost no 
quality training data that reflects African contexts. Our health systems, demographics,
languages, and realities. Models trained on Western data consistently underperform 
when deployed in Africa.

AfriGen fixes this.

## 🧠 What AfriGen Does

AfriGen transforms real-world African statistics into validated, production-ready synthetic datasets for machine learning.

It uses World Health Organization (WHO) Global Health Observatory and World Bank data to ground Gemini AI generation in real statistical distributions, ensuring outputs reflect actual African health and demographic realities instead of random synthetic patterns.

Each dataset is then scored for statistical fidelity, automatically registered in OpenMetadata with full lineage and schema tracking, and made discoverable through a live catalog.

Before any dataset reaches a training pipeline, it passes through a data quality layer that checks completeness, detects anomalies, scans for sensitive data, and evaluates model readiness with AI-assisted recommendations.

## 🏗️ Architecture
WHO API + World Bank API

↓

Ground Truth Statistics

↓

Gemini AI
(generates synthetic rows
matching real distributions)

↓

Fidelity Scoring Engine

↓

OpenMetadata Catalog
(schema + lineage + governance)

↓

AfriGen UI
(generate, validate, download)

## 🔬 How Fidelity Scoring Works

Every generated dataset is scored 0–100 using a two-layer algorithm:

**Layer 1 — Gemini AI Evaluation (80% of score)**

Gemini evaluates 50 randomly sampled rows against 4 criteria:
- Feature relationship coherence - do the columns make sense together? (40 pts)
- Realistic distributions - are values varied, not uniform or random? (30 pts)  
- Risk factor consistency - do risk indicators align logically? (20 pts)
- Logical coherence - are there contradictions across rows? (10 pts)

**Layer 2 - Completeness Check (20% of score)**

A statistical completeness function scans every cell in the full dataset:

```typescript
function getCompleteness(csv: string) {
  const rows = csv.split('\n').filter(Boolean)
  let total = 0
  let filled = 0
  rows.forEach(r => {
    r.split(',').forEach(cell => {
      total++
      if (cell.trim() !== '') filled++
    })
  })
  return (filled / total) * 100
}
```

**Final Score Formula:**
finalScore = (0.8 × GeminiScore) + (0.2 × completenessScore)

This penalizes missing values even when AI-evaluated rows look good.

## 📊 WHO + World Bank Data Grounding

Before Gemini generates a single row, AfriGen fetches real statistics for the 
requested country and domain from:

- **WHO Global Health Observatory** - disease prevalence, mortality rates, 
  health indicators
- **World Bank Open Data** - population statistics, demographic distributions, 
  economic indicators

These real statistics become ground truth constraints passed directly to Gemini 
as part of the generation prompt. This is what separates AfriGen from a random 
data generator, every synthetic row is anchored to real African data.

## 🗂️ OpenMetadata Integration

AfriGen uses OpenMetadata as its core governance layer via the REST API.

Every generated dataset is automatically:

- Registered as a **Table Entity** under the `afrigen-synthetic` Database Service
- Given full **column schema** with data types and descriptions
- Tagged with **Tier3 governance tag**
- Stored with a complete **description** including domain, country, fidelity score,
  and the exact prompt used to generate it
- Tracked with **lineage** - the Gemini AI Generator pipeline is registered as the 
  source, with an edge connecting it to every output table
- Discoverable in the **AfriGen Catalog** which pulls live from OpenMetadata API

### OpenMetadata Entity Structure

Database Service: afrigen-synthetic (CustomDatabase)
  Database: default
    Schema: synthetic_datasets
      - healthcare_dataset__nigeria (Table)
      - malaria_dataset__kano (Table)
      - ...

Pipeline Service: afrigen-pipelines (CustomPipeline)
  Pipeline: gemini-generator
    Outputs:
      - healthcare_dataset__nigeria (Lineage Edge)
      - malaria_dataset__kano (Lineage Edge)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| AI Generation | Google Gemini AI (gemini-flash-latest) |
| Data Sources | WHO Global Health Observatory, World Bank Open Data |
| Governance | OpenMetadata REST API v1 |
| Streaming | Next.js Route Handlers with ReadableStream |

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- Docker Desktop (for OpenMetadata)
- Gemini API Key - [get one free here](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/[your-username]/afrigen.git
cd afrigen
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
OPENMETADATA_URL=http://localhost:8585
OPENMETADATA_TOKEN=your_openmetadata_bot_token_here
```

### 4. Start OpenMetadata locally

```bash
cd afrigen-data-platform
docker compose -f docker-compose.yml up --detach
```

Wait 7-8 minutes for all containers to start, then open:
**http://localhost:8585** - login with `admin@open-metadata.org` / `admin`

Get your bot token:
- Go to **Settings → Bots → ingestion-bot → copy the JWT token**
- Paste it as `OPENMETADATA_TOKEN` in your `.env.local`

### 5. Initialize the OpenMetadata catalog

```bash
# Start the app first
npm run dev

# Then visit this URL once to create the service, database and schema
http://localhost:3000/api/setup-om
```

### 6. You're ready
http://localhost:3000

Generate your first African dataset. Watch it appear in OpenMetadata automatically.

## 🌟 What Makes AfriGen Different

- Not just a data generator - It is a full **data infrastructure platform**
- Real statistics from **WHO and World Bank** ground every dataset
- **Automatic governance** - every dataset is cataloged, tagged, and lineage-tracked
- **Fidelity scoring** tells you exactly how trustworthy your data is before training
- Built specifically for **African ML engineers** who have been underserved by 
  existing tools.

## 📄 License

MIT - built with ❤️ for Africa
