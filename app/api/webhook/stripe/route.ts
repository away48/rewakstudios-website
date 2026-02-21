import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createBooking } from '@/lib/beds24';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const m = pi.metadata;

    if (m.type === 'short_term_full_payment' || m.type === 'long_term_first_payment') {
      await createBooking({
        roomId: parseInt(m.roomId), arrival: m.arrival, departure: m.departure,
        firstName: m.firstName, lastName: m.lastName, email: m.email, phone: m.phone || '',
        numAdults: parseInt(m.guests) || 2, totalPrice: pi.amount / 100,
        paymentMethod: 'stripe', paymentId: pi.id,
        notes: m.type === 'long_term_first_payment'
          ? `Long-term CC. Period 1/${m.totalPeriods}. Recurring scheduled.`
          : `Short-term CC. ${pi.description}`,
      });

      // Schedule recurring payments for long-term
      if (m.type === 'long_term_first_payment' && m.billingSchedule) {
        const periods = JSON.parse(m.billingSchedule);
        const pms = await stripe.paymentMethods.list({ customer: pi.customer as string, type: 'card' });
        if (pms.data.length) {
          for (const period of periods) {
            if (new Date(period.startDate) > new Date()) {
              await stripe.paymentIntents.create({
                amount: Math.round(period.totalWithCCFee * 100),
                currency: 'usd', customer: pi.customer as string,
                payment_method: pms.data[0].id, off_session: true, confirm: false,
                metadata: {
                  type: 'recurring_payment', roomId: m.roomId, roomSlug: m.roomSlug,
                  arrival: m.arrival, departure: m.departure,
                  periodNumber: String(period.periodNumber), scheduledDate: period.startDate,
                },
                description: `Rewak Studios - ${m.roomSlug} | Period ${period.periodNumber} (${period.startDate} to ${period.endDate})`,
              });
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
