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

async function uploadModel(file: File): Promise<{ url: string }> {
  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch("/api/upload-model", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Upload model error:", data);
    throw new Error(data.error || "Model upload failed");
  }

  return data;
}






export function useCarEditor(
  car: Car,
  onUpdate: (car: Car) => void
) {

  const [isOpen, setIsOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Car>>(car);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);


  // Image
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);


  // 3D Model
  const [modelFile, setModelFile] = useState<File | null>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);



  function resetPhotoState() {

    setFile(null);

    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (fileInputRef.current)
      fileInputRef.current.value = "";
  }



  function resetModelState(){

    setModelFile(null);

    if(modelInputRef.current)
      modelInputRef.current.value = "";

  }



  function open(nextOpen: boolean) {

    setEditData(car);

    resetPhotoState();

    resetModelState();

    setIsOpen(nextOpen);
  }



  function setField(
    field: keyof Car,
    value: string | number
  ) {

    setEditData((prev)=>({
      ...prev,
      [field]:value
    }));

  }



  function selectFile(
    e: React.ChangeEvent<HTMLInputElement>
  ){

    const selected =
      e.target.files?.[0];

    if(!selected) return;


    setFile(selected);

    setPreview((prev)=>{

      if(prev)
        URL.revokeObjectURL(prev);

      return URL.createObjectURL(selected);

    });

  }



  function selectModel(
    e: React.ChangeEvent<HTMLInputElement>
  ){

    const selected =
      e.target.files?.[0];


    if(!selected)
      return;


    if(!selected.name.endsWith(".glb")){

      alert("Only .glb files are allowed");

      return;

    }


    setModelFile(selected);

  }


  async function save() {
    setSaving(true);
  
    try {
      let payload = { ...editData };
  
      // Upload image
      if (file) {
        setUploading(true);
  
        const { url } = await uploadImage(file);
  
        payload = {
          ...payload,
          image_url: url,
        };
  
        setUploading(false);
      }
  
  
      // Upload 3D model
      if (modelFile) {
        setUploading(true);
  
        const { url } = await uploadModel(modelFile);
  
        payload = {
          ...payload,
          model_path: url,
        };
  
        setUploading(false);
      }
  
  
      const updated = await editCars(
        car.car_id,
        payload
      );
  
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

    // image
    file,
    preview,
    fileInputRef,
    selectFile,


    // model
    modelFile,
    modelInputRef,
    selectModel,


    save,

  };

}