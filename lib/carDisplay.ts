import  Car  from "./types";

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
  const index = (car.car_id % TOTAL_PLACEHOLDER_IMAGES) + 1;
  return `/Images/image_${index}.png`;
}

export function getCarRating(car: Car) {
  // deterministic pseudo-rating between 4.0 and 5.0
  const seed = (car.car_id * 37) % 100;
  const rating = 4 + seed / 100;
  const reviews = 20 + ((car.car_id * 53) % 950);
  return { rating: Math.round(rating * 10) / 10, reviews };
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