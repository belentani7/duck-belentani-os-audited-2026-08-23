const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const EMAIL_VALIDATION_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value?: string) {
  const email = value?.trim().toLowerCase();
  if (!email || email.length > 320 || email.includes("..") || !EMAIL_VALIDATION_RE.test(email)) return undefined;
  return email;
}

export function normalizePhone(value?: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return undefined;
  return value.trim().startsWith("+") ? `+${digits}` : digits;
}

function stripHtml(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstMatch(values: string[]) {
  return values.find((value) => value && value.length > 2)?.trim();
}

function scoreLead(input: { email?: string; phone?: string; companyName?: string; intentSignal?: string; variables: string[] }) {
  let score = 20;
  if (input.email) score += 25;
  if (input.phone) score += 15;
  if (input.companyName) score += 15;
  if (input.intentSignal) score += 15;
  const haystack = `${input.companyName ?? ""} ${input.intentSignal ?? ""}`.toLowerCase();
  if (input.variables.some((variable) => haystack.includes(variable.toLowerCase()))) score += 10;
  return Math.min(100, score);
}

export type ScrapedLead = {
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website: string;
  intentSignal?: string;
  score: number;
  dedupeKey: string;
};

export async function scrapePublicPage(url: string, variables: string[]): Promise<{ title?: string; lead?: ScrapedLead }> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("A fonte precisa usar HTTPS.");
  const response = await fetch(parsed.toString(), { headers: { "user-agent": "DuckProspector/1.0 (+public-pages-only)" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Fonte respondeu HTTP ${response.status}.`);
  const html = (await response.text()).slice(0, 1_500_000);
  const text = stripHtml(html);
  const emails = Array.from(new Set((html.match(EMAIL_RE) ?? []).map(normalizeEmail).filter((email): email is string => Boolean(email)))).filter((email) => !email.endsWith(".png"));
  const phones = Array.from(new Set((text.match(PHONE_RE) ?? []).map(normalizePhone).filter((phone): phone is string => Boolean(phone))));
  const title = firstMatch(Array.from(html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi), (match) => stripHtml(match[1]))) ?? parsed.hostname;
  const companyName = firstMatch(Array.from(html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:site_name|application-name)["'][^>]+content=["']([^"']+)/gi), (match) => match[1])) ?? parsed.hostname.replace(/^www\./, "").split(".")[0];
  const signal = firstMatch(variables.filter((variable) => text.toLowerCase().includes(variable.toLowerCase())));
  const email = emails[0];
  const phone = phones[0];
  const lead = { companyName, email, phone, website: parsed.origin, intentSignal: signal, score: scoreLead({ email, phone, companyName, intentSignal: signal, variables }), dedupeKey: `${email ?? ""}|${phone ?? ""}|${parsed.hostname}` };
  if (!email && !phone && !signal) return { title };
  return { title, lead };
}
