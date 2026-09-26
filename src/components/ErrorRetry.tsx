"use client";

export default function ErrorRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-input border border-danger-light bg-danger-light px-4 py-3">
      <p className="text-sm font-medium text-danger">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-button border border-danger bg-white px-3 py-1 text-xs font-semibold text-danger hover:bg-danger-light"
      >
        Retry
      </button>
    </div>
  );
}
