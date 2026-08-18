// app/rentals/[rentalId]/payment/success/page.tsx  (SERVER component)
//
// Route: /rentals/[rentalId]/payment/success
//
// IMPORTANT: landing here is NOT proof of payment — it's just where Stripe
// sends the browser after Checkout. The webhook (api-webhook/route.ts) is
// what actually marks the rental as paid, and it may not have processed
// yet by the time this page renders. So we re-fetch the rental fresh and
// show its real status rather than assuming success from the URL alone.
import { requireUser } from '@/lib/IAM/validators';
import { getRental } from '@/lib/api/rentals';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ rentalId: string }>;
}

export default async function PaymentSuccessPage({ params }: PageProps) {
  const { rentalId } = await params;
  const id = Number(rentalId);
  if (!Number.isFinite(id)) redirect('/');

  const user = await requireUser();
  const rental = await getRental(id);

  if (!rental || String(rental.customer_id) !== String(user.id)) {
    redirect('/');
  }

  const confirmed = rental.status === 'confirmed' || rental.status === 'paid';

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-black px-6 py-10 text-center text-[#F5F5F5]">
      {confirmed ? (
        <>
          <div className="text-4xl">✓</div>
          <h1 className="text-2xl font-bold">You're all set</h1>
          <p className="text-sm text-[#A3A3A3]">
            Rental #{rental.rental_id} is confirmed. A receipt has been sent to your email.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Finalizing your payment…</h1>
          <p className="text-sm text-[#A3A3A3]">
            This can take a few seconds. Refresh this page shortly — if it still shows as unpaid after a minute,
            contact support with rental #{rental.rental_id}.
          </p>
        </>
      )}
    </div>
  );
}