import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { Inter_Tight } from "next/font/google";

// Matches the shape returned by GET /api/cars
export interface Car {
  car_id: number;
  owner_id: number;
  make: string;
  model: string;
  year: number;
  price: string;
  status: string;
  rating: string;
  rating_count: number;
  image_url: string;
  model_path:string;
  body_type: string;
  fuel_type: string;
  transmission: string;
  created_at: Date; // was `Timestamp` — Postgres timestamps map to JS Date
}


export type CarFilters = {
  rentalType: string;
  availableOnly: boolean;
  priceRange: [number, number];
  bodyTypes: string[];
  transmission: string;
  fuelTypes: string[];
};



export interface User{
  user_id  : number;
  full_name  : string;
  email      :  string;
  phone      :   string
  password_hash: Text
  role        :  string;
  created_at : Timestamp;
}



export  interface Car_Perf{
    performance_id : number;
    car_id : number;
    mileage : number;
    top_speed : number;
    acceleration_0_100 : number;    
    engine_power : number;          
    torque : number;                   
    fuel_efficiency : number;          
    created_at : Timestamp;
  }

export interface Named_Car_Perf extends Car_Perf{ 
   car_name : string;
   brand? : string;
}

export type CarDetails = Car & Car_Perf;


export interface Payment{
  payment_id :  number   ;                 
  rental_id   :  number   ;    
  purchase_id  :  number   ;   
  amount      :  number   ;    
  payment_method :  string   ; 
  payment_date   :  Date   ;
  status         :  string   ;
  transaction_ref:  string  ;
}


export type AddCarFormState = {
  owner_id: number;
  make: string;
  model: string;
  year: string;
  price: string;
  body_type: string;
  fuel_type: string;
  transmission: string;
 
};

export interface CustomRes {
  success : boolean;
  message : string;
}


export interface AddCarFormData extends AddCarFormState{
   url: URL,
}

export interface AddPerfFormData{
    car_id : number;
    mileage : number;
    top_speed : number;
    acceleration_0_100 : number;    
    engine_power : number;          
    torque : number;                   
    fuel_efficiency : number;          

}

export type NavItem<T extends string = string> = {
  tab: T;
  label: string;
  icon: React.ElementType | string;
};

export interface Sales{
  purchase_id  : number;
  customer_id  :  number;
  car_id  :      number;
  purchase_date : Date;
  purchase_price : number;
  status  :      string;
  created_at :   Timestamp
}