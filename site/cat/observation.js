import { wetnessAt } from './puddles.js';
import { createCloudLayer, seasonFor } from './seasons.js?v=8';
import { readVisibleCats, pollInterval } from './positions.js';
import { fetchConditions, forecastLead, formatWeather, japanClock, weatherLabel } from './conditions.js?v=11';

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
const dryingHollows = [
  [1252,679,117,21,.22],
  [1194,726,170,25,.1],
  [1339,861,230,67,0],
];
const dampRoad = mask([[1210,624],[1260,633],[1290,689],[1340,778],
  [1450,865],[1560,941],[1035,941],[1034,854],[1045,772],[1138,686]]);
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
// The sheen follows the pavement, widening with the road towards the camera.
const rainRoad = mask([[1175,562],[1230,565],[1290,681],[1324,753],
  [1411,838],[1570,941],[310,941],[511,798],[666,684],[863,614],[1016,581]]);
const rainSky = document.createElement('canvas');
rainSky.width = W;
rainSky.height = 340;
const skyPaint = rainSky.getContext('2d');
const background = document.createElement('canvas');
background.width = canvas.width;
background.height = canvas.height;
const plate = background.getContext('2d', { alpha: false });
plate.setTransform(scale, 0, 0, canvas.height / H, 0, 0);
let sprites, scenery, dryRoad, seasonRequested;
let foliage = [];
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
const clouds = createCloudLayer();

function image(filename) {
  const asset = new Image();
  asset.src = new URL(filename, import.meta.url);
  return asset.decode().then(() => asset);
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

function blendPatch(patch, x, y, light) {
  const width = patch.width;
  const height = patch.height / 3;
  for (const [band, alpha] of [1, light.day, light.night].entries()) {
    plate.globalAlpha = alpha;
    plate.drawImage(patch,0,height*band,width,height,x,y,width,height);
  }
  plate.globalAlpha = 1;
}

function drawDryingRoad(light, wetness) {
  if (!dryRoad || wetness >= 1) return;
  const dry = new Path2D();
  dry.rect(1020,657,537,283);
  for (const [x,y,rx,ry,cutoff] of dryingHollows) {
    if (wetness <= cutoff) continue;
    const size = Math.sqrt((wetness-cutoff)/(1-cutoff));
    dry.moveTo(x+rx*size,y);
    dry.ellipse(x,y,rx*size,ry*size,0,0,TAU);
    dry.closePath();
  }
  // Reveal the original reflections only inside the shrinking hollows.
  plate.save();
  plate.clip(dry,'evenodd');
  blendPatch(dryRoad,1020,657,light);
  plate.restore();
}

// Small clusters wholly inside the canopy or shrubs, away from the gate and wires.
const leafClusters = [
  [290,42,60,29], [436,30,63,25], [540,54,41,31], [641,37,53,29],
  [741,26,53,21], [870,47,48,31], [939,53,27,25],
  [389,272,40,29], [468,257,39,25], [523,284,28,23],
  [879,341,37,31], [921,370,35,26], [960,324,28,23],
  [1603,423,36,30], [1635,450,28,24],
];

function prepareFoliage(atlas) {
  const sample = document.createElement('canvas');
  const pixels = sample.getContext('2d', { willReadFrequently: true });
  return leafClusters.map(([cx,cy,rx,ry], index) => {
    const x = cx-rx, y = cy-ry, w = rx*2, h = ry*2;
    sample.width = w;
    sample.height = h;
    pixels.drawImage(atlas,x,y+H,w,h,0,0,w,h);
    const image = pixels.getImageData(0,0,w,h);
    for (let row=0; row<h; row++) {
      for (let col=0; col<w; col++) {
        const p = (row*w+col)*4;
        const [r,g,b] = image.data.subarray(p,p+3);
        const chroma = Math.max(r,g)-b;
        const edge = 1 - ((col-rx)/rx)**2 - ((row-ry)/ry)**2;
        const leaf = r+g > 92 && b < Math.max(r,g)*.81;
        image.data[p+3] = leaf ? Math.round(255 * clamp(edge*2) * clamp((chroma-20)/29)) : 0;
      }
    }
    const matte = document.createElement('canvas');
    matte.width = w;
    matte.height = h;
    matte.getContext('2d').putImageData(image,0,0);
    const layer = document.createElement('canvas');
    layer.width = w;
    layer.height = h;
    return { x,y,w,h,matte,layer,phase:index*.83 };
  });
}

function refreshLeafLayers() {
  for (const { x,y,w,h,matte,layer } of foliage) {
    const g = layer.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0,0,w,h);
    g.drawImage(background,x*scale,y*canvas.height/H,w*scale,h*canvas.height/H,0,0,w,h);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(matte,0,0);
  }
}

function drawFoliage(t) {
  const speed = report?.windSpeed ?? 5;
  const wind = clamp(speed / 18);
  const direction = Math.sin((report?.windDirection ?? 250)*Math.PI/180);
  const gust = .55 + .29*Math.sin(t*.62) + .16*Math.sin(t*1.09+.8);
  ctx.save();
  ctx.globalAlpha = .86;
  for (const { x,y,h,layer,phase } of foliage) {
    const hanging = y < 110;
    const anchorY = hanging ? 0 : h;
    const flutter = Math.sin(t*1.85-phase) + .23*Math.sin(t*3.2+phase);
    const sway = wind*(direction*gust*4 + flutter*(.9+gust*2));
    const shear = (hanging ? sway : -sway)/h;
    ctx.save();
    ctx.translate(x,y+anchorY);
    // The masked leaves bend around their attachment point.
    ctx.transform(1,0,shear,1,0,0);
    ctx.drawImage(layer,0,-anchorY);
    ctx.restore();
  }
  ctx.restore();
}

function paintRainSky(light) {
  if (!scenery.sky) return;
  skyPaint.clearRect(0,0,W,rainSky.height);
  const gradient = skyPaint.createLinearGradient(0,0,0,320);
  gradient.addColorStop(0, light.night > .5 ? '#202834' : '#485361');
  gradient.addColorStop(1, light.night > .5 ? '#394452' : '#879096');
  skyPaint.fillStyle = gradient;
  skyPaint.fillRect(0,0,W,rainSky.height);
  skyPaint.globalCompositeOperation = 'destination-in';
  skyPaint.drawImage(scenery.sky,0,0);
  skyPaint.globalCompositeOperation = 'source-over';
  plate.drawImage(rainSky,0,0);
}

function paintRainRoad(light) {
  plate.save();
  plate.clip(rainRoad);
  const sheen = plate.createLinearGradient(0,565,0,H);
  const daylight = 1-light.night*.64;
  sheen.addColorStop(0,'rgba(183,203,221,.14)');
  sheen.addColorStop(.40,`rgba(181,204,224,${.37*daylight})`);
  sheen.addColorStop(.77,`rgba(157,184,205,${.22*daylight})`);
  sheen.addColorStop(1,'rgba(21,35,51,.26)');
  plate.fillStyle = sheen;
  plate.fillRect(0,565,W,H-565);

  // Broken highlights widen towards the camera and stay within the asphalt.
  for (let i=0; i<148; i++) {
    const depth = ((i*181)%997)/997;
    const y = Math.floor(573+depth*depth*367);
    const x = 1190 + (((i*311)%997)/997-.72)*(75+depth*1100);
    const width = 3 + depth*(8+(i*47)%56);
    const glint = plate.createLinearGradient(x-width,0,x+width,0);
    glint.addColorStop(0,'rgba(171,195,215,0)');
    glint.addColorStop(.47,`rgba(196,218,234,${(.15+depth*.22)*daylight})`);
    glint.addColorStop(1,'rgba(171,195,215,0)');
    plate.fillStyle = glint;
    plate.fillRect(x-width,y,width*2,1+Math.floor(depth*2));
  }
  plate.restore();
}

const wetRoof = mask([[444,147],[480,121],[691,109],[783,127],[863,185],
  [843,196],[466,191]]);
const wetEdges = [
  [377,455,654,455], [1422,516,1672,513],
  [14,744,257,680], [0,831,355,723], [24,861,379,743],
  [650,439,838,382],
];

function paintWetSurfaces(light) {
  plate.save();
  plate.globalCompositeOperation = 'screen';
  plate.globalAlpha = 1-light.night*.64;
  const roof = plate.createLinearGradient(0,113,0,196);
  roof.addColorStop(0,'rgba(160,185,206,.30)');
  roof.addColorStop(.68,'rgba(115,146,172,.12)');
  roof.addColorStop(1,'rgba(115,146,172,0)');
  plate.fillStyle = roof;
  plate.fill(wetRoof);
  for (const [x1,y1,x2,y2] of wetEdges) {
    const edge = plate.createLinearGradient(x1,y1,x2,y2);
    edge.addColorStop(0,'rgba(167,189,205,0)');
    edge.addColorStop(.30,'rgba(167,189,205,.37)');
    edge.addColorStop(.68,'rgba(167,189,205,.22)');
    edge.addColorStop(1,'rgba(167,189,205,0)');
    plate.strokeStyle = edge;
    plate.lineWidth = 2.5;
    plate.beginPath();
    plate.moveTo(x1,y1);
    plate.lineTo(x2,y2);
    plate.stroke();
  }
  plate.restore();
}

function composePlate(light) {
  const raining = rainTarget() > 0;
  if (raining) plate.filter = 'saturate(.62) brightness(.72)';
  const { atlas, legacy, flowers } = scenery;
  if (atlas) {
    plate.drawImage(atlas,0,0,W,H,0,0,W,H);
    plate.globalAlpha = light.day;
    plate.drawImage(atlas,0,H,W,H,0,0,W,H);
    plate.globalAlpha = light.night;
    plate.drawImage(atlas,0,2*H,W,H,0,0,W,H);
  } else {
    plate.drawImage(legacy[0],0,0,W,H);
    plate.globalAlpha = light.day;
    plate.drawImage(legacy[1],0,0,W,H);
    plate.globalAlpha = light.night;
    plate.drawImage(legacy[2],0,0,W,H);
  }
  plate.globalAlpha = 1;
  if (flowers) blendPatch(flowers,40,538,light);
  const wetness = wetnessAt(report && {...report, sampledAt:report.forecastAt}, report?.forecastAt, raining);
  drawDryingRoad(light, raining ? 0 : wetness);
  plate.filter = 'none';
  if (raining) {
    paintRainSky(light);
    paintRainRoad(light);
    paintWetSurfaces(light);
  } else if (wetness > 0) {
    plate.fillStyle = `rgba(34,47,61,${Math.max(.04, wetness*.18)})`;
    plate.fill(dampRoad);
  }
  plate.fillStyle = `rgba(252,166,125,${light.dawn*(raining ? .03 : .14)})`;
  plate.fillRect(0,0,W,H);
  plate.fillStyle = `rgba(49,67,92,${rain*.23})`;
  plate.fillRect(0,0,W,H);
  refreshLeafLayers();
}

function drawClouds(t, light) {
  if (scenery.sky && rainTarget() === 0) ctx.drawImage(clouds(t,light,report,scenery.sky),0,0);
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
    const hour = nowInJapan.minute/60;
    const isWindow = y < 500;
    const afterBedtime = hour >= (x < 400 ? 22 : 23) || hour < (x < 400 ? 5.5 : 6.5);
    const output = isWindow && afterBedtime ? .18 : 1;
    glow.addColorStop(0,`rgba(255,163,72,${a*intensity*output})`);
    glow.addColorStop(1,'rgba(255,140,45,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-1,-1,2,2);
    ctx.restore();
  }
  ctx.restore();
}

// Keep each trajectory stable between frames; choose independent phases and lifetimes.
const rainDrops = Array.from({length:240}, () => {
  const depth = Math.random();
  return {
    x: Math.random()*(W+80),
    phase: Math.random(),
    speed: 235+depth*350+Math.random()*65,
    length: 6+depth*17+Math.random()*5,
    lean: .05+Math.random()*.2,
    opacity: .32+depth*.6,
  };
});
const rainSplashes = Array.from({length:38}, () => ({
  x: 540+Math.random()*980,
  y: 592+Math.random()*349,
  phase: Math.random(),
  interval: .42+Math.random()*.9,
}));

function weather(t) {
  if (rain < .01) return;
  ctx.save();
  ctx.lineWidth = 1.2;
  for (const drop of rainDrops) {
    const fall = drop.phase + t*drop.speed/(H+80);
    const passage = Math.floor(fall);
    const y = (fall-passage)*(H+80)-40;
    const x = (drop.x + passage*(310+drop.speed) + (y+40)*drop.lean)%(W+80)-40;
    ctx.strokeStyle = `rgba(219,230,237,${(.18+rain*.37)*drop.opacity})`;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+drop.lean*drop.length,y+drop.length);
    ctx.stroke();
  }
  ctx.clip(rainRoad);
  for (const splash of rainSplashes) {
    const phase = (t/splash.interval+splash.phase)%1;
    if (phase > .45) continue;
    const life = phase/.45;
    const width = 1+life*(splash.y-520)*.017;
    ctx.strokeStyle = `rgba(209,220,230,${(1-life)*rain*.31})`;
    ctx.beginPath();
    ctx.moveTo(splash.x-width,splash.y);
    ctx.lineTo(splash.x+width,splash.y);
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
  drawClouds(elapsed,currentLight);
  if (!paused) drawFoliage(elapsed);
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
  if (!report || Math.abs(Date.now()+forecastLead-report.forecastAt) >= 45*60000) return 0;
  const label = weatherLabel(report.code);
  return Math.min(1, (report.rain + report.showers) * 2 + (label === '雨' || label === '雷雨' ? .4 : 0));
}

function updateClock() {
  const previousDate = nowInJapan?.date;
  nowInJapan = japanClock(new Date(report?.forecastAt ?? Date.now()+forecastLead));
  if (nowInJapan.date !== previousDate) refreshSeason();
  clock.textContent = nowInJapan.display + ' 気象予報';
  clock.dateTime = nowInJapan.date + 'T' + nowInJapan.label + ':00+09:00';
  if (paused) render();
}

async function updateWeather() {
  if (weatherRequest || document.hidden || Date.now() - lastWeatherAttempt < 60000) return;
  lastWeatherAttempt = Date.now();
  weatherRequest = fetchConditions();
  try {
    report = await weatherRequest;
    gradeMinute = -1;
    updateClock();
    conditions.textContent = formatWeather(report);
  } catch {
    report = undefined;
    conditions.textContent = '葛飾の4時間後の予報を取得できません';
  } finally {
    weatherRequest = undefined;
    gradeMinute = -1;
    if (paused) {
      rain = rainTarget();
      render();
    }
  }
}

async function loadSeason(season) {
  const base = season === 'rainy' ? 'springgreen' : season;
  const [atlas, sky, flowers] = await Promise.all([
    image(`./art/season-${base}-v2.webp`),
    image(`./art/sky-${base}.webp`),
    season === 'rainy' ? image('./art/hydrangea.webp') : null,
  ]);
  return { atlas, sky, flowers };
}

function refreshSeason() {
  const season = seasonFor(nowInJapan.date);
  if (season === seasonRequested) return;
  seasonRequested = season;
  loadSeason(season).then(next => {
    if (seasonRequested !== season) return;
    scenery = next;
    foliage = prepareFoliage(next.atlas);
    gradeMinute = -1;
    if (paused) render();
  }).catch(() => {
    // The current scene stays on screen if a replacement cannot load.
  });
}

async function start() {
  const season = seasonFor(japanClock(new Date(Date.now()+forecastLead)).date);
  seasonRequested = season;
  [scenery, sprites, dryRoad] = await Promise.all([
    loadSeason(season).catch(async () => ({
      legacy: await Promise.all(['alley','day','night'].map(name => image(`./art/${name}.webp`))),
    })),
    image('./art/cats.webp'),
    image('./art/dry-road-shadow.webp').catch(() => null),
  ]);
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
  if (scenery.atlas) foliage = prepareFoliage(scenery.atlas);
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
