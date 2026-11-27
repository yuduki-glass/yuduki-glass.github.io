// Rain and showers in each completed hourly weather interval feed the same
// drying model on startup and on refresh, so reopening the page preserves it.
export function wetnessAt(report, now, isRaining, lastRainSample) {
  if (!report) return 0;
  const fresh = isRaining && now - report.sampledAt < 45*60000;
  if (fresh) return 1;

  let wetness = 0;
  const samples = lastRainSample ? [...report.recentRain, lastRainSample] : report.recentRain;
  for (const { end, amount } of samples) {
    const hours = Math.max(0, (now - end)/3600000);
    const initial = Math.min(1, .32 + amount*.42);
    const duration = Math.min(6, 1.5 + amount*1.3);
    wetness = Math.max(wetness, initial * Math.max(0, 1 - hours/duration));
  }
  return wetness;
}
