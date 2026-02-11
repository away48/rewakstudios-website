// Stay Anchorage Pricing Logic
// Tax rules: < 30 nights = taxed, >= 30 nights = tax exempt (Anchorage municipal rule)
// Payment: Credit card (Stripe) adds 3% fee, ACH (Forte) no fee

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
  // Long-term billing schedule
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
const STAY_ANCHORAGE_TAX_RATE = 0.12; // 12% bed tax - Anchorage Municipality

export function calculatePricing(
  nightlyRates: { date: string; rate: number }[],
  taxRateOverride?: number
): PricingBreakdown {
  const nights = nightlyRates.length;
  const isLongTerm = nights >= LONG_TERM_THRESHOLD;
  const taxRate = isLongTerm ? 0 : (taxRateOverride ?? STAY_ANCHORAGE_TAX_RATE);
  
  const subtotal = nightlyRates.reduce((sum, r) => sum + r.rate, 0);
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const totalBeforeFees = subtotal + taxAmount;
  const ccFeeAmount = Math.round(totalBeforeFees * CC_FEE_PERCENT * 100) / 100;
  
  const breakdown: PricingBreakdown = {
    nights,
    nightlyRates,
    subtotal,
    taxRate,
    taxAmount,
    totalBeforeFees,
    ccFeePercent: CC_FEE_PERCENT,
    ccFeeAmount,
    totalWithCCFee: totalBeforeFees + ccFeeAmount,
    totalACH: totalBeforeFees,
    isLongTerm,
  };

  if (isLongTerm) {
    breakdown.billingSchedule = calculateBillingSchedule(nightlyRates);
  }

  return breakdown;
}

function calculateBillingSchedule(
  nightlyRates: { date: string; rate: number }[]
): BillingPeriod[] {
  const periods: BillingPeriod[] = [];
  let periodStart = 0;
  let periodNumber = 1;

  while (periodStart < nightlyRates.length) {
    const periodEnd = Math.min(periodStart + 30, nightlyRates.length);
    const periodRates = nightlyRates.slice(periodStart, periodEnd);
    const periodNights = periodRates.length;
    const isProrated = periodNumber > 1 && periodNights < 30;
    
    const subtotal = periodRates.reduce((sum, r) => sum + r.rate, 0);
    // Long-term stays in Anchorage are tax exempt
    const taxAmount = 0;
    const total = subtotal + taxAmount;
    const ccFee = Math.round(total * CC_FEE_PERCENT * 100) / 100;

    periods.push({
      periodNumber,
      startDate: periodRates[0].date,
      endDate: periodRates[periodRates.length - 1].date,
      nights: periodNights,
      subtotal,
      taxAmount,
      total,
      totalWithCCFee: total + ccFee,
      isFirstPayment: periodNumber === 1,
      isProrated,
    });

    periodStart = periodEnd;
    periodNumber++;
  }

  return periods;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
