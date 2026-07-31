import { User } from "@/lib/types"

export async function getCurrUser(user_id: number): Promise<User>{
  const res = await fetch(`${process.env.HOST}/api/users?owner_id=${user_id}`, {
    cache: "no-store"
  })
  if (!res.ok) {
    throw new Error("Failed to fetch cars");
  }
return res.json()
}