// app/admin/page.tsx
import AdminLayout from "./AdminLayout";
import { getCars } from "@/lib/api/car";

export default async function AdminPage() {
  const cars = await getCars();

  return <AdminLayout initialCars={cars} />;
}