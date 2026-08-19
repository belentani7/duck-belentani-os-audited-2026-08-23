import { formatQuoteRange, calculateQuote, type ServiceType } from "@shared/quote";

export type { ServiceType } from "@shared/quote";

export function getSuggestedRange(service: ServiceType, durationMinutes = 180, trackCount = 1, deadlineDays = 7) {
  const quote = calculateQuote(service, durationMinutes, trackCount, deadlineDays);
  return formatQuoteRange(quote.min, quote.max);
}
