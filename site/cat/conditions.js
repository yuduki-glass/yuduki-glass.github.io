const weekdayFormat = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'short' });
const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function japanClock(date) {
  const parts = Object.fromEntries(clockFormat.formatToParts(date).map(({type,value}) => [type,value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    display: `${parts.year}年${Number(parts.month)}月${Number(parts.day)}日（${weekdayFormat.format(date)}）${Number(parts.hour)}:${parts.minute}`,
    label: `${parts.hour}:${parts.minute}`,
    minute: Number(parts.hour)*60 + Number(parts.minute),
  };
}

const endpoint = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
  latitude: '35.74',
  longitude: '139.85',
  current: 'rain,showers,weather_code,temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,wind_direction_10m',
  daily: 'sunrise,sunset',
  hourly: 'rain,showers,weather_code,precipitation_probability',
  past_days: '1',
  timezone: 'Asia/Tokyo',
  forecast_days: '2',
});

export function weatherLabel(code) {
  if (code === 0) return '晴れ';
  if (code <= 2) return '晴れ時々曇り';
  if (code === 3) return '曇り';
  if (code === 45 || code === 48) return '霧';
  if ([71,73,75,77,85,86].includes(code)) return '雪';
  if (code >= 95) return '雷雨';
  return '雨';
}

const localTime = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/;
const hourOf = value => Number(value.slice(11,13)) + Number(value.slice(14,16))/60;

export async function fetchConditions() {
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
  if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
  const { current, daily, hourly } = await response.json();
  const time = current?.time;
  const date = japanClock(new Date()).date;
  const dayIndex = daily?.time?.indexOf(date);
  const sunrise = daily?.sunrise?.[dayIndex];
  const sunset = daily?.sunset?.[dayIndex];
  const values = [current?.weather_code, current?.temperature_2m, current?.rain, current?.showers];
  if (![time,sunrise,sunset].every(value => localTime.test(value)) ||
      ![sunrise,sunset].every(value => value.startsWith(date)) ||
      hourOf(sunrise) >= hourOf(sunset) ||
      Math.abs(Date.now() - Date.parse(time + ':00+09:00')) > 45*60000 ||
      !values.every(Number.isFinite)) {
    throw new Error('Weather response is incomplete or stale');
  }
  const [code,temperature,rain,showers] = values;
  const cloudCover = current.cloud_cover;
  const windSpeed = current.wind_speed_10m;
  const windDirection = current.wind_direction_10m;
  const sampledAt = Date.parse(time + ':00+09:00');
  const futureHour = (hourly?.time ?? []).findIndex(stamp => localTime.test(stamp) && stamp > time);
  const nextCode = hourly?.weather_code?.[futureHour];
  const precipitationProbability = hourly?.precipitation_probability?.[futureHour];
  const humidity = current.relative_humidity_2m;
  const recentRain = [];
  for (const [index, stamp] of (hourly?.time ?? []).entries()) {
    if (!localTime.test(stamp)) continue;
    const end = Date.parse(stamp + ':00+09:00');
    const rain = hourly.rain?.[index];
    const showers = hourly.showers?.[index];
    if (end <= sampledAt && sampledAt - end < 8*3600000 &&
        Number.isFinite(rain) && Number.isFinite(showers) && rain + showers > 0) {
      recentRain.push({ end, amount: rain + showers });
    }
  }
  return { date, time, sampledAt, recentRain, nextCode, precipitationProbability, humidity, cloudCover: Number.isFinite(cloudCover) ? Math.max(0, Math.min(100, cloudCover)) : undefined,
    windSpeed: Number.isFinite(windSpeed) ? Math.max(0, Math.min(65, windSpeed)) : undefined,
    windDirection: Number.isFinite(windDirection) ? windDirection : undefined, sunrise: hourOf(sunrise), sunset: hourOf(sunset), code, temperature, rain, showers };
}

export function formatWeather({ code, nextCode, temperature, humidity, precipitationProbability, time }) {
  const initial = weatherLabel(code);
  const next = Number.isFinite(nextCode) ? weatherLabel(nextCode) : initial;
  const trend = next === initial ? initial : `${initial}▶${next}`;
  const percent = value => Number.isFinite(value) && value >= 0 && value <= 100 ? `${Math.round(value)}%` : '—';
  return `${trend}　${Math.round(temperature)}℃　湿度${percent(humidity)}　降水${percent(precipitationProbability)}（${time.slice(11,16)} 推定）`;
}
