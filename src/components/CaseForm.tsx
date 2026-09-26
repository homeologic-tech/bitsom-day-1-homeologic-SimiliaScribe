"use client";

import type { ExtractedCase } from "@/lib/schema";

interface Props {
  data: ExtractedCase;
  onChange: (data: ExtractedCase) => void;
}

function TextArea({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-sec-light">{label}</span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full rounded-input border border-input-border-light bg-input-bg-light px-3 py-1.5 text-sm text-text-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}

export default function CaseForm({ data, onChange }: Props) {
  const setComplaintDetail = (key: keyof ExtractedCase["complaintDetails"], v: string) =>
    onChange({ ...data, complaintDetails: { ...data.complaintDetails, [key]: v } });

  const setAssessment = (key: keyof ExtractedCase["assessments"], v: string) =>
    onChange({ ...data, assessments: { ...data.assessments, [key]: v } });

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-xs font-medium text-text-sec-light">Chief Complaints (comma-separated)</span>
        <input
          type="text"
          value={data.chiefComplaints.join(", ")}
          onChange={(e) =>
            onChange({
              ...data,
              chiefComplaints: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="mt-1 w-full rounded-input border border-input-border-light bg-input-bg-light px-3 py-1.5 text-sm text-text-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <TextArea label="Occupation" value={data.occupation} onChange={(v) => onChange({ ...data, occupation: v })} rows={1} />

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted-light">Complaint Details</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextArea label="Onset" value={data.complaintDetails.onset} onChange={(v) => setComplaintDetail("onset", v)} rows={1} />
          <TextArea label="Duration" value={data.complaintDetails.duration} onChange={(v) => setComplaintDetail("duration", v)} rows={1} />
          <TextArea label="Location" value={data.complaintDetails.location} onChange={(v) => setComplaintDetail("location", v)} rows={1} />
          <TextArea label="Character" value={data.complaintDetails.character} onChange={(v) => setComplaintDetail("character", v)} rows={1} />
          <TextArea label="Modalities (Better/Worse)" value={data.complaintDetails.modalities} onChange={(v) => setComplaintDetail("modalities", v)} />
          <TextArea label="Concomitants" value={data.complaintDetails.concomitants} onChange={(v) => setComplaintDetail("concomitants", v)} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted-light">Assessment</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextArea label="History of Present Illness" value={data.assessments.hpi} onChange={(v) => setAssessment("hpi", v)} />
          <TextArea label="Past History" value={data.assessments.pastHistory} onChange={(v) => setAssessment("pastHistory", v)} />
          <TextArea label="Family History" value={data.assessments.familyHistory} onChange={(v) => setAssessment("familyHistory", v)} />
          <TextArea label="Physical Generals" value={data.assessments.physGenerals} onChange={(v) => setAssessment("physGenerals", v)} />
          <TextArea label="Physical Particulars" value={data.assessments.physParticulars} onChange={(v) => setAssessment("physParticulars", v)} />
          <TextArea label="Mental / Emotional State" value={data.assessments.mentalEmotions} onChange={(v) => setAssessment("mentalEmotions", v)} />
          <TextArea label="Dreams" value={data.assessments.dreams} onChange={(v) => setAssessment("dreams", v)} rows={1} />
          <TextArea label="Fears / Anxieties" value={data.assessments.fears} onChange={(v) => setAssessment("fears", v)} rows={1} />
        </div>
      </div>
    </div>
  );
}
