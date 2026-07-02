"use client";

import { useState } from "react";

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  return res.json();
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  async function handleUpload() {
    if (!file) return;
    console.log("uploading")
    const res = await uploadImage(file);
    setImageUrl(res.url);
    console.log("url : " + res.url)
  }

  return (
    <div className="p-6">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
       className="bg-red-800 rounded p-10"
       onClick={handleUpload}>
        Upload
      </button>

      {imageUrl && (
        <div>
          <p>Uploaded Image:</p>
          <img src={imageUrl} width={200} />
        </div>
      )}
    </div>
  );
}