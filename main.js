// main.js — Peaches & Cream Core v3.2

let store       = {};
let charName    = '{{char}}';
let userName    = '{{user}}';
let charDesc    = '';
let userPersona = '';
let generate    = null;
let generateWithRole = null;
let getChat     = null;
let getChatRange= null;
let saveStore   = null;
let refreshPrompt = null;
let charKey     = 'default';

function initBridge() {
  const p = window.parent;
  if (!p) return;
  store         = p.__PC_STORE__          || {};
  charName      = p.__PC_CHAR__           || '{{char}}';
  userName      = p.__PC_USER__           || '{{user}}';
  charDesc      = p.__PC_CHAR_DESC__      || '';
  userPersona   = p.__PC_USER_PERSONA__   || '';
  generate      = p.__PC_GENERATE__       || null;
  generateWithRole = p.__PC_GENERATE__    || null;
  getChat       = p.__PC_GET_CHAT__       || null;
  getChatRange  = p.__PC_GET_CHAT_RANGE__ || null;
  saveStore     = p.__PC_SAVE__           || null;
  refreshPrompt = p.__PC_REFRESH_PROMPT__ || null;
  charKey       = p.__PC_CHAR_KEY__       || 'default';
}

window.__PC_ON_BRIDGE__ = function() {
  initBridge();
  window.saveStore     = saveStore;
  window.refreshPrompt = refreshPrompt;
  router.init();
};

const SCREENS = {
  'home':             () => import('./screens/home.js').then(m => m.render()),
  'profile':          () => import('./screens/profile.js').then(m => m.render()),
  'toolbar-settings': () => import('./screens/toolbar-settings.js').then(m => m.render()),
  'sfw-settings':     () => import('./screens/sfw-settings.js').then(m => m.render()),
};

const TOPBAR_LABELS = {
  'home':             '🍑 Peaches & Cream Core',
  'profile':          'Profile',
  'toolbar-settings': 'NSFW 태그 관리',
  'sfw-settings':     'SFW 태그 관리',
};

const BACK_MAP = {
  'profile':          'home',
  'toolbar-settings': 'home',
  'sfw-settings':     'home',
};

const router = {
  current: 'home',
  init() { initBridge(); this.go('home'); },
  go(screenId) {
    this.current = screenId;
    document.querySelectorAll('.save-bar, .tab-bar').forEach(el => el.remove());
    const areaReset = document.getElementById('scroll-area');
    if (areaReset) { areaReset.style.padding=''; areaReset.style.background=''; }
    this._updateTopbar(screenId);
    const area = document.getElementById('scroll-area');
    area.innerHTML = '<div class="loading-card" style="margin:20px 16px;"><div class="sp"></div><span class="loading-text">로딩 중...</span></div>';
    area.scrollTop = 0;
    const fn = SCREENS[screenId];
    if (fn) fn().catch(err => {
      console.error('[PC] screen load error', err);
      area.innerHTML = '<div style="padding:20px;color:#c03020;">화면 로딩 실패</div>';
    });
  },
  _updateTopbar(id) {
    const left   = document.getElementById('topbar-left');
    const center = document.getElementById('topbar-center');
    const right  = document.getElementById('topbar-right');
    right.innerHTML = '<button class="close-btn" onclick="closeApp()">✕</button>';
    if (id === 'home') {
      left.innerHTML   = '';
      center.innerHTML = `<span class="topbar-title">${TOPBAR_LABELS[id]}</span>`;
    } else {
      const backTo = BACK_MAP[id] || 'home';
      left.innerHTML   = `<button class="back-btn" onclick="router.go('${backTo}')">← 홈</button>`;
      center.innerHTML = `<span class="topbar-title">${TOPBAR_LABELS[id]||id}</span>`;
    }
  }
};

function closeApp() {
  if (window.parent && window.parent.__PC_CLOSE__) window.parent.__PC_CLOSE__();
  else window.close();
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>');
}

function showToast(msg) {
  const t = document.getElementById('save-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function showModal({ title, desc, confirmText='확인', onConfirm, danger=false }) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent  = desc;
  const confirmBtn = document.getElementById('modal-confirm');
  confirmBtn.textContent = confirmText;
  confirmBtn.style.background = danger ? '#c03020' : '#000';
  overlay.classList.add('show');
  document.getElementById('modal-cancel').onclick  = () => overlay.classList.remove('show');
  confirmBtn.onclick = () => { overlay.classList.remove('show'); if (onConfirm) onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };
}

function doSave(fn) {
  if (fn) fn();
  if (saveStore) saveStore();
  if (refreshPrompt) refreshPrompt();
  showToast('저장됐어요 ✓');
  const btn = document.querySelector('.save-btn');
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = '저장됐어요 ✓';
    btn.style.background = '#2a7a40';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1500);
  }
}

function syncStore() {
  if (window.parent && window.parent.__PC_STORE__) store = window.parent.__PC_STORE__;
}

function getRecentChat(limit) {
  return getChat ? getChat(limit || 20) : [];
}

if (window.parent && window.parent.__PC_STORE__) {
  router.init();
}
