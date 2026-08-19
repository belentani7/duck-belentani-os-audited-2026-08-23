import { describe, expect, it } from "vitest";
import { analyzeUploadAudio } from "@/lib/audio-upload";

describe("AudioWorkbench upload analysis", () => {
  it("extrai duração e gera payload completo antes do registerAudioAsset", async () => {
    const context = { decodeAudioData: async () => ({ duration: 12.7, getChannelData: () => new Float32Array([0, 0.5, -1, 0.5]) }) };
    const result = await analyzeUploadAudio(new Uint8Array([1, 2, 3]).buffer, context, 3);
    expect(result.decoded.duration).toBe(12.7);
    expect(result.metadata.durationSeconds).toBe(13);
    expect(result.metadata.versionLabel).toBe("render · v3");
    expect(result.metadata.peakDb).toBe("0.00");
    expect(result.metadata.rms).toBe("0.6124");
    expect(JSON.parse(result.metadata.waveformJson)).toHaveLength(80);
  });
});
