/**
 * Beds24 API Client for Rewak Studios
 * Property ID: 5780 (Fairbanks, AK)
 * 3 Room Types: Queen, 2 Doubles, 2BR Apartment
 */

const BEDS24_JSON_API = 'https://api.beds24.com/json';
const PROP_ID = 5780;

// Room IDs for Rewak Studios
export const ROOM_IDS: Record<string, number> = {
  'queen': 13092,
  'two-doubles': 56674,
  'apartment-2br': 411888, // TODO: Verify this is "Unit 5"
};

export const ROOM_INFO: Record<number, { name: string; slug: string; maxGuests: number; minPrice: number }> = {
  13092: { name: 'Queen Room', slug: 'queen', maxGuests: 2, minPrice: 97 },
  56674: { name: 'Two Doubles', slug: 'two-doubles', maxGuests: 4, minPrice: 120 },
  411888: { name: '2BR Apartment', slug: 'apartment-2br', maxGuests: 4, minPrice: 165 },
};

function getV1ApiKey(): string {
  const key = process.env.BEDS24_API_KEY;
  if (!key) throw new Error('BEDS24_API_KEY not configured');
  return key;
}

// Convert YYYY-MM-DD or YYYYMMDD → YYYYMMDD
function toYYYYMMDD(d: string): string {
  return d.includes('-') ? d.replace(/-/g, '') : d;
}

// Convert YYYYMMDD or YYYY-MM-DD → Date
function toDate(d: string): Date {
  const s = d.includes('-') ? d : `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
  return new Date(s);
}

// ─── Availability API: Get offers (rates + availability) ───

export interface RoomOffer {
  roomId: number;
  roomName: string;
  slug: string;
  available: boolean;
  price: number | null;
  nightlyRates: { date: string; rate: number }[];
  maxGuests: number;
}

export async function getOffers(checkIn: string, checkOut: string, guests: number = 2): Promise<{
  success: boolean;
  rooms: RoomOffer[];
  nights: number;
  error?: string;
}> {
  const nights = Math.round((toDate(checkOut).getTime() - toDate(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  try {
    const response = await fetch(`${BEDS24_JSON_API}/getAvailabilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkIn: toYYYYMMDD(checkIn),
        checkOut: toYYYYMMDD(checkOut),
        propId: String(PROP_ID),
        numAdult: String(guests),
      }),
    });

    if (!response.ok) {
      return { success: false, rooms: [], nights, error: `API error: ${response.status}` };
    }

    const data = await response.json();

    // Map our 3 room types from the response (room IDs are keys in the response)
    const rooms: RoomOffer[] = Object.values(ROOM_IDS).map((roomId) => {
      const roomData = data[String(roomId)];
      const roomInfo = ROOM_INFO[roomId];
      const available = roomData ? Number(roomData.roomsavail) > 0 : false;
      const totalPriceDollars = roomData?.price ? Number(roomData.price) : null;
      const nightlyRateDollars = totalPriceDollars && nights > 0
        ? Math.round((totalPriceDollars / nights) * 100) / 100
        : null;

      // Build nightly breakdown (even rate per night)
      const nightlyRates = nightlyRateDollars
        ? Array.from({ length: nights }, (_, i) => {
            const d = toDate(checkIn);
            d.setDate(d.getDate() + i);
            return { date: d.toISOString().split('T')[0], rate: nightlyRateDollars };
          })
        : [];

      return {
        roomId,
        roomName: roomInfo?.name || `Room ${roomId}`,
        slug: roomInfo?.slug || `room-${roomId}`,
        available,
        price: totalPriceDollars ? Math.round(totalPriceDollars * 100) : null, // store as cents
        nightlyRates,
        maxGuests: roomInfo?.maxGuests || 4,
      };
    });

    return { success: true, rooms, nights };
  } catch (error) {
    console.error('Beds24 API error:', error);
    return { success: false, rooms: [], nights, error: String(error) };
  }
}

// ─── V2 API: Get calendar rates (fallback for nightly breakdown) ───

export async function getCalendarRates(roomId: number, checkIn: string, checkOut: string): Promise<{ date: string; rate: number }[]> {
  try {
    const nights = Math.round((toDate(checkOut).getTime() - toDate(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const response = await fetch(`${BEDS24_JSON_API}/getAvailabilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkIn: toYYYYMMDD(checkIn),
        checkOut: toYYYYMMDD(checkOut),
        propId: String(PROP_ID),
        numAdult: '1',
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    const roomData = data[String(roomId)];
    if (!roomData?.price) return [];

    const totalPrice = Number(roomData.price);
    const nightlyRate = Math.round((totalPrice / nights) * 100) / 100;

    return Array.from({ length: nights }, (_, i) => {
      const d = toDate(checkIn);
      d.setDate(d.getDate() + i);
      return { date: d.toISOString().split('T')[0], rate: nightlyRate };
    });
  } catch (error) {
    console.error('Beds24 calendar rates error:', error);
    return [];
  }
}

// ─── V1 API: Create booking ───

export interface BookingDetails {
  roomId: number;
  arrival: string;
  departure: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  numAdults: number;
  totalPrice: number;
  nightlyRates?: { date: string; rate: number }[];
  paymentMethod?: string;
  paymentId?: string;
  notes?: string;
}

export async function createBooking(details: BookingDetails): Promise<{
  success: boolean;
  bookingId?: string;
  error?: string;
}> {
  try {
    const guestName = `${details.firstName} ${details.lastName}`;
    
    const requestBody = {
      authentication: {
        apiKey: getV1ApiKey(),
      },
      booking: {
        roomId: details.roomId,
        arrival: details.arrival,
        departure: details.departure,
        numAdult: details.numAdults,
        guestFirstName: details.firstName,
        guestName: guestName,
        guestEmail: details.email,
        guestPhone: details.phone,
        price: details.totalPrice,
        status: 1, // Confirmed
        notes: details.notes || '',
      },
    };

    const response = await fetch(`${BEDS24_JSON_API}/setBooking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.success && data.bookingId) {
      return { success: true, bookingId: String(data.bookingId) };
    }

    return { success: false, error: data.error || 'Booking creation failed' };
  } catch (error) {
    console.error('Beds24 booking error:', error);
    return { success: false, error: String(error) };
  }
}
