import CarTab from "./CarHandler";
import CustomerTab from "./CustomersHandler"
import { getCars } from "@/lib/api/car";

export default async function AdminPage() {
  const cars = await getCars();

  return <>
  <CarTab initialCars={cars} />
  <CustomerTab  />
  </>;
}