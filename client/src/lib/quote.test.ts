import { describe, expect, it } from "vitest";
import { getSuggestedRange, type ServiceType } from "./quote";

describe("getSuggestedRange", () => {
  it.each([
    ["Mix + master", "R$ 1.000 — 2.200"],
    ["Produção de beat", "R$ 900 — 2.000"],
    ["Direção vocal", "R$ 550 — 1.300"],
    ["Consultoria de lançamento", "R$ 400 — 1.000"],
  ] as const)("retorna a faixa correta para %s", (service: ServiceType, expected) => {
    expect(getSuggestedRange(service)).toBe(expected);
  });
});
