
import {CreateRentalData} from "@/lib/types"
export async function createRental(data: CreateRentalData) {
  const response = await fetch("/api/rentals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to create rental");
  }

  return result.rental;
}

export async function getRental(rentalId: number) {
  const response = await fetch(`/api/rentals/${rentalId}`);

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to get rental");
  }

  return result.rental;
}