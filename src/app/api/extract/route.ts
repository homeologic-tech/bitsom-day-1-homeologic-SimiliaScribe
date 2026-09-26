import { NextRequest, NextResponse } from "next/server";
import * as ollamaProvider from "@/lib/ollama";
import * as openaiProvider from "@/lib/openai";
import { deidentify } from "@/lib/deidentify";

export const maxDuration = 900;

export async function POST(req: NextRequest) {
  try {
    const { transcript, provider, model } = await req.json();
    if (typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    if (provider === "openai") {
      // Strip identifiers before anything leaves this machine. Local runs skip
      // this — the text never goes anywhere, and the doctor may legitimately
      // want names retained in their own on-device notes.
      const { text, redactions } = deidentify(transcript);
      const extracted = await openaiProvider.extractCaseFromTranscript(text, model);
      return NextResponse.json({ ...extracted, _redactions: redactions.length });
    }

    const extracted = await ollamaProvider.extractCaseFromTranscript(transcript);
    return NextResponse.json(extracted);
  } catch (err) {
    console.error("[/api/extract]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 },
    );
  }
}
