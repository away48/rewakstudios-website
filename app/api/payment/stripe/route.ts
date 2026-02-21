import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ROOM_IDS } from '@/lib/beds24';
import { calculatePricing } from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomSlug, arrival, departure, guests, firstName, lastName, email, phone, nightlyRates } = body;

    if (!roomSlug || !arrival || !departure || !firstName || !lastName || !email || !nightlyRates?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomId = ROOM_IDS[roomSlug];
    if (!roomId) return NextResponse.json({ error: 'Invalid room' }, { status: 400 });

    const pricing = calculatePricing(nightlyRates);
    
    // Short stays: no CC fee (totalACH = totalWithCCFee). Long stays: CC fee applies.
    const chargeAmount = pricing.isLongTerm && pricing.billingSchedule?.length
      ? pricing.billingSchedule[0].totalWithCCFee
      : pricing.totalWithCCFee; // For short stays ccFeeAmount=0 so this equals totalACH

    const amountInCents = Math.round(chargeAmount * 100);

    const customer = await stripe.customers.create({
      email, name: `${firstName} ${lastName}`, phone,
      metadata: { roomId: String(roomId), roomSlug, arrival, departure, guests: String(guests) },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customer.id,
      ...(pricing.isLongTerm ? { setup_future_usage: 'off_session' as const } : {}),
      metadata: {
        type: pricing.isLongTerm ? 'long_term_first_payment' : 'short_term_full_payment',
        roomId: String(roomId), roomSlug, arrival, departure,
        guests: String(guests), firstName, lastName, email, phone,
        ...(pricing.isLongTerm && pricing.billingSchedule ? {
          totalPeriods: String(pricing.billingSchedule.length),
          billingSchedule: JSON.stringify(pricing.billingSchedule.slice(1)),
        } : {}),
      },
      receipt_email: email,
      description: `Rewak Studios - ${roomSlug} | ${arrival} to ${departure}${pricing.isLongTerm ? ` | Period 1/${pricing.billingSchedule?.length}` : ''}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
      chargeAmount,
      isRecurring: pricing.isLongTerm && (pricing.billingSchedule?.length || 0) > 1,
      pricing,
    });
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
  }
}
