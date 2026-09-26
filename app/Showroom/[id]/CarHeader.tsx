'use client'

import CarModelViewer from "@/components/CarModelViewer/CarModelViewer"
import CarNav from "./Carnav"
import { useState } from "react"
import { CarVisualizerState, CarVisualizerStateContext } from "./CarContext"
import { carDetails } from "@/lib/api/car"
import Image from "next/image"

const CarHeader = ({ id, model_path, mode }: { id: string, model_path: string, mode: "normal" | 'wireframe' }) => {
  const carVisualizerState = useState<CarVisualizerStateContext>({ mode: mode })
  return (
    <CarVisualizerState.Provider value={carVisualizerState}>
      <CarModelViewer modelUrl={model_path}/>

      {/* Top nav */}
      <div className="sticky">
        <div className="relative z-10 flex items-center justify-between px-8 py-6 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md invert">
              <Image src="/logo.png" width={400} height={400} alt="AutoLink Logo"/>
            </div>
            <div>
              <p className="text-white font-semibold leading-none">AutoLink</p>
              <p className="text-neutral-500 text-[10px] leading-none mt-0.5">Premium Cars Collection</p>
            </div>
          </div>
          <CarNav id={id} />
        </div>
      </div>
    </CarVisualizerState.Provider>
  )
}

export default CarHeader