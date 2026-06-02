/* FinTrack — _shared.js — camada de dados + utilitários */

/* ---------- Splash screen (uma vez por sessão) ---------- */
(function () {
  if (sessionStorage.getItem('ft-splash')) return;
  sessionStorage.setItem('ft-splash', '1');
  const el = document.createElement('div');
  el.id = 'ft-splash';
  el.innerHTML = '<div class="s-word"><span class="s-fin">Fin</span><span class="s-track">Track</span></div><div class="s-bar"></div>';
  document.body.prepend(el);
  el.addEventListener('animationend', (e) => { if (e.animationName === 'splash-out') el.remove(); });
})();

(function () {
  'use strict';

  const API_BASE = 'https://harmonious-unity-production-e26f.up.railway.app';

  /* ---------- Ícones SVG das categorias ---------- */
  const CAT_ICONS = {
    alimentacao: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2"/><line x1="5" y1="11" x2="5" y2="22"/><path d="M20 2l-3 9h3"/><line x1="19" y1="11" x2="19" y2="22"/></svg>`,
    transporte:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    lazer:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="17" y1="10" x2="17.01" y2="10"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`,
    moradia:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    saude:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    educacao:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    outros:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></svg>`,
  };

  function iconForCategoria(nome) {
    return CAT_ICONS[normKey(nome)] || CAT_ICONS.outros;
  }

  /* ---------- Metadados das categorias ---------- */
  const CAT_META = {
    alimentacao: { cor: 'var(--cat-alimentacao)', hex: '#EF4444' },
    transporte:  { cor: 'var(--cat-transporte)',  hex: '#3B82F6' },
    lazer:       { cor: 'var(--cat-lazer)',       hex: '#F97316' },
    moradia:     { cor: 'var(--cat-moradia)',     hex: '#8B5CF6' },
    saude:       { cor: 'var(--cat-saude)',       hex: '#06B6D4' },
    educacao:    { cor: 'var(--cat-educacao)',    hex: '#EC4899' },
    outros:      { cor: 'var(--cat-outros)',      hex: '#6B7280' },
  };

  const CAT_DEFAULT = [
    { id: 1, nome: 'Alimentação' },
    { id: 2, nome: 'Transporte' },
    { id: 3, nome: 'Lazer' },
    { id: 4, nome: 'Moradia' },
    { id: 5, nome: 'Saúde' },
    { id: 6, nome: 'Educação' },
    { id: 7, nome: 'Outros' },
  ];

  function demoGastos() {
    const hoje = new Date();
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const d = (n) => `${y}-${m}-${String(n).padStart(2, '0')}`;
    return [
      { id: 1,  descricao: 'Mercado da semana',    valor: 287.4,  data: d(3),  categoria_id: 1 },
      { id: 2,  descricao: 'Combustível',           valor: 210.0,  data: d(4),  categoria_id: 2 },
      { id: 3,  descricao: 'Cinema com amigos',     valor: 68.0,   data: d(6),  categoria_id: 3 },
      { id: 4,  descricao: 'Aluguel',               valor: 1450.0, data: d(5),  categoria_id: 4 },
      { id: 5,  descricao: 'Farmácia',              valor: 92.3,   data: d(8),  categoria_id: 5 },
      { id: 6,  descricao: 'Curso online',          valor: 149.9,  data: d(9),  categoria_id: 6 },
      { id: 7,  descricao: 'Café da manhã',         valor: 24.5,   data: d(10), categoria_id: 1 },
      { id: 8,  descricao: 'Uber centro',           valor: 31.8,   data: d(11), categoria_id: 2 },
      { id: 9,  descricao: 'Assinatura streaming',  valor: 39.9,   data: d(12), categoria_id: 3 },
      { id: 10, descricao: 'Conta de luz',          valor: 178.6,  data: d(13), categoria_id: 4 },
      { id: 11, descricao: 'Jantar restaurante',    valor: 134.0,  data: d(15), categoria_id: 1 },
      { id: 12, descricao: 'Material escolar',      valor: 56.2,   data: d(16), categoria_id: 6 },
    ];
  }

  /* ---------- Auth ---------- */
  const auth = {
    getToken: () => localStorage.getItem('ft-token'),
    getUser:  () => { try { return JSON.parse(localStorage.getItem('ft-user')); } catch { return null; } },
    setSession(token, nome) {
      localStorage.setItem('ft-token', token);
      localStorage.setItem('ft-user', JSON.stringify({ nome }));
    },
    logout() {
      localStorage.removeItem('ft-token');
      localStorage.removeItem('ft-user');
      window.location.href = 'login.html';
    },
  };

  function requireAuth() {
    if (!localStorage.getItem('ft-token')) {
      window.location.href = 'login.html';
      return;
    }
    document.addEventListener('DOMContentLoaded', () => {
      const header = document.querySelector('.l-header');
      if (!header) return;
      const btn = document.createElement('button');
      btn.textContent = 'SAIR';
      btn.style.cssText = 'background:none;border:none;color:rgba(255,255,255,0.28);font:600 10px/1 Sora,sans-serif;letter-spacing:.14em;cursor:pointer;padding:0;';
      btn.onmouseenter = () => { btn.style.color = 'rgba(255,255,255,0.65)'; };
      btn.onmouseleave = () => { btn.style.color = 'rgba(255,255,255,0.28)'; };
      btn.onclick = auth.logout;
      header.appendChild(btn);
    });
  }

  let usingDemo = false;
  const isDemo = () => usingDemo;

  async function api(path, options = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const token = auth.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
      const res = await fetch(API_BASE + path, {
        headers,
        signal: ctrl.signal,
        ...options,
      });
      clearTimeout(t);
      if (res.status === 401) {
        auth.logout();
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const txt = await res.text();
      return txt ? JSON.parse(txt) : null;
    } catch (err) {
      clearTimeout(t);
      throw err;
    }
  }

  async function getGastos() {
    const estaLogado = !!auth.getToken();
    try {
      const data = await api('/gastos');
      usingDemo = false;
      return Array.isArray(data) ? data : (data?.gastos || []);
    } catch (e) {
      if (estaLogado) return [];
      usingDemo = true;
      return demoGastos();
    }
  }

  async function addGasto(gasto) {
    try {
      return await api('/gastos', { method: 'POST', body: JSON.stringify(gasto) });
    } catch (e) {
      usingDemo = true;
      return { ...gasto, id: Date.now() };
    }
  }

  async function updateGasto(id, gasto) {
    try {
      return await api('/gastos/' + id, { method: 'PUT', body: JSON.stringify(gasto) });
    } catch (e) {
      usingDemo = true;
      return { ...gasto, id };
    }
  }

  async function deleteGasto(id) {
    try {
      await api('/gastos/' + id, { method: 'DELETE' });
      return true;
    } catch (e) {
      usingDemo = true;
      return true;
    }
  }

  async function getCategorias() {
    try {
      const data = await api('/categorias');
      const list = Array.isArray(data) ? data : (data?.categorias || []);
      usingDemo = false;
      return list.length ? list : CAT_DEFAULT;
    } catch (e) {
      usingDemo = true;
      return CAT_DEFAULT;
    }
  }

  function normKey(nome) {
    return String(nome || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z]/g, '');
  }

  function metaForCategoria(nome) {
    return CAT_META[normKey(nome)] || { cor: 'var(--cat-outros)', hex: '#74B9FF' };
  }

  function buildCatMap(categorias) {
    const map = {};
    (categorias || CAT_DEFAULT).forEach((c) => {
      map[c.id] = { ...c, ...metaForCategoria(c.nome) };
    });
    return map;
  }

  function formatBRL(v) {
    const n = Number(v) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatData(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = String(dataStr).split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  }

  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const MESES_LONGO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  function mesAnoDe(dataStr) {
    const [ano, mes] = String(dataStr).split('T')[0].split('-');
    return { mes: parseInt(mes, 10), ano: parseInt(ano, 10) };
  }

  window.FinTrack = {
    API_BASE,
    CAT_META, CAT_ICONS, CAT_DEFAULT, MESES, MESES_LONGO,
    getGastos, addGasto, updateGasto, deleteGasto, getCategorias,
    metaForCategoria, buildCatMap, normKey, iconForCategoria,
    formatBRL, formatData, mesAnoDe,
    isDemo, auth, requireAuth,
  };
})();
