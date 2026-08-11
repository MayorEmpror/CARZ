"use client";

import { useState } from "react";
import {
  Bell,
  Folder,
  Link2,
  UserPlus,
  FileText,
  ImageIcon,
} from "lucide-react";

// ---- types ---------------------------------------------------------
export interface ConversationMember {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  role?: "Admin" | "Member";
}

export interface ConversationFile {
  id: number;
  type: "image" | "document";
  url: string;
  name?: string;
}

export interface ConversationLink {
  id: number;
  url: string;
  title?: string;
}

interface ConversationInfoPanelProps {
  members: ConversationMember[];
  media: ConversationFile[];
  documents: ConversationFile[];
  links: ConversationLink[];
  onAddMember?: () => void;
}

type Tab = "Media" | "Document" | "Links";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function colorForUser(userId: number) {
  const palette = [
    "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500",
    "bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-violet-500",
    "bg-fuchsia-500", "bg-pink-500",
  ];
  return palette[userId % palette.length];
}

export default function ConversationInfoPanel({
  members,
  media,
  documents,
  links,
  onAddMember,
}: ConversationInfoPanelProps) {
 
  const [tab, setTab] = useState<Tab>("Media");


  const visibleMedia = media.slice(0, 5);
  const remainingCount = media.length - visibleMedia.length;

  return (
    <div className="flex flex-col">
      {/* Notifications header */}
  

      {/* Files / Links stat cards */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <div className="rounded-2xl border border-white/5 bg-white/3 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
            <Folder className="h-4.5 w-4.5 text-amber-400" strokeWidth={1.75} />
          </div>
          <div className="mt-3 text-sm font-semibold text-white">Files</div>
          <div className="text-xs text-neutral-500">{documents.length}</div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/3 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15">
            <Link2 className="h-4.5 w-4.5 text-blue-400" strokeWidth={1.75} />
          </div>
          <div className="mt-3 text-sm font-semibold text-white">Links</div>
          <div className="text-xs text-neutral-500">{links.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex items-center gap-2 px-4">
        {(["Media", "Document", "Links"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-blue-500 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4 px-4">
        {tab === "Media" && (
          <div className="grid grid-cols-3 gap-2">
            {visibleMedia.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center gap-2 py-8 text-xs text-neutral-500">
                <ImageIcon className="h-5 w-5" strokeWidth={1.5} />
                No media yet
              </div>
            )}
            {visibleMedia.map((item, i) => {
              const isLast = i === visibleMedia.length - 1 && remainingCount > 0;
              return (
                <div
                  key={item.id}
                  className="relative aspect-square overflow-hidden rounded-xl bg-neutral-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.name ?? ""} className="h-full w-full object-cover" />
                  {isLast && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-medium text-white">
                      +{remainingCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "Document" && (
          <div className="flex flex-col gap-2">
            {documents.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-xs text-neutral-500">
                <FileText className="h-5 w-5" strokeWidth={1.5} />
                No documents yet
              </div>
            )}
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-3 py-2.5 text-xs text-neutral-200 transition hover:bg-white/6"
              >
                <FileText className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.75} />
                <span className="truncate">{doc.name ?? doc.url}</span>
              </a>
            ))}
          </div>
        )}

        {tab === "Links" && (
          <div className="flex flex-col gap-2">
            {links.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-xs text-neutral-500">
                <Link2 className="h-5 w-5" strokeWidth={1.5} />
                No links yet
              </div>
            )}
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-3 py-2.5 text-xs text-neutral-200 transition hover:bg-white/6"
              >
                
                <Link2 className="h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.75} />
                <span className="truncate">{link.title ?? link.url}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Add member */}
      <div className="mt-5 px-4">
        <button
          onClick={onAddMember}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 py-3 text-sm font-medium text-white transition hover:bg-blue-400"
        >
          <UserPlus className="h-4 w-4" strokeWidth={1.75} />
          Add member
        </button>
      </div>

      {/* Member list */}
      <div className="mt-4 flex flex-col divide-y divide-white/5 border-t border-white/5 px-4 pb-4">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {m.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatar_url} alt={m.full_name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${colorForUser(
                    m.user_id
                  )}`}
                >
                  {initials(m.full_name)}
                </div>
              )}
              <span className="text-sm text-neutral-200">{m.full_name}</span>
            </div>
            {m.role && <span className="text-xs text-neutral-500">{m.role}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}