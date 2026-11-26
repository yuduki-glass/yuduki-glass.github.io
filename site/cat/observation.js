import { readVisibleCats, pollInterval } from './positions.js';
import { fetchConditions, japanClock, weatherLabel } from './conditions.js';

const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d', { alpha: false });
const clock = document.querySelector('#clock');
const conditions = document.querySelector('#conditions');
const status = document.querySelector('#status');
const motion = matchMedia('(prefers-reduced-motion: reduce)');

const W = 1672;
const H = 941;
const TAU = Math.PI * 2;
const scale = canvas.width / W;
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const mix = (a, b, f) => a + (b - a) * f;
const smooth = n => n * n * (3 - 2 * n);
const mask = points => {
  const path = new Path2D();
  points.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y));
  path.closePath();
  return path;
};

// Silhouettes follow the pixels of the fixed camera plate.
const car = mask([[474,424],[517,409],[587,414],[627,427],[688,480],[736,487],
  [773,503],[790,519],[800,540],[800,584],[771,594],[743,606],[722,608],
  [704,621],[676,626],[653,615],[633,582],[587,573],[570,516],[474,469]]);
const carportPost = mask([[656,310],[677,318],[679,659],[658,663]]);
const gardenWall = mask([[1420,515],[1672,515],[1672,941],[1548,890],[1411,821]]);
const distantWall = mask([[1262,488],[1298,485],[1314,476],[1330,490],
  [1350,504],[1355,642],[1321,645],[1295,629],[1256,608]]);
const sky = mask([[980,0],[1428,0],[1428,272],[1367,260],[1280,278],[1219,302],
  [1160,281],[1101,295],[1029,273],[944,269],[895,264],[899,205],[855,150],[930,157]]);
const puddleEdges = mask([
  [1046,718],[1097,707],[1264,709],[1300,717],[1320,741],[1248,749],
  [1140,750],[1071,745],[1052,738],[1090,731],
]);
puddleEdges.addPath(mask([[1155,817],[1226,802],[1334,804],[1387,823],
  [1418,857],[1428,899],[1395,918],[1325,909],[1265,877],[1197,851]]));
puddleEdges.addPath(mask([[1146,668],[1232,660],[1291,670],[1302,702],
  [1230,708],[1198,690],[1150,677]]));
const puddles = [
  { x: 1170, y: 726, rx: 95, ry: 14 },
  { x: 1275, y: 826, rx: 91, ry: 18 },
  { x: 1361, y: 886, rx: 57, ry: 12 },
  { x: 1207, y: 671, rx: 35, ry: 4 },
];

const lighting = [
  { hour: 0, day: 0, night: 1, dawn: 0 },
  { hour: 4.5, day: 0, night: 1, dawn: 0 },
  { hour: 6.1, day: .63, night: .04, dawn: .65 },
  { hour: 8, day: .92, night: 0, dawn: .16 },
  { hour: 11, day: 1, night: 0, dawn: 0 },
  { hour: 14.5, day: 1, night: 0, dawn: 0 },
  { hour: 17.25, day: 0, night: 0, dawn: 0 },
  { hour: 18.45, day: .35, night: .39, dawn: 0 },
  { hour: 20, day: 0, night: 1, dawn: 0 },
  { hour: 24, day: 0, night: 1, dawn: 0 },
];
const background = document.createElement('canvas');
background.width = canvas.width;
background.height = canvas.height;
const plate = background.getContext('2d', { alpha: false });
plate.setTransform(scale, 0, 0, canvas.height / H, 0, 0);
const foliage = [];
const leafAreas = [
  [367,242,82,62,1.4], [502,269,101,75,2.0], [539,413,79,75,1.8],
  [714,20,150,124,1.6], [861,35,106,99,1.7], [1369,577,58,111,2.2],
  [1570,334,102,144,2.0], [72,570,112,103,1.3], [1510,754,118,113,1.3],
];

let dusk, daylight, nightPlate, sprites;
let positionRequest;
let positions = { expiresAt: 0, cats: [] };
let elapsed = 0;
let raf = 0;
let previous = 0;
let previousDraw = 0;
let gradeMinute = -1;
let lastRain = -1;
let report;
let lastWeatherAttempt = 0;
let weatherRequest;
let nowInJapan;
let rain = 0;
let paused = motion.matches;
let currentLight;
let paperCloud;

function image(filename) {
  const asset = new Image();
  asset.src = new URL(filename, import.meta.url);
  return asset.decode().then(() => asset);
}

function loadFoliage() {
  for (const [x,y,w,h,strength] of leafAreas) {
    const layer = document.createElement('canvas');
    layer.width = w;
    layer.height = h;
    const g = layer.getContext('2d');
    const edge = g.createRadialGradient(w/2,h/2,Math.min(w,h)*.16,w/2,h/2,Math.min(w,h)*.49);
    edge.addColorStop(0,'#fff');
    edge.addColorStop(1,'#fff0');
    foliage.push({x,y,w,h,strength,layer,g,edge});
  }

  paperCloud = document.createElement('canvas');
  paperCloud.width = 240;
  paperCloud.height = 48;
  const cloud = paperCloud.getContext('2d');
  for (const [x,y,rx,ry] of [[80,25,70,10],[105,19,49,12],[145,24,67,11],[181,29,51,8],[60,30,55,6]]) {
    const glow = cloud.createRadialGradient(0,0,.1,0,0,1);
    glow.addColorStop(0,'#fff5dfb0');
    glow.addColorStop(1,'#fff5df00');
    cloud.save();
    cloud.translate(x,y);
    cloud.scale(rx,ry);
    cloud.fillStyle = glow;
    cloud.fillRect(-1,-1,2,2);
    cloud.restore();
  }
}

function getLighting(hour) {
  const index = lighting.findIndex(next => next.hour > hour);
  const a = lighting[index - 1];
  const b = lighting[index];
  const f = smooth((hour - a.hour) / (b.hour - a.hour));
  return {
    day: mix(a.day,b.day,f),
    night: mix(a.night,b.night,f),
    dawn: mix(a.dawn,b.dawn,f),
  };
}

function composePlate(light) {
  plate.drawImage(dusk,0,0,W,H);
  plate.globalAlpha = light.day;
  plate.drawImage(daylight,0,0,W,H);
  plate.globalAlpha = light.night;
  plate.drawImage(nightPlate,0,0,W,H);
  plate.globalAlpha = 1;
  plate.fillStyle = `rgba(252,166,125,${light.dawn*.14})`;
  plate.fillRect(0,0,W,H);
  plate.fillStyle = `rgba(49,67,92,${rain*.23})`;
  plate.fillRect(0,0,W,H);

  for (const { x,y,w,h,g,edge } of foliage) {
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0,0,w,h);
    g.drawImage(background, x*scale, y*canvas.height/H, w*scale, h*canvas.height/H,0,0,w,h);
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = edge;
    g.fillRect(0,0,w,h);
  }
}

function environment(t, light) {
  ctx.save();
  ctx.clip(sky);
  ctx.globalAlpha = (.12 + light.day*.32) * (1 - .84*light.night);
  for (let i=0; i<5; i++) {
    const x = 640 + (t * (3.2 + i*.4) + i*201) % 1050;
    ctx.drawImage(paperCloud, Math.floor(x), 29 + i*32, 181+i*28, 24+i*3);
  }
  ctx.restore();
  for (const { x,y,layer,strength } of foliage) {
    const wave = Math.sin(t*1.27+x*.025) + .28*Math.sin(t*2.8+y*.05);
    ctx.drawImage(layer,x + Math.round(wave*strength*(1+rain)), y + Math.round(wave*.8));
  }
}

function occlude(path) {
  ctx.save();
  ctx.clip(path);
  ctx.drawImage(background,0,0,W,H);
  ctx.restore();
}

const poses = { still: 8, sit: 9, sleep: 10, sniff: 11, crawl: 11, groom: 12 };
function drawCat(cat, light) {
  const id = cat.sprite;
  const x = cat.x * W;
  const y = cat.y * H;
  const depth = cat.layer === 'wall' ? .79 : clamp((cat.y - .59) / .29);
  const size = mix(.52, 1.07, depth) * (id === 2 ? 1.15 : 1);
  const walk = cat.action === 'walk';
  const crawl = cat.action === 'crawl';
  const grooming = cat.action === 'groom' && elapsed % 3.7 < 2.8;
  const frame = walk ? Math.floor(elapsed*8.6) % 8 : grooming ? poses.groom :
    cat.action === 'groom' ? poses.sit : poses[cat.action];
  const stride = Math.sin(elapsed*TAU*2.15);
  const bob = walk ? 1.2*stride : cat.action === 'sleep' ? .6*Math.sin(elapsed*2.3) :
    grooming ? 1.1*Math.sin(elapsed*8.4) : 0;
  const height = size*(crawl ? 83 : 100) + bob;
  const alpha = crawl ? .83 : 1;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(size, size);
  ctx.scale(mix(1.22,.72,light.day),1);
  ctx.fillStyle = `rgba(43,31,42,${.27*(1-light.night*.6)})`;
  ctx.beginPath();
  ctx.ellipse(-13*(1-light.day),2,43,6,-.08,0,TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(24,19,26,.25)';
  ctx.beginPath();
  ctx.ellipse(0,0,37,4,0,0,TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  ctx.scale(cat.facing,1);
  ctx.imageSmoothingEnabled = false;
  const brightness = mix(.94,.50,light.night) * mix(1,.83,rain) * (crawl ? .8 : 1);
  ctx.filter = `brightness(${brightness}) saturate(${1 - .40*light.night - .15*light.day})`;
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprites,frame*128,id*100,128,100,-64*size,-height+2,128*size,height);
  ctx.restore();
}

function drawVisibleCats(light) {
  if (positions.expiresAt <= Date.now()) return;
  for (const cat of positions.cats) {
    drawCat(cat, light);
    if (cat.layer === 'behindWall') occlude(distantWall);
    if (cat.layer === 'street' && cat.x > .80) occlude(gardenWall);
    if (cat.action === 'crawl') {
      occlude(car);
      occlude(carportPost);
    }
  }
}

async function updatePositions() {
  if (document.hidden || positionRequest) return;
  positionRequest = readVisibleCats();
  try {
    positions = await positionRequest;
  } catch {
    positions = { expiresAt: 0, cats: [] };
  } finally {
    positionRequest = undefined;
    if (paused) render();
  }
}

function lightingEffects(light) {
  if (light.night < .23) return;
  const intensity = smooth(clamp((light.night-.23)/.62));
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const [x,y,rx,ry,a] of [[190,372,107,142,.20],[1203,366,86,70,.17],
    [1175,602,105,43,.13],[1056,442,30,20,.16],[1210,683,105,11,.13]]) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(rx,ry);
    const glow = ctx.createRadialGradient(0,0,.02,0,0,1);
    glow.addColorStop(0,`rgba(255,163,72,${a*intensity})`);
    glow.addColorStop(1,'rgba(255,140,45,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-1,-1,2,2);
    ctx.restore();
  }
  ctx.restore();
}

function weather(t) {
  if (rain < .01) return;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(205,220,233,${rain*.33})`;
  ctx.beginPath();
  for (let i=0; i<160; i++) {
    const velocity = 310+(i*213 % 275);
    const y = (i*1337 + t*velocity) % (H+60)-30;
    const x = (i*1379 + Math.floor((i*1337+t*velocity)/(H+60))*143+y*.14) % (W+40);
    ctx.moveTo(x,y);
    ctx.lineTo(x+3,y+12+(i%8));
  }
  ctx.stroke();
  ctx.clip(puddleEdges);
  ctx.strokeStyle = `rgba(236,224,220,${rain*.35})`;
  for (let i=0; i<puddles.length*5; i++) {
    const patch = puddles[i % puddles.length];
    const cycle = (t*1.78+i*.381) % 1;
    const x = patch.x + (i*13%29-14)*patch.rx/22;
    const y = patch.y + (i*7%19-9)*patch.ry/11;
    ctx.globalAlpha = (1-cycle)*rain;
    ctx.beginPath();
    ctx.ellipse(x,y,1+cycle*11, .5+cycle*2.6,0,0,TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function render() {
  const minute = nowInJapan.minute;
  if (minute !== gradeMinute || Math.abs(rain-lastRain) > .025) {
    const hour = minute / 60;
    const sun = report?.date === nowInJapan.date ? report : null;
    // Map actual sunrise and sunset onto the existing artwork's light curve.
    const mappedHour = sun
      ? hour < sun.sunrise ? mix(0, 6.1, hour / sun.sunrise)
        : hour < sun.sunset ? mix(6.1, 17.25, (hour-sun.sunrise)/(sun.sunset-sun.sunrise))
          : mix(17.25, 20, clamp((hour-sun.sunset) / .92))
      : hour;
    currentLight = getLighting(mappedHour);
    gradeMinute = minute;
    lastRain = rain;
    composePlate(currentLight);
  }
  ctx.setTransform(scale,0,0,canvas.height/H,0,0);
  ctx.drawImage(background,0,0,W,H);
  environment(elapsed,currentLight);
  drawVisibleCats(currentLight);
  lightingEffects(currentLight);
  weather(elapsed);
}

function frame(now) {
  raf = 0;
  if (paused || document.hidden) return;
  if (now - previousDraw >= 32) {
    const step = previous ? Math.min(.1,(now-previous)/1000) : 0;
    elapsed += step;
    rain = mix(rain,rainTarget(),1 - Math.exp(-step*2));
    previous = previousDraw = now;
    render();
  }
  raf = requestAnimationFrame(frame);
}

function resume() {
  if (paused || document.hidden || raf) return;
  previous = 0;
  raf = requestAnimationFrame(frame);
}

function stop() {
  cancelAnimationFrame(raf);
  raf = 0;
}

function rainTarget() {
  return report ? Math.min(1, (report.rain + report.showers) * 2 + (weatherLabel(report.code) === '雨' ? .4 : 0)) : 0;
}

function updateClock() {
  nowInJapan = japanClock(new Date());
  clock.textContent = nowInJapan.label;
  clock.dateTime = nowInJapan.date + 'T' + nowInJapan.label + ':00+09:00';
  if (paused) render();
}

async function updateWeather() {
  if (weatherRequest || document.hidden || Date.now() - lastWeatherAttempt < 60000) return;
  lastWeatherAttempt = Date.now();
  weatherRequest = fetchConditions();
  try {
    report = await weatherRequest;
    conditions.textContent = `葛飾 · ${weatherLabel(report.code)} · ${report.temperature} °C（${report.time.slice(11,16)} 推定）`;
  } catch {
    report = undefined;
    conditions.textContent = '葛飾の天候を取得できません';
  } finally {
    weatherRequest = undefined;
    gradeMinute = -1;
    if (paused) {
      rain = rainTarget();
      render();
    }
  }
}

async function start() {
  [dusk, daylight, nightPlate, sprites] = await Promise.all([
    image('./art/alley.webp'),
    image('./art/day.webp'),
    image('./art/night.webp'),
    image('./art/cats.webp'),
  ]);
  loadFoliage();
  motion.addEventListener('change', event => {
    paused = event.matches;
    if (paused) stop();
    else resume();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else {
      updateClock();
      updateWeather();
      updatePositions();
      resume();
    }
  });
  updateClock();
  render();
  status.hidden = true;
  resume();
  updateWeather();
  updatePositions();
  setInterval(updatePositions, pollInterval);
  setInterval(updateClock, 1000);
  setInterval(updateWeather, 5 * 60000);
}

start().catch(error => {
  status.textContent = '風景を読み込めませんでした。再読み込みしてください。';
  console.error(error);
});
