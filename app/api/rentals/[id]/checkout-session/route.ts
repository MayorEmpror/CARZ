// app/api/rentals/[id]/checkout-session/route.ts
//
// POST /api/rentals/:id/checkout-session
// Creates a Stripe Checkout Session for an existing rental and returns its
// hosted-page URL. Server-only — this is the one place STRIPE_SECRET_KEY
// gets used, so it never reaches the browser.
//
// TODO: adjust these two imports to your real setup.
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireUser } from '@/lib/IAM/validators';
import { getRental } from '@/lib/api/rentals'; // your existing server-side rental fetch

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rentalId = Number(id);
  if (!Number.isFinite(rentalId) || rentalId <= 0) {
    return NextResponse.json({ error: 'Invalid rental id' }, { status: 400 });
  }

  // Re-verify the session user server-side — never trust a rental id alone.
  const user = await requireUser();
  
  console.log("user now in payout : ", user.user_id)
  const rental = await getRental(rentalId);
  console.log('[checkout-session debug]', {
    rental_customer_id: rental?.customer_id,
    rental_customer_id_type: typeof rental?.customer_id,
    user_id: user?.id,
    user_id_type: typeof user?.id,
  });
  if (!rental) {
    return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
  }

  // Ownership check: this user must be the one who booked this rental.
  if (String(rental.customer_id) !== String(user.user_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only allow paying for rentals that are actually awaiting payment —
  // stops someone re-paying a cancelled/expired/already-paid rental.
  if (rental.status !== 'payment_pending' && rental.status !== 'pending') {
    return NextResponse.json({ error: `Rental is not payable (status: ${rental.status})` }, { status: 409 });
  }

  // Reject if the hold has already expired — force them back to booking.
  if (rental.hold_expires_at && new Date(rental.hold_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This rental hold has expired. Please book again.' }, { status: 410 });
  }

  if (!rental.total_amount || rental.total_amount <= 0) {
    return NextResponse.json({ error: 'Rental has no payable amount' }, { status: 400 });
  }

  const origin = req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd', // TODO: match your actual currency
          product_data: {
            name: `Rental #${rental.rental_id} — ${rental.make} ${rental.model} (${rental.year})`,
            description: `${rental.pickup_location} → ${rental.dropoff_location}`,
          },
          // Stripe wants the amount in the smallest currency unit (cents).
          unit_amount: Math.round(Number(rental.total_amount) * 100),
        },
        quantity: 1,
      },
    ],
    // Carry the rental id through so the webhook knows what to update.
    metadata: {
      rental_id: String(rental.rental_id),
      customer_id: String(rental.customer_id),
    },
    success_url: `${origin}/rentals/${rental.rental_id}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/rentals/${rental.rental_id}/payment`,
    // Optional: expire the Checkout Session alongside your own hold so the
    // two timers stay roughly in sync (Stripe minimum is 30 minutes).
    expires_at: rental.hold_expires_at
      ? Math.max(Math.floor(new Date(rental.hold_expires_at).getTime() / 1000), Math.floor(Date.now() / 1000) + 30 * 60)
      : undefined,
  });

  return NextResponse.json({ url: session.url });
}