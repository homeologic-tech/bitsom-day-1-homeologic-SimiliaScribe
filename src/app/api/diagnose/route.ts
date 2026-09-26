import { NextRequest, NextResponse } from "next/server";
import * as ollamaProvider from "@/lib/ollama";
import * as openaiProvider from "@/lib/openai";
import { EMPTY_VITALS } from "@/lib/schema";
import type { DiagnoseInput } from "@/lib/prompts";

export const maxDuration = 900;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: DiagnoseInput = {
      chiefComplaints: Array.isArray(body.chiefComplaints) ? body.chiefComplaints : [],
      occupation: body.occupation,
      complaintDetails: body.complaintDetails ?? {},
      assessments: body.assessments ?? {},
      vitals: body.vitals ?? EMPTY_VITALS,
    };

    const result =
      body.provider === "openai"
        ? await openaiProvider.diagnoseCase(input, body.model)
        : await ollamaProvider.diagnoseCase(input);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/diagnose]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Diagnosis generation failed" },
      { status: 500 },
    );
  }
}
