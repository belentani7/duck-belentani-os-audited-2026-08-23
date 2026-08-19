import { describe, expect, it } from "vitest";
import { buildAudioAssetMetadata } from "../shared/audio-metadata";

describe("buildAudioAssetMetadata", () => {
  it("gera payload persistível com duração e versão sucessiva", () => {
    const first = buildAudioAssetMetadata([0, 0.5, -1, 0.5], 12.7, 1);
    const second = buildAudioAssetMetadata([0, 0.25, -0.5, 0.25], 18.2, 2);
    expect(first.durationSeconds).toBe(13);
    expect(first.versionLabel).toBe("render · v1");
    expect(second.versionLabel).toBe("render · v2");
    expect(first.peakDb).toBe("0.00");
    expect(first.rms).toBe("0.6124");
    expect(JSON.parse(first.waveformJson)).toHaveLength(80);
  });
});
