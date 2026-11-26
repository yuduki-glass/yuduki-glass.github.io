export const pollInterval = 60_000;
const maxValidity = 65 * 60_000;
const spriteById = new Map([['01', 0], ['02', 1], ['03', 2]]);
const actions = new Set(['still', 'walk', 'sit', 'sleep', 'sniff', 'crawl', 'groom']);
const layers = new Set(['street', 'wall', 'behindWall']);

export function decodeSnapshot(snapshot, now = Date.now()) {
  const { version, observedAt, validUntil, cats } = snapshot ?? {};
  const observed = Date.parse(observedAt);
  const expiresAt = Date.parse(validUntil);
  if (version !== 1 || !Array.isArray(cats) || cats.length > 3 ||
      typeof observedAt !== 'string' || typeof validUntil !== 'string' ||
      !Number.isFinite(observed) || !Number.isFinite(expiresAt) ||
      observed > now || expiresAt <= now || expiresAt - observed > maxValidity) {
    throw new Error('Invalid or expired cat snapshot');
  }

  const mapped = [];
  const seen = new Set();
  for (const cat of cats) {
    if (cat?.visible !== true) continue;
    const { id, x, y, facing, action, layer } = cat;
    if (!spriteById.has(id) || seen.has(id) ||
        ![x, y].every(value => Number.isFinite(value) && value >= 0 && value <= 1) ||
        ![-1, 1].includes(facing) || !actions.has(action) || !layers.has(layer)) continue;
    seen.add(id);
    mapped.push({ sprite: spriteById.get(id), x, y, facing, action: action === 'walk' ? 'still' : action, layer });
  }
  return { expiresAt, cats: mapped.sort((a,b) => a.y - b.y) };
}

export async function readVisibleCats() {
  const endpoint = new URL('./positions.json', import.meta.url);
  const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Cat snapshot is unavailable');
  return decodeSnapshot(await response.json());
}
