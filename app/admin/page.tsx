// app/admin/page.tsx
import AdminLayout from "./AdminLayout";
import { getCars } from "@/lib/api/car";
import { getCustomers } from "@/lib/api/customers";


export default async function AdminPage() {
  const cars = await getCars();
  const customers = await getCustomers();

  return <AdminLayout
   initialCars={cars} 
   initialCust={customers}
    />;
}