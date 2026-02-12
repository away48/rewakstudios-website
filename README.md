# Rewak Studios Website

Custom booking website for Rewak Studios in Fairbanks, Alaska.

## Property Details
- **Location:** 3483 Rewak Dr, Fairbanks, AK 99709
- **Beds24 Property ID:** 5780
- **Tax Rate:** 8% (Fairbanks bed tax - verify with city)
- **Payment:** Stripe (credit card) + Forte (ACH/bank transfer)

## Features
- Real-time availability from Beds24
- Integrated checkout with Stripe & Forte
- Dynamic pricing with tax calculation
- 30+ night extended stays: tax-exempt, 3% CC fee (no fee for ACH)
- <30 nights: taxed, no CC fee

## Environment Variables

Create `.env.local`:

```bash
BEDS24_API_KEY=your_v1_api_key
BEDS24_V2_TOKEN=your_v2_token
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FORTE_ACCESS_ID=your_forte_access_id
FORTE_SECURE_KEY=your_forte_secure_key
FORTE_ORG_ID=399195
FORTE_LOC_ID=264389
```

## Development

```bash
npm install
npm run dev
```

## Deployment

Deployed on Vercel. Push to `main` to auto-deploy.

## TODO
- Pull real photos from Beds24 property 5780
- Verify Fairbanks tax rate (currently set to 8%)
- Add room-specific content/descriptions
- Test full checkout flow end-to-end
