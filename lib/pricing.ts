// Rewak Studios (Fairbanks, AK) Pricing Logic
// Tax rules: < 30 nights = taxed, >= 30 nights = tax exempt (Alaska extended stay rule)
// Payment: Credit card (Stripe) adds 3% fee ONLY for 30+ night stays
// Short-term stays: no CC fee (absorbed by property)

export interface PricingBreakdown {
  nights: number;
  nightlyRates: { date: string; rate: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalBeforeFees: number;
  ccFeePercent: number;
  ccFeeAmount: number;
  totalWithCCFee: number;
  totalACH: number;
  isLongTerm: boolean;
  billingSchedule?: BillingPeriod[];
}

export interface BillingPeriod {
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
}

const LONG_TERM_THRESHOLD = 30;
const CC_FEE_PERCENT = 0.03;
const FAIRBANKS_TAX_RATE = 0.08; // 8% Fairbanks bed tax (verify with city)

export function calculatePricing(
  nightlyRates: { date: string; rate: number }[],
  taxRateOverride?: number
): PricingBreakdown {
  const nights = nightlyRates.length;
  const isLongTerm = nights >= LONG_TERM_THRESHOLD;
  const taxRate = isLongTerm ? 0 : (taxRateOverride ?? FAIRBANKS_TAX_RATE);
  
  const subtotal = nightlyRates.reduce((sum, r) => sum + r.rate, 0);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const totalBeforeFees = subtotal + taxAmount;
  
  // CC fee only applies to long-term stays (30+ nights)
  const ccFeePercent = isLongTerm ? CC_FEE_PERCENT : 0;
  const ccFeeAmount = isLongTerm ? Math.round(totalBeforeFees * CC_FEE_PERCENT * 100) / 100 : 0;
  const totalWithCCFee = totalBeforeFees + ccFeeAmount;
  const totalACH = totalBeforeFees; // ACH never has fees

  // For long-term stays, create monthly billing schedule
  let billingSchedule: BillingPeriod[] | undefined;
  if (isLongTerm) {
    billingSchedule = createBillingSchedule(nightlyRates, taxRate);
  }

  return {
    nights,
    nightlyRates,
    subtotal,
    taxRate,
    taxAmount,
    totalBeforeFees,
    ccFeePercent,
    ccFeeAmount,
    totalWithCCFee,
    totalACH,
    isLongTerm,
    billingSchedule,
  };
}

function createBillingSchedule(
  nightlyRates: { date: string; rate: number }[],
  taxRate: number
): BillingPeriod[] {
  const periods: BillingPeriod[] = [];
  let currentPeriodStart = 0;
  let periodNumber = 1;

  while (currentPeriodStart < nightlyRates.length) {
    const remainingNights = nightlyRates.length - currentPeriodStart;
    const periodNights = Math.min(30, remainingNights);
    const periodEnd = currentPeriodStart + periodNights;

    const periodRates = nightlyRates.slice(currentPeriodStart, periodEnd);
    const subtotal = periodRates.reduce((sum, r) => sum + r.rate, 0);
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + taxAmount;
    const totalWithCCFee = total + Math.round(total * CC_FEE_PERCENT * 100) / 100;

    periods.push({
      periodNumber,
      startDate: periodRates[0].date,
      endDate: periodRates[periodRates.length - 1].date,
      nights: periodNights,
      subtotal,
      taxAmount,
      total,
      totalWithCCFee,
      isFirstPayment: periodNumber === 1,
      isProrated: periodNights < 30,
    });

    currentPeriodStart = periodEnd;
    periodNumber++;
  }

  return periods;
}
