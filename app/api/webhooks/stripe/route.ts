// app/api/webhooks/stripe/route.ts
//
// POST /api/webhooks/stripe
// The ONLY place that should ever mark a rental as paid. The success_url
// redirect a user lands on is not proof of payment — it can be visited
// without paying, retried, or skipped if the tab closes. Stripe's webhook,
// verified with the signing secret, is the trustworthy source of truth.
//
// Register this URL in the Stripe dashboard (or `stripe listen` for local
// dev) and set STRIPE_WEBHOOK_SECRET from what it gives you.
//
// TODO: adjust the DB import to however you update a rental row.
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateRentalStatus } from '@/lib/api/rentals'; // TODO: implement this — sets status + clears hold_expires_at

export async function POST(req: NextRequest) {
  const body = await req.text(); // must be the raw body for signature verification
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session;
      const rentalId = Number(session.metadata?.rental_id);

      if (!Number.isFinite(rentalId)) {
        console.error('checkout.session.completed missing/invalid rental_id metadata', session.id);
        break;
      }

      // session.payment_status is 'paid' for card payments completed
      // synchronously; some methods settle asynchronously and fire
      // checkout.session.async_payment_succeeded instead (handled below).
      if (session.payment_status === 'paid') {
        await updateRentalStatus(rentalId, {
          status: 'confirmed',
          hold_expires_at: null,
          stripe_payment_intent_id: String(session.payment_intent),
        });
      }
      break;
    }

    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session;
      const rentalId = Number(session.metadata?.rental_id);
      if (Number.isFinite(rentalId)) {
        await updateRentalStatus(rentalId, {
          status: 'confirmed',
          hold_expires_at: null,
          stripe_payment_intent_id: String(session.payment_intent),
        });
      }
      break;
    }

    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired': {
      const session = event.data.object as import('stripe').Stripe.Checkout.Session;
      const rentalId = Number(session.metadata?.rental_id);
      if (Number.isFinite(rentalId)) {
        await updateRentalStatus(rentalId, { status: 'cancelled' });
      }
      break;
    }

    default:
      // Unhandled event types are fine to ignore — Stripe sends many.
      break;
  }

  return NextResponse.json({ received: true });
}