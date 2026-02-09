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
    
    router.push(\`/rooms?checkIn=\${checkInFormatted}&checkOut=\${checkOutFormatted}&guests=\${guests}\`);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] bg-gradient-to-br from-primary via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('/images/anchorage-mountains.jpg')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
            Stay Anchorage
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 font-light">
            Your Home Away From Home in Alaska's Largest City
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
              4 unique properties • Weekly rates available • Book direct & save
            </p>
          </div>
        </div>
      </section>

      {/* Properties Preview */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Our Properties</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Choose from four unique furnished apartments in prime Anchorage locations
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                name: 'Unit 1', 
                type: '1 Bedroom',
                guests: '2 guests',
                price: 'From $125/night',
                image: '/images/unit1.jpg'
              },
              { 
                name: 'Unit 2', 
                type: '1 Bedroom',
                guests: '2 guests',
                price: 'From $125/night',
                image: '/images/unit2.jpg'
              },
              { 
                name: 'Unit 3', 
                type: '2 Bedroom',
                guests: '4 guests',
                price: 'From $165/night',
                image: '/images/unit3.jpg'
              },
              { 
                name: 'Unit 4', 
                type: '2 Bedroom',
                guests: '4 guests',
                price: 'From $165/night',
                image: '/images/unit4.jpg'
              },
            ].map((unit) => (
              <div key={unit.name} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                  <div className="absolute bottom-4 left-4 z-20 text-white">
                    <p className="text-sm opacity-90">{unit.type}</p>
                    <p className="font-semibold">{unit.name}</p>
                  </div>
                  {/* Placeholder - replace with actual images */}
                  <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">{unit.guests}</span>
                  <span className="font-semibold text-blue-600">{unit.price}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/rooms"
              className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-8 rounded-xl transition-colors"
            >
              View All Properties
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Stay With Us?</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            More than a hotel room — a real home for your Anchorage stay
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Anchorage</h2>
              <p className="text-slate-600 mb-6">
                Alaska's largest city offers incredible outdoor adventures, vibrant culture, 
                and stunning mountain views. Our properties put you in the heart of it all.
              </p>
              
              <ul className="space-y-3">
                {[
                  'Walk to downtown restaurants & shops',
                  'Close to Tony Knowles Coastal Trail',
                  '15 min to Ted Stevens International Airport',
                  'Easy access to Chugach State Park',
                  'Near Alaska Wildlife Conservation Center',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-blue-500">✓</span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2261.5!2d-149.88!3d61.21!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Book Your Stay?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Whether you're visiting for business, relocation, or adventure, 
            we have the perfect place for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/rooms"
              className="inline-block bg-white text-blue-600 font-semibold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Browse Properties
            </Link>
            <a 
              href="tel:+19073123456"
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
            <h3 className="font-semibold text-lg mb-4">Stay Anchorage</h3>
            <p className="text-slate-400 text-sm">
              Anchorage, AK 99501<br />
              <a href="mailto:info@stayanchorage.com" className="hover:text-white transition-colors">info@stayanchorage.com</a>
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link href="/rooms" className="hover:text-white transition-colors">All Properties</Link></li>
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
