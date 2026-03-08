'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions
const W = 800, H = 560;
canvas.width = W;
canvas.height = H;

// ── Constants ────────────────────────────────────────────────────────────────
const DIE         = 52;      // die square size (px)
const BULLET_SPD  = 9;       // bullet speed (px/frame)
const MAX_BULLETS = 3;       // max bullets on screen
const LIVES_START = 3;
const KILLS_PER_LVL  = 8;   // kills needed to level up
const SPAWN_BASE  = 120;     // starting spawn interval (frames)
const SPAWN_MIN   = 40;      // fastest spawn interval
const SPAWN_DEC   = 15;      // frames removed per level
const FALL_BASE   = 0.60;    // base fall speed (px/frame)
const GUN_HOLD_DELAY = 18;  // frames of hold before continuous movement starts
const GUN_HOLD_SPD   = 5;   // px/frame during continuous hold

// ── Pre-generated star field ──────────────────────────────────────────────────
const STARS = Array.from({ length: 90 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: 0.3 + Math.random() * 1.4,
  a: 0.3 + Math.random() * 0.5
}));

// ── Pip positions (normalized 0–1 within die face) ───────────────────────────
const DOTS = {
  1: [[.5, .5]],
  2: [[.28, .28], [.72, .72]],
  3: [[.28, .28], [.5, .5],  [.72, .72]],
  4: [[.28, .28], [.72, .28], [.28, .72], [.72, .72]],
  5: [[.28, .28], [.72, .28], [.5,  .5],  [.28, .72], [.72, .72]],
  6: [[.28, .2],  [.72, .2],  [.28, .5],  [.72, .5],  [.28, .8],  [.72, .8]]
};

// Explosion accent color per face value
const BURST_COLOR = ['', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

// ── Game state ────────────────────────────────────────────────────────────────
let state;                    // 'start' | 'playing' | 'paused' | 'over'
let score, highScore = 0, lives, level, killCount;
let gunX, gunHoldLeft, gunHoldRight;
let bullets, dice, particles, spawnTimer;
const keys = {};

// ── Input ─────────────────────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) e.preventDefault();

  // All keys ignore OS key-repeat beyond here
  if (keys[e.key]) return;
  keys[e.key] = true;

  // Arrow keys: move DIE/4 on first press; game loop handles continuous hold
  const step = DIE / 7;   // ~7px per tap
  if (e.key === 'ArrowLeft'  && state === 'playing') gunX = Math.max(22, gunX - step);
  if (e.key === 'ArrowRight' && state === 'playing') gunX = Math.min(W - 22, gunX + step);

  if (e.key === 'Enter' || e.key === ' ') {
    if (state === 'start' || state === 'over') initGame();
    else if (state === 'playing') shoot();
  }
  if (e.key === 'p' || e.key === 'P') {
    if (state === 'playing') state = 'paused';
    else if (state === 'paused') state = 'playing';
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ── Init ──────────────────────────────────────────────────────────────────────
function initGame() {
  score = 0; lives = LIVES_START; level = 1; killCount = 0;
  gunX = W / 2;
  gunHoldLeft = 0; gunHoldRight = 0;
  bullets = []; dice = []; particles = [];
  spawnTimer = 0;
  state = 'playing';
}

// ── Actions ───────────────────────────────────────────────────────────────────
function shoot() {
  if (bullets.length >= MAX_BULLETS) return;
  // Bullet y = top of bullet; gun barrel top is at H - 20 - 20 - 24 = H - 64
  bullets.push({ x: gunX, y: H - 64, w: 4, h: 14 });
}

function spawnDie() {
  const x   = 10 + Math.random() * (W - DIE - 20);
  const val = 1 + Math.floor(Math.random() * 6);
  const spd = (FALL_BASE + Math.random() * 0.24) * (1 + (level - 1) * 0.18);
  dice.push({ x, y: -DIE, val, spd, rot: 0, rotV: (Math.random() - 0.5) * 0.03 });
}

function burst(x, y, val) {
  const color = BURST_COLOR[val];
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 1.5 + Math.random() * 3.5;
    particles.push({
      x: x + DIE / 2, y: y + DIE / 2,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      life: 1, decay: 0.03 + Math.random() * 0.04,
      r: 2 + Math.random() * 3.5, color
    });
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update() {
  // Gun continuous hold movement (kicks in after GUN_HOLD_DELAY frames)
  if (keys['ArrowLeft']) {
    if (++gunHoldLeft > GUN_HOLD_DELAY) gunX = Math.max(22, gunX - GUN_HOLD_SPD);
  } else { gunHoldLeft = 0; }
  if (keys['ArrowRight']) {
    if (++gunHoldRight > GUN_HOLD_DELAY) gunX = Math.min(W - 22, gunX + GUN_HOLD_SPD);
  } else { gunHoldRight = 0; }

  // Bullets move up; remove when off top of canvas
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= BULLET_SPD;
    if (bullets[i].y + bullets[i].h < 0) bullets.splice(i, 1);
  }

  // Spawn dice
  const interval = Math.max(SPAWN_MIN, SPAWN_BASE - (level - 1) * SPAWN_DEC);
  if (++spawnTimer >= interval) {
    spawnTimer = 0;
    spawnDie();
    if (level >= 4 && Math.random() < 0.35) spawnDie();
    if (level >= 7 && Math.random() < 0.25) spawnDie();
  }

  // Dice: fall, rotate, collide
  for (let i = dice.length - 1; i >= 0; i--) {
    const d = dice[i];
    d.y += d.spd;
    d.rot += d.rotV;

    // Die reached ground line
    if (d.y + DIE > H - 10) {
      dice.splice(i, 1);
      if (--lives <= 0) {
        highScore = Math.max(highScore, score);
        state = 'over';
      }
      continue;
    }

    // AABB bullet collision (on unrotated bounds — acceptable approximation)
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const hitsX = b.x + b.w / 2 > d.x && b.x - b.w / 2 < d.x + DIE;
      const hitsY = b.y + b.h > d.y && b.y < d.y + DIE;
      if (hitsX && hitsY) {
        score += d.val;
        if (++killCount >= KILLS_PER_LVL) { killCount = 0; level++; }
        burst(d.x, d.y, d.val);
        dice.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
  }

  // Particles: move with gravity, fade
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.12;     // gravity
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ── Draw helpers ──────────────────────────────────────────────────────────────
function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);      ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

function drawBg() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#06060f');
  g.addColorStop(1, '#0b0b20');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  STARS.forEach(s => {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Ground line (danger zone indicator)
  ctx.strokeStyle = 'rgba(231, 76, 60, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 14]);
  ctx.beginPath();
  ctx.moveTo(0, H - 10);
  ctx.lineTo(W, H - 10);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDie(d) {
  ctx.save();
  ctx.translate(d.x + DIE / 2, d.y + DIE / 2);
  ctx.rotate(d.rot);

  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  rrect(-DIE / 2, -DIE / 2, DIE, DIE, DIE * 0.15);
  ctx.fillStyle = '#f5f5eb';
  ctx.fill();

  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#1a1a2e';
  const dotR = DIE * 0.085;
  DOTS[d.val].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc((dx - 0.5) * DIE, (dy - 0.5) * DIE, dotR, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawGun(x) {
  // Body: H-40 → H-20 (height 20), Barrel: H-64 → H-40 (height 24)
  const bw = 10, bh = 24, gw = 38, gh = 20;
  ctx.save();
  ctx.shadowColor = 'rgba(46,204,113,0.5)';
  ctx.shadowBlur = 12;

  ctx.fillStyle = '#27ae60';                             // barrel
  rrect(x - bw / 2, H - 20 - gh - bh, bw, bh, 3);
  ctx.fill();

  ctx.fillStyle = '#2ecc71';                             // body
  rrect(x - gw / 2, H - 20 - gh, gw, gh, 6);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.18)';              // shine
  rrect(x - gw / 2 + 4, H - 20 - gh + 3, gw - 8, gh * 0.4, 3);
  ctx.fill();

  ctx.restore();
}

function drawBullet(b) {
  ctx.save();
  ctx.shadowColor = '#ffe066';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffe066';
  rrect(b.x - b.w / 2, b.y, b.w, b.h, 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawHUD() {
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 17px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 12);

  ctx.fillStyle = '#f39c12';
  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${highScore}`, W / 2, 12);

  ctx.fillStyle = '#e74c3c';
  ctx.textAlign = 'right';
  ctx.fillText('♥ '.repeat(lives).trim(), W - 14, 12);

  ctx.fillStyle = '#9b59b6';
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL ${level}`, W / 2, 35);

  // Kill progress bar
  const bx = W / 2 - 50, by = 52;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  rrect(bx, by, 100, 6, 3); ctx.fill();
  ctx.fillStyle = '#9b59b6';
  rrect(bx, by, 100 * (killCount / KILLS_PER_LVL), 6, 3); ctx.fill();
}

function drawOverlay(title, titleColor, lines, footer) {
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = titleColor;
  ctx.font = 'bold 54px monospace';
  ctx.fillText(title, W / 2, H / 2 - 100);

  lines.forEach((l, i) => {
    ctx.fillStyle = l.c || '#f8f8f0';
    ctx.font = '21px monospace';
    ctx.fillText(l.t, W / 2, H / 2 - 20 + i * 42);
  });

  if (footer) {
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 19px monospace';
    ctx.fillText(footer, W / 2, H / 2 + 140);
  }
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function gameLoop() {
  drawBg();

  if (state === 'start') {
    drawOverlay('DICE INVADERS', '#f8f8f0', [
      { t: '← → Arrow Keys to move',     c: '#2ecc71' },
      { t: 'Enter or Space to shoot',     c: '#2ecc71' },
      { t: 'Score = die face value  (1–6)', c: '#f39c12' },
      { t: highScore ? `High Score: ${highScore}` : '', c: '#9b59b6' }
    ], 'Press Enter to Start');

  } else {
    if (state === 'playing') update();

    dice.forEach(drawDie);
    bullets.forEach(drawBullet);
    drawParticles();
    drawGun(gunX);
    drawHUD();

    if (state === 'over') {
      const newBest = score > 0 && score === highScore;
      drawOverlay('GAME OVER', '#e74c3c', [
        { t: `Score: ${score}` },
        { t: newBest ? '★  NEW HIGH SCORE  ★' : `Best: ${highScore}`, c: newBest ? '#f39c12' : '#9b59b6' },
        { t: `Level reached: ${level}` }
      ], 'Press Enter to Play Again');
    }

    if (state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f8f8f0';
      ctx.font = 'bold 46px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', W / 2, H / 2);
      ctx.fillStyle = '#aaa';
      ctx.font = '18px monospace';
      ctx.fillText('P to continue', W / 2, H / 2 + 55);
    }
  }

  requestAnimationFrame(gameLoop);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
state = 'start';
requestAnimationFrame(gameLoop);
