import { describe, expect, it } from "vitest";
import { calculateQuote, formatQuoteRange, type ServiceType } from "../shared/quote";

describe("motor de orçamento do Duck", () => {
  it("calcula uma faixa base para mix e master", () => {
    expect(calculateQuote("Mix + master", 180, 1, 7)).toEqual({ min: 1000, max: 2200 });
  });

  it("aumenta a faixa para mais duração e mais faixas", () => {
    const base = calculateQuote("Produção de beat", 180, 1, 14);
    const expanded = calculateQuote("Produção de beat", 360, 12, 14);
    expect(expanded.min).toBeGreaterThan(base.min);
    expect(expanded.max).toBeGreaterThan(base.max);
  });

  it("aplica fator de urgência para prazo curto", () => {
    const normal = calculateQuote("Direção vocal", 180, 1, 14);
    const urgent = calculateQuote("Direção vocal", 180, 1, 3);
    expect(urgent.min).toBeGreaterThan(normal.min);
    expect(urgent.max).toBeGreaterThan(normal.max);
  });

  it.each([
    ["Mix + master", 1000, 2200],
    ["Produção de beat", 800, 1800],
    ["Direção vocal", 500, 1200],
    ["Consultoria de lançamento", 350, 900],
  ] as const)("formata a faixa padrão de %s", (service: ServiceType, min, max) => {
    expect(formatQuoteRange(min, max)).toContain(`R$ ${min.toLocaleString("pt-BR")}`);
    expect(service).toBeTruthy();
  });
});
