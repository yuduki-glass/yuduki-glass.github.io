// The garden follows the observation site's Japan calendar.
export function seasonFor(date) {
  const month = Number(date.slice(5,7));
  const day = Number(date.slice(8,10));
  if ((month === 3 && day >= 24) || (month === 4 && day <= 12)) return 'spring';
  if (month >= 3 && month <= 5) return 'springgreen';
  if (month === 6) return 'rainy';
  if (month >= 7 && month <= 9) return 'summer';
  if (month >= 10 && month <= 11) return 'autumn';
  return 'winter';
}

const SKY_HEIGHT = 340;
const WIDTH = 1672;
const CLOUD_BITS = [
  [.73,.13,.16,0], [.88,.19,.22,1], [.68,.26,.14,2], [.60,.36,.18,1],
  [.74,.49,.23,0], [.92,.60,.12,2], [.64,.72,.21,1], [.90,.82,.18,0],
  [.71,.93,.15,2], [.83,.32,.17,2],
];

function cloudSprites() {
  return [
    [[12,16,12,6],[20,11,14,8],[33,8,13,8],[45,12,13,8],[55,16,11,5]],
    [[12,17,11,4],[20,13,13,6],[32,9,14,9],[43,13,12,7],[54,16,12,5]],
    [[12,17,11,4],[24,15,13,5],[34,13,12,7],[42,15,13,5],[56,17,11,4]],
  ].map(lobes => {
    const sprite = document.createElement('canvas');
    sprite.width = 68;
    sprite.height = 26;
    const ctx = sprite.getContext('2d');
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const edge = Math.min(...lobes.map(([ox,oy,rx,ry]) =>
          ((x-ox)/rx)**2 + ((y-oy)/ry)**2));
        const noise = ((x*173+y*91+x*y*13)%47)/47;
        if (edge + noise*.26 > 1 || y + noise*2 > 21) continue;
        ctx.fillStyle = y + noise*3 < 15 ? '#fff8e8' : y < 19 ? '#ebecf4' : '#c5d2e5';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return sprite;
  });
}

export function createCloudLayer() {
  const layer = document.createElement('canvas');
  layer.width = WIDTH;
  layer.height = SKY_HEIGHT;
  const ctx = layer.getContext('2d');
  const sprites = cloudSprites();
  let position = 0;
  let previous = 0;
  let cover = .38;
  let drawingTime = -1;
  return (seconds, light, weather, skyMask) => {
    const step = seconds - previous;
    previous = seconds;
    const prevailingSpeed = (weather?.windSpeed ?? 9) / 6;
    const direction = Math.sin((weather?.windDirection ?? 250)*Math.PI/180);
    position = (position - step * prevailingSpeed * direction) ;
    cover += ((weather?.cloudCover ?? 38)/100 - cover) * (1-Math.exp(-step/12));
    const drawingTick = Math.floor(seconds*8);
    if (drawingTick === drawingTime) return layer;
    drawingTime = drawingTick;
    ctx.clearRect(0,0,WIDTH,SKY_HEIGHT);
    ctx.imageSmoothingEnabled = false;
    const night = light.night;
    const dusk = (1-light.day)*(1-night);
    ctx.filter = `brightness(${1-.65*night}) sepia(${dusk*.55}) saturate(${1-.55*night})`;
    CLOUD_BITS.forEach(([depth,offset,threshold,sprite], index) => {
      const span = WIDTH + 1000;
      const shift = (position*depth + span*offset) % span;
      const x = (shift+span)%span - 500;
      const alpha = Math.max(0, Math.min(1, (cover-threshold)*4));
      ctx.globalAlpha = alpha * (.83-night*.18);
      ctx.drawImage(sprites[sprite], Math.round(x), 15+index%5*42, 170+depth*400, 40+depth*42);
    });
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(skyMask,0,0,WIDTH,SKY_HEIGHT);
    ctx.globalCompositeOperation = 'source-over';
    return layer;
  };
}
