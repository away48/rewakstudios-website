/**
 * Beds24 API Client for Rewak Studios
 * Property ID: 5780 (Fairbanks, AK)
 * 3 Room Types: Queen, 2 Doubles, 2BR Apartment
 */

const BEDS24_JSON_API = 'https://api.beds24.com/json';
const PROP_ID = 5780;

// Room type definitions — each type may have multiple physical rooms in Beds24
interface RoomType {
  slug: string;
  name: string;
  maxGuests: number;
  minPrice: number;
  roomIds: number[];         // Parent/aggregate IDs (used for availability count + pricing)
  physicalRoomIds: number[]; // Individual bookable room IDs (required for setBooking)
}

export const ROOM_TYPES: RoomType[] = [
  {
    slug: 'queen',
    name: 'Queen Room',
    maxGuests: 2,
    minPrice: 97,
    roomIds: [13092], // Parent — aggregates all 9 queen units
    // 200-floor studios (Virtual Rooms 200–208) — confirmed via getAvailabilities cross-check
    physicalRoomIds: [57477, 61094, 61095, 61105, 61106, 61108, 61109, 61110, 61111],
  },
  {
    slug: 'two-doubles',
    name: 'Two Doubles',
    maxGuests: 4,
    minPrice: 120,
    roomIds: [13091], // Parent — aggregates all 7 double units
    // 100-floor studios (Virtual Rooms 101–107) — confirmed via getAvailabilities cross-check
    physicalRoomIds: [61044, 61096, 61098, 61099, 61100, 61101, 61104],
  },
  {
    slug: 'apartment-2br',
    name: '2BR Apartment',
    maxGuests: 4,
    minPrice: 165,
    roomIds: [411888],
    physicalRoomIds: [411888], // Already a single physical room
  },
];

// Legacy lookups (used by checkout API)
export const ROOM_IDS: Record<string, number> = Object.fromEntries(
  ROOM_TYPES.map(rt => [rt.slug, rt.roomIds[0]])
);
export const ROOM_INFO: Record<number, { name: string; slug: string; maxGuests: number; minPrice: number }> = {};
for (const rt of ROOM_TYPES) {
  // Index by both parent IDs and physical room IDs so lookups work either way
  for (const id of [...rt.roomIds, ...rt.physicalRoomIds]) {
    ROOM_INFO[id] = { name: rt.name, slug: rt.slug, maxGuests: rt.maxGuests, minPrice: rt.minPrice };
  }
}

function getV1ApiKey(): string {
  const key = process.env.BEDS24_API_KEY;
  if (!key) throw new Error('BEDS24_API_KEY not configured');
  return key;
}

function getV1PropKey(): string {
  const key = process.env.BEDS24_PROP_KEY;
  if (!key) throw new Error('BEDS24_PROP_KEY not configured');
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

    // Build offers per room type
    const rooms: RoomOffer[] = ROOM_TYPES.map((roomType) => {
      // Step 1: Get price + aggregate availability from parent ID
      const parentData = data[String(roomType.roomIds[0])];
      const totalAvail = Number(parentData?.roomsavail) || 0;
      const totalPriceDollars = parentData?.price != null ? Number(parentData.price) : null;

      // Step 2: Find a specific available physical room ID for setBooking
      // (parent IDs cannot be used directly with setBooking)
      let availablePhysicalRoomId: number | null = null;
      for (const rid of roomType.physicalRoomIds) {
        const roomData = data[String(rid)];
        if (roomData && Number(roomData.roomsavail) > 0) {
          availablePhysicalRoomId = rid;
          break;
        }
      }

      const available = totalAvail > 0 && availablePhysicalRoomId !== null;

      const nightlyRateDollars = totalPriceDollars && nights > 0
        ? Math.round((totalPriceDollars / nights) * 100) / 100
        : null;

      const nightlyRates = nightlyRateDollars
        ? Array.from({ length: nights }, (_, i) => {
            const d = toDate(checkIn);
            d.setDate(d.getDate() + i);
            return { date: d.toISOString().split('T')[0], rate: nightlyRateDollars };
          })
        : [];

      return {
        // Return physical room ID — this is what gets stored in Stripe metadata and passed to setBooking
        roomId: availablePhysicalRoomId ?? roomType.physicalRoomIds[0],
        roomName: roomType.name,
        slug: roomType.slug,
        available,
        price: totalPriceDollars ? Math.round(totalPriceDollars * 100) : null,
        nightlyRates,
        maxGuests: roomType.maxGuests,
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
        propKey: getV1PropKey(),
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
