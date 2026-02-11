/**
 * Beds24 API Client for Stay Anchorage
 * Property ID: 17757
 * V2 API for rates/availability, V1 for booking creation
 */

const BEDS24_V1_API = 'https://beds24.com/api/json';
const BEDS24_V2_API = 'https://beds24.com/api/v2';
const PROP_ID = 17757;
const MIN_NIGHTS = 2;

// Room IDs for Stay Anchorage units
export const ROOM_IDS: Record<string, number> = {
  'unit-1': 43512,
  'unit-2': 43513,
  'unit-3': 435186,
  'unit-4': 43514,
  'unit-4-2': 402537,
};

export const ROOM_INFO: Record<number, { name: string; slug: string; maxGuests: number; minPrice: number }> = {
  43512: { name: 'Unit 1', slug: 'unit-1', maxGuests: 5, minPrice: 60 },
  43513: { name: 'Unit 2', slug: 'unit-2', maxGuests: 5, minPrice: 60 },
  435186: { name: 'Unit 3', slug: 'unit-3', maxGuests: 5, minPrice: 60 },
  43514: { name: 'Unit 4', slug: 'unit-4', maxGuests: 4, minPrice: 70 },
  402537: { name: 'Unit 4-2', slug: 'unit-4-2', maxGuests: 4, minPrice: 70 },
};

function getV2Token(): string {
  const token = process.env.BEDS24_V2_TOKEN;
  if (!token) throw new Error('BEDS24_V2_TOKEN not configured');
  return token;
}

function getV1ApiKey(): string {
  const key = process.env.BEDS24_API_KEY;
  if (!key) throw new Error('BEDS24_API_KEY not configured');
  return key;
}

// ─── V2 API: Get offers (rates + availability) ───

export interface RoomOffer {
  roomId: number;
  roomName: string;
  slug: string;
  available: boolean;
  price: number | null;
  nightlyRates: { date: string; rate: number }[];
  maxGuests: number;
}

export async function getOffers(
  arrival: string, // YYYY-MM-DD
  departure: string, // YYYY-MM-DD
  numAdults: number = 2
): Promise<{ rooms: RoomOffer[]; nights: number; error?: string }> {
  const arrDate = new Date(arrival);
  const depDate = new Date(departure);
  const nights = Math.ceil((depDate.getTime() - arrDate.getTime()) / (1000 * 60 * 60 * 24));

  if (nights < MIN_NIGHTS) {
    return { rooms: [], nights, error: `Minimum stay is ${MIN_NIGHTS} nights` };
  }

  try {
    const url = `${BEDS24_V2_API}/inventory/rooms/offers?propertyId=${PROP_ID}&arrival=${arrival}&departure=${departure}&numAdults=${numAdults}`;
    const res = await fetch(url, {
      headers: { token: getV2Token() },
      next: { revalidate: 300 }, // Cache 5 min
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Beds24 offers error:', data.error);
      return { rooms: [], nights, error: data.error };
    }

    const rooms: RoomOffer[] = (data.data || []).map((room: any) => {
      const info = ROOM_INFO[room.roomId];
      const offer = room.offers?.[0];
      return {
        roomId: room.roomId,
        roomName: info?.name || `Room ${room.roomId}`,
        slug: info?.slug || `room-${room.roomId}`,
        available: !!offer,
        price: offer?.price ?? null,
        nightlyRates: offer?.dailyRates
          ? Object.entries(offer.dailyRates).map(([date, rate]) => ({ date, rate: rate as number }))
          : [],
        maxGuests: info?.maxGuests || 2,
      };
    });

    return { rooms, nights };
  } catch (error) {
    console.error('Beds24 offers fetch error:', error);
    return { rooms: [], nights, error: 'Failed to fetch availability' };
  }
}

// ─── V2 API: Get calendar rates (per-day pricing) ───

export async function getCalendarRates(
  roomId: number,
  startDate: string, // YYYY-MM-DD
  endDate: string
): Promise<{ date: string; rate: number }[]> {
  try {
    const url = `${BEDS24_V2_API}/inventory/rooms/calendar?roomId=${roomId}&startDate=${startDate}&endDate=${endDate}`;
    const res = await fetch(url, {
      headers: { token: getV2Token() },
    });
    const data = await res.json();

    if (!data.success || !data.data) return [];

    return data.data.map((day: any) => ({
      date: day.date,
      rate: day.price1 || day.price || 0,
    }));
  } catch (error) {
    console.error('Calendar rates error:', error);
    return [];
  }
}

// ─── V2 API: Create booking ───

export interface BookingRequest {
  roomId: number;
  arrival: string; // YYYY-MM-DD
  departure: string; // YYYY-MM-DD
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  numAdults: number;
  numChildren?: number;
  notes?: string;
  totalPrice: number;
  paymentMethod: 'stripe' | 'forte';
  paymentId: string;
}

export async function createBooking(booking: BookingRequest): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    const res = await fetch(`${BEDS24_V2_API}/bookings`, {
      method: 'POST',
      headers: {
        token: getV2Token(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        roomId: booking.roomId,
        arrival: booking.arrival,
        departure: booking.departure,
        status: 1, // confirmed
        numAdult: booking.numAdults,
        numChild: booking.numChildren || 0,
        guestFirstName: booking.firstName,
        guestName: booking.lastName,
        guestEmail: booking.email,
        guestPhone: booking.phone,
        price: booking.totalPrice,
        guestComments: booking.notes || '',
        infoItems: [
          {
            code: 'payment_method',
            text: booking.paymentMethod === 'stripe' ? 'Credit Card (Stripe)' : 'ACH (Forte)',
          },
          {
            code: 'payment_id',
            text: booking.paymentId,
          },
        ],
      }]),
    });

    const data = await res.json();

    if (data.success && data.data?.[0]?.id) {
      return { success: true, bookingId: String(data.data[0].id) };
    }

    // Fallback to v1 if v2 booking creation fails
    return await createBookingV1(booking);
  } catch (error) {
    console.error('Beds24 booking creation error:', error);
    return { success: false, error: 'Failed to create booking' };
  }
}

async function createBookingV1(booking: BookingRequest): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    const res = await fetch(`${BEDS24_V1_API}/setBooking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authentication: { apiKey: getV1ApiKey() },
        roomId: String(booking.roomId),
        arrival: booking.arrival.replace(/-/g, ''),
        departure: booking.departure.replace(/-/g, ''),
        status: 1,
        numAdult: booking.numAdults,
        numChild: booking.numChildren || 0,
        guestFirstName: booking.firstName,
        guestName: booking.lastName,
        guestEmail: booking.email,
        guestPhone: booking.phone,
        price: booking.totalPrice,
        guestComments: `Payment: ${booking.paymentMethod.toUpperCase()} | ID: ${booking.paymentId}`,
      }),
    });

    const data = await res.json();
    const bookingId = data?.setBooking?.bookId || data?.setBooking?.bookingId;

    if (bookingId) {
      return { success: true, bookingId: String(bookingId) };
    }

    return { success: false, error: JSON.stringify(data) };
  } catch (error) {
    console.error('Beds24 v1 booking error:', error);
    return { success: false, error: 'Failed to create booking via v1 API' };
  }
}
