'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

// Stay Anchorage units from Beds24 (propId: 17757)
const properties = [
  {
    id: 'unit-1',
    roomId: '43512',
    name: 'Unit 1',
    type: '1 Bedroom',
    beds: '1 Queen Bed',
    guests: 5,
    bathrooms: 1,
    sqft: 550,
    price: 6000, // $60 min from Beds24
    description: 'Cozy downtown apartment perfect for couples or solo travelers. Walking distance to everything.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV'],
    images: [
      'https://media.xmlcal.com/pic/p0001/7757/42.png',
      'https://media.xmlcal.com/pic/p0001/7757/41.png',
      'https://media.xmlcal.com/pic/p0001/7757/22.png',
      'https://media.xmlcal.com/pic/p0001/7757/21.png',
      'https://media.xmlcal.com/pic/p0001/7757/17.png',
      'https://media.xmlcal.com/pic/p0001/7757/18.png',
    ],
  },
  {
    id: 'unit-2',
    roomId: '43513',
    name: 'Unit 2',
    type: '1 Bedroom',
    beds: '1 Queen Bed',
    guests: 5,
    bathrooms: 1,
    sqft: 550,
    price: 6000,
    description: 'Bright and airy one-bedroom with modern finishes. Great for extended stays.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV', 'Workspace'],
    images: [
      'https://media.xmlcal.com/pic/p0001/7757/62.png',
      'https://media.xmlcal.com/pic/p0001/7757/65.png',
      'https://media.xmlcal.com/pic/p0001/7757/63.png',
      'https://media.xmlcal.com/pic/p0001/7757/66.png',
      'https://media.xmlcal.com/pic/p0001/7757/56.png',
      'https://media.xmlcal.com/pic/p0001/7757/57.png',
    ],
  },
  {
    id: 'unit-3',
    roomId: '435186',
    name: 'Unit 3',
    type: '2 Bedroom',
    beds: '1 King, 1 Queen',
    guests: 5,
    bathrooms: 1,
    sqft: 750,
    price: 6000,
    description: 'Spacious two-bedroom ideal for families or groups. Plenty of room to spread out.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV', 'Dining Area'],
    images: [
      'https://media.xmlcal.com/pic/p0001/7757/46.png',
      'https://media.xmlcal.com/pic/p0001/7757/44.png',
      'https://media.xmlcal.com/pic/p0001/7757/45.png',
      'https://media.xmlcal.com/pic/p0001/7757/49.png',
      'https://media.xmlcal.com/pic/p0001/7757/51.png',
      'https://media.xmlcal.com/pic/p0001/7757/52.png',
    ],
  },
  {
    id: 'unit-4',
    roomId: '43514',
    name: 'Unit 4',
    type: '2 Bedroom',
    beds: '1 King, 1 Queen',
    guests: 4,
    bathrooms: 1,
    sqft: 750,
    price: 7000, // $70 min from Beds24
    description: 'Corner unit with extra natural light. Perfect for longer stays or small groups.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV', 'Corner Unit'],
    images: [
      'https://media.xmlcal.com/pic/p0001/7757/40.png',
      'https://media.xmlcal.com/pic/p0001/7757/30.png',
      'https://media.xmlcal.com/pic/p0001/7757/32.png',
      'https://media.xmlcal.com/pic/p0001/7757/37.png',
      'https://media.xmlcal.com/pic/p0001/7757/38.png',
      'https://media.xmlcal.com/pic/p0001/7757/36.png',
    ],
  },
  {
    id: 'unit-4-2',
    roomId: '402537',
    name: 'Unit 4-2',
    type: '2 Bedroom',
    beds: '1 King, 1 Queen',
    guests: 4,
    bathrooms: 1,
    sqft: 750,
    price: 7000,
    description: 'Spacious two-bedroom with premium finishes. Ideal for families or work groups.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV', 'Premium Finishes'],
    images: [
      'https://media.xmlcal.com/pic/p0001/7757/44.png',
      'https://media.xmlcal.com/pic/p0001/7757/45.png',
      'https://media.xmlcal.com/pic/p0001/7757/46.png',
      'https://media.xmlcal.com/pic/p0001/7757/47.png',
      'https://media.xmlcal.com/pic/p0001/7757/49.png',
      'https://media.xmlcal.com/pic/p0001/7757/51.png',
    ],
  },
];

function RoomsContent() {
  const searchParams = useSearchParams();
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '2');
  
  const [filteredProperties, setFilteredProperties] = useState(properties);
  
  useEffect(() => {
    const filtered = properties.filter(p => p.guests >= guests);
    setFilteredProperties(filtered);
  }, [guests]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Stay Anchorage
          </Link>
          <a 
            href="tel:+19073123456"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Contact Us
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {checkIn && checkOut && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-blue-800">
              Showing available properties for <strong>{guests} guests</strong>
              {checkIn && checkOut && (
                <> from <strong>{checkIn.slice(4,6)}/{checkIn.slice(6,8)}</strong> to <strong>{checkOut.slice(4,6)}/{checkOut.slice(6,8)}</strong></>
              )}
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">Available Properties</h1>
        <p className="text-slate-600 mb-8">222 W 13th Ave, Anchorage, AK 99501</p>

        <div className="grid md:grid-cols-2 gap-8">
          {filteredProperties.map((property) => (
            <div 
              key={property.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[16/10] bg-slate-200 relative">
                <Image
                  src={property.images[0]}
                  alt={property.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
                  {property.type}
                </div>
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
                  {property.amenities.slice(0, 4).map((amenity) => (
                    <span 
                      key={amenity}
                      className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                  {property.amenities.length > 4 && (
                    <span className="text-slate-500 text-xs px-2 py-1">
                      +{property.amenities.length - 4} more
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold text-slate-900">
                      {formatPrice(property.price)}
                    </span>
                    <span className="text-slate-500 text-sm"> / night</span>
                  </div>
                  <Link
                    href={`/checkout?property=${property.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">No properties available for {guests} guests.</p>
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
