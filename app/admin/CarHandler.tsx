"use client";

import { useId, useRef, useState } from "react";
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from "@/components/motion-primitives/morphing-popover";
import { XIcon, PencilIcon, StarIcon } from "lucide-react";
import type { Car } from "@/lib/types";
import { editCars } from "@/lib/api/car";

interface Props {
  initialCars: Car[];
}

const inputClass =
  "w-full h-9  rounded-lg border border-white/10 bg-[#0F0F14] px-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-violet-300/50 transition-colors";

async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload failed");
  return res.json();
}

export default function CarTab({ initialCars }: Props) {
  const [cars, setCars] = useState(initialCars);

  function handleCarUpdate(updated: Car) {
    setCars((prev) => prev.map((c) => (c.car_id === updated.car_id ? updated : c)));
  }

  return (
    <div className="min-h-screen bg-[#0B0B10] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-semibold">Manage Vehicles</h1>
          <p className="text-neutral-500 text-sm mt-1">{cars.length} vehicles in the fleet</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <CarCard key={car.car_id} car={car} onUpdate={handleCarUpdate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isAvailable = status.toLowerCase() === "available";
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        isAvailable ? "bg-green-500/20 text-green-400" : "bg-neutral-700 text-neutral-300"
      }`}
    >
      {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-neutral-500 text-xs">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function CarCard({ car, onUpdate }: { car: Car; onUpdate: (car: Car) => void }) {
  const uniqueId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Car>>(car);
  const [saving, setSaving] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetPhotoState() {
    setFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(open: boolean) {
    setEditData(car);
    resetPhotoState();
    setIsOpen(open);
  }

  function handleChange(field: keyof Car, value: string | number) {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      let payload = editData;

      if (file) {
        setUploading(true);
        const { url } = await uploadImage(file);
        payload = { ...payload, image_url: url };
        setUploading(false);
      }

      const updated = await editCars(car.car_id, payload);
      onUpdate(updated);
      setIsOpen(false);
      resetPhotoState();
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return (
    <MorphingPopover
      transition={{ type: "spring", bounce: 0.05, duration: 0.3 }}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <MorphingPopoverTrigger className="block w-full text-left rounded-2xl border border-white/5 bg-[#131318] overflow-hidden hover:border-white/10 transition-colors p-0">
        <div className="flex flex-col">
          <div className="px-5 pt-5 flex items-center justify-between">
            <h3 className="text-white font-semibold">
              {car.make} {car.model}
            </h3>
            <StatusBadge status={car.status} />
          </div>

          <div className="relative h-[180px] mt-2 bg-linear-to-b from-neutral-800 to-neutral-900 group cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={car.image_url}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-contain p-4"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full">
                <PencilIcon size={12} /> Edit
              </span>
            </div>
          </div>

          <div className="px-5 pb-5 pt-3 flex items-center justify-between">
            <div>
              <p className="text-white text-xl font-semibold">
                {car.price}
                <span className="text-neutral-500 text-xs font-normal"> €/day</span>
              </p>
              <p className="text-neutral-500 text-xs mt-0.5">{car.year}</p>
            </div>
            <div className="flex items-center gap-1">
              <StarIcon size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="text-white text-sm font-medium">{car.rating}</span>
              <span className="text-neutral-500 text-xs">({car.rating_count})</span>
            </div>
          </div>
        </div>
      </MorphingPopoverTrigger>

      <MorphingPopoverContent className="rounded-2xl border border-white/10 bg-[#131318] p-0 shadow-[0_9px_30px_0px_rgba(0,0,0,0.4)]">
        <div className="w-[340px]">
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <h3 className="text-white font-semibold">Edit vehicle</h3>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="text-neutral-500 hover:text-white transition-colors"
                aria-label="Close popover"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="px-5 pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Make">
                  <input
                    value={editData.make ?? ""}
                    onChange={(e) => handleChange("make", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Model">
                  <input
                    value={editData.model ?? ""}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Year">
                  <input
                    type="number"
                    value={editData.year ?? ""}
                    onChange={(e) => handleChange("year", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Price / day">
                  <input
                    value={editData.price ?? ""}
                    onChange={(e) => handleChange("price", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Status">
                <select
                  value={editData.status ?? ""}
                  onChange={(e) => handleChange("status", e.target.value)}
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
                    onChange={(e) => handleChange("rating", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Rating count">
                  <input
                    type="number"
                    value={editData.rating_count ?? ""}
                    onChange={(e) => handleChange("rating_count", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div>
                <label className="block text-sm text-[#8B9299] mb-2">Photo</label>
                <label
                  htmlFor={`car-photo-${uniqueId}`}
                  className="flex items-center gap-4 bg-[#1C2126] border border-white/5 rounded-xl p-3 cursor-pointer hover:border-white/10 transition-colors"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Selected car"
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                  ) : editData.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editData.image_url}
                      alt="Current car"
                      className="w-14 h-14 object-cover rounded-lg"
                    />
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
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center px-5 py-4 mt-1">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
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
      </MorphingPopoverContent>
    </MorphingPopover>
  );
}