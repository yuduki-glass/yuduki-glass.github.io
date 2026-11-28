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

export const forecastLead = 4*3600000;

const endpoint = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
  latitude: '35.74',
  longitude: '139.85',
  daily: 'sunrise,sunset',
  hourly: 'rain,showers,weather_code,precipitation_probability,temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,wind_direction_10m',
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

export async function fetchConditions(now = new Date()) {
  const forecastAt = now.getTime() + forecastLead;
  const forecast = japanClock(new Date(forecastAt));
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
  if (!response.ok) throw new Error(`Weather HTTP ${response.status}`);
  const { daily, hourly } = await response.json();
  const dayIndex = daily?.time?.indexOf(forecast.date);
  const sunrise = daily?.sunrise?.[dayIndex];
  const sunset = daily?.sunset?.[dayIndex];
  const hours = (hourly?.time ?? []).map(time => localTime.test(time) ? Date.parse(time + ':00+09:00') : NaN);
  const later = hours.findIndex(time => time >= forecastAt);
  const earlier = later > 0 && hours[later] !== forecastAt ? later-1 : later;
  if (later < 0 || ![sunrise,sunset].every(time => localTime.test(time) && time.startsWith(forecast.date)) ||
      hourOf(sunrise) >= hourOf(sunset) || !Number.isFinite(hours[earlier]) ||
      forecastAt < hours[earlier] || hours[later]-hours[earlier] > 3600000) {
    throw new Error('Four-hour forecast is unavailable');
  }
  const weight = earlier === later ? 0 : (forecastAt-hours[earlier])/(hours[later]-hours[earlier]);
  const nearest = weight < .5 ? earlier : later;
  const interpolate = field => {
    const a = hourly[field]?.[earlier], b = hourly[field]?.[later];
    return Number.isFinite(a) && Number.isFinite(b) ? a+(b-a)*weight : undefined;
  };
  const code = hourly.weather_code?.[nearest];
  const temperature = interpolate('temperature_2m');
  const humidity = interpolate('relative_humidity_2m');
  const precipitationProbability = hourly.precipitation_probability?.[later];
  const rain = hourly.rain?.[later];
  const showers = hourly.showers?.[later];
  if (![code,temperature,rain,showers].every(Number.isFinite)) {
    throw new Error('Four-hour forecast is incomplete');
  }
  // Hourly rain totals are timestamped at the end of each interval.
  const recentRain = hours.flatMap((end,index) => {
    const rain = hourly.rain?.[index], showers = hourly.showers?.[index];
    return end <= forecastAt && forecastAt-end < 8*3600000 &&
      Number.isFinite(rain) && Number.isFinite(showers) && rain+showers > 0
      ? [{end,amount:rain+showers}] : [];
  });
  return { date:forecast.date, time:forecast.label, forecastAt, recentRain,
    sunrise:hourOf(sunrise), sunset:hourOf(sunset), code, temperature, humidity,
    precipitationProbability, rain, showers, cloudCover:interpolate('cloud_cover'),
    windSpeed:interpolate('wind_speed_10m'), windDirection:hourly.wind_direction_10m?.[nearest] };
}

export function formatWeather({ code, temperature, humidity, precipitationProbability }) {
  const percent = value => Number.isFinite(value) && value >= 0 && value <= 100 ? `${Math.round(value)}%` : '—';
  return `${weatherLabel(code)}　${Math.round(temperature)}℃　湿度${percent(humidity)}　降水${percent(precipitationProbability)}`;
}
