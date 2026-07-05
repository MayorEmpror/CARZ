"use client";

import { User } from "@/lib/types";
import { useState } from "react";

type Props = {
  initialCustomers: User[];
};

export default function CustomerTab({ initialCustomers }: Props) {
  const [customers, setCustomers] = useState<User[]>(initialCustomers);

  return (
    <div className="text-white p-4">
      <h1 className="text-2xl mb-4">Customers</h1>

      {customers.map((cust) => (
        <div key={cust.user_id} className="border p-3 mb-3">
          <div>{cust.full_name}</div>
          <div>{cust.email}</div>
        </div>
      ))}
    </div>
  );
}