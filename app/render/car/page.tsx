// app/render/car/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import CarModelViewer from "@/components/CarModelViewer/CarModelViewer";

export default function RenderCarPage() {
  const params = useSearchParams();
  const modelUrl = params.get("modelUrl") ?? "";
  const angle = (params.get("angle") ?? "three-quarter") as any;

  return (
    <CarModelViewer
      modelUrl={modelUrl}
      mode="renderer"
      angle={angle}
      onReady={() => {
        // @ts-ignore
        window.__renderReady = true;
      }}
    />
  );
}