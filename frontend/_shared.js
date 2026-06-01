/* =====================================================================
   FinTrack — _shared.js
   Camada de dados (API) + categorias + utilitários compartilhados.
   ---------------------------------------------------------------------
   Estratégia: tentamos a API real (Railway). Se a rede/CORS falhar,
   usamos dados de demonstração para que a interface continue navegável.
   O objeto global window.FinTrack expõe tudo que as páginas precisam.
   ===================================================================== */

/* ---------- Tema (dark/light) ---------- */
(function () {
  const saved = localStorage.getItem('ft-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

(function () {
  'use strict';

  const API_BASE = 'https://harmonious-unity-production-e26f.up.railway.app';

  /* ---------- Metadados das categorias (ícone + cor) ---------- */
  const CAT_META = {
    alimentacao: { emoji: '🍔', cor: 'var(--cat-alimentacao)', hex: '#FF4757' },
    transporte:  { emoji: '🚗', cor: 'var(--cat-transporte)',  hex: '#2ED573' },
    lazer:       { emoji: '🎮', cor: 'var(--cat-lazer)',       hex: '#FFA502' },
    moradia:     { emoji: '🏠', cor: 'var(--cat-moradia)',     hex: '#1E90FF' },
    saude:       { emoji: '💊', cor: 'var(--cat-saude)',       hex: '#FF6B81' },
    educacao:    { emoji: '📚', cor: 'var(--cat-educacao)',    hex: '#A55EEA' },
    outros:      { emoji: '📦', cor: 'var(--cat-outros)',      hex: '#ECCC68' },
  };

  /* Lista padrão de categorias (fallback e ordem visual) */
  const CAT_DEFAULT = [
    { id: 1, nome: 'Alimentação' },
    { id: 2, nome: 'Transporte' },
    { id: 3, nome: 'Lazer' },
    { id: 4, nome: 'Moradia' },
    { id: 5, nome: 'Saúde' },
    { id: 6, nome: 'Educação' },
    { id: 7, nome: 'Outros' },
  ];

  /* Dados de demonstração (usados quando a API está inacessível) */
  function demoGastos() {
    const hoje = new Date();
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const d = (n) => `${y}-${m}-${String(n).padStart(2, '0')}`;
    return [
      { id: 1,  descricao: 'Mercado da semana',     valor: 287.4,  data: d(3),  categoria_id: 1 },
      { id: 2,  descricao: 'Combustível',            valor: 210.0,  data: d(4),  categoria_id: 2 },
      { id: 3,  descricao: 'Cinema com amigos',      valor: 68.0,   data: d(6),  categoria_id: 3 },
      { id: 4,  descricao: 'Aluguel',                valor: 1450.0, data: d(5),  categoria_id: 4 },
      { id: 5,  descricao: 'Farmácia',               valor: 92.3,   data: d(8),  categoria_id: 5 },
      { id: 6,  descricao: 'Curso online',           valor: 149.9,  data: d(9),  categoria_id: 6 },
      { id: 7,  descricao: 'Café da manhã padaria',  valor: 24.5,   data: d(10), categoria_id: 1 },
      { id: 8,  descricao: 'Uber centro',            valor: 31.8,   data: d(11), categoria_id: 2 },
      { id: 9,  descricao: 'Assinatura streaming',   valor: 39.9,   data: d(12), categoria_id: 3 },
      { id: 10, descricao: 'Conta de luz',           valor: 178.6,  data: d(13), categoria_id: 4 },
      { id: 11, descricao: 'Jantar restaurante',     valor: 134.0,  data: d(15), categoria_id: 1 },
      { id: 12, descricao: 'Material escolar',       valor: 56.2,   data: d(16), categoria_id: 6 },
    ];
  }

  let usingDemo = false;
  const isDemo = () => usingDemo;

  /* ---------- Helper de fetch com timeout ---------- */
  async function api(path, options = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    try {
      const res = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        ...options,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const txt = await res.text();
      return txt ? JSON.parse(txt) : null;
    } catch (err) {
      clearTimeout(t);
      throw err;
    }
  }

  /* ---------- Operações de gastos ---------- */
  async function getGastos() {
    try {
      const data = await api('/gastos');
      usingDemo = false;
      return Array.isArray(data) ? data : (data?.gastos || []);
    } catch (e) {
      usingDemo = true;
      return demoGastos();
    }
  }

  async function addGasto(gasto) {
    try {
      return await api('/gastos', { method: 'POST', body: JSON.stringify(gasto) });
    } catch (e) {
      usingDemo = true;
      // Em modo demo, devolvemos o objeto como se tivesse sido salvo.
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

  /* ---------- Utilitários ---------- */

  // Normaliza nome de categoria -> chave de CAT_META (sem acento/minúsculo)
  function normKey(nome) {
    return String(nome || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
  }

  function metaForCategoria(nome) {
    return CAT_META[normKey(nome)] || { emoji: '📦', cor: 'var(--cat-outros)', hex: '#5a7d6a' };
  }

  // Constrói mapa id -> {nome, emoji, cor, hex}
  function buildCatMap(categorias) {
    const map = {};
    (categorias || CAT_DEFAULT).forEach((c) => {
      map[c.id] = { ...c, ...metaForCategoria(c.nome) };
    });
    return map;
  }

  // Formata moeda em Real brasileiro
  function formatBRL(v) {
    const n = Number(v) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Formata data evitando bug de fuso horário (padrão pedido no brief)
  function formatData(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = String(dataStr).split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // Nome curto do mês a partir de "YYYY-MM-DD"
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const MESES_LONGO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  function mesAnoDe(dataStr) {
    const [ano, mes] = String(dataStr).split('T')[0].split('-');
    return { mes: parseInt(mes, 10), ano: parseInt(ano, 10) };
  }

  /* ---------- Exporta tudo ---------- */
  window.FinTrack = {
    API_BASE,
    CAT_META, CAT_DEFAULT, MESES, MESES_LONGO,
    getGastos, addGasto, updateGasto, deleteGasto, getCategorias,
    metaForCategoria, buildCatMap, normKey,
    formatBRL, formatData, mesAnoDe,
    isDemo,
  };

  /* ---------- Toggle dark/light ---------- */
  function themeIcon(t) { return t === 'dark' ? '☀️' : '🌙'; }

  function injectThemeToggle() {
    const topbar = document.querySelector('.topbar');
    if (!topbar || document.getElementById('theme-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-btn';
    btn.setAttribute('aria-label', 'Alternar tema');
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    btn.textContent = themeIcon(cur);
    btn.onclick = () => {
      const next = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ft-theme', next);
      btn.textContent = themeIcon(next);
    };
    topbar.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectThemeToggle);
  } else {
    injectThemeToggle();
  }
})();