"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { Crown, MapPin, Building2 } from "lucide-react";

interface Data {
  user: User;
}

export default function TopBar({ user }: Data) {
  const router = useRouter();
  const [time, setTime] = useState<string>("");
  const [hasOwnerAccount, setHasOwnerAccount] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkOwnerAccount() {
      try {
        const res = await fetch("/api/isOwner");
        console.log("[owner-status] status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          console.log("[owner-status] error body:", text);
          return;
        }

        const data = await res.json();
        console.log("[owner-status] response body:", data.hasOwnerAccount);
        console.log("data: a;slkdfja;sdlkas;flk " + data)
        if (!cancelled) setHasOwnerAccount(Boolean(data.hasOwnerAccount));
      } catch (err) {
        console.error("[owner-status] fetch threw:", err);
      }
    }

    checkOwnerAccount();
    return () => {
      cancelled = true;
    };
  }, [user.user_id]);

  async function handleSwitchToOwner() {
    if (switching) return;
    setSwitching(true);

    try {
      const res = await fetch("/api/switchUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: "owner" }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error(result?.message ?? "Failed to switch to owner mode.");
        setSwitching(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setSwitching(false);
    }
  }
 console.log(hasOwnerAccount)
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#131318] px-5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
          <div className="h-3 w-3 rounded-full bg-[#131318]" />
        </div>
        <span className="text-sm font-semibold leading-tight tracking-wide text-white">
          CARZ
        </span>
      </div>

      <div className="flex items-center gap-6 text-xs text-neutral-400">
        <span>
          {time || "--:--"} <span className="text-neutral-500">(UTC-7)</span>
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {user.full_name}
        </span>
      </div>

      <div className="flex items-center gap-3">
       
        {hasOwnerAccount && (
          <button
            onClick={handleSwitchToOwner}
            disabled={switching}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Building2 className="h-3.5 w-3.5" />
            {switching ? "Switching..." : "Switch to Owner mode"}
          </button>
        )}

        <button className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#131318] hover:bg-neutral-200">
          <Crown className="h-3.5 w-3.5" />
          PRO features
        </button>

        <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
          <img src="/avatar.jpg" alt="Account" className="h-full w-full object-cover" />
        </div>
      </div>
    </header>
  );
}