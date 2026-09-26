import type { DiagnosisResult } from "@/lib/schema";

interface Props {
  result: DiagnosisResult;
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted-light">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-light whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function gradeStyle(grade: number) {
  if (grade >= 4) return "bg-accent text-white font-bold";
  if (grade === 3) return "bg-accent-mid text-accent-hover font-semibold";
  if (grade === 2) return "bg-accent-light text-accent italic";
  if (grade === 1) return "text-text-sec-light";
  return "text-text-muted-light";
}

export default function ResultsPanel({ result }: Props) {
  const medicines = result.medicines;

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-accent-mid bg-accent-light p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-hover">Primary Suggestion</p>
        <p className="mt-1 text-xl font-bold text-text-light">{result.primarySuggestion || "—"}</p>
        {result.reasoning && <p className="mt-2 text-sm text-text-sec-light">{result.reasoning}</p>}
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Row label="Provisional Diagnosis" value={result.provisionalDiagnosis} />
        <Row label="Final Diagnosis" value={result.finalDiagnosis} />
        <Row label="Totality Analysis" value={result.totalityAnalysis} />
        <Row label="Treatment Plan" value={result.treatmentPlan} />
        <Row label="Follow-up" value={result.followUp} />
        <Row label="Notes" value={result.notes} />
      </dl>

      {result.chart.rows.length > 0 && medicines.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted-light">
            Repertorial Chart
          </h3>
          <div className="overflow-x-auto rounded-card border border-border-light">
            <table className="min-w-full divide-y divide-divider-light text-sm">
              <thead className="bg-table-head-light">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-text-light">Rubric</th>
                  {medicines.map((med, i) => (
                    <th key={`${med}-${i}`} className="px-3 py-2 text-center font-semibold text-text-light">
                      {med}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider-light">
                {result.chart.rows.map((row, rowIdx) => (
                  <tr key={`${row.symptom}-${rowIdx}`}>
                    <td className="px-3 py-2 text-text-light">{row.symptom}</td>
                    {medicines.map((med, i) => {
                      const grade = row.grades[i] ?? 0;
                      return (
                        <td key={`${med}-${i}`} className={`px-3 py-2 text-center ${gradeStyle(grade)}`}>
                          {grade > 0 ? grade : "·"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
