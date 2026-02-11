import { NextRequest, NextResponse } from 'next/server';
import { getOffers, getCalendarRates, ROOM_IDS, ROOM_INFO } from '@/lib/beds24';
import { calculatePricing } from '@/lib/pricing';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomSlug = searchParams.get('roomId') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '2');

  if (!roomSlug || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const arrival = checkIn.includes('-') ? checkIn : `${checkIn.slice(0,4)}-${checkIn.slice(4,6)}-${checkIn.slice(6,8)}`;
  const departure = checkOut.includes('-') ? checkOut : `${checkOut.slice(0,4)}-${checkOut.slice(4,6)}-${checkOut.slice(6,8)}`;

  const roomId = ROOM_IDS[roomSlug];
  if (!roomId) {
    return NextResponse.json({ error: 'Invalid room' }, { status: 400 });
  }

  const roomInfo = ROOM_INFO[roomId];

  try {
    const { rooms, nights, error } = await getOffers(arrival, departure, guests);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const room = rooms.find(r => r.roomId === roomId);
    if (!room || !room.available) {
      return NextResponse.json({ error: 'Unit not available for selected dates' }, { status: 400 });
    }

    let nightlyRates = room.nightlyRates;
    if (!nightlyRates.length && room.price) {
      const calRates = await getCalendarRates(roomId, arrival, departure);
      if (calRates.length) {
        nightlyRates = calRates;
      } else {
        const avgRate = room.price / nights;
        const startDate = new Date(arrival);
        nightlyRates = Array.from({ length: nights }, (_, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return { date: d.toISOString().split('T')[0], rate: Math.round(avgRate * 100) / 100 };
        });
      }
    }

    if (!nightlyRates.length) {
      return NextResponse.json({ error: 'Unable to retrieve rates' }, { status: 400 });
    }

    const pricing = calculatePricing(nightlyRates);

    return NextResponse.json({
      room: { roomId, name: roomInfo.name, slug: roomSlug, maxGuests: roomInfo.maxGuests },
      arrival, departure, guests, pricing,
    });
  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: 'Failed to calculate pricing' }, { status: 500 });
  }
}
