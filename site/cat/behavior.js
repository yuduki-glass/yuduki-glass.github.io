// Timeline coordinates are normalized to the camera frame. A future data
// source can supply the same observations without owning or changing the clock.
const pose = (x, y, action, facing = 1, layer = 'street') => ({ x, y, action, facing, layer });
const offscreen = pose(0, 0, 'away');

const tracks = [
  [
    [0, pose(.905, .547, 'sit', -1, 'wall')],
    [15, pose(.905, .547, 'groom', -1, 'wall')],
    [23, pose(.905, .547, 'sit', -1, 'wall')],
    [29, pose(.905, .547, 'walk', 1, 'wall')],
    [37, pose(1.055, .552, 'walk', 1, 'wall')],
    [38, offscreen],
    [127, pose(1.055, .552, 'walk', -1, 'wall')],
    [135, pose(.905, .547, 'sit', -1, 'wall')],
    [154, pose(.905, .547, 'sleep', -1, 'wall')],
    [175, pose(.905, .547, 'sit', -1, 'wall')],
  ],
  [
    [0, pose(.568, .746, 'walk')],
    [5, pose(.642, .713, 'sniff')],
    [10, pose(.642, .713, 'still', -1)],
    [14, pose(.642, .713, 'walk', -1)],
    [25, pose(.51, .702, 'walk', -1)],
    [33, pose(.492, .668, 'sniff', -1)],
    [37, pose(.492, .668, 'crawl', -1)],
    [43, pose(.419, .651, 'crawl', -1)],
    [44, offscreen],
    [103, pose(.419, .651, 'crawl')],
    [109, pose(.492, .668, 'walk')],
    [121, pose(.624, .674, 'still', -1)],
    [125, pose(.624, .674, 'sniff', -1)],
    [128, pose(.624, .674, 'walk')],
    [134, pose(.685, .631, 'walk')],
    [140, pose(.728, .616, 'walk')],
    [142, pose(.747, .611, 'walk', 1, 'behindWall')],
    [150, pose(.797, .595, 'walk', 1, 'behindWall')],
    [151, offscreen],
    [162, pose(.419, .651, 'crawl')],
    [168, pose(.492, .668, 'walk')],
    [179, pose(.568, .746, 'walk')],
  ],
  [
    [0, pose(.243, .779, 'sleep')],
    [26, pose(.243, .779, 'sit')],
    [31, pose(.243, .779, 'groom')],
    [39, pose(.243, .779, 'still')],
    [42, pose(.243, .779, 'walk', -1)],
    [57, pose(-.055, .845, 'walk', -1)],
    [58, offscreen],
    [104, pose(.556, 1.08, 'walk')],
    [121, pose(.566, .695, 'still')],
    [125, pose(.566, .695, 'sniff')],
    [134, pose(.566, .695, 'walk', -1)],
    [156, pose(.358, .845, 'walk', -1)],
    [166, pose(.268, .795, 'walk', -1)],
    [171, pose(.243, .779, 'sit')],
    [177, pose(.243, .779, 'sleep')],
  ],
];

const moving = new Set(['walk', 'crawl']);
const lastIndex = tracks.map(() => 0);

export const demoSource = {
  sample(seconds, out) {
    const time = seconds % 180;
    tracks.forEach((track, index) => {
      let i = lastIndex[index];
      if (time < track[i][0]) i = 0;
      while (i + 1 < track.length && time >= track[i + 1][0]) i++;
      lastIndex[index] = i;
      const [start, from] = track[i];
      const [end, to] = track[i + 1] ?? track[i];
      const cat = out[index];
      Object.assign(cat, from);
      if (end > start && moving.has(from.action) && to.action !== 'away') {
        const fraction = (time - start) / (end - start);
        cat.x += (to.x - from.x) * fraction;
        cat.y += (to.y - from.y) * fraction;
      }
      cat.elapsed = time - start;
    });
  },
};
