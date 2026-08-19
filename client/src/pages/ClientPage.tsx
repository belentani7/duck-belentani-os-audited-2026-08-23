import React from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { canAccessClientPortal } from "../../../shared/client-access";
import ClientPortal from "@/components/ClientPortal";
import { trpc } from "@/lib/trpc";

export default function ClientPage() {
  const { user, loading: authLoading } = useAuth();
  const dashboard = trpc.workspace.dashboard.useQuery(undefined, { enabled: Boolean(user) });
  if (authLoading) return <div className="min-h-screen grid place-items-center bg-background text-foreground"><Loader2 className="animate-spin" /></div>;
  if (!canAccessClientPortal(user)) return <main className="client-route"><div className="client-route-bar"><a href="/">← Duck x Belentani OS</a></div><div className="empty-state"><LockKeyhole size={24} /><h2>Área privada de cliente</h2><p>Entre para acessar renders, comentários e aprovações.</p><Button className="primary-button" onClick={() => startLogin()}>Entrar com segurança</Button></div></main>;
  if (dashboard.isLoading) return <div className="min-h-screen grid place-items-center bg-background text-foreground"><Loader2 className="animate-spin" /></div>;
  return <main className="client-route"><div className="client-route-bar"><a href="/">← Duck x Belentani OS</a><span>Área segura de aprovação</span></div><ClientPortal projects={(dashboard.data?.projects ?? []).map((project) => ({ id: project.id, name: project.name, artist: project.artist, status: project.status, progress: project.progress, currentVersion: project.currentVersion }))} /></main>;
}
