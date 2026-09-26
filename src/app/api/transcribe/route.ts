import { NextRequest, NextResponse } from "next/server";
import { decodeAudioTo16kMonoFloat32 } from "@/lib/audio";
import { transcribeToEnglish } from "@/lib/whisper";
import { transcribeToEnglishSarvam } from "@/lib/sarvam";

// Local Whisper inference on CPU can take a while for longer clips.
export const maxDuration = 900;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("audio");
    const provider = form.get("provider");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "webm";

    const pcm = await decodeAudioTo16kMonoFloat32(buffer, ext);
    if (pcm.length < 1600) {
      return NextResponse.json(
        { error: "Recording too short to transcribe (need at least ~0.1s of audio)." },
        { status: 400 },
      );
    }

    if (provider === "sarvam") {
      const { text, model } = await transcribeToEnglishSarvam(pcm);
      return NextResponse.json({ transcript: text, model });
    }

    const { text, model } = await transcribeToEnglish(pcm);
    return NextResponse.json({ transcript: text, model });
  } catch (err) {
    console.error("[/api/transcribe]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 },
    );
  }
}
