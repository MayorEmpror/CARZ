import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

interface CarVisualizerStateContext {
  mode: "normal" | "wireframe"
}
type CVSC = CarVisualizerStateContext
const CarVisualizerState = createContext<[CVSC, Dispatch<SetStateAction<CVSC>>] | null>(null)
const useCarVisualizer = () => useContext(CarVisualizerState)

export {
  useCarVisualizer,
  CarVisualizerState
}

export type {
  CarVisualizerStateContext
}