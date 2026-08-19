import { useEffect, useMemo, useRef, useState } from "react";
import { Check, FileAudio, MessageSquareText, Play, Plus, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AudioWorkbench({ projectId }: { projectId?: number }) {
  const [selectedAsset, setSelectedAsset] = useState<number>();
  const [comment, setComment] = useState("");
  const [cursor, setCursor] = useState(83);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [abMode, setAbMode] = useState<"A" | "B">("A");
  const [referenceAssetId, setReferenceAssetId] = useState<number>();
  const prepareUpload = trpc.workspace.prepareAudioUpload.useMutation();
  const registerAsset = trpc.workspace.registerAudioAsset.useMutation({ onSuccess: () => { assets.refetch(); toast.success("Render enviado e versão criada."); }, onError: (error) => toast.error(error.message) });
  const assets = trpc.workspace.audioAssets.useQuery({ projectId: projectId ?? 0 }, { enabled: Boolean(projectId), retry: false });
  const comments = trpc.workspace.waveformComments.useQuery({ assetId: (abMode === "B" ? referenceAssetId : selectedAsset) ?? 0 }, { enabled: Boolean((abMode === "B" ? referenceAssetId : selectedAsset)), retry: false });
  useEffect(() => { if (!selectedAsset && assets.data?.[0]) setSelectedAsset(assets.data[0].id); }, [assets.data, selectedAsset]);
  const createComment = trpc.workspace.createWaveformComment.useMutation({
    onSuccess: () => { setComment(""); comments.refetch(); toast.success("Comentário marcado na waveform."); },
    onError: (error) => toast.error(error.message),
  });
  const activeAsset = assets.data?.find((asset) => asset.id === selectedAsset) ?? assets.data?.[0];
  const referenceAsset = assets.data?.find((asset) => asset.id === referenceAssetId);
  const sourceAsset = abMode === "B" && referenceAsset ? referenceAsset : activeAsset;
  const displayAsset = sourceAsset;
  const downloadUrl = trpc.workspace.getAudioDownloadUrl.useQuery({ storageKey: sourceAsset?.storageKey ?? "" }, { enabled: Boolean(sourceAsset?.storageKey), retry: false });
  const togglePlayback = async () => { if (!audioRef.current || !downloadUrl.data) return; if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } else { await audioRef.current.play(); setIsPlaying(true); } };
  const bars = useMemo(() => { try { return displayAsset?.waveformJson ? JSON.parse(displayAsset.waveformJson) as number[] : []; } catch { return []; } }, [displayAsset]);
  const timestampFromCursor = Math.round((cursor / 100) * (displayAsset?.durationSeconds ?? 0));
  const handleFile = async (file?: File) => {
    if (!file || !projectId) return;
    try {
      const prepared = await prepareUpload.mutateAsync({ fileName: file.name, mimeType: file.type || "audio/wav" });
      const bytes = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const decoded = await audioContext.decodeAudioData(bytes.slice(0));
      const channel = decoded.getChannelData(0);
      const checksumBytes = await crypto.subtle.digest("SHA-256", bytes);
      const checksumSha256 = Array.from(new Uint8Array(checksumBytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
      const bucketSize = Math.max(1, Math.floor(channel.length / 80));
      const peaks = Array.from({ length: 80 }, (_, index) => { let peak = 0; for (let i = index * bucketSize; i < Math.min(channel.length, (index + 1) * bucketSize); i += 1) peak = Math.max(peak, Math.abs(channel[i])); return Math.max(10, Math.round(peak * 100)); });
      const uploadResponse = await fetch(prepared.url, { method: "PUT", headers: { "Content-Type": file.type || "audio/wav" }, body: file });
      if (!uploadResponse.ok) throw new Error(`Falha no upload (${uploadResponse.status})`);
      await registerAsset.mutateAsync({ projectId, fileName: file.name, storageKey: prepared.key, mimeType: file.type || "audio/wav", fileSize: file.size, checksumSha256, versionLabel: `${file.name.replace(/\\.[^/.]+$/, "")} · v${(assets.data?.length ?? 0) + 1}`, durationSeconds: Math.round(decoded.duration), waveformJson: JSON.stringify(peaks) });
      await audioContext.close();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao enviar o áudio."); }
  };

  return <section className="workbench panel"><div className="panel-heading"><div><p className="eyebrow">AUDIO WORKBENCH</p><h2>Versões, waveform e feedback no segundo exato</h2></div><div className="workbench-actions"><input ref={fileRef} type="file" accept="audio/wav,audio/mpeg,audio/mp3" hidden onChange={(event) => handleFile(event.target.files?.[0])} /><Button className="ghost-button" onClick={() => fileRef.current?.click()} disabled={prepareUpload.isPending || registerAsset.isPending}><Upload size={15} /> {registerAsset.isPending ? "Analisando…" : "Enviar render"}</Button><Button className="primary-button" onClick={() => fileRef.current?.click()}><Plus size={15} /> Nova versão</Button></div></div>{!projectId && <div className="empty-state">Crie ou selecione um projeto persistido para abrir os assets de áudio.</div>}{projectId && <><div className="ab-controls"><span className="eyebrow">A/B</span><button className={abMode === "A" ? "ab-button active" : "ab-button"} onClick={() => setAbMode("A")}>A · Atual</button><button className={abMode === "B" ? "ab-button active" : "ab-button"} onClick={() => setAbMode("B")} disabled={!referenceAsset}>B · Referência</button><select aria-label="Selecionar referência A/B" value={referenceAssetId ?? ""} onChange={(event) => setReferenceAssetId(Number(event.target.value) || undefined)}><option value="">Escolha uma referência</option>{assets.data?.filter((asset) => asset.id !== activeAsset?.id).map((asset) => <option key={asset.id} value={asset.id}>{asset.versionLabel}</option>)}</select></div><div className="asset-strip">{assets.isLoading && <span className="loading-line"><RefreshCw size={14} /> Sincronizando assets…</span>}{!assets.isLoading && assets.data?.length === 0 && <div className="asset-empty"><FileAudio size={20} /><span>Nenhum render ainda. O próximo upload aparecerá aqui com versão e metadados.</span></div>}{assets.data?.map((asset) => <button key={asset.id} className={`asset-chip ${activeAsset?.id === asset.id ? "selected" : ""}`} onClick={() => setSelectedAsset(asset.id)}><FileAudio size={14} /><span>{asset.versionLabel}</span><small>{asset.fileName}</small></button>)}</div><div className="waveform-card"><audio ref={audioRef} src={downloadUrl.data} hidden onEnded={() => setIsPlaying(false)} /><div className="waveform-head"><div><strong>{displayAsset?.versionLabel ?? "Aguardando primeiro render"}</strong><span>{displayAsset?.fileName ?? "WAV 24-bit · 48 kHz"}</span></div><button className="play-button lime" onClick={togglePlayback} disabled={!downloadUrl.data}>{isPlaying ? <span className="pause-bars"><i /><i /></span> : <Play size={15} fill="currentColor" />}</button></div><div className="waveform" onClick={(event) => setCursor((event.nativeEvent as MouseEvent).offsetX / (event.currentTarget as HTMLElement).clientWidth * 100)}>{bars.length > 0 ? bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index < cursor * .8 ? "played" : ""} />) : <div className="waveform-empty">Envie um render para gerar a waveform real no navegador</div>}{comments.data?.map((item) => <button key={item.id} className="waveform-marker" style={{ left: `${displayAsset?.durationSeconds ? Math.min(100, item.timestampSeconds / displayAsset.durationSeconds * 100) : 0}%` }} title={item.body} onClick={(event) => { event.stopPropagation(); setCursor(displayAsset?.durationSeconds ? item.timestampSeconds / displayAsset.durationSeconds * 100 : 0); }} />)}<i className="playhead" style={{ left: `${cursor}%` }} /></div><div className="waveform-time"><span>{abMode === "B" ? "B · referência" : "A · atual"}</span><span>00:00</span><span>{displayAsset?.durationSeconds ? `${Math.floor(displayAsset.durationSeconds / 60)}:${String(displayAsset.durationSeconds % 60).padStart(2, "0")}` : "03:24"}</span></div></div><div className="audio-download"><a href={downloadUrl.data} download={sourceAsset?.fileName} className="text-button">Baixar {sourceAsset?.fileName ?? "asset"}</a></div><div className="workbench-footer"><div className="audio-stats"><span>BPM <strong>{displayAsset?.bpm ?? "—"}</strong></span><span>LUFS <strong>{displayAsset?.loudnessLufs ?? "—"}</strong></span><span>Formato <strong>{displayAsset?.mimeType ?? "—"}</strong></span></div><div className="annotation-form"><span><MessageSquareText size={14} /> Marcar em {timestampFromCursor}s</span><Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ex.: subir 1.5dB no synth" /><Button className="primary-button" disabled={!activeAsset || !comment.trim() || createComment.isPending} onClick={() => activeAsset && createComment.mutate({ assetId: activeAsset.id, timestampSeconds: timestampFromCursor, body: comment })}><Check size={15} /> Marcar</Button></div></div><div className="annotation-list">{comments.data?.map((item) => <div className="annotation" key={item.id}><span className="annotation-time">{Math.floor(item.timestampSeconds / 60)}:{String(item.timestampSeconds % 60).padStart(2, "0")}</span><span>{item.body}</span></div>)}{selectedAsset && !comments.isLoading && comments.data?.length === 0 && <div className="empty-state">Nenhum comentário neste render. Clique na waveform para posicionar e registre o próximo feedback.</div>}</div></>}</section>;
}
