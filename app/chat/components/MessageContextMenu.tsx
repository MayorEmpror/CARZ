
import { Plus } from "lucide-react";
import { REACTION_EMOJIS, CONTEXT_MENU_ACTIONS } from "./data";

export function MessageContextMenu({
  onAction,
  onReact,
}: {
  onAction: (key: string) => void;
  onReact: (emoji: string) => void;
}) {
  return (
    <div className="absolute right-0 top-0 z-20 flex items-start gap-2">
      {/* Vertical reaction picker */}
      <div className="flex flex-col items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full py-2 px-1.5 shadow-xl">
        {REACTION_EMOJIS.map(({ icon: Icon, value }) => (
          <button
            key={value}
            onClick={() => onReact(value)}
            title={value}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            <Icon className="w-4 h-4 text-zinc-300" />
          </button>
        ))}
        <button
          onClick={() => console.log("[Chats] open full emoji picker")}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-400"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Actions list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-2 shadow-xl w-40">
        {CONTEXT_MENU_ACTIONS.map(({ key, label, icon: Icon, danger }) => (
          <button
            key={key}
            onClick={() => onAction(key)}
            className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
              danger
                ? "text-red-400 hover:bg-zinc-800"
                : "text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}