import { useState } from "react";
import { CheckCircle2, Download, ExternalLink, FileAudio, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Project = { id: number; name: string; artist: string; status: string; progress: number; currentVersion: string };

function PortalProject({ project }: { project: Project }) {
  const [comment, setComment] = useState("");
  const assets = trpc.workspace.audioAssets.useQuery({ projectId: project.id });
  const asset = assets.data?.[0];
  const download = trpc.workspace.getAudioDownloadUrl.useQuery({ storageKey: asset?.storageKey ?? "" }, { enabled: Boolean(asset?.storageKey) });
  const approve = trpc.workspace.approveProjectVersion.useMutation({ onSuccess: () => toast.success("Versão aprovada e registrada."), onError: (error) => toast.error(error.message) });
  const addComment = trpc.workspace.createWaveformComment.useMutation({ onSuccess: () => { setComment(""); toast.success("Comentário enviado ao Duck."); }, onError: (error) => toast.error(error.message) });
  return <article className="portal-project"><div className="portal-project-top"><div className="portal-cover"><FileAudio size={22} /></div><div><strong>{project.name}</strong><span>{project.artist}</span></div><span className="status-tag lime">{project.status}</span></div><div className="portal-progress"><div className="progress-track"><span className="lime" style={{ width: `${project.progress}%` }} /></div><span>{project.progress}%</span></div><div className="portal-version"><div><span className="eyebrow">VERSÃO DISPONÍVEL</span><strong>{asset?.versionLabel ?? project.currentVersion}</strong></div><div className="portal-actions"><Button className="ghost-button" disabled={!download.data} onClick={() => download.data && window.open(download.data, "_blank")}><Download size={14} /> Baixar</Button><Button className="primary-button" disabled={approve.isPending} onClick={() => approve.mutate({ projectId: project.id })}><CheckCircle2 size={14} /> {approve.isPending ? "Registrando…" : "Aprovar"}</Button></div></div><div className="portal-comment"><MessageSquareText size={14} /><Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comentário sobre esta versão" /><Button className="ghost-button" disabled={!asset || !comment.trim() || addComment.isPending} onClick={() => asset && addComment.mutate({ assetId: asset.id, timestampSeconds: 0, body: comment })}>Enviar <ExternalLink size={13} /></Button></div></article>;
}

export default function ClientPortal({ projects }: { projects: Project[] }) {
  return <section className="client-portal panel"><div className="portal-header"><div><p className="eyebrow">CLIENT PORTAL</p><h2>Um espaço limpo para aprovar e continuar</h2><p>O cliente vê apenas o andamento, os renders e os pedidos de revisão. A operação interna continua protegida no workspace.</p></div><div className="portal-badge"><ShieldCheck size={18} /><span>Link privado<br /><strong>controlado pelo Duck</strong></span></div></div><div className="portal-projects">{projects.map((project) => <PortalProject key={project.id} project={project} />)}{projects.length === 0 && <div className="empty-state">Nenhum projeto compartilhado com clientes ainda. Quando um projeto for criado, ele aparecerá aqui com um link privado.</div>}</div></section>;
}
