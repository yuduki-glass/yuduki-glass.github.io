// ──【解決策A】重複エラーを回避する安全な宣言に差し替え ── 
if (typeof canvas === 'undefined') { var canvas = document.getElementById('c'); }
if (typeof ctx === 'undefined') { var ctx = canvas ? canvas.getContext('2d') : null; }
if (typeof canvasWrap === 'undefined') { var canvasWrap = document.getElementById('canvasWrap'); }
if (typeof gameArea === 'undefined') { var gameArea = document.getElementById('gameArea'); }
if (typeof leaderboard === 'undefined') { var leaderboard = document.getElementById('leaderboard'); }
if (typeof overlay === 'undefined') { var overlay = document.getElementById('overlay'); }
if (typeof startBtn === 'undefined') { var startBtn = document.getElementById('startBtn'); }
if (typeof collectionBtn === 'undefined') { var collectionBtn = document.getElementById("collectionBtn"); }
if (typeof collectionView === 'undefined') { var collectionView = document.getElementById("collectionView"); }
if (typeof closeCollection === 'undefined') { var closeCollection = document.getElementById("closeCollection"); }
if (typeof pauseOverlay === 'undefined') { var pauseOverlay = document.getElementById('pauseOverlay'); }
if (typeof resumeBtn === 'undefined') { var resumeBtn = document.getElementById('resumeBtn'); }
if (typeof resetDataBtn === 'undefined') { var resetDataBtn = document.getElementById('resetDataBtn'); }

// ── ここから下は消さずにそのまま残す ──
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const cursorDot = document.getElementById('cursor-dot');
function showDot(show) {
  if (cursorDot) {
    if (!isMobile && show) {
      cursorDot.style.display = 'block';
      document.body.classList.add('custom-cursor-active');
    } else {
      cursorDot.style.display = 'none';
      document.body.classList.remove('custom-cursor-active');
    }
  }
}

showDot(true);

window.addEventListener('mousemove', (e) => {
  if (cursorDot && cursorDot.style.display === 'block') {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  }
});

let CW, CH; 
let isPortrait = false;

let shakeTime = 0;
function triggerShake(duration) {
  shakeTime = duration;
}

function resize() {
  // ── 修正：leaderboard がなくても処理を止めないようにガードを変更 ──
  if (!canvasWrap || !gameArea || !canvas) return;
  
  const availW = canvasWrap.clientWidth;
  const availH = canvasWrap.clientHeight;
  const LB_SIDE = 160; 
  const LB_TOP  = 48;  

  if (availW >= availH) {
    // ── 横画面（PC）の処理 ──
    isPortrait = false;
    canvasWrap.style.flexDirection = 'row';
    
    // leaderboard が存在するときだけクラスやDOM順序をいじる
    if (leaderboard) {
      leaderboard.classList.remove('lb-top');
      leaderboard.classList.add('lb-left');
      if (leaderboard.nextSibling !== gameArea) {
        canvasWrap.insertBefore(leaderboard, gameArea);
      }
    }
    
    // 記録枠が消えたので、実質は availW 全体ベースでもいいが、安全に計算
    const sideGap = leaderboard ? LB_SIDE : 0;
    const size = Math.min(availW - sideGap, availH);
    CW = size; CH = size; 
    
    gameArea.style.width   = size + 'px';
    gameArea.style.height  = size + 'px';
    canvas.width           = size;
    canvas.height          = size;
  }
  else {
    // ── 縦画面（スマホ）の処理 ──
    isPortrait = true;
    canvasWrap.style.flexDirection = 'column';
    
    if (leaderboard) {
      leaderboard.classList.remove('lb-left');
      leaderboard.classList.add('lb-top');
      if (leaderboard.nextSibling !== gameArea) {
        canvasWrap.insertBefore(leaderboard, gameArea);
      }
    }
    
    const lbH = leaderboard ? (leaderboard.offsetHeight || LB_TOP) : 0;
    const paddingBottom = 60; 
    CW = availW; 
    CH = availH - lbH - paddingBottom; 
    
    gameArea.style.width   = CW + 'px';
    gameArea.style.height  = CH + 'px';
    canvas.width           = CW;
    canvas.height          = CH;
  }
}
resize();
window.addEventListener('resize', () => { resize(); if (started) resetPositions(); });

const PADDLE_H = 12;
const BALL_R = (window.innerWidth <= 1080) ? 2.5 : 5;
const COLS = 32;
const ROWS = 12;

function paddleY()     { return CH - 40; }
function brickStartY() { return Math.round(CH * 0.14); }
function brickH()      { return 4; }
function brickGapY()   { return 2; }
function brickGapX()   { return 2; }
function brickW() { 
  return Math.floor((CW - (COLS - 1) * brickGapX()) / COLS); 
}
function brickStartX() { return Math.round((CW - (COLS * brickW() + (COLS-1) * brickGapX())) / 2); }

let gameState = 'idle';
let score = 0, hi = 0, lives = 3, level = 1;
let userEscaped = false;       
let exitedIntentionally = false; 
let paused = false;
let paddleX = window.innerWidth / 2, mouseX = window.innerWidth / 2;
let balls = [];
let bricks = [];
let started = false;

let lastTouchX = 0;

// ── Powerups ──
let drops = [];
const PU_MULTIBALL  = 'multiball';
const PU_WIDEBALL   = 'wideball';
const PU_PIERCE     = 'pierce';
const PU_DROP_CHANCE = 0.18;

const PADDLE_W_BASE = 90;
const PADDLE_W_WIDE = 160;
let paddleWCurrent = PADDLE_W_BASE;  
let paddleWTarget  = PADDLE_W_BASE;
let wideballTimer  = 0;
let pierceTimer = 0;

function activateWideball() {
  paddleWTarget = PADDLE_W_WIDE;
  wideballTimer = performance.now() + WIDEBALL_DURATION;
  const colors = ['rgba(56,189,248,0.5)', 'rgba(192,132,252,0.4)'];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    particles.push({
      type: 'spark', x: paddleX, y: paddleY(),
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.5,
      life: 1, decay: 0.03,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1.5 + Math.random() * 2
    });
  }
}

function activatePierce() {
  pierceTimer = performance.now() + 10000;
  const colors = ['rgba(255,255,255,0.7)', 'rgba(56,189,248,0.5)'];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    particles.push({
      type: 'spark', x: paddleX, y: paddleY(),
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 1, decay: 0.03,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1.5 + Math.random() * 2
    });
  }
}

const WIDEBALL_DURATION = 7000; 
function updateWideballPowerup() {
  if (wideballTimer > 0 && performance.now() >= wideballTimer) {
    wideballTimer = 0;
    paddleWTarget = PADDLE_W_BASE;
  }
  const diff = paddleWTarget - paddleWCurrent;
  if (Math.abs(diff) > 0.1) {
    paddleWCurrent += diff * 0.1; 
  } else {
    paddleWCurrent = paddleWTarget;
  }
}

function spawnDrop(bx, by, bw, bh, type) {
  drops.push({
    type,
    x: bx + bw / 2,
    y: by + bh / 2,
    vy: 1.8,
    w: 36, h: 18,
    pulse: 0,
    caught: false
  });
}

function drawMultiballIcon(cx, cy, size) {
  const r = size * 0.18;
  const offsets = [[-size*0.23, size*0.08],[size*0.23, size*0.08],[0, -size*0.23]];
  ctx.fillStyle = '#38bdf8';
  for (const [ox, oy] of offsets) {
    ctx.beginPath();
    ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWidePaddleIcon(cx, cy, size) {
  const hw = size * 0.38, hh = size * 0.1;
  ctx.fillStyle = '#c084fc';
  ctx.fillRect(cx - hw, cy - hh, hw * 2, hh * 2);
}

function updateDrops() {
  const py = paddleY();
  const pw = paddleWCurrent;
  drops.forEach(d => {
    d.y += d.vy;
    d.pulse += 0.12;
    
    if (d.y + d.h / 2 >= py && d.y - d.h / 2 <= py + PADDLE_H &&
        d.x >= paddleX - pw / 2 - d.w / 2 && d.x <= paddleX + pw / 2 + d.w / 2) {
      
      d.caught = true;
      if (d.type === PU_MULTIBALL) { activateMultiball(); sfxPowerup(); }
      else if (d.type === PU_WIDEBALL) { activateWideball(); sfxPowerup(); }
      else if (d.type === PU_PIERCE) { activatePierce(); sfxPowerup(); }
    }
  });
  drops = drops.filter(d => !d.caught && d.y < CH + 40);
}

function activateMultiball() {
  if (balls.length >= 50) return;

  const current = [...balls];
  for (const source of current) {
    if (balls.length >= 50) break; 
    const spd = Math.hypot(source.vx, source.vy);
    const base = Math.atan2(source.vy, source.vx);
    const angles = [-0.35, 0.35];
    for (const da of angles) {
      balls.push({
        x: source.x, y: source.y,
        vx: Math.cos(base + da) * spd,
        vy: Math.sin(base + da) * spd,
        isExtra: true,
        history: []
      });
    }
  }
  const colors = ['rgba(56,189,248,0.5)', 'rgba(192,132,252,0.4)'];
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    particles.push({
      type: 'spark', x: paddleX, y: paddleY(),
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.5,
      life: 1, decay: 0.03,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1.5 + Math.random() * 1.5
    });
  }
}

function drawDrops() {
  drops.forEach(d => {
    const alpha = 0.2 + 0.1 * Math.sin(d.pulse);
    ctx.fillStyle = '#060b14';
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha + 0.3})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#38bdf8';
    roundRect(ctx, d.x - d.w/2, d.y - d.h/2, d.w, d.h, 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    if (d.type === PU_WIDEBALL) { drawWidePaddleIcon(d.x, d.y, d.h); }
    else if (d.type === PU_PIERCE) { drawPierceIcon(d.x, d.y, d.h); }
    else { drawMultiballIcon(d.x, d.y, d.h); }
  });
}

function drawPierceIcon(cx, cy, size) {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx-size*0.3, cy);
  ctx.lineTo(cx+size*0.3, cy);
  ctx.stroke();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x + r, y + r, r);
  c.arcTo(x, y + r, x + r, y, r);
  c.closePath();
}

let particles = [];

function spawnBrickParticles(bx, by, bw, bh) {
  const cx = bx + bw / 2, cy = by + bh / 2;
  const colors = ['rgba(56,189,248,0.7)', 'rgba(192,132,252,0.6)', 'rgba(255,255,255,0.8)'];
  
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.5;
    particles.push({
      type: 'spark', x: cx, y: cy,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.7, 
      life: 1, decay: 0.015 + Math.random() * 0.015, 
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1 + Math.random() * 2.2
    });
  }
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.4 + Math.random() * 1.5;
    particles.push({
      type: 'shard',
      x: bx + Math.random() * bw, y: by + Math.random() * bh,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 1, decay: 0.012 + Math.random() * 0.012,
      color: Math.random() > 0.5 ? 'rgba(125,211,252,0.4)' : 'rgba(216,180,254,0.35)',
      w: 2 + Math.random() * 5, h: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.15
    });
  }
}

function spawnDeathParticles(x, y) {
  const colors = ['rgba(192,132,252,0.5)', 'rgba(56,189,248,0.4)', 'rgba(255,255,255,0.2)'];
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.0 + Math.random() * 3.5;
    particles.push({
      type: 'spark', x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.3,
      life: 1, decay: 0.015 + Math.random() * 0.015,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1.5 + Math.random() * 2.5
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.life -= p.decay;
    if (p.type === 'spark') { 
      p.x += p.vx; p.y += p.vy; 
      p.vy += 0.01; 
    } else if (p.type === 'shard') { 
      p.x += p.vx; p.y += p.vy; 
      p.rot += p.rotV; 
    }
  }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  for (const p of particles) {
    const alpha = Math.max(0, p.life);
    ctx.globalAlpha = alpha;
    if (p.type === 'spark') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      if (Math.random() > 0.5) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (p.type === 'shard') {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w * p.life, p.h * p.life);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

function resetPositions() {
  paddleX = CW / 2;
  mouseX  = CW / 2;
  if (balls.length) { balls[0].x = paddleX; balls[0].y = paddleY() - BALL_R - 2; }
}

function makeBall() {
  return { x: paddleX, y: paddleY() - BALL_R - 2, vx: 3.75, vy: -6.25, history: [], lost: false };
}

function buildBricks() {
  bricks = [];
  const bx = brickStartX(), by = brickStartY();
  const bw = brickW(), bh = brickH(), gx = brickGapX(), gy = brickGapY();
  const rows = Math.min(ROWS + level - 1, 10);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      const roll = Math.random();
      let dropType = null;
      if (roll < PU_DROP_CHANCE) {
        const itemRoll = Math.random();
        if (itemRoll < 0.5) dropType = PU_MULTIBALL;
        else if (itemRoll < 0.8) dropType = PU_WIDEBALL;
        else dropType = PU_PIERCE;
      }
      bricks.push({
        x: bx + c * (bw + gx), y: by + r * (bh + gy),
        w: bw, h: bh, alive: true, row: r,
        dropType
      });
    }
  }
}

function initGame() {
  if (typeof loadCollection === "function") {
    loadCollection(); 
  }
  exitPointerLock();
  resize();
  score = 0; lives = 3; level = 1;
  paddleX = CW / 2; mouseX = CW / 2;
  particles = []; drops = [];
  paddleWCurrent = PADDLE_W_BASE;
  paddleWTarget = PADDLE_W_BASE;
  wideballTimer = 0;
  pierceTimer = 0;
  userEscaped = false;
  exitedIntentionally = false;
  paused = false;
  if (pauseOverlay) pauseOverlay.style.display = 'none';
  const ideoLink = document.getElementById('ideoLink');
  if (ideoLink) ideoLink.style.display = 'none';
  
  if (overlay) {
    const glitch = overlay.querySelector('.glitch');
    if (glitch) glitch.textContent = '硝子片集め';
    const taglines = overlay.querySelectorAll('.tagline');
    if (taglines.length > 0) taglines[0].textContent = 'glass fragment breaker';
    overlay.style.display = 'none';
  }
  
  if (startBtn) {
    startBtn.textContent = '[ 観測開始 ]';
  }
  
  buildBricks();
  balls = [makeBall()];
  started = true;
  updHUD();
  
setTimeout(() => {
  gameState = 'waiting';
  showDot(true);
}, 80);
} 
  
function launch() {
  if (gameState !== 'waiting') return;
  balls[0].vx = 3.75 * (Math.random() > 0.5 ? 1 : -1);
  balls[0].vy = -6.25;
  gameState = 'playing';
 //if (!isMobile && document.pointerLockElement !== gameArea) {
 //   requestPointerLock();
 // }
}
  
function updHUD() {
  const sv = document.getElementById('sv');
  const lv = document.getElementById('lv');
  const lf = document.getElementById('lf');
  const hv = document.getElementById('hv');
  if (sv) sv.textContent = String(score).padStart(6,'0');
  if (lv) lv.textContent = String(level).padStart(2,'0');
  if (lf) lf.textContent = lives;
  if (hv) hv.textContent = String(hi).padStart(6,'0');
}

const ROW_BG = [
  'rgba(175,219,245,0.45)',
  'rgba(230,230,250,0.40)',
  'rgba(245,245,245,0.35)',
  'rgba(175,219,245,0.30)',
  'rgba(230,230,250,0.25)',
  'rgba(245,245,245,0.20)'
];
const ROW_BD = [
  'rgba(175,219,245,0.65)',
  'rgba(230,230,250,0.60)',
  'rgba(245,245,245,0.55)',
  'rgba(175,219,245,0.45)',
  'rgba(230,230,250,0.35)',
  'rgba(245,245,245,0.25)'
];

function update() {
  if (gameState === 'idle' || gameState === 'over') return;

  if (shakeTime > 0) shakeTime--; 
  updateParticles();
  updateDrops();
  updateWideballPowerup();
  
  if (pierceTimer > 0 && performance.now() >= pierceTimer) {
    pierceTimer = 0;
  }

  const PW = paddleWCurrent; 
  paddleX += (mouseX - paddleX) * 0.25;
  paddleX = Math.max(PW / 2, Math.min(CW - PW / 2, paddleX));

  if (gameState === 'waiting') {
    if (balls[0]) {
      balls[0].x = paddleX;
      balls[0].y = paddleY() - BALL_R - 2;
      balls[0].history = [];
    }
    return;
  }

  const py = paddleY();
  
  const maxRows = Math.min(ROWS + level - 1, 10);
  const maxBrickY = brickStartY() + maxRows * (brickH() + brickGapY());

  for (const ball of balls) {
    if (ball.lost) continue;
    
    ball.history.push({ x: ball.x, y: ball.y });
    if (ball.history.length > 5) ball.history.shift(); 

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - BALL_R < 0)  { ball.x = BALL_R;       ball.vx =  Math.abs(ball.vx); triggerShake(3); }
    if (ball.x + BALL_R > CW) { ball.x = CW - BALL_R;  ball.vx = -Math.abs(ball.vx); triggerShake(3); }
    if (ball.y - BALL_R < 0)  { ball.y = BALL_R;        ball.vy =  Math.abs(ball.vy); triggerShake(3); }

    if (ball.vy > 0 &&
        ball.y + BALL_R >= py &&
        ball.y + BALL_R <= py + PADDLE_H + 8 &&
        ball.x >= paddleX - PW / 2 &&
        ball.x <= paddleX + PW / 2) {
      const hit = (ball.x - paddleX) / (PW / 2);
      const speed = Math.hypot(ball.vx, ball.vy);
      ball.vx = hit * speed * 0.9;
      ball.vy = -Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, 1));
      sfxPaddle();
      triggerShake(4); 
    }

    if (ball.y - BALL_R <= maxBrickY) {
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w &&
            ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
          b.alive = false;
          score += 10 * level;
          
          if (pierceTimer <= 0) {
            const prevY = ball.y - ball.vy;
            if (prevY + BALL_R <= b.y || prevY - BALL_R >= b.y + b.h) {
              ball.vy *= -1;
            } else {
              ball.vx *= -1;
            }
          }
          hi = Math.max(hi, score);
          updHUD();
          spawnBrickParticles(b.x, b.y, b.w, b.h);
          sfxBrick();
          triggerShake(2);
          if (b.dropType) spawnDrop(b.x, b.y, b.w, b.h, b.dropType);
          break;
        }
      }
    }

    if (ball.y - BALL_R > CH) {
      ball.lost = true;
      spawnDeathParticles(ball.x, CH - 10);
      sfxDeath();
    }
  }

  balls = balls.filter(b => !b.lost);

  if (balls.length === 0) {
    if (gameState === 'clear') return;
    
    lives--; 
    updHUD();

    if (lives <= 0) {
      gameState = 'over';
      exitPointerLock();
      showDot(true);
      setTimeout(() => {
        if (overlay) {

          const oldDisplay = overlay.querySelector('.get-item-display');
          if (oldDisplay) oldDisplay.remove();
          
          overlay.style.display = 'flex'; 
          const glitch = overlay.querySelector('.glitch');
          if (glitch) glitch.textContent = '散逸'; 
          const taglines = overlay.querySelectorAll('.tagline');
          if (taglines.length > 0) taglines[0].textContent = '終端観測値: ' + String(score).padStart(6,'0');
        }
        if (startBtn) startBtn.textContent = '[ もう一度 ]';
        const ideoLink = document.getElementById('ideoLink');
        if (ideoLink) ideoLink.style.display = 'block';
      }, 0);
    } else {
      balls = [makeBall()];
      gameState = 'waiting';
    }
    return;
  }

if (bricks.length > 0 && bricks.every(b => !b.alive)) {
    if (gameState === 'clear') return;
    gameState = 'clear';
    
    if (overlay) {
      overlay.style.display = 'flex';
      const glitch = overlay.querySelector('.glitch');
      if (glitch) glitch.textContent = '結晶共鳴';
      
      // ★修正1: ”glass fragment breaker” の文字を消す（空文字にする）
      const taglines = overlay.querySelectorAll('.tagline');
      if (taglines.length > 0) taglines[0].textContent = '';

      const oldDisplay = overlay.querySelector('.get-item-display');
      if (oldDisplay) oldDisplay.remove();

      if (typeof addCollectionItem === "function") {
        const gottenItem = addCollectionItem(level); 
        
        if (gottenItem && gottenItem.name) {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'get-item-display';
          itemDiv.style.cssText = 'margin: 15px 0; text-align: center; animation: popupFadeIn 0.3s ease-out; position: relative;';

          // ── ★修正2: レア度バッジの生成と追加 ──
          // gottenItem.rarity（おそらく 'c', 'r', 'l' のいずれか）を取得
// 全硝子片観測完了は専用演出
if (gottenItem.name === "全硝子片 観測完了") {

  const itemName = document.createElement('div');
  itemName.textContent = `【 ${gottenItem.name} 】`;
  itemName.style.cssText =
    'font-size:15px; letter-spacing:2px; font-weight:600; color:#eafcff;';
  itemDiv.appendChild(itemName);

} else {

  const rKey = (gottenItem.rarity || 'c').toLowerCase();

  // レア度に応じた表示名を設定
  let rName = '常融';
  if (rKey === 'r') rName = '希硝';
  if (rKey === 'l') rName = '幻晶';

  // バッジ要素を作成
  const badgeSpan = document.createElement('span');
  badgeSpan.className = `rarity-badge rarity-${rKey}`;
  badgeSpan.textContent = rName;
  badgeSpan.style.cssText =
    'position: relative !important; display: inline-block; margin-bottom: 12px; padding: 3px 10px !important; font-size: 11px !important;';
  itemDiv.appendChild(badgeSpan);

  if (gottenItem.image) {
    const itemImg = document.createElement('img');
    itemImg.src = gottenItem.image;
    itemImg.className = `rarity-border-${rKey}`;
    itemImg.style.cssText =
      'width: 56px; height: 56px; object-fit: contain; margin: 0 auto 8px auto; display: block;';
    itemDiv.appendChild(itemImg);
  }

  const itemName = document.createElement('div');
  itemName.textContent = `【 獲得: ${gottenItem.name} 】`;
  itemName.className = `rarity-text-${rKey}`;
  itemName.style.cssText =
    'font-size: 15px; letter-spacing: 2px; font-weight: 600;';
  itemDiv.appendChild(itemName);
}

overlay.insertBefore(itemDiv, collectionBtn);
        }
      }
    }

    if (startBtn) {
      startBtn.textContent = '[ 次の層へ ]';
    }

    exitPointerLock();
    showDot(true);
    return;
  }
}

function draw() {
  ctx.save();
  
  if (shakeTime > 0) {
    const dx = (Math.random() - 0.5) * 2.0;
    const dy = (Math.random() - 0.5) * 2.0;
    ctx.translate(dx, dy);
  }

  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = '#050A15';
  ctx.fillRect(0, 0, CW, CH);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.025)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < CW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
  for (let y = 0; y < CH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

  bricks.forEach(b => {
    if (!b.alive) return;
    const ri = Math.min(b.row, ROW_BG.length - 1);
    ctx.fillStyle = ROW_BG[ri];
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = ROW_BD[ri];
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  });

  drawParticles();
  drawDrops();

  if (!started) { ctx.restore(); return; }

  const py = paddleY();
  const PW = paddleWCurrent;
  const px = paddleX - PW / 2;
  
  ctx.fillStyle = 'rgba(175,219,245,0.12)';
  ctx.fillRect(px, py, PW, PADDLE_H);
  ctx.strokeStyle = 'rgba(230,230,250,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, PW - 1, PADDLE_H - 1);

  if (gameState !== 'over') {
    ctx.lineWidth = BALL_R * 1.3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    
    balls.forEach(ball => {
      if (ball.history && ball.history.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ball.history[0].x, ball.history[0].y);
        for (let i = 1; i < ball.history.length; i++) {
          ctx.lineTo(ball.history[i].x, ball.history[i].y);
        }
        ctx.stroke();
      }
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = pierceTimer > 0 ? 30 : 18;
    ctx.shadowColor = pierceTimer > 0 ? '#ffffff' : '#00FFFF';

    balls.forEach(ball => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.shadowBlur = 0; 
  }
  
  ctx.restore();
}

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type, duration, gainVal, fadeOut = true) {
  try {
    const ctxNode = getAudioCtx();
    const osc = ctxNode.createOscillator();
    const gain = ctxNode.createGain();
    osc.connect(gain);
    gain.connect(ctxNode.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctxNode.currentTime);
    gain.gain.setValueAtTime(gainVal, ctxNode.currentTime);
    if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, ctxNode.currentTime + duration);
    osc.start(ctxNode.currentTime);
    osc.stop(ctxNode.currentTime + duration);
    
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, duration * 1000 + 50);
  } catch(e) {}
}

function sfxPaddle() { playTone(520, 'triangle', 0.12, 0.04); }

let lastBrickSfx = 0;
function sfxBrick() {
  const now = performance.now();
  if (now - lastBrickSfx < 40) return; 
  lastBrickSfx = now;
  try {
    const ctxNode = getAudioCtx();
    const osc = ctxNode.createOscillator();
    const gain = ctxNode.createGain();
    osc.connect(gain);
    gain.connect(ctxNode.destination);
    osc.detune.value = Math.random() * 8 - 4;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctxNode.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctxNode.currentTime + 0.15);
    gain.gain.setValueAtTime(0.04, ctxNode.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxNode.currentTime + 0.06);
    osc.start(ctxNode.currentTime);
    osc.stop(ctxNode.currentTime + 0.07);
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, 120);
  } catch(e) {}
}

function sfxPowerup() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 'sine', 0.15, 0.03), i * 50);
  });
}

function sfxDeath() {
  try {
    const ctxNode = getAudioCtx();
    const osc = ctxNode.createOscillator();
    const gain = ctxNode.createGain();
    osc.connect(gain);
    gain.connect(ctxNode.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctxNode.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctxNode.currentTime + 0.8);
    gain.gain.setValueAtTime(0.08, ctxNode.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxNode.currentTime + 0.4);
    osc.start(ctxNode.currentTime);
    osc.stop(ctxNode.currentTime + 0.4);
    setTimeout(() => {
      osc.disconnect();
      gain.disconnect();
    }, 450);
  } catch(e) {}
}

function pauseGame() {
  if (paused || (gameState !== 'playing' && gameState !== 'waiting')) return;
  paused = true;
  if (pauseOverlay) pauseOverlay.style.display = 'flex';
  showDot(true);
}

function resumeGame() {
  if (!paused) return;
  paused = false;
  if (pauseOverlay) pauseOverlay.style.display = 'none';
  showDot(true);
  userEscaped = false;
}

if (resumeBtn) {
  resumeBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation(); e.preventDefault(); resumeGame();
  }, { passive:false });
  resumeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); resumeGame();
  });
}

document.addEventListener('pointerlockchange', () => {
  if (!isMobile &&
    document.pointerLockElement !== gameArea &&
    !exitedIntentionally &&
    gameState !== 'over'){
    userEscaped = true;
    pauseGame();
  }
});

function exitPointerLock() {
  if (document.pointerLockElement === gameArea) {
    document.exitPointerLock();
  }
}

function requestPointerLock() {
  if (isMobile || !gameArea) return; 
  gameArea.requestPointerLock({ unadjustedMovement: true }).catch(() => {
    gameArea.requestPointerLock();
  });
}

if (gameArea) {
  gameArea.addEventListener('mousemove', e => {
    if (!isMobile && document.pointerLockElement === gameArea) {
      mouseX = Math.max(0, Math.min(CW, mouseX + e.movementX));
    } else if (!isMobile) {
      const r = gameArea.getBoundingClientRect();
      // gameAreaの実際の表示幅(r.width)と、ゲーム内の論理幅(CW)の比率を考慮して、正確な座標を出す
      mouseX = (e.clientX - r.left) * (CW / r.width);
    }
  });

  gameArea.addEventListener('touchstart', e => {
    if ((overlay && overlay.style.display !== 'none') || gameState === 'clear' || gameState === 'idle' || gameState === 'over') {
      return; 
    }
    
    e.preventDefault();
    const touch = e.touches[0];
    lastTouchX = touch.clientX;
    if (gameState === 'waiting') { launch(); }
  }, { passive:false });

  gameArea.addEventListener('touchmove', e => {
    if (gameState === 'playing' || gameState === 'waiting') {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchX;
      lastTouchX = touch.clientX;
      mouseX = Math.max(0, Math.min(CW, mouseX + deltaX * 1.2));
    }
  }, { passive:false });

  if (!isMobile) {
    gameArea.addEventListener('click', e => {
      if (gameState === 'clear' || gameState === 'over' || gameState === 'idle') return;

      if (gameState === 'playing' || gameState === 'waiting') {
      if (document.pointerLockElement !== gameArea && !userEscaped) {
        exitedIntentionally = false;
        paused = false;
        if (pauseOverlay) pauseOverlay.style.display = 'none';
        showDot(true);
      }
        if (gameState === 'waiting') { launch(); }
      }
    });
  }
}

function handleStartAction(e) {
  e.stopPropagation();
  e.preventDefault();
  
  // リスタート時は、まず強制的にオーバーレイを視覚的に消す
  if (overlay) overlay.style.display = 'none';
  if (pauseOverlay) pauseOverlay.style.display = 'none';
  
if (gameState === 'clear') {
  level++;
  buildBricks();
  balls = [makeBall()];
  updHUD();
    
  setTimeout(() => {
    gameState = 'waiting';
    showDot(true);
  }, 80);

} else {
  exitedIntentionally = true; 
  initGame();
  setTimeout(() => { exitedIntentionally = false; }, 100);
}
}

if (startBtn) {
  startBtn.addEventListener('touchstart', handleStartAction, { passive:false });
  startBtn.addEventListener('click', handleStartAction);
}

function updateClock() {
  const clock = document.getElementById('clock');
  if (clock) {
    const now = new Date();
    clock.textContent = now.toTimeString().split(' ')[0];
  }
}
setInterval(updateClock, 1000);
updateClock();

if (collectionBtn) {
  const handleCollectionOpen = (e) => {
    if (overlay) overlay.style.display = 'none';
    if (collectionView) collectionView.style.display = 'flex';
    
    if (typeof loadCollection === "function") loadCollection();
    if (typeof updateTotalWeightDisplay === "function") updateTotalWeightDisplay();
    if (typeof openCollection === "function") openCollection(); 
  };
  collectionBtn.onclick = handleCollectionOpen;
}

if (closeCollection) {
  const handleCollectionClose = (e) => {
    const itemPopup = document.getElementById("itemPopup");
    if (itemPopup && itemPopup.style.display === "flex") {
      return; 
    }
    if (collectionView) collectionView.style.display = "none";
    if (gameState === 'clear' || gameState === 'over' || gameState === 'idle') {
      if (overlay) overlay.style.display = 'flex';
    }
  };
  closeCollection.onclick = handleCollectionClose;
  closeCollection.ontouchstart = (e) => { e.preventDefault(); handleCollectionClose(e); };
}

if (resetDataBtn) {
  const handleResetData = (e) => {
    e.stopPropagation();
    if (e.type === 'touchstart') e.preventDefault();

    if (confirm('今までの記録をすべて消去してもいい？')) {
      if (typeof window.resetCollectionMemory === "function") {
        window.resetCollectionMemory();
      }
    }
  };
  resetDataBtn.onclick = handleResetData;
  resetDataBtn.ontouchstart = handleResetData;
}

// ──【駆動コア】ゲームループの処理 ──
function loop() {
  if (!paused) {
    update();
    draw();
  } else {
    draw(); // 一時停止中も画面が消えないように描画だけは維持
  }
  requestAnimationFrame(loop);
}

// 最初のループ起動
requestAnimationFrame(loop);
