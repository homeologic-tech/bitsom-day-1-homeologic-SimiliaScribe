import { z } from "zod";

// Mirrors backend/src/clinic/schemas/consultation.schema.ts (Vitals) in the
// main HomeoAI repo. Vitals are entered manually by the doctor, not extracted
// from the conversation — they're instrument-measured, not spoken data.
export const VitalsSchema = z.object({
  bloodPressure: z.string().optional(),
  weightKg: z.number().optional(),
  temperatureF: z.number().optional(),
  pulseRate: z.number().optional(),
  height: z.string().optional(),
  respiratoryRate: z.string().optional(),
});
export type Vitals = z.infer<typeof VitalsSchema>;

export const EMPTY_VITALS: Vitals = {};

// Fields use .nullable() rather than .optional(): OpenAI's strict structured-
// output mode requires every property to appear in the schema's "required"
// array (Zod's JSON-schema conversion omits .optional() fields from
// "required", which OpenAI rejects) — nullable fields stay required but can
// be null, which both OpenAI and Ollama handle correctly.

// Mirrors ComplaintDetails in consultation.schema.ts
export const ComplaintDetailsSchema = z.object({
  onset: z.string().nullable().describe("When the complaint started, e.g. '3 days ago', 'since childhood'. null if not mentioned."),
  duration: z.string().nullable().describe("How long each episode lasts. null if not mentioned."),
  location: z.string().nullable().describe("Body part / side affected. null if not mentioned."),
  character: z.string().nullable().describe("Nature of the sensation, e.g. 'throbbing', 'burning'. null if not mentioned."),
  modalities: z.string().nullable().describe("What makes it better or worse, e.g. 'worse from cold, better bending forward'. null if not mentioned."),
  concomitants: z.string().nullable().describe("Other symptoms occurring alongside the chief complaint. null if not mentioned."),
});

// Mirrors the conversation-extractable subset of Assessment in consultation.schema.ts
// (excludes physical/genExam/tongue/labResults/imaging — those come from
// examination/reports, not the spoken conversation).
export const AssessmentSchema = z.object({
  hpi: z.string().nullable().describe("History of present illness, narrative summary. null if not mentioned."),
  pastHistory: z.string().nullable().describe("Relevant past medical history mentioned. null if not mentioned."),
  familyHistory: z.string().nullable().describe("Relevant family medical history mentioned. null if not mentioned."),
  physGenerals: z.string().nullable().describe("Physical generals: appetite, thirst, sleep, thermal reaction, perspiration, cravings/aversions. null if not mentioned."),
  physParticulars: z.string().nullable().describe("Particular physical symptoms not covered elsewhere. null if not mentioned."),
  mentalEmotions: z.string().nullable().describe("Mental and emotional state: mood, temperament, reactions to stress. null if not mentioned."),
  dreams: z.string().nullable().describe("Dreams mentioned by the patient, if any. null if not mentioned."),
  fears: z.string().nullable().describe("Fears or anxieties mentioned by the patient, if any. null if not mentioned."),
});

export const ExtractedCaseSchema = z.object({
  chiefComplaints: z
    .array(z.string())
    .describe("Short list of the patient's main presenting complaints, e.g. 'headache', 'loose motions'"),
  occupation: z.string().nullable().describe("Patient's occupation, only if mentioned. null if not mentioned."),
  complaintDetails: ComplaintDetailsSchema,
  assessments: AssessmentSchema,
});
export type ExtractedCase = z.infer<typeof ExtractedCaseSchema>;

export const EMPTY_EXTRACTED_CASE: ExtractedCase = {
  chiefComplaints: [],
  occupation: null,
  complaintDetails: {
    onset: null,
    duration: null,
    location: null,
    character: null,
    modalities: null,
    concomitants: null,
  },
  assessments: {
    hpi: null,
    pastHistory: null,
    familyHistory: null,
    physGenerals: null,
    physParticulars: null,
    mentalEmotions: null,
    dreams: null,
    fears: null,
  },
};

// Mirrors AiDiagnosisResult + AiSuggestResult in backend/src/global/ai/ai.service.ts,
// merged into one call for demo latency (one local MedGemma round trip instead of two).
export const DiagnosisResultSchema = z.object({
  provisionalDiagnosis: z.string().describe("Conventional clinical disease name (a few words), NOT a remedy name"),
  totalityAnalysis: z.string().describe("Homeopathic totality-of-symptoms analysis, MAX 2 SHORT sentences"),
  finalDiagnosis: z.string().describe("Confirmed clinical disease name (a few words), NOT a remedy name"),
  treatmentPlan: z.string().describe("Remedy name, potency, dosage, frequency, duration — ONE sentence"),
  followUp: z.string().describe("Follow-up instructions, MAX 1 SHORT sentence"),
  notes: z.string().describe("Additional clinical or dietary notes, MAX 1 SHORT sentence"),
  primarySuggestion: z.string().describe("The single best-indicated remedy name"),
  medicines: z
    .array(z.string())
    .length(3)
    .describe("Exactly 3 candidate remedies, primary first — chart.rows grades are positional against this list"),
  reasoning: z.string().describe("MAX 2 short sentences of clinical reasoning for the primary remedy"),
  chart: z.object({
    rows: z
      .array(
        z.object({
          symptom: z.string().describe("A single repertorial rubric derived from the case, 2-4 words"),
          grades: z
            .array(z.number())
            .length(3)
            .describe("Grade 0-4 for each of the 3 medicines, in the SAME order as the top-level medicines array"),
        }),
      )
      .length(4)
      .describe("EXACTLY 4 rows, one per rubric — fixed 3-medicine-wide grading, avoids free-form nested objects"),
  }),
});
export type DiagnosisResult = z.infer<typeof DiagnosisResultSchema>;
