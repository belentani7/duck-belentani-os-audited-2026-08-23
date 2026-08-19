import { describe, expect, it } from "vitest";
import { analyzeAudioSamples } from "../shared/audio-analysis";

describe("analyzeAudioSamples", () => {
  it("calcula pico, RMS, dBFS e waveform", () => {
    const result = analyzeAudioSamples([0, 0.5, -1, 0.5], 4);
    expect(result.peak).toBe(1);
    expect(result.peakDb).toBe("0.00");
    expect(result.rms).toBeCloseTo(Math.sqrt(0.375));
    expect(result.waveform).toHaveLength(4);
    expect(Math.max(...result.waveform)).toBe(100);
  });
});
