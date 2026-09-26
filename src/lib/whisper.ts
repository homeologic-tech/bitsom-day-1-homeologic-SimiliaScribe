import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

// Multilingual Whisper checkpoint (NOT the ".en" English-only variant) — trained
// on Hindi and Tamil alongside English, so a real Indian-clinic conversation with
// code-switching works out of the box. "small" balances CPU speed against
// Indic-language accuracy for a live demo; Tamil will still be noticeably
// weaker than Hindi/English (Whisper's own training-data imbalance) — a known,
// disclosed limitation, not a bug.
const MODEL_ID = "Xenova/whisper-small";

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!transcriberPromise) {
    transcriberPromise = pipeline("automatic-speech-recognition", MODEL_ID) as Promise<AutomaticSpeechRecognitionPipeline>;
  }
  return transcriberPromise;
}

export interface TranscriptionResult {
  text: string;
  model: string;
}

/**
 * Runs Whisper in "translate" mode: whatever language is spoken (Hindi, Tamil,
 * English, or a mix), the output text is always English. This keeps every
 * downstream step (MedGemma extraction) single-language, which is far more
 * reliable for medical terminology than asking MedGemma to translate too.
 */
export async function transcribeToEnglish(audio: Float32Array): Promise<TranscriptionResult> {
  const transcriber = await getTranscriber();
  const output = await transcriber(audio, {
    task: "translate",
    chunk_length_s: 30,
    stride_length_s: 5,
  });
  const single = Array.isArray(output) ? output[0] : output;
  const text = (single?.text ?? "").trim();
  return { text, model: MODEL_ID };
}
