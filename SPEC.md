# Stay Anchorage - Website Spec

## Overview
A modern, mobile-first booking website for Stay Anchorage short-term rentals that provides a clean direct booking experience.

## Goals
- **Direct bookings** to avoid OTA fees
- **Clean, fast booking flow** 
- **Mobile-first design** for travelers
- **Trust signals** for vacation rentals

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Backend:** Beds24 API (JSON API v2)
- **Hosting:** Vercel
- **Domain:** stayanchorage.com

## Current Status
- **Live Preview:** https://stayanchorage-website.vercel.app
- **GitHub:** https://github.com/away48/stayanchorage-website
- **Vercel Project:** prj_ZRv9Bd8jE3kVeyvCHD0ogL6KIma5

## Properties (4 units)
*Placeholder data - needs Beds24 API credentials to pull real info*

1. Unit 1 - Studio / 2 guests / $125/night
2. Unit 2 - 1 Bedroom / 2 guests / $145/night
3. Unit 3 - 2 Bedroom / 4 guests / $165/night
4. Unit 4 - 2 Bedroom / 4 guests / $185/night

## Pages Implemented

### Homepage (`/`)
- ✅ Hero with search form (check-in, check-out, guests)
- ✅ Property preview cards
- ✅ Features/amenities section
- ✅ Location section (Anchorage highlights)
- ✅ CTA sections
- ✅ Footer with links

### Properties (`/rooms`)
- ✅ Grid of properties
- ✅ Filter by guest count
- ✅ Price display
- ✅ Amenity chips
- ✅ "Book Now" links

### Booking (`/book`)
- ⏳ Not yet implemented - redirect to Beds24 as fallback

## Design
- Colors: Blue primary (#1e3a5f), slate neutrals
- Modern, clean aesthetic
- Mobile-first responsive
- Blue/white color scheme (Anchorage/Alaska theme)

## Next Steps (for Alex)

### 1. Get Beds24 API Credentials
1. Log into Beds24 at https://www.beds24.com/control3.php
2. Go to Settings → Account Access → API
3. Create API key and Property key
4. Add to Vercel environment variables:
   - `BEDS24_API_KEY`
   - `BEDS24_PROP_KEY`

### 2. Property Images
- Need real photos for each unit
- Upload to /public/images/ or use Cloudinary
- Recommended: 4-6 photos per unit

### 3. Connect Domain
In Vercel dashboard:
1. Go to Project → Domains
2. Add stayanchorage.com
3. Update DNS at registrar

### 4. Complete Booking Flow
Once API credentials are set:
- Implement availability check
- Build checkout flow
- Add Stripe or use Beds24 payments

## File Structure
```
stayanchorage-website/
├── app/
│   ├── page.tsx          # Homepage
│   ├── rooms/page.tsx    # Property listing
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   ├── beds24.ts         # API client (needs credentials)
│   └── utils.ts          # Helper functions
├── public/images/        # Property images (TBD)
├── .env.example          # Environment template
└── package.json
```

---
*Created 2026-02-09 by Kit*
*Site deployed overnight while Alex sleeps 🌙*
