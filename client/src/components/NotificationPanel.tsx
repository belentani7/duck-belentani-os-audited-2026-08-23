import React, { useState } from "react";
import { BellRing, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export const notificationEventOptions = ["render", "client", "money"] as const;
export function buildPreferencePayload(channel: "internal" | "telegram" | "whatsapp", destination: string, enabled: boolean, eventTypes: string[]) {
  return { channel, destination, enabled, eventTypes };
}

export default function NotificationPanel() {
  const preferences = trpc.workspace.notificationPreferences.useQuery();
  const [channel, setChannel] = useState<"internal" | "telegram" | "whatsapp">("internal");
  const [destination, setDestination] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [eventTypes, setEventTypes] = useState<string[]>([...notificationEventOptions]);
  const save = trpc.workspace.saveNotificationPreference.useMutation({ onSuccess: () => { preferences.refetch(); toast.success("Preferência de notificação salva."); }, onError: (error) => toast.error(error.message) });
  const toggleEvent = (eventType: string) => setEventTypes((current) => current.includes(eventType) ? current.filter((item) => item !== eventType) : [...current, eventType]);
  return <section className="notification-panel panel"><div className="panel-heading"><div><p className="eyebrow">AUTOMAÇÕES / NOTIFICAÇÕES</p><h2>Escolha como os renders chegam até você</h2></div><BellRing className="accent-icon" size={20} /></div><p className="panel-description">O feed interno já funciona no workspace. Aqui você prepara canais externos para avisar quando um render DAW for recebido, uma versão for aprovada ou um briefing virar oportunidade.</p><div className="notification-form"><label>Canal<select value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}><option value="internal">Feed interno</option><option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option></select></label><label>Destino<Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="@usuario, telefone ou vazio no feed interno" /></label><label className="notification-toggle"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Ativo</label><div className="notification-events"><span className="eyebrow">EVENTOS</span>{notificationEventOptions.map((eventType) => <label key={eventType}><input type="checkbox" checked={eventTypes.includes(eventType)} onChange={() => toggleEvent(eventType)} /> {eventType}</label>)}</div><Button className="primary-button" disabled={save.isPending} onClick={() => save.mutate(buildPreferencePayload(channel, destination, enabled, eventTypes))}><Save size={14} /> Salvar canal</Button></div><div className="notification-list">{preferences.data?.map((preference) => <div className="notification-row" key={preference.id}><span className={`status-dot ${preference.enabled ? "active" : ""}`} /><strong>{preference.channel}</strong><span>{preference.destination || "feed interno"}</span><small>{preference.eventTypes || "eventos padrão"}</small></div>)}{!preferences.isLoading && !preferences.data?.length && <div className="empty-state">Nenhum canal externo configurado ainda.</div>}</div></section>;
}
