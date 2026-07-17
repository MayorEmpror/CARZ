// worker/generate-car-images.ts
import  pool  from "../lib/db";
import { generateCarImages } from "@/lib/generate";

async function getCarModelPath(carId: number): Promise<string> {
  const { rows } = await pool.query(`SELECT model_path FROM cars WHERE car_id = $1`, [carId]);
  if (!rows[0]) throw new Error(`Car ${carId} not found`);
  return rows[0].model_path;
}

async function main() {
  const carIds = process.argv.slice(2).map(Number);
  if (carIds.length === 0) {
    console.error("Usage: tsx worker/generate-car-images.ts <carId> [carId...]");
    process.exit(1);
  }

  for (const carId of carIds) {
    try {
      const modelPath = await getCarModelPath(carId);
      console.log(`car ${carId}: generating images...`);
      const images = await generateCarImages(carId, modelPath);
      images.forEach((img) => console.log(`  ${img.angle} -> ${img.url}`));
    } catch (err) {
      console.error(`Failed for car ${carId}:`, err);
    }
  }

  await pool.end();
}

main();