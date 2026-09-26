"use client";

import { useRef, useState } from "react";

interface Props {
  onAudioReady: (file: Blob, filename: string) => void;
  disabled?: boolean;
}

export default function RecorderPanel({ onAudioReady, disabled }: Props) {
  const [mode, setMode] = useState<"live" | "upload">("live");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        onAudioReady(blob, "consultation.webm");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setError("Couldn't access the microphone. Check browser permissions, or switch to file upload.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUrl(URL.createObjectURL(file));
    onAudioReady(file, file.name);
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div>
      <div className="inline-flex rounded-button border border-border-light bg-input-bg-light p-1 text-sm">
        {(["live", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            disabled={disabled}
            className={`rounded-button px-4 py-1.5 font-medium transition ${
              mode === m ? "bg-accent text-white" : "text-text-sec-light hover:bg-hover-bg-light"
            }`}
          >
            {m === "live" ? "Record Live" : "Upload Recording"}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {mode === "live" ? (
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                className="flex items-center gap-2 rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white" /> Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-button bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <span className="h-2.5 w-2.5 animate-pulse rounded-sm bg-white" /> Stop ({mm}:{ss})
              </button>
            )}
            {isRecording && <span className="text-xs text-text-muted-light">Listening…</span>}
          </div>
        ) : (
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="block w-full text-sm text-text-sec-light file:mr-4 file:rounded-button file:border-0 file:bg-accent-light file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent hover:file:bg-accent-mid"
          />
        )}
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}
