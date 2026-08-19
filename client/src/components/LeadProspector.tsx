import { useMemo, useState } from "react";
import { Download, Radar, RefreshCw, Search, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const statuses = ["novo", "revisar", "contactar", "respondeu", "qualificado", "descartado", "convertido"] as const;

export default function LeadProspector() {
  const [name, setName] = useState("Radar de clientes musicais");
  const [niche, setNiche] = useState("Música / produção de áudio");
  const [area, setArea] = useState("Recife, Aracaju, Barcelona");
  const [variables, setVariables] = useState("mixagem, masterização, produção musical, beat, estúdio, contratar produtor");
  const [sourceUrls, setSourceUrls] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<(typeof statuses)[number] | "todos">("todos");
  const [textFilter, setTextFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [nicheFilter, setNicheFilter] = useState("todos");
  const [sourceFilter, setSourceFilter] = useState("todos");
  const utils = trpc.useUtils();
  const leadsQuery = trpc.workspace.leads.useQuery(undefined, { retry: false });
  const createSearch = trpc.workspace.createLeadSearch.useMutation({
    onSuccess: (result) => { toast.success(`${result.inserted} novos leads encontrados`); utils.workspace.leads.invalidate(); utils.workspace.leadSearches.invalidate(); },
    onError: (error) => toast.error(error.message || "Não foi possível executar a busca."),
  });
  const updateLead = trpc.workspace.updateLead.useMutation({ onSuccess: () => utils.workspace.leads.invalidate(), onError: (error) => toast.error(error.message) });
  const niches = useMemo(() => Array.from(new Set((leadsQuery.data ?? []).map((lead) => lead.niche).filter(Boolean))), [leadsQuery.data]);
  const sources = useMemo(() => Array.from(new Set((leadsQuery.data ?? []).map((lead) => lead.website).filter(Boolean))), [leadsQuery.data]);
  const leads = useMemo(() => (leadsQuery.data ?? []).filter((lead) => {
    const haystack = `${lead.fullName ?? ""} ${lead.companyName ?? ""} ${lead.email ?? ""} ${lead.website ?? ""} ${lead.niche ?? ""}`.toLowerCase();
    return (selectedStatus === "todos" || lead.status === selectedStatus) && (nicheFilter === "todos" || lead.niche === nicheFilter) && (sourceFilter === "todos" || lead.website === sourceFilter) && (!textFilter.trim() || haystack.includes(textFilter.toLowerCase().trim())) && (!areaFilter.trim() || (lead.area ?? "").toLowerCase().includes(areaFilter.toLowerCase().trim())) && lead.score >= minScore && (!hasEmail || Boolean(lead.email)) && (!hasPhone || Boolean(lead.phone));
  }), [leadsQuery.data, selectedStatus, nicheFilter, sourceFilter, textFilter, areaFilter, minScore, hasEmail, hasPhone]);

  const run = () => {
    const urls = sourceUrls.split(/\n|,/).map((value) => value.trim()).filter(Boolean);
    if (urls.length === 0) { toast.error("Adicione pelo menos uma URL pública HTTPS autorizada."); return; }
    createSearch.mutate({ name, niche, area, variables: variables.split(",").map((value) => value.trim()).filter(Boolean), sourceUrls: urls });
  };

  const exportCsv = () => {
    const header = ["nome", "empresa", "email", "telefone", "site", "área", "nicho", "sinal", "score", "status", "fonte"];
    const rows = leads.map((lead) => [lead.fullName, lead.companyName, lead.email, lead.phone, lead.website, lead.area, lead.niche, lead.intentSignal, lead.score, lead.status, lead.sourceUrl].map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`));
    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "duck-leads.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section className="panel lead-prospector-panel">
    <div className="panel-heading"><div><p className="eyebrow">MÁQUINA DE PROSPECÇÃO</p><h2>Encontre quem pode comprar</h2></div><Radar size={22} className="accent-icon" /></div>
    <p className="panel-description">Configure qualquer nicho e área. A máquina lê apenas páginas públicas HTTPS autorizadas, identifica contatos visíveis, deduplica e prepara a próxima ação comercial.</p>
    <div className="lead-safety-note"><ShieldCheck size={16} /><span>Sem LinkedIn fechado, CAPTCHA, login ou envio automático. Cada contato mantém a URL de origem para revisão.</span></div>
    <div className="lead-form-grid">
      <label>Nome da busca<Input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Nicho<Input value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="Ex.: clínicas odontológicas" /></label>
      <label>Área geográfica<Input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Ex.: Recife e raio de 80 km" /></label>
      <label>Variáveis e sinais, separados por vírgula<Input value={variables} onChange={(event) => setVariables(event.target.value)} placeholder="Ex.: orçamento, contratar, urgente" /></label>
      <label className="wide-field">URLs públicas HTTPS, uma por linha<textarea className="lead-textarea" value={sourceUrls} onChange={(event) => setSourceUrls(event.target.value)} placeholder="https://exemplo.com/diretorio-publico\nhttps://outro-site.com/oportunidades" /></label>
    </div>
    <div className="lead-actions"><Button className="primary-button" onClick={run} disabled={createSearch.isPending}><Search size={16} /> {createSearch.isPending ? "Varrendo fontes…" : "Executar prospecção"}</Button><span className="lead-counter"><Target size={15} /> {leads.length} leads no radar</span></div>
    <div className="lead-results-heading"><div><p className="eyebrow">PIPELINE DE LEADS</p><h3>Contatos encontrados</h3></div><div className="lead-result-actions"><select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as typeof selectedStatus)}><option value="todos">Todos os estados</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><Button variant="outline" className="ghost-button" onClick={exportCsv} disabled={!leads.length}><Download size={15} /> CSV</Button><Button variant="outline" className="ghost-button" onClick={() => leadsQuery.refetch()}><RefreshCw size={15} /></Button></div></div>
    <div className="lead-filters"><Input value={textFilter} onChange={(event) => setTextFilter(event.target.value)} placeholder="Buscar nome, empresa, email ou site" /><Input value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} placeholder="Filtrar área" /><select value={nicheFilter} onChange={(event) => setNicheFilter(event.target.value)}><option value="todos">Todos os nichos</option>{niches.map((niche) => <option key={niche}>{niche}</option>)}</select><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="todos">Todas as fontes</option>{sources.map((source) => <option key={source}>{source}</option>)}</select><label>Score mínimo<input type="number" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value) || 0)} /></label><label className="filter-check"><input type="checkbox" checked={hasEmail} onChange={(event) => setHasEmail(event.target.checked)} /> Com email</label><label className="filter-check"><input type="checkbox" checked={hasPhone} onChange={(event) => setHasPhone(event.target.checked)} /> Com telefone</label></div>
    <div className="lead-table-wrap"><table className="lead-table"><thead><tr><th>Contato / empresa</th><th>Canal</th><th>Score</th><th>Estado</th><th>Fonte</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><strong>{lead.fullName || lead.companyName || "Contato não identificado"}</strong><small>{lead.companyName || lead.website || "—"}</small></td><td><span>{lead.email || "sem email"}</span><small>{lead.phone || "sem telefone"}</small></td><td><span className={`lead-score ${lead.score >= 70 ? "hot" : "warm"}`}>{lead.score}</span></td><td><select value={lead.status} onChange={(event) => updateLead.mutate({ leadId: lead.id, status: event.target.value as (typeof statuses)[number] })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td><td><a href={lead.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte</a><small>{lead.intentSignal || "sem sinal"}</small></td></tr>)}{!leads.length && <tr><td colSpan={5} className="lead-empty">Execute uma busca com URLs públicas autorizadas para preencher o radar.</td></tr>}</tbody></table></div>
  </section>;
}
