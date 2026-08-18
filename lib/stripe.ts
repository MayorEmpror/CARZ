// lib/stripe.ts
// Single shared Stripe server-side client. Never import this from a
// client component — STRIPE_SECRET_KEY must never reach the browser.
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY env var');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});