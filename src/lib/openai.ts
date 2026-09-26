import { ChatOpenAI } from "@langchain/openai";
import { ExtractedCaseSchema, DiagnosisResultSchema, type ExtractedCase, type DiagnosisResult } from "./schema";
import { EXTRACTION_SYSTEM_PROMPT, DIAGNOSIS_SYSTEM_PROMPT, buildCaseText, type DiagnoseInput } from "./prompts";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

// Keys are read server-side from the environment only — they are never sent to
// the browser, never stored in localStorage, and never travel in a request
// body. The client can only choose *which* provider/model to use.
function makeModel(model: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is not set on the server. Add it to .env.local and restart the dev server.",
    );
  }
  return new ChatOpenAI({
    apiKey,
    model: model || DEFAULT_OPENAI_MODEL,
    temperature: 0,
  });
}

export async function extractCaseFromTranscript(
  transcript: string,
  model: string,
): Promise<ExtractedCase> {
  const llm = makeModel(model).withStructuredOutput(ExtractedCaseSchema);
  return llm.invoke([
    { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
    { role: "user", content: `TRANSCRIPT:\n${transcript}` },
  ]);
}

export async function diagnoseCase(input: DiagnoseInput, model: string): Promise<DiagnosisResult> {
  const llm = makeModel(model).withStructuredOutput(DiagnosisResultSchema);
  const caseText = buildCaseText(input);
  return llm.invoke([
    { role: "system", content: DIAGNOSIS_SYSTEM_PROMPT },
    { role: "user", content: `PATIENT CASE:\n${caseText}` },
  ]);
}
