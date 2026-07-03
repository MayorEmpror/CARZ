import AdminDashboard from "./AdminDashboard";
import { getCars } from "@/lib/api/car";

export default async function AdminPage() {
  const cars = await getCars();

  return <AdminDashboard initialCars={cars} />;
}