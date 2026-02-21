import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility | Rewak Studios',
  description: 'Accessibility information for Rewak Studios in Fairbanks, Alaska.',
};

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">Rewak Studios</Link>
          <a href="tel:+18888518324" className="text-blue-600 hover:text-blue-700 font-medium">(888) 851-8324</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Accessibility</h1>

        <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Our Commitment</h2>
            <p>
              Rewak Studios is committed to making our website and our property accessible to all
              guests, including those with disabilities. We strive to conform to the Web Content
              Accessibility Guidelines (WCAG) 2.1 Level AA standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Website Accessibility</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Semantic HTML structure with proper heading hierarchy</li>
              <li>Form labels associated with their inputs</li>
              <li>Sufficient color contrast ratios for text and interactive elements</li>
              <li>Keyboard-navigable interface</li>
              <li>Alt text on images</li>
              <li>Responsive design that works across devices and zoom levels</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Property Accessibility</h2>
            <p className="mb-3">
              Our property at 3483 Rewak Drive, Fairbanks, AK 99709 includes:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Ground-floor rooms available</li>
              <li>Well-lit parking and pathways</li>
              <li>Wide doorways in select units</li>
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              Please contact us before booking if you have specific accessibility needs so we can
              ensure the best possible experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of Rewak Studios. If you encounter
              any barriers or have suggestions, please contact us:
            </p>
            <ul className="mt-3 space-y-1">
              <li>📞 <a href="tel:+18888518324" className="text-blue-600 hover:underline">(888) 851-8324</a></li>
              <li>✉️ <a href="mailto:info@rewakstudios.com" className="text-blue-600 hover:underline">info@rewakstudios.com</a></li>
            </ul>
          </section>

          <p className="text-sm text-slate-400 pt-4 border-t">
            Last updated: February 2026
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline font-medium">← Back to Home</Link>
        </div>
      </div>
    </main>
  );
}
