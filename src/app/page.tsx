"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import VitalsCard from "@/components/VitalsCard";
import RecorderPanel from "@/components/RecorderPanel";
import CaseForm from "@/components/CaseForm";
import ResultsPanel from "@/components/ResultsPanel";
import StepSection from "@/components/StepSection";
import LoadingCard from "@/components/LoadingCard";
import ErrorRetry from "@/components/ErrorRetry";
import SettingsPanel, { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, type AiSettings } from "@/components/SettingsPanel";
import { EMPTY_VITALS, type ExtractedCase, type DiagnosisResult, type Vitals } from "@/lib/schema";

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="rounded-button bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Working…" : children}
    </button>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        // Hydrating persisted preferences from localStorage on mount — window/localStorage
        // don't exist during SSR, so this can't be a lazy useState initializer instead.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {
        // ignore malformed stored settings, keep defaults
      }
    }
  }, []);

  const updateSettings = (next: AiSettings) => {
    setSettings(next);
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  };

  const [vitals, setVitals] = useState<Vitals>(EMPTY_VITALS);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFilename, setAudioFilename] = useState("consultation.webm");

  const [transcript, setTranscript] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const [extractedCase, setExtractedCase] = useState<ExtractedCase | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null);

  const handleAudioReady = (blob: Blob, filename: string) => {
    setAudioBlob(blob);
    setAudioFilename(filename);
    setTranscript("");
    setExtractedCase(null);
    setExtractError(null);
    setDiagnosis(null);
    setDiagnoseError(null);
  };

  const runTranscribe = async () => {
    if (!audioBlob) return;
    setTranscribing(true);
    setTranscribeError(null);
    try {
      const form = new FormData();
      form.append("audio", audioBlob, audioFilename);
      form.append("provider", settings.sttProvider);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transcription failed");
      setTranscript(data.transcript);
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const runExtract = async () => {
    if (!transcript.trim()) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          provider: settings.provider,
          model: settings.openaiModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setExtractedCase(data);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const runDiagnose = async () => {
    if (!extractedCase) return;
    setDiagnosing(true);
    setDiagnoseError(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...extractedCase,
          vitals,
          provider: settings.provider,
          model: settings.openaiModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Diagnosis failed");
      setDiagnosis(data);
    } catch (err) {
      setDiagnoseError(err instanceof Error ? err.message : "Diagnosis failed");
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="border-b border-border-light bg-topbar-light">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/brand/logoprimary.svg" alt="Homeologic" width={36} height={36} />
            <div>
              <h1 className="text-lg font-bold text-text-light">SimiliaScribe</h1>
              <p className="text-xs text-text-muted-light">Voice-to-case AI scribe for homeopathic consultations · by Homeologic</p>
            </div>
          </div>
          <SettingsPanel settings={settings} onChange={updateSettings} />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <StepSection
            step={1}
            title="Consultation Capture"
            description="Record the conversation live, or upload a pre-recorded file. Hindi, Tamil, and English (including mixed) are all supported."
          >
            <RecorderPanel onAudioReady={handleAudioReady} disabled={transcribing} />
            {audioBlob && !transcript && (
              <div className="mt-4">
                {transcribing ? (
                  <LoadingCard label="Transcribing audio…" />
                ) : transcribeError ? (
                  <ErrorRetry message={transcribeError} onRetry={runTranscribe} />
                ) : (
                  <PrimaryButton onClick={runTranscribe}>Transcribe Conversation</PrimaryButton>
                )}
              </div>
            )}
            {transcript && (
              <label className="mt-4 block">
                <span className="text-xs font-medium text-text-sec-light">
                  Transcript (English — edit to correct any transcription errors)
                </span>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-input border border-input-border-light bg-input-bg-light px-3 py-2 text-sm text-text-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <div className="mt-3">
                  <PrimaryButton onClick={runExtract} loading={extracting}>
                    Extract Case Details
                  </PrimaryButton>
                </div>
              </label>
            )}
          </StepSection>

          {(extracting || extractError || extractedCase) && (
            <StepSection
              step={2}
              title="Extracted Case Details"
              description="Auto-filled from the conversation — review and correct before generating a diagnosis."
            >
              {extracting ? (
                <LoadingCard label="Extracting case details…" />
              ) : extractError ? (
                <ErrorRetry message={extractError} onRetry={runExtract} />
              ) : (
                extractedCase && (
                  <>
                    <CaseForm data={extractedCase} onChange={setExtractedCase} />
                    <div className="mt-5">
                      <PrimaryButton onClick={runDiagnose} loading={diagnosing}>
                        Generate Diagnosis &amp; Repertorial Suggestion
                      </PrimaryButton>
                    </div>
                  </>
                )
              )}
            </StepSection>
          )}

          {(diagnosing || diagnoseError || diagnosis) && (
            <StepSection
              step={3}
              title="AI Diagnosis & Repertorial Suggestion"
              description="Review before acting on it clinically."
            >
              {diagnosing ? (
                <LoadingCard label="Generating diagnosis and repertorial chart…" />
              ) : diagnoseError ? (
                <ErrorRetry message={diagnoseError} onRetry={runDiagnose} />
              ) : (
                diagnosis && <ResultsPanel result={diagnosis} />
              )}
            </StepSection>
          )}
        </div>

        <div>
          <VitalsCard vitals={vitals} onChange={setVitals} />
        </div>
      </main>
    </div>
  );
}
