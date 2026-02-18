import { NextRequest, NextResponse } from 'next/server';
import { getOffers } from '@/lib/beds24';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '2');

  if (!checkIn || !checkOut) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing checkIn or checkOut dates' 
    }, { status: 400 });
  }

  try {
    const result = await getOffers(checkIn, checkOut, guests);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch availability' 
    }, { status: 500 });
  }
}
// Build 1771453833
