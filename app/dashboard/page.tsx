import { devNull } from "os";
import DashboardLayout from "./dashboardLayout"
import { getCurrentUser } from "@/lib/IAM/session";
import {getCarByUserId} from "@/lib/api/car"
import {getSalesByUserId} from "@/lib/api/sales"
import  {getCustomers} from "@/lib/api/customers"
import {getPaymentsByUserId} from "@/lib/api/payments"
import { requireUser } from "@/lib/IAM/validators";

export default async function (){
    const user = await requireUser();
    console.log("user id : " + user.user_id  )
    const cars = await getCarByUserId(user.user_id  );
    const sales = await getSalesByUserId(user.user_id  );
    const customers = await getCustomers();
    const payments = await getPaymentsByUserId(user.user_id  );
   
    // over here we will need to check if the owner account is there, if not go to register as owner 
    return <DashboardLayout 
    initialCars={cars}
    sales={sales}
    payments={payments}
    customers={customers}
    user={user}
    />
}
