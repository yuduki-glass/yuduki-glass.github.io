const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function japanClock(date) {
  const parts = Object.fromEntries(clockFormat.formatToParts(date).map(({type,value}) => [type,value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    label: `${parts.hour}:${parts.minute}`,
    minute: Number(parts.hour)*60 + Number(parts.minute),
  };
}

const endpoint = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
  latitude: '35.74',
  longitude: '139.85',
  current: 'rain,showers,weather_code,temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m',
  daily: 'sunrise,sunset',
  timezone: 'Asia/Tokyo',
  forecast_days: '1',
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
  const { current, daily } = await response.json();
  const time = current?.time;
  const date = japanClock(new Date()).date;
  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];
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
  return { date, time, cloudCover: Number.isFinite(cloudCover) ? Math.max(0, Math.min(100, cloudCover)) : undefined,
    windSpeed: Number.isFinite(windSpeed) ? Math.max(0, Math.min(65, windSpeed)) : undefined,
    windDirection: Number.isFinite(windDirection) ? windDirection : undefined, sunrise: hourOf(sunrise), sunset: hourOf(sunset), code, temperature, rain, showers };
}
