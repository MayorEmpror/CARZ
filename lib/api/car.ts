import {Car} from "@/lib/types"
import { CarDetails } from "@/lib/types";

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