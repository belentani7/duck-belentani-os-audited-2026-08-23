import { analyzeAudioSamples } from "./audio-analysis";

export function buildAudioAssetMetadata(samples: Float32Array | number[], durationSeconds: number, versionNumber: number) {
  const analysis = analyzeAudioSamples(samples);
  return {
    durationSeconds: Math.round(durationSeconds),
    peakDb: analysis.peakDb,
    rms: analysis.rms.toFixed(4),
    waveformJson: JSON.stringify(analysis.waveform),
    versionLabel: `render · v${versionNumber}`,
  };
}
