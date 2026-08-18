'use client';

// app/rentals/[rentalId]/payment/PaymentPage.tsx  (CLIENT component)
//
// Shows the rental summary and a "Pay now" button. The button POSTs to
// /api/rentals/:id/checkout-session, then does a full browser redirect to
// the Stripe-hosted URL that route returns — no card fields live here,
// so there's no PCI scope to worry about on this page.
import { useEffect, useMemo, useState } from 'react';

// Reuse the same shape your Services.tsx already defines for a rental.
// TODO: import this from a shared types file instead of redefining it.
interface RentalRecord {
  rental_id: number;
  customer_id: number;
  car_id: number;
  start_time: string;
  end_time: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: number | null;
  estimated_duration: number | null;
  base_price: number | null;
  distance_charge: number | null;
  service_fee: number | null;
  total_amount: number | null;
  status: string;
  hold_expires_at: string | null;
  make: string;
  model: string;
  year: number;
}

export default function PaymentPage({ rental }: { rental: RentalRecord }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live countdown against the rental hold, so the user knows the clock is
  // ticking before Stripe's own Checkout Session timer kicks in.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!rental.hold_expires_at) return;
    const expiresAt = new Date(rental.hold_expires_at).getTime();

    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [rental.hold_expires_at]);

  const holdExpired = secondsLeft === 0;

  const countdownLabel = useMemo(() => {
    if (secondsLeft == null) return null;
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/rentals/${rental.rental_id}/checkout-session`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not start checkout');
      }
      const { url } = await res.json();
      if (!url) throw new Error('No checkout URL returned');
      window.location.href = url; // full redirect to Stripe's hosted page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 bg-black px-6 py-10 text-[#F5F5F5]">
      <div>
        <h1 className="text-2xl font-bold">Confirm & pay</h1>
        <p className="mt-1 text-sm text-[#A3A3A3]">Rental #{rental.rental_id}</p>
      </div>

      {countdownLabel && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            holdExpired
              ? 'border-red-500/20 bg-red-500/10 text-red-400'
              : 'border-[#8C7CFF]/20 bg-[#8C7CFF]/10 text-[#8C7CFF]'
          }`}
        >
          {holdExpired ? 'Your hold has expired — please book again.' : `Hold expires in ${countdownLabel}`}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 text-sm font-semibold text-[#F5F5F5]">
          {rental.make} {rental.model} '{rental.year}
        </div>

        <SummaryRow label="Pickup" value={rental.pickup_location} />
        <SummaryRow label="Drop-off" value={rental.dropoff_location} />
        {rental.distance_km != null && <SummaryRow label="Distance" value={`${rental.distance_km} km`} />}

        <div className="my-4 h-px bg-white/10" />

        <SummaryRow label="Base price" value={`$${rental.base_price?.toFixed?.(2) ?? rental.base_price}`} />
        <SummaryRow label="Distance charge" value={`$${rental.distance_charge?.toFixed?.(2) ?? rental.distance_charge}`} />
        <SummaryRow label="Service fee" value={`$${rental.service_fee?.toFixed?.(2) ?? rental.service_fee}`} />

        <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
          <span className="text-sm text-[#A3A3A3]">Total</span>
          <span className="text-lg font-bold text-[#34D399]">
            ${rental.total_amount?.toFixed?.(2) ?? rental.total_amount}
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handlePay}
        disabled={loading || holdExpired}
        className="rounded-lg bg-[#8C7CFF] px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Redirecting to checkout…' : 'Pay now'}
      </button>

      <p className="text-center text-xs text-[#6B6B6B]">You'll be redirected to Stripe's secure checkout page.</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
      <span className="text-[#6B6B6B]">{label}</span>
      <span className="text-[#F5F5F5]">{value}</span>
    </div>
  );
}