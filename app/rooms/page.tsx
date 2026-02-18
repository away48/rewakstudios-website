'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
      '/images/room-17.jpg', // Queen room
      '/images/rewak-exterior.jpg',
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
      '/images/room-06.jpg', // Two doubles
      '/images/rewak-exterior.jpg',
    ],
  },
  {
    id: 'apartment-2br',
    roomId: 411888,
    name: '2-Bedroom Apartment',
    type: '2 Bedroom Apartment',
    beds: '1 Queen, 1 Double',
    guests: 6,
    bathrooms: 1,
    sqft: 750,
    price: 16500, // $165 baseline
    description: 'Full 2-bedroom apartment with complete kitchen, living area, and private bath. Perfect for families or extended stays.',
    amenities: ['Full Kitchen', 'WiFi', 'Free Parking', 'Smart TV', 'Living Area'],
    images: [
      '/images/room-15.jpg', // 2BR apartment
      '/images/rewak-exterior.jpg',
    ],
  },
];

function RoomsContent() {
  const searchParams = useSearchParams();
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '2');
  
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);
  
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

  const getRoomPrice = (roomId: number, fallbackPrice: number) => {
    const liveRoom = liveRooms.find(r => r.roomId === roomId);
    if (liveRoom && liveRoom.price) {
      return liveRoom.price;
    }
    return fallbackPrice;
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
        {checkIn && checkOut && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-blue-800">
              Showing available rooms for <strong>{guests} guests</strong>
              {checkIn && checkOut && (
                <> from <strong>{checkIn.slice(4,6)}/{checkIn.slice(6,8)}</strong> to <strong>{checkOut.slice(4,6)}/{checkOut.slice(6,8)}</strong></>
              )}
              {loadingPrices && <span className="ml-2 text-sm">(Loading live pricing...)</span>}
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">Available Rooms</h1>
        <p className="text-slate-600 mb-8">3483 Rewak Dr, Fairbanks, AK 99709</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => {
            const currentPrice = getRoomPrice(property.roomId, property.price);
            const available = isRoomAvailable(property.roomId);

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
                    {property.amenities.slice(0, 3).map((amenity) => (
                      <span 
                        key={amenity}
                        className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className="text-slate-500 text-xs px-2 py-1">
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <span className="text-2xl font-bold text-slate-900">
                        {formatPrice(currentPrice)}
                      </span>
                      <span className="text-slate-500 text-sm"> / night</span>
                    </div>
                    {available ? (
                      <Link
                        href={`/checkout?room=${property.id}&roomId=${property.roomId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                      >
                        Book Now
                      </Link>
                    ) : (
                      <button 
                        disabled
                        className="bg-slate-300 text-slate-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed"
                      >
                        Unavailable
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
