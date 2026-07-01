"use client";

import { useEffect, useState } from "react";
import { Crown, MapPin } from "lucide-react";

export default function TopBar() {
  const [time, setTime] = useState<string>("");

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

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900">
          <div className="h-3 w-3 rounded-full bg-white" />
        </div>
        <span className="text-sm font-semibold leading-tight tracking-wide">
          AUTO
          <br />
          ULTIMATE
        </span>
      </div>

      <div className="flex items-center gap-6 text-xs text-neutral-500">
        <span>
          {time || "--:--"} <span className="text-neutral-400">(UTC-7)</span>
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          San Francisco, US
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800">
          <Crown className="h-3.5 w-3.5" />
          PRO features
        </button>
        <div className="h-8 w-8 overflow-hidden rounded-full bg-neutral-200">
          <img
            src="/avatar.jpg"
            alt="Account"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}