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

  // Normalize date format: accept YYYYMMDD or YYYY-MM-DD
  const normDate = (d: string) => d.includes('-') ? d : `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
  const checkInNorm = normDate(checkIn);
  const checkOutNorm = normDate(checkOut);

  try {
    const result = await getOffers(checkInNorm, checkOutNorm, guests);
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
