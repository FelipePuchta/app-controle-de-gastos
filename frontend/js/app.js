/* ===== FINTRACK SHARED UTILITIES ===== */

const API = 'http://127.0.0.1:8000';

const CAT_COLORS = [
  '#f5c518','#ff6b35','#4ecdc4','#a29bfe',
  '#ff8b94','#00b894','#e17055','#74b9ff',
  '#fd79a8','#55efc4'
];

const CAT_ICONS = {
  'alimentação':'🍽️','comida':'🍔','mercado':'🛒',
  'transporte':'🚗','uber':'🚕','combustível':'⛽',
  'saúde':'💊','médico':'🏥','farmácia':'💉',
  'lazer':'🎮','entretenimento':'🎬','streaming':'📺',
  'educação':'📚','curso':'🎓','livro':'📖',
  'moradia':'🏠','aluguel':'🏘️','contas':'💡',
  'roupa':'👕','moda':'👗','sapato':'👟',
  'viagem':'✈️','hotel':'🏨',
  'tecnologia':'💻','celular':'📱',
  'pet':'🐾','animal':'🐕',
  'presente':'🎁','gift':'🎀',
  'academia':'🏋️','esporte':'⚽',
  'outros':'📦','geral':'💰','misc':'📋'
};

function getCatIcon(nome) {
  if (!nome) return '💰';
  const n = nome.toLowerCase();
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (n.includes(key)) return icon;
  }
  return '💰';
}

function getCatColor(index) {
  return CAT_COLORS[index % CAT_COLORS.length];
}

// ===== THEME =====
const THEME_KEY = 'fintrack_theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

// ===== API CALLS =====
async function apiFetch(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000)
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  getGastos:           ()        => apiFetch('GET',    '/gastos'),
  postGasto:           (data)    => apiFetch('POST',   '/gastos', data),
  putGasto:            (id,data) => apiFetch('PUT',    `/gastos/${id}`, data),
  deleteGasto:         (id)      => apiFetch('DELETE', `/gastos/${id}`),
  getCategorias:       ()        => apiFetch('GET',    '/categorias'),
  getGastosMes:        (m,y)     => apiFetch('GET',    `/gastos/mes/${m}/${y}`),
  getGastosCategoria:  (id)      => apiFetch('GET',    `/gastos/categoria/${id}`),
  getTotalCategoria:   ()        => apiFetch('GET',    '/gastos/total/categoria'),
  getTotalMes:         (m,y)     => apiFetch('GET',    `/gastos/total/mes/${m}/${y}`),
};

// ===== API STATUS =====
let statusInterval;

async function checkStatus() {
  const el = document.getElementById('apiStatus');
  if (!el) return;
  el.className = 'api-status checking';
  el.innerHTML = '<span class="api-dot"></span>Verificando';
  try {
    await fetch(API + '/categorias', { signal: AbortSignal.timeout(3000) });
    el.className = 'api-status online';
    el.innerHTML = '<span class="api-dot"></span>Online';
  } catch {
    el.className = 'api-status offline';
    el.innerHTML = '<span class="api-dot"></span>Offline';
  }
}

// ===== TOAST =====
let toastTimeout;
function toast(msg, type = 'success') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast ${type}`;
  clearTimeout(toastTimeout);
  requestAnimationFrame(() => {
    el.classList.add('show');
    toastTimeout = setTimeout(() => el.classList.remove('show'), 2800);
  });
}

// ===== FORMAT =====
function fmtBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);
}

function fmtDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtDateShort(d) {
  if (!d) return '';
  const [,m,day] = d.split('-');
  return `${day}/${m}`;
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ===== COUNTER ANIMATION =====
function animateCount(el, to, duration = 1200, isCurrency = true) {
  const start = performance.now();
  const from = 0;
  const ease = t => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const p = ease(Math.min((now - start) / duration, 1));
    const v = from + (to - from) * p;
    el.textContent = isCurrency ? fmtBRL(v) : Math.round(v).toString();
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ===== PARTICLES =====
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [], frame;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkPt() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
      r: Math.random() * 1.6 + .4,
      a: Math.random() * .45 + .05,
      c: Math.random() > .72 ? '#f5c518' : '#ffffff',
      life: 0, max: Math.random() * 280 + 160
    };
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach((p, i) => {
      p.life++; p.x += p.vx; p.y += p.vy;
      const t = p.life / p.max;
      const fade = Math.min(t / .12, 1) * Math.min((1 - t) / .15, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = p.a * fade;
      ctx.fill();
      if (p.life >= p.max || p.x < -10 || p.x > W+10 || p.y < -10 || p.y > H+10)
        pts[i] = mkPt();
    });
    // connections
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 85) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = '#f5c518';
          ctx.globalAlpha = (1 - d/85) * .06;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(tick);
  }

  resize();
  pts = Array.from({ length: 70 }, mkPt);
  window.addEventListener('resize', resize);
  tick();
}

// ===== SCROLL REVEAL =====
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ===== SWIPE NAV =====
const NAV_PAGES = ['index.html','dashboard.html','gastos.html','adicionar.html','categorias.html'];

function initSwipeNav() {
  let x0 = 0, y0 = 0;
  document.addEventListener('touchstart', e => {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
      const cur = window.location.pathname.split('/').pop() || 'index.html';
      const idx = NAV_PAGES.indexOf(cur);
      if (idx === -1) return;
      if (dx < 0 && idx < NAV_PAGES.length - 1) pageGo(NAV_PAGES[idx + 1]);
      else if (dx > 0 && idx > 0) pageGo(NAV_PAGES[idx - 1]);
    }
  }, { passive: true });
}

function pageGo(href) {
  document.body.style.cssText = 'opacity:0;transform:translateX(-16px);transition:all 0.28s ease;';
  setTimeout(() => { window.location.href = href; }, 280);
}

// ===== PIE CHART =====
class PieChart {
  constructor(canvasId, data) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.data = data;
    this.progress = 0;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width - 32, 260);
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);
    this.size = size;
  }

  draw() {
    const { ctx, data, progress, size } = this;
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2, cy = size / 2, r = size / 2 - 12;
    const total = data.reduce((s, d) => s + d.total, 0);
    if (!total) return;

    let start = -Math.PI / 2;
    data.forEach((item, i) => {
      const angle = (item.total / total) * Math.PI * 2 * progress;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = CAT_COLORS[i % CAT_COLORS.length];
      ctx.fill();
      start += angle;
    });

    // Donut
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0a0a';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();

    // Center text
    if (progress > 0.9) {
      const alpha = (progress - 0.9) / 0.1;
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || 'rgba(255,255,255,0.5)';
      ctx.font = `600 11px Inter`;
      ctx.fillText('TOTAL', cx, cy - 8);
      ctx.fillStyle = '#f5c518';
      ctx.font = `700 15px Inter`;
      ctx.fillText(fmtBRL(total), cx, cy + 12);
      ctx.globalAlpha = 1;
    }
  }

  animate() {
    if (!this.canvas) return;
    const start = performance.now();
    const dur = 1100;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const frame = now => {
      this.progress = ease(Math.min((now - start) / dur, 1));
      this.draw();
      if (this.progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

// ===== LINE CHART =====
class LineChart {
  constructor(canvasId, labels, values) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.labels = labels;
    this.values = values;
    this.progress = 0;
    this.setup();
  }

  setup() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width - 32;
    const h = 180;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.W = w; this.H = h;
  }

  draw() {
    const { ctx, labels, values, progress, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    if (!values.length) return;

    const pad = { top: 16, right: 16, bottom: 28, left: 48 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const max = Math.max(...values) * 1.1 || 100;
    const n = values.length;

    const xOf = i => pad.left + (i / (n - 1)) * chartW;
    const yOf = v => pad.top + chartH - (v / max) * chartH;

    // Grid
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    [0, .25, .5, .75, 1].forEach(t => {
      const y = pad.top + chartH * (1 - t);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || 'rgba(255,255,255,0.5)';
      ctx.font = '10px Inter'; ctx.textAlign = 'right';
      ctx.fillText(fmtBRL(max * t).replace('R$','').trim(), pad.left - 4, y + 4);
    });

    // Points to draw (animated)
    const pts = values.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
    const drawCount = Math.ceil(pts.length * progress);
    if (drawCount < 2) return;
    const visible = pts.slice(0, drawCount);

    // Fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, 'rgba(245,197,24,0.3)');
    grad.addColorStop(1, 'rgba(245,197,24,0)');
    ctx.beginPath();
    ctx.moveTo(visible[0].x, yOf(0));
    visible.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(visible[visible.length-1].x, yOf(0));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(visible[0].x, visible[0].y);
    visible.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#f5c518';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots
    visible.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f5c518';
      ctx.fill();
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0a0a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Labels
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
    ctx.font = '10px Inter'; ctx.textAlign = 'center';
    labels.slice(0, drawCount).forEach((l, i) => {
      ctx.fillText(l, xOf(i), H - 6);
    });
  }

  animate() {
    if (!this.canvas) return;
    const start = performance.now();
    const dur = 1200;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const frame = now => {
      this.progress = ease(Math.min((now - start) / dur, 1));
      this.draw();
      if (this.progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

// ===== BAR CHART =====
class BarChart {
  constructor(canvasId, labels, values) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.labels = labels;
    this.values = values;
    this.progress = 0;
    this.setup();
  }

  setup() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width - 32;
    const h = 180;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.W = w; this.H = h;
  }

  draw() {
    const { ctx, labels, values, progress, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    if (!values.length) return;
    const pad = { top: 10, right: 10, bottom: 28, left: 10 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const max = Math.max(...values) * 1.1 || 100;
    const n = values.length;
    const barW = chartW / n * 0.65;
    const gap = chartW / n;

    values.forEach((v, i) => {
      const barH = (v / max) * chartH * progress;
      const x = pad.left + gap * i + (gap - barW) / 2;
      const y = pad.top + chartH - barH;
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, CAT_COLORS[i % CAT_COLORS.length]);
      grad.addColorStop(1, CAT_COLORS[i % CAT_COLORS.length] + '88');
      ctx.fillStyle = grad;
      const rr = Math.min(6, barW / 2);
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [rr, rr, 0, 0]);
      ctx.fill();
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
      ctx.font = '10px Inter'; ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2, H - 8);
    });
  }

  animate() {
    if (!this.canvas) return;
    const start = performance.now();
    const dur = 1000;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const frame = now => {
      this.progress = ease(Math.min((now - start) / dur, 1));
      this.draw();
      if (this.progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

// ===== BACK BUTTON =====
function initBack() {
  const btn = document.getElementById('backBtn');
  if (btn) btn.addEventListener('click', () => pageGo('index.html'));
}

// ===== ACTIVE NAV =====
function initNav() {
  const cur = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    if (item.dataset.page === cur) item.classList.add('active');
  });
}

// ===== SERVICE WORKER =====
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../service-worker.js').catch(() => {
      // SW registration optional — fail silently
    });
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getTheme());
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  initParticles();
  initReveal();
  initSwipeNav();
  initBack();
  initNav();
  checkStatus();
  statusInterval = setInterval(checkStatus, 30000);
  document.body.classList.add('page-in');
  registerSW();
});
