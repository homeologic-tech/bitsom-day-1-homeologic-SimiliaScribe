/**
 * Local PII redaction, applied to the transcript BEFORE it is sent to any
 * cloud LLM.
 *
 * Why this is safe to do aggressively: a homeopathic diagnosis is derived from
 * symptoms, modalities, and mental/physical generals — it never needs the
 * patient's identity. So stripping identifiers costs nothing in output
 * quality, which makes data minimisation a free win rather than a tradeoff.
 *
 * Deliberately conservative regex/gazetteer matching rather than an ML NER
 * model: it runs instantly with no extra dependency or model download, and
 * over-redacting a stray word is harmless here (the clinical content is what
 * matters), whereas under-redacting is not. Automated redaction never reaches
 * perfect recall, which is exactly why the doctor reviews the transcript
 * before it leaves the device.
 */

export type PiiKind = "NAME" | "PHONE" | "AADHAAR" | "EMAIL" | "ID" | "ADDRESS";

export interface Redaction {
  kind: PiiKind;
  original: string;
}

export interface DeidentifyResult {
  text: string;
  redactions: Redaction[];
}

interface Rule {
  kind: PiiKind;
  pattern: RegExp;
  /** Which capture group holds the value to mask (default: whole match). */
  group?: number;
}

const RULES: Rule[] = [
  // Email addresses
  { kind: "EMAIL", pattern: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g },

  // Aadhaar: 12 digits, optionally space/hyphen grouped 4-4-4. Checked before
  // the phone rule so a 12-digit ID isn't partially matched as a phone number.
  { kind: "AADHAAR", pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },

  // Indian mobile numbers, with or without +91 / 0 prefix
  { kind: "PHONE", pattern: /(?:\+91[\s-]?|\b0)?[6-9]\d{9}\b/g },

  // Explicitly labelled record/patient identifiers
  { kind: "ID", pattern: /\b(?:patient|record|file|reg(?:istration)?|mrn|uhid)\s*(?:id|no\.?|number|#)?\s*[:\-#]?\s*([A-Za-z0-9/-]{3,})\b/gi, group: 1 },

  // PIN codes stated as such (bare 6-digit numbers are left alone — too likely
  // to be a dosage, potency, or year in clinical speech)
  { kind: "ADDRESS", pattern: /\bpin(?:\s*code)?\s*[:\-]?\s*(\d{6})\b/gi, group: 1 },

  // Personal names following an honorific. Honorific-anchored rather than
  // general capitalised-word matching, because clinical text is full of
  // capitalised remedy names (Bryonia, Nux Vomica) that must NOT be redacted.
  {
    kind: "NAME",
    pattern: /\b(?:Mr|Mrs|Ms|Miss|Dr|Shri|Smt|Sri|Thiru)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g,
    group: 1,
  },

  // "my name is X", "I am X", "this is X" — self-introductions
  {
    kind: "NAME",
    pattern: /\b(?:my name is|name is|i am|i'm|this is|patient name)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/gi,
    group: 1,
  },
];

export function deidentify(text: string): DeidentifyResult {
  const redactions: Redaction[] = [];
  let result = text;

  for (const rule of RULES) {
    result = result.replace(rule.pattern, (match, ...groups) => {
      const value = rule.group ? (groups[rule.group - 1] as string) : match;
      if (!value) return match;

      redactions.push({ kind: rule.kind, original: value });
      const placeholder = `[${rule.kind}]`;

      // When only a capture group is sensitive, keep the surrounding context
      // (e.g. "Dr. [NAME]") so the transcript stays readable to the clinician.
      return rule.group ? match.replace(value, placeholder) : placeholder;
    });
  }

  return { text: result, redactions };
}
