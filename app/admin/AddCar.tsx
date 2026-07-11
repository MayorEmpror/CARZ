"use client";

import { useState, useRef } from "react";
import { AddCarFormState } from "@/lib/types";
import { Addcars } from "@/lib/api/car"; // adjust path to match your project

const BODY_TYPES = ["Sedan", "SUV", "Hatchback", "Coupe", "Convertible", "Truck", "Van"];
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"];
const TRANSMISSIONS = ["Automatic", "Manual"];

type FormErrors = Partial<Record<keyof AddCarFormState, string>>;

const initialForm: AddCarFormState = {
  owner_id: 1, // TODO: replace with authenticated user id
  make: "",
  model: "",
  year: "",
  price: "",
  body_type: "",
  fuel_type: "",
  transmission: "",
};

export default function AddCar() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState<AddCarFormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof AddCarFormState>(key: K, value: AddCarFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    const currentYear = new Date().getFullYear();

    if (!form.make.trim()) next.make = "Enter a make";
    if (!form.model.trim()) next.model = "Enter a model";

    const yearNum = Number(form.year);
    if (!form.year) next.year = "Enter a year";
    else if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      next.year = `Enter a year between 1900 and ${currentYear + 1}`;
    }

    const priceNum = Number(form.price);
    if (!form.price) next.price = "Enter a price";
    else if (Number.isNaN(priceNum) || priceNum <= 0) next.price = "Enter a valid price";

    if (!form.body_type) next.body_type = "Select a body type";
    if (!form.fuel_type) next.fuel_type = "Select a fuel type";
    if (!form.transmission) next.transmission = "Select a transmission";

    return next;
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Image upload failed");
    return res.json();
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");

    const nextErrors = validate();
    if (!file) {
      setStatusMessage("Add a photo of the car before submitting.");
      setStatus("error");
      return;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const upload = await uploadImage(file);

      const result = await Addcars({ ...form, url: upload.url });

      if (!result.success) {
        setStatus("error");
        setStatusMessage(result.message);
        return;
      }

      setStatus("success");
      setStatusMessage(result.message);
      setForm(initialForm);
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#E8EAED] flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#14181C] border border-white/5 rounded-2xl p-6 space-y-5 shadow-2xl"
      >
        <div>
          <h1 className="text-lg font-semibold">List a car</h1>
          <p className="text-sm text-[#8B9299] mt-1">Add the details below to publish a new listing.</p>
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm text-[#8B9299] mb-2">Photo</label>
          <label
            htmlFor="car-photo"
            className="flex items-center gap-4 bg-[#1C2126] border border-white/5 rounded-xl p-3 cursor-pointer hover:border-white/10 transition-colors"
          >
            {preview ? (
              <img src={preview} alt="Selected car" className="w-14 h-14 object-cover rounded-lg" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#262C33] flex items-center justify-center text-[#8B9299] text-xl">
                +
              </div>
            )}
            <span className="text-sm text-[#8B9299]">
              {file ? file.name : "Choose an image"}
            </span>
            <input
              id="car-photo"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Make / Model */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make" error={errors.make}>
            <input
              value={form.make}
              onChange={(e) => updateField("make", e.target.value)}
              placeholder="e.g. Toyota"
              className={inputClass(!!errors.make)}
            />
          </Field>
          <Field label="Model" error={errors.model}>
            <input
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              placeholder="e.g. Corolla"
              className={inputClass(!!errors.model)}
            />
          </Field>
        </div>

        {/* Year / Price */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year" error={errors.year}>
            <input
              type="number"
              inputMode="numeric"
              value={form.year}
              onChange={(e) => updateField("year", e.target.value)}
              placeholder="2022"
              className={inputClass(!!errors.year)}
            />
          </Field>
          <Field label="Price" error={errors.price}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B9299] text-sm">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="18,500"
                className={`${inputClass(!!errors.price)} pl-6`}
              />
            </div>
          </Field>
        </div>

        {/* Body type */}
        <Field label="Body type" error={errors.body_type}>
          <select
            value={form.body_type}
            onChange={(e) => updateField("body_type", e.target.value)}
            className={selectClass(!!errors.body_type)}
          >
            <option value="" disabled>Select body type</option>
            {BODY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        {/* Fuel / Transmission */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fuel type" error={errors.fuel_type}>
            <select
              value={form.fuel_type}
              onChange={(e) => updateField("fuel_type", e.target.value)}
              className={selectClass(!!errors.fuel_type)}
            >
              <option value="" disabled>Select</option>
              {FUEL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Transmission" error={errors.transmission}>
            <select
              value={form.transmission}
              onChange={(e) => updateField("transmission", e.target.value)}
              className={selectClass(!!errors.transmission)}
            >
              <option value="" disabled>Select</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>

        {status !== "idle" && (
          <div
            className={`text-sm rounded-lg px-3 py-2 ${
              status === "success"
                ? "bg-[#1E3A2E] text-[#6FCF97] border border-[#2E5240]"
                : "bg-[#3A1E1E] text-[#F28B82] border border-[#523030]"
            }`}
          >
            {statusMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#6FCF97] hover:bg-[#5FBF88] disabled:opacity-60 disabled:cursor-not-allowed text-[#0B0E11] font-semibold rounded-xl py-3 transition-colors"
        >
          {submitting ? "Adding car…" : "Add car"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-[#8B9299] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-[#F28B82] mt-1">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full bg-[#1C2126] border rounded-xl px-3 py-2.5 text-sm text-[#E8EAED] placeholder:text-[#5B6169] outline-none focus:border-[#6FCF97]/60 transition-colors ${
    hasError ? "border-[#F28B82]/60" : "border-white/5"
  }`;
}

function selectClass(hasError: boolean) {
  return `w-full bg-[#1C2126] border rounded-xl px-3 py-2.5 text-sm text-[#E8EAED] outline-none focus:border-[#6FCF97]/60 transition-colors appearance-none ${
    hasError ? "border-[#F28B82]/60" : "border-white/5"
  }`;
}