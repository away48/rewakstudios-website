'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PricingData {
  room: { roomId: number; name: string; slug: string; maxGuests: number };
  arrival: string;
  departure: string;
  guests: number;
  pricing: {
    nights: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalBeforeFees: number;
    ccFeePercent: number;
    ccFeeAmount: number;
    totalWithCCFee: number;
    totalACH: number;
    isLongTerm: boolean;
    nightlyRates: { date: string; rate: number }[];
    billingSchedule?: {
      periodNumber: number;
      startDate: string;
      endDate: string;
      nights: number;
      subtotal: number;
      taxAmount: number;
      total: number;
      totalWithCCFee: number;
      isFirstPayment: boolean;
      isProrated: boolean;
    }[];
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
}

// ─── Stripe Card Payment Form ───
function StripePaymentForm({
  pricingData,
  guestInfo,
  onSuccess,
  onError,
}: {
  pricingData: PricingData;
  guestInfo: GuestInfo;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: {
          billing_details: {
            name: `${guestInfo.firstName} ${guestInfo.lastName}`,
            email: guestInfo.email,
            phone: guestInfo.phone,
          },
        },
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess({ paymentIntentId: paymentIntent.id, method: 'stripe' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg"
      >
        {processing ? 'Processing...' : `Pay ${formatCurrency(
          pricingData.pricing.isLongTerm && pricingData.pricing.billingSchedule?.length
            ? pricingData.pricing.billingSchedule[0].totalWithCCFee
            : pricingData.pricing.totalWithCCFee
        )}`}
      </button>
      <p className="text-xs text-slate-500 mt-2 text-center">
        {pricingData.pricing.isLongTerm ? 'Includes 3% credit card processing fee' : 'No additional fees'}
      </p>
    </form>
  );
}

// ─── ACH Payment Form ───
function ACHPaymentForm({
  pricingData,
  guestInfo,
  onSuccess,
  onError,
}: {
  pricingData: PricingData;
  guestInfo: GuestInfo;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}) {
  const pricing = pricingData.pricing;
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountNumber !== confirmAccountNumber) {
      onError('Account numbers do not match');
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch('/api/payment/forte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomSlug: pricingData.room.slug,
          arrival: pricingData.arrival,
          departure: pricingData.departure,
          guests: pricingData.guests,
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
          email: guestInfo.email,
          phone: guestInfo.phone,
          nightlyRates: pricingData.pricing.nightlyRates,
          routingNumber,
          accountNumber,
          accountType,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess({ transactionId: data.transactionId, bookingId: data.bookingId, method: 'forte' });
      } else {
        onError(data.error || 'ACH payment failed');
      }
    } catch (err) {
      onError('Payment processing error');
    }

    setProcessing(false);
  };

  const chargeAmount = pricingData.pricing.isLongTerm && pricingData.pricing.billingSchedule?.length
    ? pricingData.pricing.billingSchedule[0].total
    : pricingData.pricing.totalACH;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Routing Number</label>
        <input
          type="text"
          value={routingNumber}
          onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="9 digit routing number"
          required
          maxLength={9}
          minLength={9}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Account number"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Account Number</label>
        <input
          type="text"
          value={confirmAccountNumber}
          onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Re-enter account number"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={processing}
        className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg"
      >
        {processing ? 'Processing...' : `Pay ${formatCurrency(chargeAmount)} via ACH`}
      </button>
      <p className="text-xs text-slate-500 text-center">
        {pricing.isLongTerm ? 'No processing fee — save 3% with bank transfer' : 'No additional fees'}
      </p>
    </form>
  );
}

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach'>('card');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);

  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const property = searchParams.get('property') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = searchParams.get('guests') || '2';

  // Fetch pricing
  useEffect(() => {
    if (!property || !checkIn || !checkOut) {
      setError('Missing booking details');
      setLoading(false);
      return;
    }

    fetch(`/api/checkout?roomId=${property}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setPricingData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load pricing');
        setLoading(false);
      });
  }, [property, checkIn, checkOut, guests]);

  // Create Stripe payment intent when card is selected and guest info is filled
  useEffect(() => {
    if (paymentMethod !== 'card' || !pricingData) return;
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) return;

    setStripeLoading(true);
    fetch('/api/payment/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomSlug: pricingData.room.slug,
        roomName: pricingData.room.name,
        arrival: pricingData.arrival,
        departure: pricingData.departure,
        guests: pricingData.guests,
        ...guestInfo,
        nightlyRates: pricingData.pricing.nightlyRates,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setPaymentError(data.error || 'Failed to initialize payment');
        }
        setStripeLoading(false);
      })
      .catch(() => {
        setPaymentError('Failed to initialize payment');
        setStripeLoading(false);
      });
  }, [paymentMethod, pricingData, guestInfo.firstName, guestInfo.lastName, guestInfo.email]);

  const handlePaymentSuccess = (result: any) => {
    setPaymentSuccess(result);
  };

  if (paymentSuccess) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-lg text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-slate-600 mb-6">
            Your reservation at Rewak Studios has been confirmed.
            {pricingData?.pricing.isLongTerm && ' Your first month has been charged. Recurring payments will be processed monthly.'}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
            <p><strong>Unit:</strong> {pricingData?.room.name}</p>
            <p><strong>Check-in:</strong> {pricingData && formatDate(pricingData.arrival)}</p>
            <p><strong>Check-out:</strong> {pricingData && formatDate(pricingData.departure)}</p>
            <p><strong>Payment:</strong> {paymentSuccess.method === 'stripe' ? 'Credit Card' : 'ACH Bank Transfer'}</p>
            {paymentSuccess.bookingId && <p><strong>Booking ID:</strong> {paymentSuccess.bookingId}</p>}
          </div>
          <p className="text-sm text-slate-500 mb-6">A confirmation email will be sent to {guestInfo.email}</p>
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Calculating your rates...</p>
        </div>
      </main>
    );
  }

  if (error || !pricingData) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-lg text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-xl font-bold mb-2">Unable to Process</h1>
          <p className="text-slate-600 mb-6">{error || 'Something went wrong'}</p>
          <Link href="/rooms" className="text-blue-600 hover:underline font-medium">
            ← Back to Rooms
          </Link>
        </div>
      </main>
    );
  }

  const { pricing, room } = pricingData;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">Rewak Studios</Link>
          <Link href="/rooms" className="text-blue-600 hover:text-blue-700 font-medium">← Back</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Complete Your Reservation</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Guest Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Guest Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={guestInfo.firstName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={guestInfo.lastName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => { setPaymentMethod('card'); setPaymentError(''); }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg font-semibold mb-1">💳 Credit Card</div>
                  <div className="text-sm text-slate-500">{pricing.isLongTerm ? '3% processing fee' : 'No additional fees'}</div>
                  <div className="text-lg font-bold mt-2 text-blue-600">
                    {formatCurrency(
                      pricing.isLongTerm && pricing.billingSchedule?.length
                        ? pricing.billingSchedule[0].totalWithCCFee
                        : pricing.totalWithCCFee
                    )}
                    {pricing.isLongTerm && <span className="text-xs font-normal text-slate-500"> /first month</span>}
                  </div>
                </button>
                <button
                  onClick={() => { setPaymentMethod('ach'); setPaymentError(''); }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === 'ach'
                      ? 'border-green-600 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg font-semibold mb-1">🏦 Bank Transfer</div>
                  <div className="text-sm text-green-600 font-medium">{pricing.isLongTerm ? 'No processing fee — save 3%!' : 'No additional fees'}</div>
                  <div className="text-lg font-bold mt-2 text-green-600">
                    {formatCurrency(
                      pricing.isLongTerm && pricing.billingSchedule?.length
                        ? pricing.billingSchedule[0].total
                        : pricing.totalACH
                    )}
                    {pricing.isLongTerm && <span className="text-xs font-normal text-slate-500"> /first month</span>}
                  </div>
                </button>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-700 text-sm">{paymentError}</p>
                </div>
              )}

              {paymentMethod === 'card' && (
                stripeLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-slate-500">Initializing secure payment...</p>
                  </div>
                ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                    <StripePaymentForm
                      pricingData={pricingData}
                      guestInfo={guestInfo}
                      onSuccess={handlePaymentSuccess}
                      onError={setPaymentError}
                    />
                  </Elements>
                ) : null
              )}

              {paymentMethod === 'ach' && (
                <ACHPaymentForm
                  pricingData={pricingData}
                  guestInfo={guestInfo}
                  onSuccess={handlePaymentSuccess}
                  onError={setPaymentError}
                />
              )}
            </div>
          </div>

          {/* Right: Price Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-4">{room.name}</h2>
              <div className="text-sm text-slate-600 space-y-1 mb-4">
                <p>📅 {formatDate(pricingData.arrival)} → {formatDate(pricingData.departure)}</p>
                <p>🌙 {pricing.nights} nights</p>
                <p>👥 {pricingData.guests} guests</p>
              </div>

              {/* Nightly Rate Breakdown */}
              {pricing.nightlyRates && pricing.nightlyRates.length > 0 && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-semibold text-sm mb-3">Nightly Rates</h3>
                  <div className="space-y-1.5 text-sm max-h-48 overflow-y-auto">
                    {pricing.nightlyRates.map((night) => (
                      <div key={night.date} className="flex justify-between text-slate-600">
                        <span>{formatDate(night.date)}</span>
                        <span>{formatCurrency(night.rate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Room ({pricing.nights} nights)</span>
                  <span>{formatCurrency(pricing.subtotal)}</span>
                </div>
                {pricing.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes ({(pricing.taxRate * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(pricing.taxAmount)}</span>
                  </div>
                )}
                {pricing.isLongTerm && pricing.taxRate === 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Extended stay tax exemption</span>
                    <span>-$0.00</span>
                  </div>
                )}
              </div>

              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.totalBeforeFees)}</span>
                </div>
              </div>

              {/* Long-term billing schedule */}
              {pricing.isLongTerm && pricing.billingSchedule && (
                <div className="border-t mt-4 pt-4">
                  <h3 className="font-semibold text-sm mb-3">Payment Schedule</h3>
                  <div className="space-y-2 text-sm">
                    {pricing.billingSchedule.map((period) => (
                      <div key={period.periodNumber} className={`flex justify-between ${period.isFirstPayment ? 'font-semibold' : 'text-slate-600'}`}>
                        <span>
                          {period.isFirstPayment ? '📍 Due now' : `Month ${period.periodNumber}`}
                          {period.isProrated && ' (prorated)'}
                          <span className="text-xs block text-slate-400">{period.nights} nights</span>
                        </span>
                        <span>{formatCurrency(period.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && pricing.isLongTerm && (
                <div className="border-t mt-4 pt-4 text-xs text-slate-500">
                  <p>💳 Credit card: +{formatCurrency(
                    pricing.billingSchedule?.length
                      ? pricing.billingSchedule[0].totalWithCCFee - pricing.billingSchedule[0].total
                      : pricing.ccFeeAmount
                  )} processing fee (3%)</p>
                </div>
              )}

              {paymentMethod === 'ach' && (
                <div className="border-t mt-4 pt-4 text-xs text-green-600">
                  <p>🏦 ACH bank transfer: No processing fee!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
