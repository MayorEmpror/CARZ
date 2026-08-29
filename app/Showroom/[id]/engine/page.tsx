import {getCarEngineById} from "@/lib/api/engine"

interface Props{
  params: Promise<{id: string}>
}

 
export  default async function Engine({params}:Props) {
  const { id } = await params 
  const engine = await getCarEngineById(Number(id))
  console.log("nigga : " + engine.cylinder_arrangement)
  // use this id
  return <div className="text-3xl text-white ">
    this is  the engine specifications car id is : {engine.cylinder_arrangement} of the car {id}
  </div>
}