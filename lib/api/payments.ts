import { Payment } from "../types";
export async function getPaymentsByUserId(user_id: number): Promise<Payment[]> {
    const res = await fetch(`${process.env.HOST}/api/payment?owner_id=${user_id}`, {
      cache: "no-store",
    });
  
    if (!res.ok) {
      throw new Error("Failed to fetch sales");
    }
  
    return res.json();
  }