# SimiliaScribe

A voice-driven ambient case-taking prototype for homeopathic consultations,
built as a standalone buildathon extension of **Homeologic**'s Similia.ai
repertorization feature.

Record (or upload) a doctor-patient conversation → get a local, multilingual
transcript → structured case fields → a diagnosis + repertorial chart with a
remedy suggestion. Fully local: no API keys, no cloud calls, patient audio
never leaves the machine.

## Prerequisites

- Node.js 20+ (this project was built against v22 via `nvm`)
- [Ollama](https://ollama.com) running locally with a model pulled, e.g.:
  ```
  ollama pull medgemma1.5:4b
  ```
- `ffmpeg` on your `PATH` (used to normalize recorded/uploaded audio)

No API keys are required for the default setup — speech-to-text (Whisper, via
`@huggingface/transformers`) and the LLM (MedGemma, via Ollama) both run
locally.

**Optional cloud fallbacks.** Local CPU-only inference can be slow on a
loaded machine. Click the settings (⚙) button in the header for two
independent provider choices, each with its own API key field (stored only
in your browser's `localStorage`, sent straight through to the provider on
each request, never written to disk or `.env`):

- **Speech-to-text:** Local (Whisper) or **Sarvam** (`saaras:v3`, cloud) —
  Sarvam is purpose-built for Indian languages and likely to beat Whisper on
  Hindi/Tamil accuracy, plus it's not competing for your CPU. Sarvam's REST
  API caps audio at 30s/request; longer recordings are automatically chunked
  and the transcripts concatenated.
- **Extraction + diagnosis:** Local (MedGemma) or **OpenAI** (defaults to
  `gpt-4o-mini`).

## Setup

```bash
npm install
cp .env.example .env.local   # defaults already match a stock local Ollama install
npm run dev
```

Open http://localhost:3000. The first transcription request will download
the Whisper model weights (`Xenova/whisper-small`, ~250MB) and cache them
under `.cache/` — expect that first call to be slow; subsequent calls are
fast.

**Before a live demo:** MedGemma (4.3GB, CPU-only) is genuinely slow under
system load — 30s-2min per call is normal, but it degrades further if the
machine is under contention (observed 5+ min with Docker Desktop's VM and a
heavy browser/IDE running alongside). Close Docker Desktop and other
heavy background apps, and run one throwaway extract+diagnose call ahead of
time to warm the model into memory (`keepAlive` is set to 30 minutes, so it
stays resident between the demo's actual calls).

## How it works

1. **Vitals** (sidebar, always visible/editable) — height, weight, temp, BP,
   pulse, respiratory rate. Entered manually since these are
   instrument-measured, not spoken.
2. **Consultation Capture** — record live via the browser mic, or upload a
   file. Transcribed locally with a multilingual Whisper model in
   *translate* mode, so Hindi/Tamil/English (and code-switched mixes) all
   come out as English text.
3. **Extracted Case Details** — MedGemma (via Ollama), constrained to a Zod
   schema mirroring HomeoAI's real `Consultation` shape, extracts chief
   complaints, complaint details, and assessment fields from the transcript.
   Fully editable.
4. **Diagnosis & Repertorial Suggestion** — MedGemma again, producing a
   provisional/final diagnosis, treatment plan, follow-up/notes, and a
   rubric × remedy grading chart with a ranked suggestion.

## Project structure

```
src/lib/schema.ts     Zod schemas mirroring HomeoAI's production data model
src/lib/audio.ts       ffmpeg normalization + WAV decode
src/lib/whisper.ts      local multilingual speech-to-text (transformers.js)
src/lib/ollama.ts       MedGemma structured extraction + diagnosis (LangChain.js)
src/app/api/*/route.ts  API routes wiring the above together
src/components/*        UI (vitals card, recorder, case form, results/chart)
```
