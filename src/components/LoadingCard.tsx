"use client";

import { useEffect, useState } from "react";

export default function LoadingCard({ label }: { label: string }) {
  // Mounts fresh each time a loading step starts (parent only renders this
  // component while that step is in flight), so elapsed naturally starts at 0.
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 rounded-input border border-dashed border-border-light bg-input-bg-light px-6 py-8 text-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent-mid border-t-accent" />
      <p className="text-sm font-medium text-text-light">{label}</p>
      <p className="text-xs text-text-muted-light">
        Running locally on-device ({elapsed}s elapsed) — this can take anywhere from a few seconds to
        several minutes depending on system load.
      </p>
    </div>
  );
}
