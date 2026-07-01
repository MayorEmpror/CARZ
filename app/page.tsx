//import CarCard from "@/components/CarCard";

// type Car = {
//   car_id: number;
//   make: string;
//   model: string;
//   year: number;
//   price: string;
//   status: string;
// };

// async function getCars(): Promise<Car[]> {
//   console.log("HOST:", process.env.HOST);
//   const res = await fetch(`${process.env.HOST}/api/cars`, {
//     cache: "no-store",
//   });

//   return res.json();
// }

export default async function Home() {
  //const cars = await getCars();
  //console.log(cars)

  return (
    <main>
      <h1>Car Catalogue</h1>

      {/* {cars.map((car, key) => (
        <CarCard
          key={key}
          make={car.make}
          model={car.model}
          year={car.year}
          price={car.price}
          status={car.status}
        />
      ))} */}
    </main>
  );
}