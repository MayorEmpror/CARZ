import { Named_Car_Perf, Car_Perf, CustomRes, AddPerfFormData} from "@/lib/types"


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


export async function AddCarPerformance(data: AddPerfFormData): Promise<CustomRes>{
  try{
    const res = await fetch("/api/carperf",{
      method: "POST",
      headers : {"Content-Type" : "application/json"},
      body : JSON.stringify({
        car_id : data.car_id,
        mileage : data.mileage,
        top_speed : data.top_speed,
        acceleration_0_100 :data.acceleration_0_100 ,  
        engine_power : data.engine_power,          
        torque : data.torque,                   
        fuel_efficiency : data.fuel_efficiency,   
      }),
    });
    if(!res.ok){
      const errorBody = await res.json().catch(() => null);
      return {
        success: false,
        message: errorBody?.message ?? "Failed to create listing",
      };
    }
    return {
      success: true,
      message: "Car added successfully",
    };
  } catch(err) {
    return {
      success: false,
      message: "Network error",
    };
  }
}
