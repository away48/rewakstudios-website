'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Property data - will be replaced with Beds24 API data
const properties = [
  {
    id: 'unit-1',
    name: 'Cozy Downtown Studio',
    type: 'Studio',
    bedrooms: 0,
    beds: '1 Queen Bed',
    guests: 2,
    bathrooms: 1,
    sqft: 400,
    price: 12500, // cents
    description: 'Perfect studio for solo travelers or couples. Walking distance to downtown Anchorage.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV'],
    images: ['/images/unit1-1.jpg', '/images/unit1-2.jpg'],
  },
  {
    id: 'unit-2',
    name: 'Modern 1BR Retreat',
    type: '1 Bedroom',
    bedrooms: 1,
    beds: '1 Queen Bed',
    guests: 2,
    bathrooms: 1,
    sqft: 550,
    price: 14500,
    description: 'Spacious one-bedroom with separate living area. Great for extended stays.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV', 'Workspace'],
    images: ['/images/unit2-1.jpg', '/images/unit2-2.jpg'],
  },
  {
    id: 'unit-3',
    name: 'Family 2BR Suite',
    type: '2 Bedroom',
    bedrooms: 2,
    beds: '1 King, 2 Twins',
    guests: 4,
    bathrooms: 1,
    sqft: 850,
    price: 16500,
    description: 'Ideal for families or groups. Two bedrooms with plenty of space to spread out.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV', 'Dining Area'],
    images: ['/images/unit3-1.jpg', '/images/unit3-2.jpg'],
  },
  {
    id: 'unit-4',
    name: 'Deluxe 2BR Mountain View',
    type: '2 Bedroom',
    bedrooms: 2,
    beds: '1 King, 1 Queen',
    guests: 4,
    bathrooms: 2,
    sqft: 950,
    price: 18500,
    description: 'Our largest unit with stunning mountain views. Perfect for longer stays or groups.',
    amenities: ['Full Kitchen', 'WiFi', 'Washer/Dryer', 'Free Parking', 'Smart TV', 'Mountain View', 'Balcony'],
    images: ['/images/unit4-1.jpg', '/images/unit4-2.jpg'],
  },
];

function RoomsContent() {
  const searchParams = useSearchParams();
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '2');
  
  const [filteredProperties, setFilteredProperties] = useState(properties);
  
  useEffect(() => {
    // Filter by guest count
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
      {/* Header */}
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
        {/* Search Summary */}
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

        <h1 className="text-3xl font-bold mb-8">Available Properties</h1>

        {/* Property Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredProperties.map((property) => (
            <div 
              key={property.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="aspect-[16/10] bg-slate-200 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
                  {property.type}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{property.name}</h2>
                <p className="text-slate-600 text-sm mb-4">{property.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                  <span>👥 {property.guests} guests</span>
                  <span>🛏️ {property.beds}</span>
                  <span>🚿 {property.bathrooms} bath</span>
                  <span>📐 {property.sqft} sqft</span>
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
                    href={\`/book?property=\${property.id}&checkIn=\${checkIn}&checkOut=\${checkOut}&guests=\${guests}\`}
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
