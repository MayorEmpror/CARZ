// Matches the shape returned by GET /api/cars
export default interface Car {
    car_id: number;
    make: string;
    model: string;
    year: number;
    price: string;
    status: string;
    rating: string;
    rating_count: number;
    image_url : string;
  };