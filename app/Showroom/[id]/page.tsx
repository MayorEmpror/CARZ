import { getPerf } from "@/lib/api/carperf";

export default async function CarDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const carperf = await getPerf(id);

  if (!carperf) {
    return (
      <div className="text-white text-2xl">
        Car not found
      </div>
    );
  }

  return (
    <div className="text-4xl text-white">
      car number {carperf.performance_id}
    </div>
  );
}