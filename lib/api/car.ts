import {Car} from "@/lib/types"

export async function getCars(): Promise<Car[]> {
    const res = await fetch(`${process.env.HOST}/api/cars`, {
      cache: "no-store",
    });
  
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

