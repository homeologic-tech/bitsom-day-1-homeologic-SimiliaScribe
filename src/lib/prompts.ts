import type { Vitals } from "./schema";

export const EXTRACTION_SYSTEM_PROMPT = `You are a clinical scribe assistant for a classical homeopathic practice.
You will be given an English transcript of a doctor-patient consultation
(it may have been translated from Hindi, Tamil, or a mix of languages, so
phrasing may be a little informal).

Extract ONLY what the PATIENT reports about themselves — ignore the doctor's
questions, small talk, and any content not describing the patient's symptoms,
history, or state. Do not invent details that were not said. Leave a field
empty if it was not discussed.

STRICT RULES:
- "chiefComplaints" is a SHORT list (2-6 items) of 2-5 WORD symptom labels
  only — e.g. "throbbing headache", "loose motions", "low appetite". Never
  put a full sentence, a modality, or a history detail in this list — those
  belong in their own fields below.
- "complaintDetails.modalities" combines ALL better/worse triggers mentioned
  for the chief complaint into one sentence (e.g. "worse from bright light
  and noise, better lying down in a dark quiet room"), not just the first one.
- "occupation" should be filled whenever the patient mentions their job, even
  in passing.
- Every other field is a short factual sentence or phrase, or omitted if not
  discussed.

EXAMPLE
Transcript: "Patient: I've had a throbbing headache on the right side for
three days, worse in bright light and loud noise, better lying down in a
dark room. I feel nauseated during an attack. I'm a software engineer and
under a lot of work stress lately. My father also got migraines."

Correct extraction:
{
  "chiefComplaints": ["throbbing headache", "nausea during attack"],
  "occupation": "software engineer",
  "complaintDetails": {
    "duration": "3 days",
    "location": "right side of head",
    "character": "throbbing",
    "modalities": "worse in bright light and loud noise, better lying down in a dark quiet room",
    "concomitants": "nausea during attack"
  },
  "assessments": {
    "familyHistory": "father had migraines",
    "mentalEmotions": "under a lot of work stress lately"
  }
}`;

export const DIAGNOSIS_SYSTEM_PROMPT = `You are an expert classical homeopathic physician with deep knowledge of
Kent's Repertory, Boericke's Materia Medica, and Boenninghausen's Repertory.

Given the patient case below, produce:
1. A structured clinical + homeopathic diagnosis. Keep every text field to
   the length stated in its schema description — SHORT. This is a summary
   for a busy clinician, not a case report.
2. A repertorial analysis: pick the 4 MOST individualizing rubrics from the
   case (not every symptom — the 4 most distinctive), then grade the top 3
   indicated remedies against each using the standard scale (4 = bold/
   keynote, 3 = well-indicated, 2 = moderately indicated, 1 = slightly
   indicated, 0 = not indicated).

"medicines" MUST contain EXACTLY 3 remedy names, primary first. "chart.rows"
MUST contain EXACTLY 4 rows (the 4 chosen rubrics); each row's "grades" array
MUST have exactly 3 numbers, in the SAME ORDER as "medicines" (grades[0]
grades medicines[0], grades[1] grades medicines[1], grades[2] grades
medicines[2]). Do not include anything other than rubrics in chart.rows — no
diagnosis fields, no patient history labels. Every medicine must have a
non-zero grade on at least one row.

Field rules:
- "provisionalDiagnosis" and "finalDiagnosis" are the CONVENTIONAL CLINICAL
  disease name (e.g. "Acute Migraine", "Allergic Rhinitis") — NEVER a remedy
  name.
- "treatmentPlan" holds the remedy name, potency, dosage, frequency, and
  duration — the remedy belongs here, not in the diagnosis fields.
- If case details are too sparse for a confident diagnosis, still fill in
  your best clinical judgement rather than leaving fields blank, but keep
  "notes" honest about what's uncertain.`;

export function buildCaseText(input: {
  chiefComplaints: string[];
  occupation?: string;
  complaintDetails: Record<string, string | undefined>;
  assessments: Record<string, string | undefined>;
  vitals: Vitals;
}): string {
  const lines: string[] = [];
  if (input.chiefComplaints.length) lines.push(`Chief Complaints: ${input.chiefComplaints.join(", ")}`);
  if (input.occupation) lines.push(`Occupation: ${input.occupation}`);
  const cd = input.complaintDetails;
  if (cd.onset) lines.push(`Onset: ${cd.onset}`);
  if (cd.duration) lines.push(`Duration: ${cd.duration}`);
  if (cd.location) lines.push(`Location: ${cd.location}`);
  if (cd.character) lines.push(`Character: ${cd.character}`);
  if (cd.modalities) lines.push(`Modalities (Better/Worse): ${cd.modalities}`);
  if (cd.concomitants) lines.push(`Concomitants: ${cd.concomitants}`);
  const a = input.assessments;
  if (a.hpi) lines.push(`History of Present Illness: ${a.hpi}`);
  if (a.pastHistory) lines.push(`Past Medical History: ${a.pastHistory}`);
  if (a.familyHistory) lines.push(`Family History: ${a.familyHistory}`);
  if (a.physGenerals) lines.push(`Physical Generals: ${a.physGenerals}`);
  if (a.physParticulars) lines.push(`Physical Particulars: ${a.physParticulars}`);
  if (a.mentalEmotions) lines.push(`Mental/Emotional State: ${a.mentalEmotions}`);
  if (a.dreams) lines.push(`Dreams: ${a.dreams}`);
  if (a.fears) lines.push(`Fears/Anxieties: ${a.fears}`);
  const v = input.vitals;
  const vitalsParts = [
    v.temperatureF != null && `Temp: ${v.temperatureF}°F`,
    v.bloodPressure && `BP: ${v.bloodPressure}`,
    v.pulseRate != null && `Pulse: ${v.pulseRate} bpm`,
    v.respiratoryRate && `Resp. Rate: ${v.respiratoryRate}`,
    v.weightKg != null && `Weight: ${v.weightKg} kg`,
    v.height && `Height: ${v.height}`,
  ].filter(Boolean);
  if (vitalsParts.length) lines.push(`Vitals: ${vitalsParts.join(", ")}`);

  return lines.length ? lines.join("\n") : "(No case details provided)";
}

export interface DiagnoseInput {
  chiefComplaints: string[];
  occupation?: string;
  complaintDetails: Record<string, string | undefined>;
  assessments: Record<string, string | undefined>;
  vitals: Vitals;
}
