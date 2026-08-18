import { CreateRentalData } from "@/lib/types";

// fetch() requires an ABSOLUTE URL when it runs on the server (route
// handlers, server components, cron jobs, etc.) — there's no browser
// window.location to resolve a relative path like '/api/rentals/205'
// against, so Node's fetch throws ERR_INVALID_URL there. In the browser
// the same relative URL works fine as-is.
//
// getBaseUrl() returns '' in the browser (relative URLs stay relative,
// unchanged from before) and an absolute origin built from your existing
// HOST env var when running on the server.
function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";

  const host = process.env.HOST;
  if (host) {
    if (host.startsWith("http://") || host.startsWith("https://")) {
      return host.replace(/\/$/, ""); // strip trailing slash if present
    }
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const hasPort = /:\d+$/.test(host);
    const withPort = hasPort ? host : `${host}:${process.env.PORT ?? 3000}`;
    return `${protocol}://${withPort}`;
  }

  // Fallback if HOST somehow isn't set.
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export async function createRental(data: CreateRentalData) {
  const response = await fetch(`${getBaseUrl()}/api/rentals`, {
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
  const response = await fetch(`${getBaseUrl()}/api/rentals/${rentalId}`, {
    // Server-side calls shouldn't get cached across different rentals.
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to get rental");
  }
  return result.rental;
}