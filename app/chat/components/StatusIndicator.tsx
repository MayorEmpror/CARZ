

import { Mic, CheckCheck, Paperclip } from "lucide-react";
import type { StatusIcon } from "./types";

export function StatusIndicator({ status }: { status?: StatusIcon }) {
  switch (status) {
    case "typing":
      return <span className="text-blue-400 text-xs truncate">Typing</span>;
    case "voice":
      return (
        <span className="flex items-center gap-1 text-zinc-500 text-xs truncate">
          <Mic className="w-3 h-3" /> Voice message (0:35)
        </span>
      );
    case "sent":
      return <CheckCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case "attachment":
      return <Paperclip className="w-3.5 h-3.5 text-zinc-500 shrink-0" />;
    case "location":
      return <span className="w-3.5 h-3.5 rounded-full bg-pink-500 shrink-0" />;
    default:
      return null;
  }
}