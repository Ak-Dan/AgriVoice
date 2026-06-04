# AgriVoice

**An open-source, multimodal AI agronomist for smallholder farmers in Africa.**

AgriVoice brings instant crop disease diagnosis and expert agricultural advice to rural farmers in Nigeria, Kenya, and Ethiopia. By operating entirely over channels farmers already use daily - WhatsApp and USSD - we eliminate the need for new app downloads, smartphone literacy, or high-speed internet.

## The Problem It Solves

Smallholder farmers (managing 0.5 to 5 hectares) are the backbone of African food production, yet they remain severely underserved.

- **Crop Disease Uncertainty:** Farmers often cannot identify a disease until significant damage is done.
- **Lack of Expert Access:** Reaching an agronomist can take 2-4 days and costs money. The crops can't wait.
- **Language Barriers:** Most existing ag-tech tools are in English.
- **Silent Outbreaks:** Diseases spread unnoticed because there's no system to aggregate farmer reports at the village or regional level.

## How It Works

AgriVoice turns a simple WhatsApp number or USSD code into a direct line to an expert.

1. **Farmer Input:** A farmer sends a photo of a sick leaf and a voice message via WhatsApp, or navigates a zero-data USSD menu (`*123#`).
2. **AI Diagnosis:** The multimodal router processes the input. Whisper transcribes the voice note, while an EfficientNet-B0 model diagnoses 38 diseases across 12 crops.
3. **RAG Agronomist:** A LangChain + ChromaDB pipeline pulls specific treatment plans from trusted crop guides, agricultural manuals, bulletins, and market data.
4. **Native Language Reply:** Translation and text-to-speech services return voice and text guidance in local languages such as Hausa, Swahili, and Amharic.
5. **Early Warning:** Every query can be geo-tagged and fed into a disease heatmap, alerting human extension workers to potential outbreaks before they spread.

## Architecture & Tech Stack

This project is built to run on a **$0 infrastructure cost** using free tiers and open-source tooling.

### 1. Farmer Layer

- WhatsApp (Twilio API)
- USSD (Africa's Talking API)

### 2. Routing & AI Core

- Express/Node diagnosis API for the current Week 2 build
- Future FastAPI multimodal input router
- Whisper STT for voice transcription
- EfficientNet-B0 / ONNX computer vision
- Translation and TTS services for native-language replies
- LangChain + ChromaDB for retrieval-augmented agronomy guidance

### 3. Data Layer

- Supabase PostgreSQL + PostGIS for geo-tagging and query logs
- ChromaDB local vector store for agricultural documents
- GitHub Actions for CI

### 4. Admin / Agronomist Dashboard

- React + Leaflet-style dashboard for heatmaps and escalation queues
- Supabase Auth planned for protected admin access

## Week 2 Public Demo

The current public web surface is a temporary demo console for judges and teammates. It is not the final farmer-facing product. The production AgriVoice direction remains WhatsApp, USSD, voice, and local-language support.

For this week's submission, the demo proves:

- The frontend is reachable on the public internet.
- A user can upload a crop image.
- The backend runs model-backed ONNX inference.
- GitHub Actions runs tests on pull requests.

## Setup & Installation

Install dependencies from the repository root:

```bash
npm install
```

Start frontend and backend together:

```bash
npm start
```

Expected local endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

Run individual workspaces:

```bash
npm run start:frontend
npm run start:backend
```

## Model Requirement

The backend expects:

```text
model/model.onnx
model/labels.json
```

`model/labels.json` is tracked in Git. Large binary model artifacts such as `.onnx` files are ignored, so deployment must provide `model/model.onnx` before starting the backend.

For deployment, upload the ONNX model to a stable file host or model registry and set:

```text
MODEL_URL=https://your-model-host/model.onnx
```

Then run:

```bash
npm run setup:model
```

## Deployment Notes

Recommended Week 2 deployment:

- Backend: Render Web Service from the repository root.
- Frontend: Vercel project from the `frontend` folder.

Render backend:

```bash
npm install && npm run setup:model
npm run start -w backend
```

Set `MODEL_URL` in Render so the build step can download `model/model.onnx`.

Vercel frontend:

```bash
npm install
npm run build -w frontend
```

Set this Vercel environment variable to the Render backend URL:

```text
VITE_API_URL=https://your-render-service.onrender.com
```

## WhatsApp Webhook

The backend includes a Twilio WhatsApp webhook:

```text
POST /webhooks/twilio/whatsapp
```

In the Twilio WhatsApp sandbox or Messaging Service settings, set the incoming message webhook to:

```text
https://your-render-service.onrender.com/webhooks/twilio/whatsapp
```

Twilio sends incoming WhatsApp messages as form-encoded webhook requests. If the message includes an image, AgriVoice downloads the first image, runs the same ONNX inference path used by `/infer`, and replies with TwiML.

For private Twilio media downloads, set these Render environment variables:

```text
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

---

*Built to ensure no farmer loses a harvest to a preventable disease.*
