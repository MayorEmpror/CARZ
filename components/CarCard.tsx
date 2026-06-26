type CarProps = {
    make: string;
    model: string;
    year: number;
    price: string;
    status: string;
  };
  
  export default function CarCard({
    make,
    model,
    year,
    price,
    status,
  }: CarProps) {
    return (
      <div
        style={{
          border: "1px solid gray",
          padding: "16px",
          marginBottom: "12px",
          borderRadius: "8px",
        }}
      >
        <h2>
          {make} {model}
        </h2>
  
        <p>Year: {year}</p>
        <p>Price: Rs. {price}</p>
        <p>Status: {status}</p>
      </div>
    );
  }