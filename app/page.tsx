'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut) return;
    
    const checkInFormatted = checkIn.replace(/-/g, '');
    const checkOutFormatted = checkOut.replace(/-/g, '');
    
    router.push(`/rooms?checkIn=${checkInFormatted}&checkOut=${checkOutFormatted}&guests=${guests}`);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] bg-gradient-to-br from-primary via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://media.xmlcal.com/pic/p0000/7757/01.png')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
            Rewak Studios
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 font-light">
            Extended Stay Living in Fairbanks, Alaska
          </p>
          
          {/* Quick Search */}
          <div className="bg-white/95 backdrop-blur rounded-2xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Check In
                </label>
                <input 
                  type="date" 
                  min={minDate}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Check Out
                </label>
                <input 
                  type="date"
                  min={checkIn || minDate}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Guests
                </label>
                <select 
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5 Guests</option>
                  <option value="6">6 Guests</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
            
            <p className="text-sm text-slate-500 mt-4">
              3 unique rooms • Nightly, Weekly &amp; Monthly rates • Book direct &amp; save
            </p>
          </div>
        </div>
      </section>

      {/* Properties Preview */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Our Rooms</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Choose from three unique rooms at Rewak Studios in Fairbanks, AK
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Queen Room', type: 'Studio', guests: '2 guests', image: 'https://media.xmlcal.com/pic/p0000/5780/17.png' },
              { name: 'Two Doubles', type: 'Studio', guests: '4 guests', image: 'https://media.xmlcal.com/pic/p0000/5780/06.png' },
              { name: '2BR Apartment', type: '2 Bedroom', guests: '4 guests', image: 'https://media.xmlcal.com/pic/p0000/5780/15.png' },
            ].map((unit) => (
              <div key={unit.name} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                  <div className="absolute bottom-4 left-4 z-20 text-white">
                    <p className="text-sm opacity-90">{unit.type}</p>
                    <p className="font-semibold">{unit.name}</p>
                  </div>
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300" style={{backgroundImage: `url(${unit.image})`}} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">{unit.guests}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/rooms"
              className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-8 rounded-xl transition-colors"
            >
              View All Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Stay With Us?</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            More than a hotel room — a real home for your Fairbanks stay
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '🏔️', title: 'Prime Location', desc: 'Minutes from downtown, trails, and attractions' },
              { icon: '🛋️', title: 'Fully Furnished', desc: 'Everything you need from day one' },
              { icon: '📶', title: 'Fast WiFi', desc: 'Work remotely with reliable high-speed internet' },
              { icon: '🚗', title: 'Free Parking', desc: 'Off-street parking included with every unit' },
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Fairbanks</h2>
              <p className="text-slate-600 mb-6">
                Fairbanks sits at the heart of Alaska — the northern lights capital, gateway to Denali, 
                and home to the University of Alaska. Our studios put you close to everything.
              </p>
              
              <ul className="space-y-3">
                {[
                  '🎓 University of Alaska Fairbanks — ~4 miles',
                  '🏥 Fairbanks Memorial Hospital — ~3 miles',
                  '✈️ Fairbanks International Airport — ~4 miles',
                  '🏙️ Downtown Fairbanks — ~4 miles',
                  '🛒 Walmart & Fred Meyer — ~2 miles',
                  '🌌 Aurora viewing — available right from property',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-blue-500">✓</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="aspect-video rounded-2xl overflow-hidden shadow-lg bg-slate-200">
              <div className="w-full h-full bg-[url('https://media.xmlcal.com/pic/p0000/5780/01.png')] bg-cover bg-center" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Book Your Stay?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Whether you&apos;re visiting for business, relocation, or adventure, 
            we have the perfect place for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/rooms"
              className="inline-block bg-white text-blue-600 font-semibold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Browse Rooms
            </Link>
            <a 
              href="tel:+18888518324"
              className="inline-block bg-blue-500 text-white font-semibold py-4 px-8 rounded-xl hover:bg-blue-400 transition-colors border-2 border-blue-400"
            >
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Rewak Studios</h3>
            <p className="text-slate-400 text-sm">
              Fairbanks, AK 99709<br />
              <a href="mailto:info@rewakstudios.com" className="hover:text-white transition-colors">info@rewakstudios.com</a>
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link href="/rooms" className="hover:text-white transition-colors">All Rooms</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Policies</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cancellation" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} ATW Properties, LLC. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
