import {User} from "@/lib/types"

export async function getCustomers(): Promise<User[]>{
    const res = await fetch(`${process.env.HOST}/api/owners`,{
        cache : "no-store"
    })
    return res.json();
}