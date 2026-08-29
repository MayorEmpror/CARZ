interface Props{
  params: Promise<{id: string}>
}


export  default async function Engine({params}:Props) {
  const { id } = await params 

  // use this id
  return <div className="text-3xl text-white ">
    this is  the engine specifications car id is : {id}
  </div>
}