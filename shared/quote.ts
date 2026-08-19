export type ServiceType = "Mix + master" | "Produção de beat" | "Direção vocal" | "Consultoria de lançamento";

const baseRanges: Record<ServiceType, [number, number]> = {
  "Mix + master": [900, 2000],
  "Produção de beat": [800, 1800],
  "Direção vocal": [500, 1200],
  "Consultoria de lançamento": [350, 900],
};

export function calculateQuote(service: ServiceType, durationMinutes: number, trackCount: number, deadlineDays: number) {
  const [baseMin, baseMax] = baseRanges[service];
  const durationFactor = Math.max(1, durationMinutes / 180);
  const tracksFactor = 1 + Math.max(0, trackCount - 1) * 0.08;
  const rushFactor = deadlineDays <= 3 ? 1.35 : deadlineDays <= 7 ? 1.1 : 1;
  return {
    min: Math.round((baseMin * durationFactor * tracksFactor * rushFactor) / 50) * 50,
    max: Math.round((baseMax * durationFactor * tracksFactor * rushFactor) / 50) * 50,
  };
}

export function formatQuoteRange(min: number, max: number) {
  return `R$ ${min.toLocaleString("pt-BR")} — ${max.toLocaleString("pt-BR")}`;
}
