import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

// Matches the shape returned by GET /api/cars
export  interface Car {
    car_id: number;
    owner_id : number;
    make: string;
    model: string;
    year: number;
    price: string;
    status: string;
    rating: string;
    rating_count: number;
    image_url : string;
    body_type: string;
    fuel_type: string;
    transmission : string;
    created_at : Timestamp;
   
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


export type FormState = {
  owner_id: number;
  make: string;
  model: string;
  year: string;
  price: string;
  body_type: string;
  fuel_type: string;
  transmission: string;
};