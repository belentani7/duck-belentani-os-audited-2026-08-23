import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeEmail, normalizePhone, scrapePublicPage } from "./leadScraper";

afterEach(() => vi.unstubAllGlobals());

describe("scrapePublicPage", () => {
  it("normaliza contatos e rejeita formatos inválidos", () => {
    expect(normalizeEmail("  CONTATO@Empresa.COM ")).toBe("contato@empresa.com");
    expect(normalizeEmail("invalido@@empresa")).toBeUndefined();
    expect(normalizeEmail("duplo..ponto@empresa.com")).toBeUndefined();
    expect(normalizePhone("+55 (81) 99999-0000")).toBe("+5581999990000");
    expect(normalizePhone("123")).toBeUndefined();
  });

  it("extrai contato empresarial visível e calcula score por sinais", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head><title>Estúdio Recife</title><meta property="og:site_name" content="Estúdio Recife"></head><body>Contrate mixagem e masterização. Email: contato@estudiorecife.com.br Telefone: +55 (81) 99999-0000</body></html>`, { status: 200 })));
    const result = await scrapePublicPage("https://estudiorecife.com.br/servicos", ["mixagem", "masterização"]);
    expect(result.title).toBe("Estúdio Recife");
    expect(result.lead?.email).toBe("contato@estudiorecife.com.br");
    expect(result.lead?.phone).toBe("+5581999990000");
    expect(result.lead?.companyName).toBe("Estúdio Recife");
    expect(result.lead?.score).toBeGreaterThanOrEqual(70);
    expect(result.lead?.dedupeKey).toContain("contato@estudiorecife.com.br");
  });

  it("não cria lead quando a página não tem contato nem sinal configurado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html><head><title>Página institucional</title></head><body>Conteúdo editorial sem contato comercial.</body></html>", { status: 200 })));
    const result = await scrapePublicPage("https://exemplo.com/institucional", ["contratar", "orçamento"]);
    expect(result.lead).toBeUndefined();
  });

  it("recusa fonte sem HTTPS", async () => {
    await expect(scrapePublicPage("http://exemplo.com", [])).rejects.toThrow("HTTPS");
  });
});
