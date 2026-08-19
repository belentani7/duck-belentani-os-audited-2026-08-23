import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CloudUpload,
  FileAudio,
  FolderKanban,
  Gauge,
  Headphones,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Music2,
  Play,
  Plus,
  Radio,
  Search,
  Settings2,
  Sparkles,
  Upload,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getSuggestedRange, type ServiceType } from "@/lib/quote";
import { trpc } from "@/lib/trpc";
import AudioWorkbench from "@/components/AudioWorkbench";

const eventIconMap = { render: FileAudio, client: MessageSquareText, money: CircleDollarSign } as const;

const navItems = [
  { label: "Comando", icon: LayoutDashboard },
  { label: "Projetos", icon: FolderKanban },
  { label: "Oportunidades", icon: Sparkles },
  { label: "Arquivos", icon: CloudUpload },
  { label: "Clientes", icon: Users },
];

export default function Home() {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState("Comando");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [service, setService] = useState<ServiceType>("Mix + master");
  const [clientName, setClientName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [trackCount, setTrackCount] = useState(1);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const dashboardQuery = trpc.workspace.dashboard.useQuery(undefined, { retry: false });
  const createOpportunity = trpc.workspace.createOpportunity.useMutation({
    onSuccess: (result) => { toast.success(`Briefing salvo: ${result.range}`); setClientName(""); dashboardQuery.refetch(); },
    onError: (error) => toast.error(error.message || "Não foi possível salvar o briefing."),
  });
  const submitOpportunity = () => {
    if (!clientName.trim()) { toast.error("Informe o nome do cliente ou projeto."); return; }
    createOpportunity.mutate({ clientName, service, durationMinutes, trackCount, deadlineDays });
  };
  const dashboard = dashboardQuery.data;
  const projects = dashboard?.projects ?? [];
  const events = dashboard?.events ?? [];

  const visibleProjects = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    if (!normalized) return projects;
    return projects.filter((project) => `${project.name} ${project.artist} ${project.currentVersion}`.toLowerCase().includes(normalized));
  }, [projects, search]);

  const greeting = user?.name?.split(" ")[0] || "Lucas";

  return (
    <main className="duck-app">
      <aside className={`duck-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span>DX</span></div>
          <div><p className="brand-name">DUCK <span>×</span> BELENTANI</p><p className="brand-subtitle">studio operating system</p></div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>
        <div className="space-switcher"><span className="status-dot" /> Duck Prod <ChevronRight size={15} /><span className="muted">BR</span></div>
        <nav className="main-nav" aria-label="Navegação principal">
          <p className="nav-label">Workspace</p>
          {navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => { setActiveNav(label); setMobileOpen(false); }}><Icon size={17} /><span>{label}</span>{label === "Oportunidades" && <span className="nav-badge">4</span>}</button>)}
          <p className="nav-label secondary-label">Sistema</p>
          <button className="nav-item"><Radio size={17} /><span>Automações</span><span className="live-pill">LIVE</span></button>
          <button className="nav-item"><WalletCards size={17} /><span>Financeiro</span></button>
          <button className="nav-item"><Settings2 size={17} /><span>Configurações</span></button>
        </nav>
        <div className="sidebar-footer"><div className="location-card"><div className="location-top"><span className="eyebrow">BASES CONECTADAS</span><span className="pulse" /></div><p>Recife <span>↔</span> Aracaju</p><small>Barcelona em colaboração</small></div><div className="profile-row"><div className="avatar">LS</div><div><strong>Lucas Silva</strong><small>Produtor / artista</small></div><MoreHorizontal size={18} className="muted-icon" /></div></div>
      </aside>

      <section className="duck-content">
        <header className="topbar"><div className="mobile-brand"><button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button><span className="brand-mini">DX</span></div><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div><div className="top-actions"><div className="search-box"><Search size={16} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar no workspace" /></div><button className="icon-button" aria-label="Notificações"><Bell size={18} /><span className="notification-dot" /></button><button className="top-avatar">LS</button></div></header>

        <div className="content-wrap">
          <section className="hero-row"><div><p className="kicker"><span className="live-dot" /> QUARTA-FEIRA, 19 DE AGOSTO · 09:42 BRT</p><h1>Bom dia, {greeting}.<br /><span>A máquina está em movimento.</span></h1><p className="hero-copy">O trabalho que importa agora está organizado. Aqui está o pulso do seu estúdio entre Recife, Aracaju e Barcelona.</p></div><div className="hero-actions"><Button className="primary-button" onClick={() => setShowUpload(true)}><Plus size={17} /> Novo projeto</Button><Button variant="outline" className="ghost-button" onClick={() => setShowUpload(true)}><Upload size={16} /> Enviar arquivo</Button></div></section>

          <section className="metric-grid"><MetricCard label="Receita em pipeline" value={`R$ ${(dashboard?.metrics.pipeline ?? 0).toLocaleString("pt-BR")}`} detail="baseado em oportunidades abertas" icon={CircleDollarSign} accent="lime" /><MetricCard label="Projetos ativos" value={String(dashboard?.metrics.activeProjects ?? 0).padStart(2, "0")} detail={`${dashboard?.metrics.inProduction ?? 0} em produção hoje`} icon={FolderKanban} accent="cyan" /><MetricCard label="Tempo recuperado" value={`${Math.floor((dashboard?.metrics.timeRecoveredMinutes ?? 0) / 60)}h ${(dashboard?.metrics.timeRecoveredMinutes ?? 0) % 60}min`} detail="calculado por eventos automáticos" icon={Clock3} accent="violet" /><MetricCard label="Saúde do estúdio" value={`${dashboard?.metrics.automationHealth ?? 0}%`} detail={dashboardQuery.isLoading ? "Calculando" : dashboard?.metrics.automationHealth ? "Baseado na atividade real" : "Aguardando atividade"} icon={Gauge} accent="amber" /></section>

          <div className="main-grid"><section className="panel projects-panel"><div className="panel-heading"><div><p className="eyebrow">ATIVIDADE PRINCIPAL</p><h2>Projetos em movimento</h2></div><button className="text-button" onClick={() => setActiveNav("Projetos")}>Ver todos <ArrowUpRight size={15} /></button></div><div className="project-list">{visibleProjects.map((project) => <ProjectRow key={project.id} project={{ ...project, version: project.currentVersion, time: new Date(project.lastActivityAt).toLocaleDateString("pt-BR") }} playing={playing} onPlay={() => setPlaying(!playing)} />)}{visibleProjects.length === 0 && <div className="empty-state">{dashboardQuery.isLoading ? "Carregando projetos persistidos…" : `Nenhum projeto encontrado${search ? ` para “${search}”` : " ainda"}.`}</div>}</div><div className="panel-footer"><span><span className="tiny-live" /> {dashboardQuery.isLoading ? "Sincronizando" : "Sincronizado agora"}</span><span>{visibleProjects.length} projeto(s) exibido(s)</span></div></section><section className="panel pulse-panel"><div className="panel-heading"><div><p className="eyebrow">PULSO DO ESTÚDIO</p><h2>O que aconteceu</h2></div><button className="icon-button small"><MoreHorizontal size={17} /></button></div><div className="event-list">{events.map((event) => { const Icon = eventIconMap[event.type as keyof typeof eventIconMap] ?? Sparkles; return <div className="event-row" key={event.id}><div className={`event-icon ${event.tone}`}><Icon size={17} /></div><div className="event-copy"><strong>{event.title}</strong><span>{event.detail}</span></div><time>{new Date(event.createdAt).toLocaleDateString("pt-BR")}</time></div>; })}{events.length === 0 && <div className="empty-state">A central de atividade aparecerá aqui conforme o workspace receber novos eventos.</div>}</div><button className="panel-link" onClick={() => setActiveNav("Comando")}>Abrir central de atividade <ArrowUpRight size={15} /></button></section></div>

          {activeNav === "Arquivos" && <AudioWorkbench projectId={projects[0]?.id} />}

          <div className="lower-grid"><section className="panel opportunity-panel"><div className="panel-heading"><div><p className="eyebrow">MOTOR DE RENDA</p><h2>Transforme demanda em trabalho</h2></div><Sparkles size={20} className="accent-icon" /></div><p className="panel-description">Monte um orçamento rápido a partir do briefing. A máquina organiza o escopo para você responder mais rápido, sem perder valor.</p><div className="quote-form"><label className="wide-field">Cliente ou projeto<Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Ex.: artista, selo ou marca" /></label><label>Serviço principal<select value={service} onChange={(event) => setService(event.target.value as ServiceType)}><option>Mix + master</option><option>Produção de beat</option><option>Direção vocal</option><option>Consultoria de lançamento</option></select></label><label>Duração<select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}><option value={90}>90 min</option><option value={180}>3 horas</option><option value={360}>6 horas</option></select></label><label>Faixas<select value={trackCount} onChange={(event) => setTrackCount(Number(event.target.value))}><option value={1}>1 faixa</option><option value={3}>3 faixas</option><option value={8}>8 faixas</option><option value={16}>16 faixas</option></select></label><label>Prazo<select value={deadlineDays} onChange={(event) => setDeadlineDays(Number(event.target.value))}><option value={3}>3 dias</option><option value={7}>7 dias</option><option value={14}>14 dias</option></select></label><div className="quote-result"><span>Faixa sugerida</span><strong>{getSuggestedRange(service, durationMinutes, trackCount, deadlineDays)}</strong></div><Button className="primary-button full-button" onClick={submitOpportunity} disabled={createOpportunity.isPending}>{createOpportunity.isPending ? "Salvando…" : "Salvar briefing"} <ArrowUpRight size={16} /></Button></div></section><section className="panel next-panel"><div className="panel-heading"><div><p className="eyebrow">PRÓXIMO PASSO</p><h2>Não deixe dinheiro parado</h2></div><Headphones size={20} className="accent-icon cyan-icon" /></div>{(dashboard?.nextSteps ?? []).map((step) => <div className="next-card" key={step.title}><div className={`next-icon ${step.tone === "lime" ? "lime-bg" : ""}`}><MessageSquareText size={19} /></div><div><strong>{step.title}</strong><p>{step.detail}</p></div><ChevronRight size={18} className="muted-icon" /></div>)}{!dashboardQuery.isLoading && (dashboard?.nextSteps ?? []).length === 0 && <div className="empty-state">Nenhuma pendência operacional. Novos próximos passos aparecerão a partir dos seus projetos e briefings.</div>}<div className="automation-note"><span className="pulse" /><span><strong>{dashboard?.events.length ?? 0} automações registradas</strong><small>Atividade persistida no workspace</small></span><Settings2 size={15} /></div></section></div>
        </div>
      </section>

      {showUpload && <div className="modal-backdrop" onClick={() => setShowUpload(false)}><div className="upload-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowUpload(false)}><X size={18} /></button><div className="upload-symbol"><CloudUpload size={26} /></div><p className="eyebrow">INGESTÃO RÁPIDA</p><h2>Comece um novo fluxo</h2><p>Crie o projeto ou solte um render para que a máquina organize a próxima etapa.</p><div className="dropzone"><Upload size={22} /><strong>Arraste WAV, MP3 ou stems aqui</strong><span>ou escolha um arquivo no dispositivo</span></div><Button className="primary-button full-button" onClick={() => setShowUpload(false)}>Continuar sem arquivo <ChevronRight size={16} /></Button></div></div>}
    </main>
  );
}

function MetricCard({ label, value, detail, icon: Icon, accent }: { label: string; value: string; detail: string; icon: typeof CircleDollarSign; accent: string }) {
  return <div className="metric-card"><div className={`metric-icon ${accent}`}><Icon size={18} /></div><p>{label}</p><strong>{value}</strong><span className={`metric-detail ${accent}`}>{detail}</span></div>;
}

function ProjectRow({ project, playing, onPlay }: { project: { name: string; artist: string; status: string; progress: number; color: string; version: string; time: string }; playing: boolean; onPlay: () => void }) {
  return <div className="project-row"><button className={`play-button ${project.color}`} onClick={onPlay} aria-label={`Reproduzir ${project.name}`}>{playing ? <span className="pause-bars"><i /><i /></span> : <Play size={15} fill="currentColor" />}</button><div className="project-main"><div className="project-title"><strong>{project.name}</strong><span>{project.artist}</span></div><div className="project-progress"><div className="progress-track"><span className={project.color} style={{ width: `${project.progress}%` }} /></div><small>{project.progress}%</small></div></div><div className="project-meta"><span className={`status-tag ${project.color}`}>{project.status}</span><small>{project.version}</small></div><time>{project.time}</time><button className="row-more" aria-label="Mais opções"><MoreHorizontal size={18} /></button></div>;
}
