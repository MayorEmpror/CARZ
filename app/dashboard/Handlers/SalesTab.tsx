"use client"
import {Sales} from "@/lib/types"
import { useState } from "react";
type Props = {
    sales: Sales[];
}
export default function SalesTab({sales} : Props){
    const [Sales, setSales] = useState<Sales[]>(sales)
    return <div className="text-4xl text-white">
        <ul>
            {sales.map((x,k)=>{
                return <li key={k}>
                  {x.car_id}
                </li>
            })}
          
        </ul>
      
    </div>
}