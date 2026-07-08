"use client";
import { User } from "@/lib/types";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

type Props = {
  initialOnwers: User[];
};

export function OwnerTab({ initialOnwers }: Props) {
  const [owners, setOwners] = useState<User[]>(initialOnwers);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Owners</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {owners.length} owners registered
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-800">
        {owners.map((owner, idx) => (
          <div
            key={owner.user_id}
            onMouseEnter={() => setHoveredId(owner.user_id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`grid grid-cols-[40px_180px_1fr_1fr_140px_160px_40px] items-center gap-4 px-2 py-4 border-b border-zinc-800 transition-colors ${
              hoveredId === owner.user_id ? "bg-zinc-900" : ""
            }`}
          >
            {/* Row number */}
            <span className="text-neutral-500 text-sm">{idx + 1}</span>

            {/* User ID */}
            <span className="text-neutral-400 text-sm font-mono truncate">
              user_{owner.user_id}
            </span>

            {/* Name — highlighted pill on hover, like the screenshot */}
            <span
              className={`text-sm font-medium truncate w-fit px-2 py-1 rounded-md transition-colors ${
                hoveredId === owner.user_id
                  ? "border border-zinc-600 bg-zinc-800"
                  : ""
              }`}
            >
              {owner.full_name}
            </span>

            {/* Email */}
            <span className="text-neutral-300 text-sm truncate">
              {owner.email}
            </span>

            {/* Phone */}
            <span className="text-neutral-300 text-sm truncate">
              {owner.phone || "—"}
            </span>

            {/* Role */}
            <span className="text-neutral-300 text-sm capitalize truncate">
              {owner.role}
            </span>

            {/* Actions */}
            <button className="text-neutral-500 hover:text-white transition-colors justify-self-end">
              <MoreHorizontal size={18} />
            </button>
          </div>
        ))}
      </div>

      {owners.length === 0 && (
        <p className="text-neutral-500 text-sm mt-6">No owners found.</p>
      )}
    </div>
  );
}