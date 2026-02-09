const BEDS24_API = 'https://api.beds24.com/json/v2';

interface Beds24Response {
  success?: boolean;
  error?: string;
  data?: any;
}

export async function getProperties(): Promise<any> {
  const response = await fetch(`${BEDS24_API}/getProperties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: process.env.BEDS24_API_KEY,
      propKey: process.env.BEDS24_PROP_KEY,
    }),
  });
  return response.json();
}

export async function getAvailability(
  propertyId: string,
  checkIn: string,
  checkOut: string
): Promise<any> {
  const response = await fetch(`${BEDS24_API}/getAvailability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: process.env.BEDS24_API_KEY,
      propKey: process.env.BEDS24_PROP_KEY,
      propertyId,
      firstNight: checkIn,
      lastNight: checkOut,
    }),
  });
  return response.json();
}

export async function getRates(
  propertyId: string,
  checkIn: string,
  checkOut: string
): Promise<any> {
  const response = await fetch(`${BEDS24_API}/getRates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: process.env.BEDS24_API_KEY,
      propKey: process.env.BEDS24_PROP_KEY,
      propertyId,
      firstNight: checkIn,
      lastNight: checkOut,
    }),
  });
  return response.json();
}

export async function createBooking(bookingData: any): Promise<any> {
  const response = await fetch(`${BEDS24_API}/setBooking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: process.env.BEDS24_API_KEY,
      propKey: process.env.BEDS24_PROP_KEY,
      ...bookingData,
    }),
  });
  return response.json();
}
