import { Sales } from "../types";
export async function getSalesByUserId(user_id: number): Promise<Sales[]> {
    const res = await fetch(`${process.env.HOST}/api/sales?owner_id=${user_id}`, {
      cache: "no-store",
    });
  
    if (!res.ok) {
      throw new Error("Failed to fetch sales");
    }
  
    return res.json();
  }