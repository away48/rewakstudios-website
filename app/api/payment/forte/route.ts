import { NextRequest, NextResponse } from 'next/server';
import { createBooking, ROOM_IDS } from '@/lib/beds24';
import { calculatePricing } from '@/lib/pricing';

const FORTE_API = 'https://api.forte.net/v3';

function getForteAuth(): string {
  return Buffer.from(`${process.env.FORTE_ACCESS_ID}:${process.env.FORTE_SECURE_KEY}`).toString('base64');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomSlug, arrival, departure, guests, firstName, lastName, email, phone, nightlyRates, routingNumber, accountNumber, accountType } = body;

    if (!roomSlug || !arrival || !departure || !firstName || !lastName || !email || !nightlyRates?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!routingNumber || !accountNumber) {
      return NextResponse.json({ error: 'Bank account details required' }, { status: 400 });
    }

    const roomId = ROOM_IDS[roomSlug];
    if (!roomId) return NextResponse.json({ error: 'Invalid room' }, { status: 400 });

    const pricing = calculatePricing(nightlyRates);
    const chargeAmount = pricing.isLongTerm && pricing.billingSchedule?.length
      ? pricing.billingSchedule[0].total : pricing.totalACH;

    const transactionRes = await fetch(
      `${FORTE_API}/organizations/${process.env.FORTE_ORG_ID}/locations/${process.env.FORTE_LOC_ID}/transactions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getForteAuth()}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Forte-Auth-Organization-Id': `org_${process.env.FORTE_ORG_ID}`,
        },
        body: JSON.stringify({
          action: 'sale',
          authorization_amount: chargeAmount,
          billing_address: { first_name: firstName, last_name: lastName },
          echeck: {
            account_holder: `${firstName} ${lastName}`,
            routing_number: routingNumber,
            account_number: accountNumber,
            account_type: accountType || 'checking',
            sec_code: 'WEB',
          },
        }),
      }
    );

    const txData = await transactionRes.json();

    if (txData.response?.response_code === 'A01' || txData.response?.response_desc?.includes('APPROVED')) {
      const bookingResult = await createBooking({
        roomId, arrival, departure, firstName, lastName, email, phone,
        numAdults: guests || 2, totalPrice: chargeAmount,
        paymentMethod: 'forte', paymentId: txData.transaction_id,
        notes: `ACH payment. ${pricing.isLongTerm ? `Period 1/${pricing.billingSchedule?.length}` : `${pricing.nights} nights`}`,
      });

      return NextResponse.json({
        success: true, transactionId: txData.transaction_id,
        bookingId: bookingResult.bookingId, chargeAmount,
        isRecurring: pricing.isLongTerm, pricing,
      });
    } else {
      return NextResponse.json({ error: txData.response?.response_desc || 'ACH payment declined' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Forte payment error:', error);
    return NextResponse.json({ error: error.message || 'ACH payment failed' }, { status: 500 });
  }
}
