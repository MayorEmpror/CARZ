import {Car} from "@/lib/types"
import { CarDetails } from "@/lib/types";
import { AddCarFormData} from "@/lib/types"
import { CustomRes } from "@/lib/types";


export async function getCars(): Promise<Car[]> {
    const res = await fetch(`${process.env.HOST}/api/cars`, {
      cache: "no-store",
    });
  
    return res.json();
}

export async function carDetails(id : string): Promise<CarDetails>{
    const res = await fetch(`${process.env.HOST}/api/details/${id}`,{
        cache: "no-store",
    });
    if(!res.ok ){
        console.log("res: "+ res)
        throw new Error("Failed to fetch car performance");
    }
    return res.json();
    
}



export async function editCars(id: number, data : Partial<Car>): Promise<Car> {
    const res = await fetch(`/api/cars/${id}`, {
        method: "PUT",
        headers : {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify(data),
    });
    if(!res.ok){
        throw new Error("Failed to update car");
    }
    return res.json();
}


export async function getwithoutperf(): Promise<Car[]>{
    const res = await fetch(`${process.env.HOST}/api/without-perf`,{
        cache: "no-store"
    });
    if(!res.ok){
        console.log("Failed to fetch car performance")
        throw new Error("Failed to fetch car performance");
    }
    return res.json()
}



export async function Addcars(data: AddCarFormData): Promise<CustomRes> {
    try {
      const res = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: data.owner_id,
          make: data.make.trim(),
          model: data.model.trim(),
          year: Number(data.year),
          price: Number(data.price),
          body_type: data.body_type,
          fuel_type: data.fuel_type,
          transmission: data.transmission,
          image_url: data.url,
        }),
      });
  
      if (!res.ok) {
        // try to surface the server's error message, if any
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

  // somewhere near your other api helpers, e.g. lib/api/car.ts
export async function setDefaultCarImage(
  carId: number
): Promise<{ imageUrl: string } | null> {
  const res = await fetch(`/api/cars/${carId}/set-default-image`, {
    method: "POST",
  });

  if (!res.ok) {
    // Not fatal — car may just not have generated images yet
    return null;
  }

  return res.json();
}