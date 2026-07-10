"use client";

import { XIcon } from "lucide-react";

export const inputClass =
  "w-full h-9 rounded-lg border border-white/10 bg-[#0F0F14] px-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-violet-300/50 transition-colors";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-neutral-500 text-xs">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

type PerfModalShellProps = {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
};

/**
 * Centered modal overlay (backdrop + card). CarEditForm was a popover
 * positioned by its parent; this is a true modal since these forms are
 * triggered from buttons ("Add Performance" and the card's "...") rather
 * than an inline row anchor.
 */
export function PerfModalShell({ title, onCancel, children, footer }: PerfModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onMouseDown={(e) => {
        // close only when the backdrop itself is clicked, not the card
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md max-h-[85vh] rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-white font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-500 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-3">{children}</div>

        <div className="shrink-0 flex justify-between items-center px-5 py-4 border-t border-white/5">
          {footer}
        </div>
      </div>
    </div>
  );
}