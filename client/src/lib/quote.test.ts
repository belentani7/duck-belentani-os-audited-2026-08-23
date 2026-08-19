import { describe, expect, it } from "vitest";
import { getSuggestedRange, type ServiceType } from "./quote";

describe("getSuggestedRange", () => {
  it.each([
    ["Mix + master", "R$ 900 — 2.000"],
    ["Produção de beat", "R$ 800 — 1.800"],
    ["Direção vocal", "R$ 500 — 1.200"],
    ["Consultoria de lançamento", "R$ 350 — 900"],
  ] as const)("retorna a faixa correta para %s", (service: ServiceType, expected) => {
    expect(getSuggestedRange(service)).toBe(expected);
  });
});
