import { useRef, useState } from "react";
import type { Car } from "@/lib/types";
import { editCars } from "@/lib/api/car";

async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Image upload failed");
  return res.json();
}

export function useCarEditor(car: Car, onUpdate: (car: Car) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Car>>(car);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetPhotoState() {
    setFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function open(nextOpen: boolean) {
    setEditData(car);
    resetPhotoState();
    setIsOpen(nextOpen);
  }

  function setField(field: keyof Car, value: string | number) {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }

  function selectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }

  async function save() {
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
      open(false);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return {
    isOpen,
    open,
    editData,
    setField,
    saving,
    uploading,
    file,
    preview,
    fileInputRef,
    selectFile,
    save,
  };
}