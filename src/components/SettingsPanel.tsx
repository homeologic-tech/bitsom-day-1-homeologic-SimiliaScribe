"use client";

import { useState } from "react";

export type Provider = "local" | "openai";
export type SttProvider = "local" | "sarvam";

export interface AiSettings {
  provider: Provider;
  openaiModel: string;
  sttProvider: SttProvider;
}

export const DEFAULT_SETTINGS: AiSettings = {
  provider: "local",
  openaiModel: "gpt-4o-mini",
  sttProvider: "local",
};

export const SETTINGS_STORAGE_KEY = "similia-scribe-ai-settings";

const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

function PrivacyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-input border border-warning-light bg-warning-light px-3 py-2 text-xs text-warning">
      <span className="mr-1" aria-hidden>⚠</span>
      {children}
    </div>
  );
}

function ToggleRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-button px-3 py-1.5 text-xs font-semibold transition ${
            value === opt.value
              ? "bg-accent text-white"
              : "border border-border-light text-text-sec-light hover:bg-hover-bg-light"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPanel({
  settings,
  onChange,
}: {
  settings: AiSettings;
  onChange: (settings: AiSettings) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-button border border-border-light bg-card-light px-3 py-1.5 text-xs font-medium text-text-sec-light hover:bg-hover-bg-light"
      >
        <span aria-hidden>⚙</span>
        Settings
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-96 rounded-card border border-border-light bg-card-light p-4 shadow-lg">
          {/* Speech-to-text provider */}
          <h3 className="text-sm font-semibold text-text-light">Speech-to-Text</h3>
          <p className="mt-1 text-xs text-text-muted-light">
            Local runs Whisper on-device, fully offline. Sarvam is a cloud API built for Indian
            languages — stronger on Hindi/Tamil and faster, since it isn&rsquo;t competing for this
            machine&rsquo;s CPU.
          </p>
          <div className="mt-3">
            <ToggleRow
              value={settings.sttProvider}
              onChange={(v) => onChange({ ...settings, sttProvider: v })}
              options={[
                { value: "local", label: "Local (Whisper)" },
                { value: "sarvam", label: "Sarvam (cloud)" },
              ]}
            />
          </div>
          {settings.sttProvider === "sarvam" && (
            <PrivacyNotice>
              Patient audio leaves this device for Sarvam AI (India-hosted, DPDP-compliant) over
              HTTPS, for transcription only — no patient name or ID is attached. Deleted from our
              server the moment transcription finishes; nothing is stored. Get patient consent
              before using this on a real consultation.
            </PrivacyNotice>
          )}

          <hr className="my-4 border-border-light" />

          {/* LLM provider (extraction + diagnosis) */}
          <h3 className="text-sm font-semibold text-text-light">Diagnosis AI</h3>
          <p className="mt-1 text-xs text-text-muted-light">
            Local runs MedGemma via Ollama, fully offline but slower under load. OpenAI is faster.
          </p>
          <div className="mt-3">
            <ToggleRow
              value={settings.provider}
              onChange={(v) => onChange({ ...settings, provider: v })}
              options={[
                { value: "local", label: "Local (MedGemma)" },
                { value: "openai", label: "OpenAI" },
              ]}
            />
          </div>
          {settings.provider === "openai" && (
            <>
              <label className="mt-3 block">
                <span className="text-xs font-medium text-text-sec-light">Model</span>
                <select
                  value={settings.openaiModel}
                  onChange={(e) => onChange({ ...settings, openaiModel: e.target.value })}
                  className="mt-1 w-full rounded-input border border-input-border-light bg-input-bg-light px-3 py-1.5 text-sm text-text-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {OPENAI_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <PrivacyNotice>
                Only the extracted case text leaves this device — never the audio — and it is
                automatically de-identified first: names, phone numbers, Aadhaar, emails and record
                IDs are stripped locally before the request is sent. The diagnosis never needs
                patient identity, so nothing is lost.
              </PrivacyNotice>
            </>
          )}

          <p className="mt-4 text-xs text-text-muted-light">
            API keys are read from server-side environment variables only — they are never entered
            here, never sent to the browser, and never stored in this app.
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-button bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
