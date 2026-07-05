"use client"
import { User } from "@/lib/types"
import { useState } from "react"

type props = {
    initialOnwers : User[];
}

export function OwnerTab({initialOnwers}: props){
    const [owners, setOwners]= useState<User[]>(initialOnwers)
    console.log(owners)
    return <div className="text-white p-4">
    <h1 className="text-2xl mb-4">Customers</h1>

    {owners.map((owner) => (
      <div key={owner.user_id} className="border p-3 mb-3">
        <div>{owner.full_name}</div>
        <div>{owner.email}</div>
      </div>
    ))}
  </div>
}