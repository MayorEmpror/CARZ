// app/rentals/[rentalId]/payment/page.tsx  (SERVER component)
//
// Route: /rentals/[rentalId]/payment
// Fetches the rental server-side (so we can check ownership/status before
// rendering anything), then hands it to the client component that talks
// to the checkout-session API route.
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireUser } from '@/lib/IAM/validators';
import { getRental } from '@/lib/api/rentals';
import PaymentPage from './Paymentpage';

interface PageProps {
  params: Promise<{ rentalId: string }>;
}

// Server components can't use relative fetch URLs (there's no browser
// `window.location` to resolve against) — build an absolute origin from
// the incoming request's own headers instead. Works in dev, behind
// proxies, and in most hosting setups without hardcoding a domain.
async function getOrigin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const protocol = h.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export default async function RentalPaymentPage({ params }: PageProps) {
  const { rentalId } = await params;
  const id = Number(rentalId);
  if (!Number.isFinite(id)) {
    console.error('[payment page] redirecting: rentalId param is not a valid number:', rentalId);
    redirect('/'); // or a proper 404
  }

  const user = await requireUser();

  const rental = await getRental(id);

  if (!rental) {
    console.error('[payment page] redirecting: getRental returned falsy for id', id);
    redirect('/'); // or a proper 404
  }
  if (String(rental.customer_id) !== String(user.user_id)) {
    console.error(
      '[payment page] redirecting: owner mismatch. rental.customer_id =',
      rental.customer_id,
      'vs user.user_id =',
      user.user_id
    );
    redirect('/'); // not this user's rental
  }

  // Already paid — send them straight to the confirmation view instead of
  // letting them pay twice.
  if (rental.status === 'confirmed' || rental.status === 'paid') {
    redirect(`/rentals/${rental.rental_id}/payment/success`);
  }

  return <PaymentPage rental={rental} />;
}