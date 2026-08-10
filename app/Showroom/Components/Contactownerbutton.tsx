"use client";

// components/chat/ContactOwnerButton.tsx
//
// Drop-in replacement for the static "Contact" nav button on the car
// details page. On click: calls POST /api/chat/conversations to
// create-or-resume a thread with this car's owner, then navigates to
// /chat/[conversationId].
//
// Kept deliberately unstyled beyond what's passed in via `className`
// so it can slot into the existing nav button loop without fighting
// its styling.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ContactOwnerButtonProps {
  carId: number;
  className?: string;
}

export default function ContactOwnerButton({ carId, className }: ContactOwnerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ car_id: carId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Most likely: 400 "own car" or 401 not logged in.
        setError(data.error ?? "Couldn't start conversation");
        setLoading(false);
        return;
      }

      router.push(`/chat/${data.conversation_id}`);
      // Deliberately not setLoading(false) here — we're navigating
      // away, no need to flicker the button back to its idle state
      // right before the page changes.
    } catch (err) {
      console.error("[chat] failed to start conversation:", err);
      setError("Something went wrong — try again");
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Starting…" : "Contact"}
      </button>
      {error && (
        <p className="absolute top-full mt-1 right-0 whitespace-nowrap text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}