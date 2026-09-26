import { ChatOllama } from "@langchain/ollama";
import { Agent } from "undici";
import { ExtractedCaseSchema, DiagnosisResultSchema, type ExtractedCase, type DiagnosisResult } from "./schema";
import { EXTRACTION_SYSTEM_PROMPT, DIAGNOSIS_SYSTEM_PROMPT, buildCaseText, type DiagnoseInput } from "./prompts";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "medgemma1.5:4b";

// Node's built-in fetch (undici under the hood) defaults to a 5-minute
// headers timeout — i.e. it aborts if no response has started arriving
// within 5 minutes. A local 4B model on a contended CPU can genuinely take
// longer than that for one non-streaming structured-output call, so this
// call needs its own dispatcher with a much longer allowance.
const longTimeoutAgent = new Agent({ headersTimeout: 15 * 60 * 1000, bodyTimeout: 15 * 60 * 1000 });
function longTimeoutFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, dispatcher: longTimeoutAgent } as RequestInit);
}

function makeModel(numPredict: number) {
  return new ChatOllama({
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL,
    temperature: 0,
    // Keep the 4.3GB model resident between calls — reloading it from disk
    // between the extract and diagnose steps (Ollama's default 5min idle
    // unload) is a bigger latency risk during a live demo than the RAM cost.
    keepAlive: "30m",
    fetch: longTimeoutFetch,
    // Our prompts are short (well under 1k tokens) — Ollama's default 4096
    // context allocates a much bigger KV-cache than we need, which costs
    // real time and memory on a CPU-only, memory-constrained machine.
    numCtx: 2048,
    // Hard ceiling on generation length: the biggest lever on wall-clock
    // time for autoregressive decoding is simply how many tokens get
    // produced. This also acts as a safety net against a runaway/looping
    // generation burning minutes producing far more than the schema needs.
    numPredict,
  });
}

export async function extractCaseFromTranscript(transcript: string): Promise<ExtractedCase> {
  const model = makeModel(500).withStructuredOutput(ExtractedCaseSchema);
  return model.invoke([
    { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
    { role: "user", content: `TRANSCRIPT:\n${transcript}` },
  ]);
}

export async function diagnoseCase(input: DiagnoseInput): Promise<DiagnosisResult> {
  const model = makeModel(800).withStructuredOutput(DiagnosisResultSchema);
  const caseText = buildCaseText(input);
  return model.invoke([
    { role: "system", content: DIAGNOSIS_SYSTEM_PROMPT },
    { role: "user", content: `PATIENT CASE:\n${caseText}` },
  ]);
}

export const OLLAMA_CONFIG = { baseUrl: OLLAMA_BASE_URL, model: OLLAMA_MODEL };
