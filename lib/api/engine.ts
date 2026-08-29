import { Engine } from "@/lib/types";

export async function getCarEngineById(car_id: number): Promise<Engine> {
  const res = await fetch(`${process.env.HOST}/api/engine?car_id=${car_id}`,
      {cache : "no-store" }
  )
  if (!res.ok) {
    throw new Error("failed to fetch engine")
  }
  return res.json();
}

