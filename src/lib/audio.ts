import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Normalizes arbitrary input audio (webm/opus from MediaRecorder, or an
 * uploaded mp3/m4a/wav/etc.) to 16kHz mono PCM via ffmpeg, then decodes the
 * resulting WAV into a Float32Array — the exact format Whisper expects.
 */
export async function decodeAudioTo16kMonoFloat32(
  input: Buffer,
  hintExt: string,
): Promise<Float32Array> {
  const dir = await mkdtemp(path.join(tmpdir(), "similia-scribe-"));
  const safeExt = hintExt.replace(/[^a-z0-9]/gi, "") || "bin";
  const inPath = path.join(dir, `input.${safeExt}`);
  const outPath = path.join(dir, "output.wav");

  try {
    await writeFile(inPath, input);
    await runFfmpeg(inPath, outPath);
    const wavBuffer = await readFile(outPath);
    return decodeWavPcm16Mono(wavBuffer);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function runFfmpeg(inPath: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-i", inPath,
      "-ar", "16000",
      "-ac", "1",
      "-f", "wav",
      outPath,
    ]);
    let stderr = "";
    ff.stderr.on("data", (d) => (stderr += d.toString()));
    ff.on("error", (err) =>
      reject(new Error(`Failed to launch ffmpeg (is it installed?): ${err.message}`)),
    );
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}:\n${stderr.slice(-2000)}`));
    });
  });
}

/** Minimal PCM16 WAV parser — sufficient for ffmpeg's own -f wav output. */
function decodeWavPcm16Mono(buffer: Buffer): Float32Array {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Invalid WAV file produced by ffmpeg");
  }

  let offset = 12;
  let dataOffset = -1;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  if (dataOffset === -1) throw new Error("WAV file has no data chunk");

  const numSamples = Math.floor(dataSize / 2);
  const floats = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    floats[i] = buffer.readInt16LE(dataOffset + i * 2) / 32768;
  }
  return floats;
}

/** Inverse of decodeWavPcm16Mono — used to re-package a PCM chunk for upload
 * to an external STT API (e.g. Sarvam) without a second ffmpeg round trip. */
export function encodeFloat32ToWav16kMono(samples: Float32Array): Buffer {
  const sampleRate = 16000;
  const blockAlign = 2; // 16-bit mono
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // PCM fmt chunk size
  buffer.writeUInt16LE(1, 20); // audio format = PCM
  buffer.writeUInt16LE(1, 22); // channels = 1
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28); // byte rate
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

/** Splits PCM into fixed-length chunks — used to stay under an external STT
 * API's per-request duration limit (e.g. Sarvam's 30-second cap). */
export function chunkFloat32BySeconds(
  samples: Float32Array,
  chunkSeconds: number,
  sampleRate = 16000,
): Float32Array[] {
  const chunkSize = chunkSeconds * sampleRate;
  if (samples.length <= chunkSize) return [samples];
  const chunks: Float32Array[] = [];
  for (let start = 0; start < samples.length; start += chunkSize) {
    chunks.push(samples.subarray(start, Math.min(start + chunkSize, samples.length)));
  }
  return chunks;
}
