"use client";

import { useId } from "react";
import { XIcon } from "lucide-react";
import type { Car } from "@/lib/types";

const inputClass =
  "w-full h-9 rounded-lg border border-white/10 bg-[#0F0F14] px-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-violet-300/50 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-neutral-500 text-xs">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

interface CarEditFormProps {
  editData: Partial<Car>;
  setField: (field: keyof Car, value: string | number) => void;
  file: File | null;
  preview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
  uploading: boolean;
  onSave: () => void;
  onCancel: () => void;
}

 

export function CarEditForm({
  editData,
  setField,
  file,
  preview,
  fileInputRef,
  onSelectFile,
  saving,
  uploading,
  onSave,
  onCancel,
}: CarEditFormProps) {
  const uniqueId = useId();

  return (
    // h-full + flex-col so the header/footer stay pinned and only the
    // middle fields section scrolls if the form is taller than the card.
    <div className="w-full h-full flex flex-col">
      <form
        className="flex flex-col h-full min-h-0"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-white font-semibold">Edit vehicle</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-500 hover:text-white transition-colors"
            aria-label="Close popover"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Scrollable field area — this is what prevents clipping when the
            form content is taller than the card's fixed height. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Make">
              <input
                value={editData.make ?? ""}
                onChange={(e) => setField("make", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Model">
              <input
                value={editData.model ?? ""}
                onChange={(e) => setField("model", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Year">
              <input
                type="number"
                value={editData.year ?? ""}
                onChange={(e) => setField("year", Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Price / day">
              <input
                value={editData.price ?? ""}
                onChange={(e) => setField("price", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Status">
            <select
              value={editData.status ?? ""}
              onChange={(e) => setField("status", e.target.value)}
              className={inputClass}
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rating">
              <input
                value={editData.rating ?? ""}
                onChange={(e) => setField("rating", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Rating count">
              <input
                type="number"
                value={editData.rating_count ?? ""}
                onChange={(e) => setField("rating_count", Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="pb-5">
            <label className="block text-sm text-[#8B9299] mb-2">Photo</label>
            <label
              htmlFor={`car-photo-${uniqueId}`}
              className="flex items-center gap-4 bg-[#1C2126] border border-white/5 rounded-xl p-3 cursor-pointer hover:border-white/10 transition-colors"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Selected car" className="w-14 h-14 object-cover rounded-lg" />
              ) : editData.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editData.image_url} alt="Current car" className="w-14 h-14 object-cover rounded-lg" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-[#262C33] flex items-center justify-center text-[#8B9299] text-xl">
                  +
                </div>
              )}
              <span className="text-sm text-[#8B9299]">
                {uploading ? "Uploading..." : file ? file.name : "Choose an image"}
              </span>
              <input
                id={`car-photo-${uniqueId}`}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="shrink-0 flex justify-between items-center px-5 py-4 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-violet-300 hover:bg-violet-400 disabled:opacity-50 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? (uploading ? "Uploading..." : "Saving...") : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}