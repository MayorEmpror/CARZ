// app/admin/page.tsx
import AdminLayout from "./AdminLayout";
import { getCars } from "@/lib/api/car";
import { getCustomers } from "@/lib/api/customers";
import {getOwners} from "@/lib/api/owners"
import {getAllPerfMetric} from "@/lib/api/carperf"
 

export default async function AdminPage() {
  const cars = await getCars();
  const customers = await getCustomers();
  const owners = await getOwners();
  const perfs = await getAllPerfMetric();

  return <AdminLayout
   initialCars={cars} 
   initialCust={customers}
   initialOnwers={owners}
   initialPerfMetric={perfs}
    />;
}