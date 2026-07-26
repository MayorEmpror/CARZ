import { CarDetails } from "@/lib/types";

type Props = {
    user_id: number;
    carswithperf: CarDetails[];
  };
  
  export default function ManageCars({
    user_id,
    carswithperf,
  }: Props) {
  console.log(carswithperf)
    return (
      <div className="text-white ">
        {carswithperf.map((car) => (
          <div 
          className="text-white text-3xl"
          key={car.car_id}>
            {car.make} {car.model}
          </div>
        ))}
      </div>
    );
  }