/**
 * Beds24 API Client for Rewak Studios
 * Property ID: 5780 (Fairbanks, AK)
 * 3 Room Types: Queen, 2 Doubles, 2BR Apartment
 */

const BEDS24_V1_API = 'https://beds24.com/api/json';
const BEDS24_V2_API = 'https://beds24.com/api/v2';
const PROP_ID = 5780;
const MIN_NIGHTS = 2;

// Room IDs for Rewak Studios
export const ROOM_IDS: Record<string, number> = {
  'queen': 13092,
  'two-doubles': 56674,
  'apartment-2br': 411888, // TODO: Verify this is "Unit 5"
};

export const ROOM_INFO: Record<number, { name: string; slug: string; maxGuests: number; minPrice: number }> = {
  13092: { name: 'Queen Room', slug: 'queen', maxGuests: 2, minPrice: 97 },
  56674: { name: 'Two Doubles', slug: 'two-doubles', maxGuests: 4, minPrice: 120 },
  411888: { name: '2BR Apartment', slug: 'apartment-2br', maxGuests: 6, minPrice: 165 },
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

export async function getOffers(checkIn: string, checkOut: string, guests: number = 2): Promise<{
  success: boolean;
  rooms: RoomOffer[];
  nights: number;
  error?: string;
}> {
  const nights = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  try {
    const response = await fetch(`${BEDS24_V2_API}/inventory/offers`, {
      method: 'POST',
      headers: {
        'token': getV2Token(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propId: PROP_ID,
        checkIn,
        checkOut,
        numAdult: guests,
      }),
    });

    if (!response.ok) {
      return { success: false, rooms: [], nights, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      return { success: false, rooms: [], nights, error: data.error || 'No rooms found' };
    }

    // Map API response to our 3 room types
    const roomIds = Object.values(ROOM_IDS);
    const rooms: RoomOffer[] = data.data
      .filter((offer: any) => roomIds.includes(offer.roomId))
      .map((offer: any) => {
        const roomInfo = ROOM_INFO[offer.roomId];
        return {
          roomId: offer.roomId,
          roomName: roomInfo?.name || offer.roomName || 'Room',
          slug: roomInfo?.slug || `room-${offer.roomId}`,
          available: offer.available === true,
          price: offer.price || null,
          nightlyRates: offer.nightlyRates || [],
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
    const response = await fetch(`${BEDS24_V2_API}/inventory/offers`, {
      method: 'POST',
      headers: {
        'token': getV2Token(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propId: PROP_ID,
        roomId,
        checkIn,
        checkOut,
        numAdult: 1,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.success || !data.data) return [];

    const room = data.data.find((r: any) => r.roomId === roomId);
    if (!room) return [];

    if (room.nightlyRates && room.nightlyRates.length > 0) {
      return room.nightlyRates;
    }

    // Fallback: distribute total price evenly across nights
    if (room.price) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const avgRate = Math.round((room.price / nights) * 100) / 100;
      return Array.from({ length: nights }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return { date: d.toISOString().split('T')[0], rate: avgRate };
      });
    }

    return [];
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

    const response = await fetch(`${BEDS24_V1_API}/setBooking`, {
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
