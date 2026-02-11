# Checkout Flow Spec - Stay Anchorage

## Flow
1. Guest selects unit + dates + guests on rooms page
2. → Checkout page: pulls live rates + tax from Beds24 API
3. Shows itemized breakdown
4. Guest chooses payment method: Credit Card (Stripe) or ACH (Forte)
5. On successful payment → create booking in Beds24
6. Confirmation page

## Pricing Logic
- Nightly rates from Beds24 API (property 17757)
- Tax rate from Beds24 `vatRate` field
- **< 30 nights**: Full amount + tax upfront
- **≥ 30 nights**: 
  - Tax EXEMPT (Anchorage rule)
  - First 30 nights charged upfront
  - Recurring monthly (every 30 days) for remainder
  - Last period prorated if < 30 nights remaining

## Payment Methods (all stays)
- **Credit Card (Stripe)**: Base amount + 3% processing fee
- **ACH (Forte)**: Base amount only (no fee)

## Tax Rules (Stay Anchorage specific)
- < 30 nights: Apply bed tax (vatRate from Beds24)
- ≥ 30 nights: Tax exempt

## API Endpoints Needed
- GET /api/checkout - Calculate pricing breakdown
- POST /api/checkout - Process payment + create Beds24 booking
- POST /api/webhook/stripe - Handle Stripe webhooks (recurring)

## Credentials
- Stripe: sk `rk_live_...`, pk `pk_live_...`
- Forte: api_access_id + api_secure_key
- Beds24: v2 token for rates, v1 api_key for booking creation

## Beds24 Integration
- Pull rates: v2 API or v1 `getRates`
- Pull tax: v1 `getProperties` → vatRate
- Create booking: v1 `setBooking` or v2 POST /bookings
