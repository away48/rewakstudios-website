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

## Properties (4 units)
1. Unit 1 - Studio / 2 guests
2. Unit 2 - 1 Bedroom / 2 guests  
3. Unit 3 - 2 Bedroom / 4 guests
4. Unit 4 - 2 Bedroom / 4 guests

*Note: Property details to be pulled from Beds24 API*

## Pages

### Homepage (`/`)
- Hero with search form
- Property previews
- Features/amenities
- Location info
- CTA sections

### Properties (`/rooms`)
- Grid of available properties
- Filter by dates/guests
- Price display
- Amenity lists

### Booking (`/book`)
- Date selection
- Guest info
- Payment (Stripe/Beds24)
- Confirmation

## Design
- Colors: Blue primary (#1e3a5f), light accents
- Modern, clean aesthetic
- Mountain/Alaska imagery
- Mobile-first responsive

## Beds24 Integration
- Property listings
- Availability calendar
- Rate calculation
- Booking creation

## Status
- [x] Project scaffolded
- [x] Homepage created
- [x] Rooms page created
- [ ] Beds24 API integration
- [ ] Booking flow
- [ ] Vercel deployment
- [ ] Domain connection

---
*Created 2026-02-09 by Kit*
