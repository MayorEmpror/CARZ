export function StatusBadge({ status }: { status: string }) {
    const isAvailable = status.toLowerCase() === "available";
    return (
      <span
        className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
          isAvailable ? "bg-green-500/20 text-green-400" : "bg-neutral-700 text-neutral-300"
        }`}
      >
        {status}
      </span>
    );
  }