/* FinTrack — _shared.js — camada de dados + utilitários */

/* ---------- Splash screen (uma vez por sessão) ---------- */
(function () {
  if (sessionStorage.getItem('ft-splash')) return;
  sessionStorage.setItem('ft-splash', '1');
  const el = document.createElement('div');
  el.id = 'ft-splash';
  el.innerHTML = '<div class="s-mark">F</div><div class="s-name">FINTRACK</div><div class="s-bar"></div>';
  document.body.prepend(el);
  el.addEventListener('animationend', (e) => { if (e.animationName === 'splash-out') el.remove(); });
})();

(function () {
  'use strict';

  const API_BASE = 'https://harmonious-unity-production-e26f.up.railway.app';

  /* ---------- Metadados das categorias ---------- */
  const CAT_META = {
    alimentacao: { cor: 'var(--cat-alimentacao)', hex: '#E17055' },
    transporte:  { cor: 'var(--cat-transporte)',  hex: '#00CEC9' },
    lazer:       { cor: 'var(--cat-lazer)',       hex: '#FDCB6E' },
    moradia:     { cor: 'var(--cat-moradia)',     hex: '#6C5CE7' },
    saude:       { cor: 'var(--cat-saude)',       hex: '#00B894' },
    educacao:    { cor: 'var(--cat-educacao)',    hex: '#E84393' },
    outros:      { cor: 'var(--cat-outros)',      hex: '#74B9FF' },
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

  let usingDemo = false;
  const isDemo = () => usingDemo;

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
    CAT_META, CAT_DEFAULT, MESES, MESES_LONGO,
    getGastos, addGasto, updateGasto, deleteGasto, getCategorias,
    metaForCategoria, buildCatMap, normKey,
    formatBRL, formatData, mesAnoDe,
    isDemo,
  };
})();
