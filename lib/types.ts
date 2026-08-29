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

export type Engine = {
  engine_id: number
  car_id: number

  // Identification
  engine_code: string | null
  engine_name: string | null
  manufacturer: string | null
  country_of_origin: string | null

  // Core specs
  engine_type: string | null
  cylinder_count: number | null
  cylinder_arrangement: string | null
  displacement_cc: number | null
  displacement_liters: number | null
  bore_mm: number | null
  stroke_mm: number | null
  compression_ratio: number | null

  // Valvetrain
  valve_mechanism: string | null
  valves_per_cylinder: number | null
  total_valves: number | null

  // Fuel & induction
  fuel_type: string | null
  fuel_delivery_system: string | null
  aspiration_type: string | null
  turbo_boost_pressure_bar: number | null
  fuel_tank_compatibility_l: number | null

  // Performance
  max_power_hp: number | null
  max_power_rpm: number | null
  max_torque_nm: number | null
  max_torque_rpm: number | null
  idle_rpm: number | null
  redline_rpm: number | null
  power_to_weight_ratio: number | null

  // Systems
  cooling_system: string | null
  ignition_system: string | null
  lubrication_system: string | null
  emission_standard: string | null
  start_stop_system: boolean | null

  // Hybrid / electric
  is_hybrid: boolean | null
  hybrid_system_type: string | null
  electric_motor_power_kw: number | null
  battery_capacity_kwh: number | null

  // Construction
  block_material: string | null
  head_material: string | null
  weight_kg: number | null

  // Installation
  engine_layout_position: string | null
  engine_orientation: string | null
  drive_type_compatibility: string | null
  transmission_compatibility: string | null

  // Fluids
  oil_capacity_liters: number | null
  oil_type_recommended: string | null
  coolant_capacity_liters: number | null

  // Lifecycle
  production_start_year: number | null
  production_end_year: number | null
  warranty_period_months: number | null

  // Metadata
  created_at: string
  updated_at: string

  // Model asset
  model_url: string | null
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

export type CreateRentalData = {
  customer_id: number;
  car_id: number;

  start_time: string;
  end_time: string;

  pickup_location: string;
  pickup_latitude: number;
  pickup_longitude: number;

  dropoff_location: string;
  dropoff_latitude: number;
  dropoff_longitude: number;

  distance_km: number;
  estimated_duration: number;

  base_price: number;
  distance_charge: number;
  service_fee: number;
  total_amount: number;
};

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
  car_id? : number;
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