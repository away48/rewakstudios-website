import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createBooking, ROOM_IDS } from '@/lib/beds24';
import { calculatePricing } from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// POST /api/payment/stripe - Create payment intent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomSlug,
      arrival,
      departure,
      guests,
      firstName,
      lastName,
      email,
      phone,
      nightlyRates,
    } = body;

    if (!roomSlug || !arrival || !departure || !firstName || !lastName || !email || !nightlyRates?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomId = ROOM_IDS[roomSlug];
    if (!roomId) {
      return NextResponse.json({ error: 'Invalid room' }, { status: 400 });
    }

    // Recalculate pricing server-side for security
    const pricing = calculatePricing(nightlyRates);
    
    // For long-term stays, charge first period only; for short stays, charge full amount
    const chargeAmount = pricing.isLongTerm && pricing.billingSchedule?.length
      ? pricing.billingSchedule[0].totalWithCCFee
      : pricing.totalWithCCFee;

    const amountInCents = Math.round(chargeAmount * 100);

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      phone,
      metadata: {
        roomId: String(roomId),
        roomSlug,
        arrival,
        departure,
        guests: String(guests),
      },
    });

    let paymentIntentId: string;

    if (pricing.isLongTerm && pricing.billingSchedule && pricing.billingSchedule.length > 1) {
      // Long-term: Create a setup for recurring + charge first period
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: customer.id,
        setup_future_usage: 'off_session', // Save card for recurring
        metadata: {
          type: 'long_term_first_payment',
          roomId: String(roomId),
          roomSlug,
          arrival,
          departure,
          guests: String(guests),
          firstName,
          lastName,
          email,
          phone,
          totalPeriods: String(pricing.billingSchedule.length),
          billingSchedule: JSON.stringify(pricing.billingSchedule.slice(1)), // remaining periods
        },
        receipt_email: email,
        description: `Stay Anchorage - ${body.roomName || roomSlug} | ${arrival} to ${departure} | Period 1 of ${pricing.billingSchedule.length}`,
      });

      paymentIntentId = paymentIntent.id;

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId,
        customerId: customer.id,
        chargeAmount,
        isRecurring: true,
        totalPeriods: pricing.billingSchedule.length,
        pricing,
      });
    } else {
      // Short-term: Single full payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: customer.id,
        metadata: {
          type: 'short_term_full_payment',
          roomId: String(roomId),
          roomSlug,
          arrival,
          departure,
          guests: String(guests),
          firstName,
          lastName,
          email,
          phone,
        },
        receipt_email: email,
        description: `Stay Anchorage - ${body.roomName || roomSlug} | ${arrival} to ${departure}`,
      });

      paymentIntentId = paymentIntent.id;

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId,
        customerId: customer.id,
        chargeAmount,
        isRecurring: false,
        pricing,
      });
    }
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
  }
}
