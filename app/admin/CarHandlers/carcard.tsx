"use client";

import { PencilIcon, StarIcon } from "lucide-react";
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from "@/components/motion-primitives/morphing-popover";
import type { Car } from "@/lib/types";
import { useCarEditor } from "../hooks/use-car-editor";
import { StatusBadge } from "./statusbadge";
import { CarEditForm } from "./careditform";
import { cn } from "@/lib/utils";

export function CarCard({ car, onUpdate }: { car: Car; onUpdate: (car: Car) => void }) {
  const editor = useCarEditor(car, onUpdate);

  return (
    <MorphingPopover
      transition={{ type: "spring", bounce: 0.05, duration: 0.3 }}
      open={editor.isOpen}
      onOpenChange={editor.open}
      className="w-full"
    >
      <MorphingPopoverTrigger
        className={cn(
          "relative block w-full  h-[420px]  overflow-hidden group text-left border border-white/10 hover:border-white/20 transition-colors",
          // Hide the trigger while the editor is open instead of letting it
          // sit visible underneath the content — it still reserves its
          // height (so the grid cell doesn't collapse/jump), it's just not
          // seen or clickable anymore.
          editor.isOpen && "invisible pointer-events-none"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={car.image_url}
          alt={`${car.make} ${car.model}`}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
        <div className="absolute inset-0 bg-linear-to-t from-[#131318] via-transparent to-[#131318]/70" />

        <div className="relative z-10 flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-white text-2xl font-bold leading-tight truncate min-w-0">
              {car.make} {car.model}
            </h3>
            <StatusBadge status={car.status} />
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white text-2xl font-bold truncate">
                {car.price}
                <span className="text-neutral-300 text-base font-normal"> €/day</span>
              </p>
              <p className="text-neutral-300 text-sm mt-0.5">{car.year}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <StarIcon size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="text-white text-base">{car.rating}</span>
              <span className="text-neutral-300 text-sm">({car.rating_count})</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <span className="bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2">
            <PencilIcon size={14} />
            Edit
          </span>
        </div>
      </MorphingPopoverTrigger>

      <MorphingPopoverContent className="inset-0 z-30 w-full h-full rounded-2xl border border-white/10 bg-[#131318] p-0 shadow-[0_9px_30px_0px_rgba(0,0,0,0.4)]">
        <CarEditForm
          editData={editor.editData}
          setField={editor.setField}
          file={editor.file}
          preview={editor.preview}
          fileInputRef={editor.fileInputRef}
          onSelectFile={editor.selectFile}
          saving={editor.saving}
          uploading={editor.uploading}
          onSave={editor.save}
          onCancel={() => editor.open(false)}
        />
      </MorphingPopoverContent>
    </MorphingPopover>
  );
}