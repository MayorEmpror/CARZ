import  {Car}  from "./types";

/**
 * Your /api/cars response only has car_id, make, model, year, price, status.
 * The screenshot also shows an image, a star rating, review count, and a
 * walking distance ("120m Â· 4 min"). Those aren't in the schema, so this
 * file derives stable, deterministic placeholders from car_id so the UI
 * doesn't jump around on re-render. Swap these out once the API returns
 * real values (e.g. car.image_url, car.rating, car.distance_m).
 */

const TOTAL_PLACEHOLDER_IMAGES = 6; // image_1.jpeg ... image_6.jpeg in /public/cars

export function getCarImage(car: Car) {
  return car.image_url || "/Images/image_fallback.png";
}
export function getCarRating(car: Car) {
  return {
    rating: car.rating,
    reviews: car.rating_count,
  };
}

export function getCarDistance(car: Car) {
  const meters = 60 + ((car.car_id * 71) % 400);
  const minutes = Math.max(1, Math.round(meters / 80));
  return { meters, minutes };
}

export function formatPrice(price: string) {
  const num = Number(price);
  const formatted = Number.isFinite(num) ? num.toFixed(2) : price;
  return `$${formatted}`;
}