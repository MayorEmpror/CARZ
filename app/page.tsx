import CarCard from "@/components/CarCard";

type Car = {
  car_id: number;
  make: string;
  model: string;
  year: number;
  price: string;
  status: string;
};

async function getCars(): Promise<Car[]> {
  const res = await fetch(`${process.env.HOST}/api/cars`, {
    cache: "no-store",
  });

  return res.json();
}

export default async function Home() {
  const cars = await getCars();

  return (
    <main>
      <h1>Car Catalogue</h1>

      {cars.map((car) => (
        <CarCard
          key={car.car_id}
          make={car.make}
          model={car.model}
          year={car.year}
          price={car.price}
          status={car.status}
        />
      ))}
    </main>
  );
}