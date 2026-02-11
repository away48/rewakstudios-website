import { NextRequest, NextResponse } from 'next/server';
import { createBooking, ROOM_IDS } from '@/lib/beds24';
import { calculatePricing } from '@/lib/pricing';

const FORTE_API = 'https://api.forte.net/v3';
const FORTE_ORG_ID = process.env.FORTE_ORG_ID || '';
const FORTE_LOC_ID = process.env.FORTE_LOC_ID || '';

function getForteAuth(): string {
  const accessId = process.env.FORTE_ACCESS_ID!;
  const secureKey = process.env.FORTE_SECURE_KEY!;
  return Buffer.from(`${accessId}:${secureKey}`).toString('base64');
}

// POST /api/payment/forte - Process ACH payment
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
      // ACH details
      routingNumber,
      accountNumber,
      accountType, // checking or savings
    } = body;

    if (!roomSlug || !arrival || !departure || !firstName || !lastName || !email || !nightlyRates?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!routingNumber || !accountNumber) {
      return NextResponse.json({ error: 'Bank account details required for ACH payment' }, { status: 400 });
    }

    const roomId = ROOM_IDS[roomSlug];
    if (!roomId) {
      return NextResponse.json({ error: 'Invalid room' }, { status: 400 });
    }

    // Recalculate pricing server-side (ACH = no fee)
    const pricing = calculatePricing(nightlyRates);

    // For long-term stays, charge first period; for short stays, charge full amount
    const chargeAmount = pricing.isLongTerm && pricing.billingSchedule?.length
      ? pricing.billingSchedule[0].total
      : pricing.totalACH;

    const amountInCents = Math.round(chargeAmount * 100);

    // Create Forte transaction
    const transactionRes = await fetch(`${FORTE_API}/organizations/${FORTE_ORG_ID}/locations/${FORTE_LOC_ID}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${getForteAuth()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Forte-Auth-Organization-Id': `org_${FORTE_ORG_ID}`,
      },
      body: JSON.stringify({
        action: 'sale',
        authorization_amount: chargeAmount,
        billing_address: {
          first_name: firstName,
          last_name: lastName,
        },
        echeck: {
          account_holder: `${firstName} ${lastName}`,
          routing_number: routingNumber,
          account_number: accountNumber,
          account_type: accountType || 'checking',
          sec_code: 'WEB',
        },
        line_items: [{
          name: `Stay Anchorage - ${roomSlug}`,
          description: `${arrival} to ${departure} | ${pricing.nights} nights`,
          quantity: 1,
          unit_price: chargeAmount,
        }],
      }),
    });

    const transactionData = await transactionRes.json();

    if (transactionData.response?.response_code === 'A01' || transactionData.response?.response_desc?.includes('APPROVED')) {
      const transactionId = transactionData.transaction_id;

      // Create booking in Beds24
      const bookingResult = await createBooking({
        roomId,
        arrival,
        departure,
        firstName,
        lastName,
        email,
        phone,
        numAdults: guests || 2,
        totalPrice: chargeAmount,
        paymentMethod: 'forte',
        paymentId: transactionId,
        notes: pricing.isLongTerm
          ? `Long-term stay. ACH payment. Period 1 of ${pricing.billingSchedule?.length || '?'}. Total stay: ${pricing.nights} nights.`
          : `Short-term stay. ACH payment. ${pricing.nights} nights.`,
      });

      return NextResponse.json({
        success: true,
        transactionId,
        bookingId: bookingResult.bookingId,
        chargeAmount,
        isRecurring: pricing.isLongTerm && (pricing.billingSchedule?.length || 0) > 1,
        pricing,
      });
    } else {
      return NextResponse.json({
        error: transactionData.response?.response_desc || 'ACH payment declined',
        details: transactionData,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Forte payment error:', error);
    return NextResponse.json({ error: error.message || 'ACH payment failed' }, { status: 500 });
  }
}
