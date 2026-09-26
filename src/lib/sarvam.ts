import { encodeFloat32ToWav16kMono, chunkFloat32BySeconds } from "./audio";

const SARVAM_STT_ENDPOINT = "https://api.sarvam.ai/speech-to-text";
// Sarvam's REST endpoint caps audio at 30s per request — chunk at 29s to
// leave a safety margin against encoding/rounding drift.
const CHUNK_SECONDS = 29;

export interface SarvamTranscriptionResult {
  text: string;
  model: string;
}

/**
 * Sarvam's Saaras model, in "translate" mode: like our local Whisper setup,
 * whatever language is spoken (Hindi, Tamil, English, mixed) comes back as
 * English text, so downstream extraction stays single-language regardless
 * of STT provider.
 */
export async function transcribeToEnglishSarvam(
  pcm: Float32Array,
): Promise<SarvamTranscriptionResult> {
  // Read server-side from the environment only — the key never reaches the
  // browser and never travels in a request body.
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "SARVAM_API_KEY is not set on the server. Add it to .env.local and restart the dev server.",
    );
  }

  const chunks = chunkFloat32BySeconds(pcm, CHUNK_SECONDS);
  const transcripts: string[] = [];

  for (const chunk of chunks) {
    const wavBuffer = encodeFloat32ToWav16kMono(chunk);
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(wavBuffer)], { type: "audio/wav" }), "chunk.wav");
    form.append("model", "saaras:v3");
    form.append("mode", "translate");

    const res = await fetch(SARVAM_STT_ENDPOINT, {
      method: "POST",
      headers: { "api-subscription-key": apiKey },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Sarvam STT error ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as { transcript?: string };
    if (data.transcript) transcripts.push(data.transcript.trim());
  }

  return { text: transcripts.join(" ").trim(), model: "sarvam-saaras:v3" };
}
