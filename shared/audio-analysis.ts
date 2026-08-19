export function analyzeAudioSamples(samples: Float32Array | number[], bucketCount = 80) {
  if (samples.length === 0) return { peak: 0, peakDb: "-Infinity", rms: 0, waveform: [] as number[] };
  let peak = 0;
  let sumSquares = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const absolute = Math.abs(sample);
    peak = Math.max(peak, absolute);
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / samples.length);
  const bucketSize = Math.max(1, Math.floor(samples.length / bucketCount));
  const waveform = Array.from({ length: bucketCount }, (_, index) => {
    let bucketPeak = 0;
    for (let i = index * bucketSize; i < Math.min(samples.length, (index + 1) * bucketSize); i += 1) bucketPeak = Math.max(bucketPeak, Math.abs(samples[i]));
    return Math.max(10, Math.round(bucketPeak * 100));
  });
  return { peak, peakDb: (20 * Math.log10(Math.max(0.000001, peak))).toFixed(2), rms, waveform };
}
