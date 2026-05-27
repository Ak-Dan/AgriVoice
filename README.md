<<<<<<< HEAD
#Agrivoice

A mobile web app that lets farmers photograph a diseased crop leaf and receive an instant AI diagnosis with treatment advice, in English or Swahili.

## Run Locally

From the repository root, install dependencies for the workspace:

```bash
npm install
```

Start both the frontend and backend together:

```bash
npm start
```

Expected local endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Run Individual Workspaces

If you want to start each app separately, use these commands from the repository root:

```bash
npm run start:frontend
npm run start:backend
```

## Backend Model Requirement

The backend depends on a local ONNX model file at `model/model.onnx`.
=======
# AgriVoice

**An open-source, multimodal AI agronomist for smallholder farmers in Africa.**

AgriVoice brings instant crop disease diagnosis and expert agricultural advice to rural farmers in Nigeria, Kenya, and Ethiopia. By operating entirely over channels farmers already use daily—WhatsApp and USSD—we eliminate the need for new app downloads, smartphone literacy, or high-speed internet. 

## The Problem It Solves

Smallholder farmers (managing 0.5 to 5 hectares) are the backbone of African food production, yet they remain severely underserved.
* **Crop Disease Uncertainty:** Farmers often cannot identify a disease until significant damage is done.
* **Lack of Expert Access:** Reaching an agronomist can take 2–4 days and costs money. The crops can't wait.
* **Language Barriers:** Most existing ag-tech tools are in English. 
* **Silent Outbreaks:** Diseases spread unnoticed because there's no system to aggregate farmer reports at the village or regional level.

## How It Works

AgriVoice turns a simple WhatsApp number or USSD code into a direct line to an expert. 

1. **Farmer Input:** A farmer sends a photo of a sick leaf and a voice message via WhatsApp, or navigates a zero-data USSD menu (*123#).
2. **AI Diagnosis:** The multimodal router processes the input. Whisper transcribes the voice note, while an EfficientNet-B0 model (trained on 54,000+ images) diagnoses 38 diseases across 12 crops with >90% accuracy.
3. **RAG Agronomist:** A LangChain + ChromaDB pipeline powered by Claude Haiku pulls specific treatment plans from IITA crop guides, FAO manuals, FMARD bulletins, and AgroMall prices.
4. **Native Language Reply:** Using Meta's NLLB-200 and Coqui TTS, the system sends back a voice note and text diagnosis in Hausa, Swahili, or Amharic.
5. **Early Warning:** Every query is geo-tagged and fed into a Leaflet.js disease heatmap, alerting human extension workers to potential outbreaks before they spread. If the AI is <70% confident, the case is automatically escalated to a human agronomist.

## Architecture & Tech Stack

This project is built to run on a **$0 infrastructure cost** using free tiers and open-source tooling.

**1. Farmer Layer:**
* WhatsApp (Twilio API)
* USSD (Africa's Talking API)

**2. Routing & AI Core (Hosted on Render.com free tier):**
* FastAPI (Multimodal Input Router)
* Whisper STT (Hausa, Swahili, Amharic)
* EfficientNet-B0 (ONNX computer vision)
* Meta NLLB-200 (Translation)
* Coqui TTS (Voice generation)
* LangChain & Claude Haiku (RAG brains)

**3. Data Layer:**
* Supabase (PostgreSQL + PostGIS for geo-tagging and query logs)
* ChromaDB (Local vector store for agricultural documents)
* GitHub Actions (CI/CD)

**4. Admin / Agronomist Dashboard:**
* React & Leaflet.js (Web/PWA for heatmap and escalation queue)
* Supabase Auth

## Setup & Installation



---
*Built to ensure no farmer loses a harvest to a preventable disease.*
>>>>>>> 6f76192e5a0f16fa84ecf0c8cb9fe41a2fcacac3
