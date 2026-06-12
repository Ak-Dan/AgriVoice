# Backend Hardening

AgriVoice now includes basic production controls for the public backend.

## What Is Implemented

- Request IDs on every response through `X-Request-Id`.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.
- Rate limiting for `/infer` and `/webhooks/twilio/whatsapp`.
- Bounded inference queue so concurrent uploads do not stampede the ONNX session.
- API-key protected admin metrics at `/admin/metrics`.
- Public health check at `/health`.
- Structured 404 and 500 responses with request IDs.

## Environment Variables

- `ADMIN_API_KEY`: required to access `/admin/metrics`.
- `INFER_RATE_LIMIT_MAX`: max `/infer` requests per minute per client. Default: `30`.
- `TWILIO_RATE_LIMIT_MAX`: max Twilio webhook requests per minute per client. Default: `60`.
- `INFERENCE_CONCURRENCY`: number of model inference jobs allowed at once. Default: `1`.
- `INFERENCE_MAX_QUEUE`: maximum pending inference jobs before returning 503. Default: `25`.
- `MAX_UPLOAD_BYTES`: max uploaded image size. Default: `6291456`.

## Admin Metrics

```bash
curl -H "x-admin-api-key: <ADMIN_API_KEY>" https://<backend-host>/admin/metrics
```

The response includes uptime, request counters, rate-limit hits, failure counters, and queue stats.
