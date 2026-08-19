import { buildAudioAssetMetadata } from "../../../shared/audio-metadata";

export type DecodedAudioLike = { duration: number; getChannelData: (channel: number) => Float32Array };
export type AudioContextLike = { decodeAudioData: (bytes: ArrayBuffer) => Promise<DecodedAudioLike> };

export async function analyzeUploadAudio(bytes: ArrayBuffer, audioContext: AudioContextLike, versionNumber: number) {
  const decoded = await audioContext.decodeAudioData(bytes.slice(0));
  const metadata = buildAudioAssetMetadata(decoded.getChannelData(0), decoded.duration, versionNumber);
  return { decoded, metadata };
}
