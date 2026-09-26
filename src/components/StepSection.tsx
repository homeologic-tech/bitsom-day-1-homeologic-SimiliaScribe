export default function StepSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border-light bg-card-light p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-light">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-text-muted-light">{description}</p>}
        </div>
      </div>
      <div className="mt-4 pl-10">{children}</div>
    </section>
  );
}
