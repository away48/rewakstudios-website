import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createBooking } from '@/lib/beds24';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const meta = paymentIntent.metadata;

      if (meta.type === 'short_term_full_payment' || meta.type === 'long_term_first_payment') {
        // Create booking in Beds24
        const result = await createBooking({
          roomId: parseInt(meta.roomId),
          arrival: meta.arrival,
          departure: meta.departure,
          firstName: meta.firstName,
          lastName: meta.lastName,
          email: meta.email,
          phone: meta.phone || '',
          numAdults: parseInt(meta.guests) || 2,
          totalPrice: paymentIntent.amount / 100,
          paymentMethod: 'stripe',
          paymentId: paymentIntent.id,
          notes: meta.type === 'long_term_first_payment'
            ? `Long-term stay. CC payment. Period 1 of ${meta.totalPeriods}. Recurring billing scheduled.`
            : `Short-term stay. CC payment.`,
        });

        console.log('Booking created:', result);

        // For long-term stays, schedule remaining payments
        if (meta.type === 'long_term_first_payment' && meta.billingSchedule) {
          try {
            const remainingPeriods = JSON.parse(meta.billingSchedule);
            await scheduleRecurringPayments(
              paymentIntent.customer as string,
              remainingPeriods,
              meta
            );
          } catch (err) {
            console.error('Failed to schedule recurring payments:', err);
          }
        }
      }

      if (meta.type === 'recurring_payment') {
        console.log(`Recurring payment succeeded: Period ${meta.periodNumber} for ${meta.roomSlug} ${meta.arrival}-${meta.departure}`);
      }

      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
      // TODO: Send failure notification
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function scheduleRecurringPayments(
  customerId: string,
  periods: any[],
  meta: Record<string, string>
) {
  // Get saved payment method from customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  if (!paymentMethods.data.length) {
    console.error('No saved payment method for recurring billing');
    return;
  }

  const paymentMethodId = paymentMethods.data[0].id;

  for (const period of periods) {
    // Schedule payment for the start of each period
    const paymentDate = new Date(period.startDate);
    
    // Only schedule if in the future
    if (paymentDate > new Date()) {
      try {
        const amountInCents = Math.round(period.totalWithCCFee * 100);
        
        // Create a payment intent for future execution
        // In production, you'd use Stripe Billing / Subscriptions for this
        // For now, create payment intents that will be charged off-session
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          customer: customerId,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: false, // Will be confirmed by a cron job on the payment date
          metadata: {
            type: 'recurring_payment',
            roomId: meta.roomId,
            roomSlug: meta.roomSlug,
            arrival: meta.arrival,
            departure: meta.departure,
            periodNumber: String(period.periodNumber),
            scheduledDate: period.startDate,
            periodStart: period.startDate,
            periodEnd: period.endDate,
            nights: String(period.nights),
          },
          description: `Stay Anchorage - ${meta.roomSlug} | Period ${period.periodNumber} (${period.startDate} to ${period.endDate})`,
        });

        console.log(`Scheduled recurring payment: Period ${period.periodNumber}, $${period.totalWithCCFee}, date: ${period.startDate}, PI: ${paymentIntent.id}`);
      } catch (err) {
        console.error(`Failed to schedule period ${period.periodNumber}:`, err);
      }
    }
  }
}
