import { Named_Car_Perf, Car_Perf} from "@/lib/types"


export async function getPerf(id: string): Promise<Car_Perf> {
  const res = await fetch(`${process.env.HOST}/api/carperf/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch car performance");
  }

  return res.json();
}


export async function getAllPerfMetric(): Promise<Named_Car_Perf[]>{
  const res = await fetch(`${process.env.HOST}/api/carperf`, {
    cache : "no-store",
  })
  if(!res.ok){
    throw new Error("Failed to fetch car performance")
  }
  return res.json()
}
