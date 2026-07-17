// lib/car-images/generate.ts
import puppeteer from "puppeteer";
import pool from "@/lib/db";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const WIDTH = 1200;
const HEIGHT = 900;

// Only generating the "left" angle for now — single default image per car.
const ANGLES = ["left"] as const;
type Angle = (typeof ANGLES)[number];

async function captureAngle(
  browser: import("puppeteer").Browser,
  modelUrl: string,
  angle: Angle
): Promise<Buffer> {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  const url = `${APP_URL}/render/car?modelUrl=${encodeURIComponent(modelUrl)}&angle=${angle}`;
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitForFunction("window.__renderReady === true", { timeout: 30000 });

  const base64 = await page.evaluate(() => {
    const canvas = document.querySelector("#car-canvas canvas") as HTMLCanvasElement;
    return canvas.toDataURL("image/png").split(",")[1];
  });

  await page.close();
  return Buffer.from(base64, "base64");
}

export interface GeneratedCarImage {
  angle: Angle;
  url: string;
}

/**
 * Captures the "left" angle for a car's model, uploads it to Cloudinary,
 * inserts a row into car_images, and returns it.
 * Does NOT touch cars.image_url — caller decides what to do with the result.
 */
export async function generateCarImages(
  carId: number,
  modelUrl: string
): Promise<GeneratedCarImage[]> {
  const browser = await puppeteer.launch({ headless: true });
  const results: GeneratedCarImage[] = [];

  try {
    for (const angle of ANGLES) {
      const buffer = await captureAngle(browser, modelUrl, angle);
      const publicId = `car-${carId}-${angle}-${Date.now()}`;
      const url = await uploadImageToCloudinary(buffer, publicId);

      await pool.query(
        `INSERT INTO car_images (car_id, url, angle, preset, width, height)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [carId, url, angle, "city", WIDTH, HEIGHT]
      );

      results.push({ angle, url });
    }
  } finally {
    await browser.close();
  }

  return results;
}