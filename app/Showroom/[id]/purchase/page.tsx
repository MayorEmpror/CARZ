import { carDetails } from "@/lib/api/car";
import BackButton from "./Back";

export default async function Purchase({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await carDetails(id);

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B10] text-white text-2xl">
        Car not found
      </div>
    );
  }

  const {
    make,
    model,
    image_url,
    price,
    rating,
    rating_count,
    top_speed,
    acceleration_0_100,
    engine_power,
    torque,
    fuel_efficiency,
  } = car;

  const downPayment = Math.round(price * 0.15);
  const financedAmount = price - downPayment;
  const monthly36 = Math.round(financedAmount / 36 * 1.04);
  const monthly60 = Math.round(financedAmount / 60 * 1.06);

  const specs = [
    { label: "Top Speed", value: `${top_speed} km/h` },
    { label: "0–100 km/h", value: `${acceleration_0_100}s` },
    { label: "Engine Power", value: `${engine_power} hp` },
    { label: "Torque", value: `${torque} Nm` },
    { label: "Fuel Efficiency", value: `${fuel_efficiency} km/l` },
  ];

  const addons = [
    { label: "Extended Warranty (3yr)", price: 1200 },
    { label: "Premium Paint Protection", price: 650 },
    { label: "Ceramic Window Tint", price: 400 },
    { label: "Roadside Assistance (2yr)", price: 250 },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white">
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <BackButton />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: image + specs */}
        <div className="space-y-6">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <img
              src={image_url}
              alt={`${make} ${model}`}
              className="w-full h-80 object-cover"
            />
          </div>

          <div>
            <h1 className="text-3xl font-semibold">
              {make} {model}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-neutral-400">
              <span>★ {rating}</span>
              <span>({rating_count.toLocaleString()} reviews)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {specs.map((s) => (
              <div
                key={s.label}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-xs text-neutral-400">{s.label}</p>
                <p className="text-sm font-medium mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: purchase panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-neutral-400">Price</p>
            <p className="text-4xl font-semibold mt-1">
              ${price.toLocaleString()}
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Down Payment (15%)</span>
                <span>${downPayment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Amount Financed</span>
                <span>${financedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">36-mo Plan</span>
                <span>${monthly36.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">60-mo Plan</span>
                <span>${monthly60.toLocaleString()}/mo</span>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
              <span className="font-semibold">Note:</span> we strongly advise
              you to hire a specialist before going through with a purchase.
              Specialists will help you understand everything about the car,
              including problems and future issues.
            </div>

            <button className="cursor-pointer w-full mt-6 py-3 rounded-full bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-200 transition-colors">
              Proceed towards Payment
            </button>
            <button className="cursor-pointer w-full mt-2 py-3 rounded-full bg-white/6 text-neutral-300 text-sm font-medium hover:bg-white-200/10 border-white/10 transition-colors">
              Notify Owner
            </button>
            <button className="cursor-pointer w-full mt-2 py-3 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-300 hover:bg-white/10 transition-colors">
              Reserve with $500 Deposit
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Add-ons
            </p>
            <div className="space-y-2">
              {addons.map((a) => (
                <label
                  key={a.label}
                  className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-neutral-300">
                    <input type="checkbox" className="accent-white" />
                    {a.label}
                  </span>
                  <span className="text-neutral-100">${a.price}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-500">
            All pricing shown is a dummy estimate. Financing terms subject to
            approval and dealer verification.
          </div>
        </div>
      </div>
    </div>
  );
}