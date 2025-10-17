type Status =
  | { type: "idle" }
  | { type: "loading"; message: string }
  | { type: "error"; message: string };

interface StatusMessageProps {
  status: Status;
}

export function StatusMessage({ status }: StatusMessageProps) {
  if (status.type === "idle") return null;

  if (status.type === "loading") {
    return (
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">{status.message}</p>
      </div>
    );
  }

  if (status.type === "error") {
    return (
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{status.message}</p>
      </div>
    );
  }

  return null;
}

export type { Status };
