"use client";

import type { Vitals } from "@/lib/schema";

interface Props {
  vitals: Vitals;
  onChange: (vitals: Vitals) => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-sec-light">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-input border border-input-border-light bg-input-bg-light px-3 py-1.5 text-sm text-text-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}

export default function VitalsCard({ vitals, onChange }: Props) {
  const set = <K extends keyof Vitals>(key: K, raw: string) => {
    const isNumeric = key === "weightKg" || key === "temperatureF" || key === "pulseRate";
    const value = isNumeric ? (raw === "" ? undefined : Number(raw)) : raw;
    onChange({ ...vitals, [key]: value as Vitals[K] });
  };

  return (
    <div className="sticky top-6 rounded-card border border-border-light bg-card-light p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-text-light">Patient Vitals</h2>
      <p className="mt-1 text-xs text-text-muted-light">
        Measured directly, not from the conversation — kept here as a live reference while you talk with the patient.
      </p>
      <div className="mt-4 space-y-3">
        <Field label="Height" value={vitals.height} onChange={(v) => set("height", v)} placeholder="e.g. 165 cm" />
        <Field label="Weight (kg)" value={vitals.weightKg} onChange={(v) => set("weightKg", v)} placeholder="e.g. 62" type="number" />
        <Field label="Temperature (°F)" value={vitals.temperatureF} onChange={(v) => set("temperatureF", v)} placeholder="e.g. 98.6" type="number" />
        <Field label="Blood Pressure" value={vitals.bloodPressure} onChange={(v) => set("bloodPressure", v)} placeholder="e.g. 120/80" />
        <Field label="Pulse Rate (bpm)" value={vitals.pulseRate} onChange={(v) => set("pulseRate", v)} placeholder="e.g. 76" type="number" />
        <Field label="Respiratory Rate" value={vitals.respiratoryRate} onChange={(v) => set("respiratoryRate", v)} placeholder="e.g. 16/min" />
      </div>
    </div>
  );
}
