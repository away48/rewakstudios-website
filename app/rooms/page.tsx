'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

// Rewak Studios rooms from Beds24 (propId: 5780, Fairbanks AK)
const properties = [
  {
    id: 'queen',
    roomId: 13092,
    name: 'Queen Room',
    type: 'Studio',
    beds: '1 Queen Bed',
    guests: 2,
    bathrooms: 1,
    sqft: 300,
    price: 8900, // $89 baseline
    description: 'Cozy studio with queen bed, perfect for solo travelers or couples. Shared kitchenette access.',
    amenities: ['Shared Kitchenette', 'WiFi', 'Free Parking', 'Smart TV'],
    images: [
      'https://media.xmlcal.com/pic/p0000/5780/17.png',
      'https://media.xmlcal.com/pic/p0000/5780/19.png',
    ],
  },
  {
    id: 'two-doubles',
    roomId: 56674,
    name: 'Two Doubles',
    type: 'Studio',
    beds: '2 Double Beds',
    guests: 4,
    bathrooms: 1,
    sqft: 350,
    price: 12000, // $120 baseline
    description: 'Spacious studio with two double beds, ideal for small families or groups. Shared kitchenette access.',
    amenities: ['Shared Kitchenette', 'WiFi', 'Free Parking', 'Smart TV'],
    images: [
      'https://media.xmlcal.com/pic/p0000/5780/06.png',
      'https://media.xmlcal.com/pic/p0000/5780/19.png',
    ],
  },
  {
    id: 'apartment-2br',
    roomId: 411888,
    name: '2-Bedroom Apartment',
    type: '2 Bedroom Apartment',
    beds: '2 Queen Beds',
    guests: 4,
    bathrooms: 1,
    sqft: 750,
    price: 16500, // $165 baseline
    description: 'Full 2-bedroom apartment with complete kitchen, living area, and private bath. Perfect for small families or extended stays.',
    amenities: ['Full Kitchen', 'WiFi', 'Free Parking', 'Smart TV', 'Living Area'],
    images: [
      'https://media.xmlcal.com/pic/p0000/5780/34.png',
      'https://media.xmlcal.com/pic/p0000/5780/31.png',
    ],
  },
];

// Convert YYYYMMDD → YYYY-MM-DD for date inputs
const toInputDate = (d: string) => d && d.length === 8 ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}` : d;
// Convert YYYY-MM-DD → YYYYMMDD for URL params
const toParamDate = (d: string) => d.replace(/-/g, '');

function RoomsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCheckIn = searchParams.get('checkIn') || '';
  const initialCheckOut = searchParams.get('checkOut') || '';
  const initialGuests = searchParams.get('guests') || '2';

  const [checkInInput, setCheckInInput] = useState(toInputDate(initialCheckIn));
  const [checkOutInput, setCheckOutInput] = useState(toInputDate(initialCheckOut));
  const [guestsInput, setGuestsInput] = useState(initialGuests);

  // These are the "committed" search values (YYYYMMDD format)
  const checkIn = initialCheckIn;
  const checkOut = initialCheckOut;
  const guests = parseInt(initialGuests);
  
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);
  const [nights, setNights] = useState(0);
  const [expandedAmenities, setExpandedAmenities] = useState<Set<string>>(new Set());

  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!checkInInput || !checkOutInput) return;
    const params = new URLSearchParams({
      checkIn: toParamDate(checkInInput),
      checkOut: toParamDate(checkOutInput),
      guests: guestsInput,
    });
    router.push(`/rooms?${params.toString()}`);
  }, [checkInInput, checkOutInput, guestsInput, router]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  
  useEffect(() => {
    const filtered = properties.filter(p => p.guests >= guests);
    setFilteredProperties(filtered);
  }, [guests]);

  // Fetch live pricing from Beds24 if dates are provided
  useEffect(() => {
    if (checkIn && checkOut) {
      setLoadingPrices(true);
      fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.rooms) {
            setLiveRooms(data.rooms);
            if (data.nights) setNights(data.nights);
          }
        })
        .catch(err => console.error('Failed to fetch live pricing:', err))
        .finally(() => setLoadingPrices(false));
    }
  }, [checkIn, checkOut, guests]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getRoomPrice = (roomId: number) => {
    const liveRoom = liveRooms.find(r => r.roomId === roomId);
    return liveRoom?.price || null;
  };

  const isRoomAvailable = (roomId: number) => {
    const liveRoom = liveRooms.find(r => r.roomId === roomId);
    return liveRoom ? liveRoom.available : true; // Default to available if no live data
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Rewak Studios
          </Link>
          <a 
            href="tel:+18888518324"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            (888) 851-8324
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Date & Guest Search */}
        <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label htmlFor="checkIn" className="block text-xs font-medium text-slate-500 mb-1">Check In</label>
              <input
                id="checkIn"
                type="date"
                min={minDate}
                value={checkInInput}
                onChange={(e) => setCheckInInput(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="checkOut" className="block text-xs font-medium text-slate-500 mb-1">Check Out</label>
              <input
                id="checkOut"
                type="date"
                min={checkInInput || minDate}
                value={checkOutInput}
                onChange={(e) => setCheckOutInput(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="guests" className="block text-xs font-medium text-slate-500 mb-1">Guests</label>
              <select
                id="guests"
                value={guestsInput}
                onChange={(e) => setGuestsInput(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                {loadingPrices ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          {checkIn && checkOut && !loadingPrices && (
            <p className="text-xs text-slate-500 mt-2">
              Showing rates for {nights} night{nights !== 1 ? 's' : ''}: {checkIn.slice(4,6)}/{checkIn.slice(6,8)} → {checkOut.slice(4,6)}/{checkOut.slice(6,8)}
            </p>
          )}
        </form>

        <h1 className="text-3xl font-bold mb-2">Available Rooms</h1>
        <p className="text-slate-600 mb-1">3483 Rewak Drive, Fairbanks, AK 99709</p>
        <p className="text-sm text-blue-600 mb-8">✓ Nightly, Weekly &amp; Monthly rates available</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => {
            const currentPrice = getRoomPrice(property.roomId);
            const available = isRoomAvailable(property.roomId);
            const hasLivePrice = currentPrice !== null;

            return (
              <div 
                key={property.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow ${!available ? 'opacity-60' : ''}`}
              >
                <div className="aspect-[16/10] bg-slate-200 relative">
                  <Image
                    src={property.images[0]}
                    alt={property.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
                    {property.type}
                  </div>
                  {!available && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                      <span className="bg-white/90 px-4 py-2 rounded-lg font-semibold text-slate-900">
                        Not Available
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{property.name}</h2>
                  <p className="text-slate-600 text-sm mb-4">{property.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                    <span>👥 Up to {property.guests} guests</span>
                    <span>🛏️ {property.beds}</span>
                    <span>🚿 {property.bathrooms} bath</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(expandedAmenities.has(property.id) ? property.amenities : property.amenities.slice(0, 3)).map((amenity) => (
                      <span 
                        key={amenity}
                        className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <button
                        onClick={() => setExpandedAmenities(prev => {
                          const next = new Set(prev);
                          next.has(property.id) ? next.delete(property.id) : next.add(property.id);
                          return next;
                        })}
                        className="text-blue-600 text-xs px-2 py-1 hover:underline cursor-pointer"
                      >
                        {expandedAmenities.has(property.id) ? 'Show less' : `+${property.amenities.length - 3} more`}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      {hasLivePrice ? (
                        <>
                          <span className="text-2xl font-bold text-slate-900">
                            {nights > 1 ? formatPrice(Math.round(currentPrice! / nights)) : formatPrice(currentPrice!)}
                          </span>
                          <span className="text-slate-500 text-sm"> / night</span>
                          {nights > 1 && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {formatPrice(currentPrice!)} total · {nights} nights
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-600 text-sm">Select dates to see rates</span>
                      )}
                    </div>
                    {hasLivePrice && available ? (
                      <Link
                        href={`/checkout?room=${property.id}&roomId=${property.roomId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                      >
                        Book Now
                      </Link>
                    ) : hasLivePrice && !available ? (
                      <button 
                        disabled
                        className="bg-slate-300 text-slate-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed"
                      >
                        Unavailable
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="bg-slate-200 text-slate-400 font-semibold py-3 px-6 rounded-xl cursor-not-allowed"
                      >
                        Select Dates
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">No rooms available for {guests} guests.</p>
            <Link href="/" className="text-blue-600 hover:underline">
              Try a different search
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RoomsContent />
    </Suspense>
  );
}
