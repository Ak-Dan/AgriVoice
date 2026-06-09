# AgriVoice LangChain + Chroma RAG Pipeline

AgriVoice now has two retrieval modes:

- Local markdown fallback: always available, reads `knowledge/disease_guides`.
- LangChain + Chroma: vector retrieval over the same disease guides, enabled when Chroma is configured.

The backend never invents treatment guidance. It retrieves source-backed markdown, then returns only the reviewed guidance, source name, and source URL.

## Local Chroma Setup

Start Chroma in one terminal.

Recommended on Windows:

```bash
docker run -p 8000:8000 chromadb/chroma
```

On macOS/Linux, or inside WSL/Python environments with the Chroma CLI installed:

```bash
chroma run --path ./chroma-data
```

In a second terminal, ingest the markdown corpus:

```bash
npm run rag:ingest
```

Then start the backend with Chroma enabled:

```bash
RAG_BACKEND=chroma CHROMA_URL=http://localhost:8000 npm run start:backend
```

On PowerShell:

```powershell
$env:RAG_BACKEND="chroma"
$env:CHROMA_URL="http://localhost:8000"
npm run start:backend
```

## Environment Variables

- `RAG_BACKEND=chroma` enables the LangChain/Chroma retriever.
- `CHROMA_URL` points to the Chroma server. Default for ingestion is `http://localhost:8000`.
- `CHROMA_COLLECTION` overrides the collection name. Default is `agrivoice_disease_guides`.

If Chroma is not enabled or is unavailable, `/infer` and WhatsApp replies fall back to local markdown retrieval instead of failing.

## Deployment Notes

For Render, Fly.io, Railway, or another hosted environment:

1. Run Chroma as a separate service or use a hosted Chroma-compatible endpoint.
2. Run `npm run rag:ingest` against that endpoint after the Chroma service is reachable.
3. Set backend env vars:
   - `RAG_BACKEND=chroma`
   - `CHROMA_URL=<your Chroma service URL>`
   - `CHROMA_COLLECTION=agrivoice_disease_guides`

The public demo can still run without Chroma; it will use the markdown fallback until the vector service is ready.

## References

- Chroma server: https://docs.trychroma.com/docs/cli/run
- Chroma Docker deployment: https://docs.trychroma.com/deployment/docker
- LangChain JS Chroma integration: https://docs.langchain.com/oss/javascript/integrations/vectorstores/chroma
