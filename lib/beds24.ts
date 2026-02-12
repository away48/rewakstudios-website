/**
 * Beds24 API Client for Rewak Studios
 * Property ID: 5780
 * V2 API for rates/availability, V1 for booking creation
 */

const BEDS24_V1_API = 'https://beds24.com/api/json';
const BEDS24_V2_API = 'https://beds24.com/api/v2';
const PROP_ID = 5780;
const MIN_NIGHTS = 2;

// Rewak Studios has multiple room types - query dynamically
export const ROOM_INFO: Record<number, { name: string; slug: string; maxGuests: number; minPrice: number }> = {
  // Will be populated dynamically from API
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
  error?: string;
}> {
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
      return { success: false, rooms: [], error: `API error: ${response.status}` };
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      return { success: false, rooms: [], error: data.error || 'No rooms found' };
    }

    const rooms: RoomOffer[] = data.data.map((offer: any) => ({
      roomId: offer.roomId,
      roomName: offer.roomName || `Room ${offer.roomId}`,
      slug: `room-${offer.roomId}`,
      available: offer.available === true,
      price: offer.price || null,
      nightlyRates: offer.nightlyRates || [],
      maxGuests: offer.maxPeople || 4,
    }));

    return { success: true, rooms };
  } catch (error) {
    console.error('Beds24 API error:', error);
    return { success: false, rooms: [], error: String(error) };
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
  guests: number;
  price: number;
  nightlyRates: { date: string; rate: number }[];
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
        numAdult: details.guests,
        guestFirstName: details.firstName,
        guestName: guestName,
        guestEmail: details.email,
        guestPhone: details.phone,
        price: details.price,
        status: 1, // Confirmed
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
