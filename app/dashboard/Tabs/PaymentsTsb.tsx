import { Payment } from "@/lib/types"

type Props = {
    payments : Payment[]
}
export default function PaymentsTab({payments}:Props){
    return <div className="text-4xl text-white">
        this is the sales tab
    </div>
}