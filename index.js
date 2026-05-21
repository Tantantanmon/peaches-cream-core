// index.js — Peaches & Cream Core v3.3
const MODULE_NAME  = 'peaches-cream-core';
const DATA_VERSION = '3.3';

function ctx() { return SillyTavern.getContext(); }
function isMobile() {
  try { return window.matchMedia('(max-width:430px),(pointer:coarse)').matches; }
  catch { return window.innerWidth <= 430; }
}
function getCharKey() {
  try {
    const c = ctx();
    const avatar = c?.characters?.[c?.characterId]?.avatar?.replace(/\.[^/.]+$/, '')
                || c?.characters?.[c?.characterId]?.filename?.replace(/\.[^/.]+$/, '');
    const name = c?.name2 || c?.characters?.[c?.characterId]?.name || 'default';
    return (avatar ? `${name}_${avatar}` : name).replace(/[^a-zA-Z0-9가-힣]/g, '_');
  } catch(e) { return 'default'; }
}

const defaultCharData = {
  userBody:'', userMarks:'', userErogenous:'',
  charBody:'', charMarks:'', charErogenous:'',
};

const defaultGlobalConfig = {
  maxTokens: 1500,
  toolbarEnabled: false,
  // NSFW
  customTags: { sfw:[], mood:[], foreplay:[], position:[], action:[], finish:[], orgasm:[], fetish:[] },
  deletedTags:{}, deletedGroups:[], customGroups:[],
  favoriteTags:[], favoriteTabEnabled:false, tbGroupOrder:[],
  condomState:'',
  recentCombos:[], savedCombos:[],
  // SFW
  sfwCustomTags:{}, sfwDeletedTags:{}, sfwDeletedGroups:[], sfwCustomGroups:[],
  sfwFavoriteTags:[], sfwFavoriteTabEnabled:false, sfwGroupOrder:[],
  sfwRecentCombos:[], sfwSavedCombos:[],
};

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════
function getStore() {
  const { extensionSettings } = ctx();
  if (!extensionSettings[MODULE_NAME] || extensionSettings[MODULE_NAME].version !== DATA_VERSION) {
    extensionSettings[MODULE_NAME] = { version:DATA_VERSION, config:JSON.parse(JSON.stringify(defaultGlobalConfig)), chars:{} };
  }
  const s = extensionSettings[MODULE_NAME];
  if (!s.config) s.config = JSON.parse(JSON.stringify(defaultGlobalConfig));
  if (!s.chars)  s.chars  = {};
  Object.keys(defaultGlobalConfig).forEach(k => { if (s.config[k] === undefined) s.config[k] = JSON.parse(JSON.stringify(defaultGlobalConfig[k])); });
  // NSFW
  if (!s.config.customTags)    s.config.customTags    = JSON.parse(JSON.stringify(defaultGlobalConfig.customTags));
  if (!s.config.deletedTags)   s.config.deletedTags   = {};
  if (!s.config.deletedGroups) s.config.deletedGroups = [];
  if (!s.config.customGroups)  s.config.customGroups  = [];
  if (!s.config.favoriteTags)  s.config.favoriteTags  = [];
  if (!s.config.tbGroupOrder)  s.config.tbGroupOrder  = [];
  if (!s.config.recentCombos)  s.config.recentCombos  = [];
  if (!s.config.savedCombos)   s.config.savedCombos   = [];
  // SFW
  if (!s.config.sfwCustomTags)    s.config.sfwCustomTags    = {};
  if (!s.config.sfwDeletedTags)   s.config.sfwDeletedTags   = {};
  if (!s.config.sfwDeletedGroups) s.config.sfwDeletedGroups = [];
  if (!s.config.sfwCustomGroups)  s.config.sfwCustomGroups  = [];
  if (!s.config.sfwFavoriteTags)  s.config.sfwFavoriteTags  = [];
  if (!s.config.sfwGroupOrder)    s.config.sfwGroupOrder    = [];
  if (!s.config.sfwRecentCombos)  s.config.sfwRecentCombos  = [];
  if (!s.config.sfwSavedCombos)   s.config.sfwSavedCombos   = [];
  delete s.config.customTags.tochar;
  return s;
}
function getCharStore() {
  const s = getStore(), key = getCharKey();
  if (!s.chars[key]) s.chars[key] = JSON.parse(JSON.stringify(defaultCharData));
  const cd = s.chars[key];
  Object.keys(defaultCharData).forEach(k => { if (cd[k] === undefined) cd[k] = defaultCharData[k]; });
  return cd;
}
function saveStore() { ctx().saveSettingsDebounced(); }

// ═══════════════════════════════════════════
// 프롬프트 빌더
// ═══════════════════════════════════════════
function buildMainPrompt() {
  const cd = getCharStore(), cname = getCurrentCharName();
  const lines = ['<peaches_and_cream>'];
  if (cd.userBody) lines.push(`<user_body>\nThis describes the user's body. Always incorporate these details naturally in scene descriptions.\n${cd.userBody}\n</user_body>`);
  if (cd.charBody) lines.push(`<char_body name="${cname}">\nThis describes ${cname}'s body.\n${cd.charBody}\n</char_body>`);
  lines.push(`<instruction>
[BODY DATA — ABSOLUTE CANON]
0. 이 프롬프트에 등록된 유저/캐릭터 신체 데이터는 모든 씬에서 반드시 반영된다.
1. 유저 신체 — 외형 묘사는 일상 씬 포함 자연스럽게 반영하라.
2. 캐릭터 신체 — 등록된 신체 묘사를 씬에서 현실적으로 반영하라.
3. 씬 서술 시 캐릭터 행동 + 유저 신체 반응을 반드시 함께 묘사하라.
4. 더티토크는 캐릭터 말투로. 여성혐오 단어 금지.
</instruction>`);
  lines.push('</peaches_and_cream>');
  return lines.join('\n');
}
function buildSexPrompt() {
  const cd = getCharStore(), cname = getCurrentCharName();
  const lines = ['<sex_data>'];
  if (cd.userErogenous) lines.push(`<user_erogenous>\nThis describes the user's erogenous zones and sexual responses.\n${cd.userErogenous}\n</user_erogenous>`);
  if (cd.charErogenous) lines.push(`<char_erogenous name="${cname}">\nThis describes ${cname}'s erogenous zones and sexual responses.\n${cd.charErogenous}\n</char_erogenous>`);
  lines.push('</sex_data>\nREMINDER: 위 데이터는 현재 성적 씬이 진행 중일 때만 활성화된다.');
  return lines.join('\n');
}
function refreshPrompt() {
  try {
    const { setExtensionPrompt } = ctx();
    setExtensionPrompt(MODULE_NAME,          buildMainPrompt(), 3, 0);
    setExtensionPrompt(MODULE_NAME + '_sex', buildSexPrompt(),  1, 2);
  } catch(e) { console.warn(`[${MODULE_NAME}] prompt error`, e); }
}

function getCurrentCharName() { try { return ctx().name2 || '{{char}}'; } catch(e) { return '{{char}}'; } }
function getCurrentUserName()  { try { return ctx().name1 || '{{user}}'; } catch(e) { return '{{user}}'; } }
function getCharDescription() {
  try {
    const c = ctx();
    if (c.characters && c.characterId !== undefined) {
      const ch = c.characters[c.characterId];
      if (ch) return [ch.description, ch.personality, ch.scenario, ch.mes_example].filter(Boolean).join('\n').trim();
    }
    return '';
  } catch(e) { return ''; }
}
function getUserPersona() { try { const c = ctx(); return c.persona || c?.powerUserSettings?.persona_description || ''; } catch(e) { return ''; } }

async function generateWithRole(systemPrompt, userPrompt, appName) {
  const c = ctx(), store = getStore();
  const APP_TOKENS = { redflag:400, clinic:400, reviews:400, offrecord:300, worldfeed:700, blackbox:400, dreamlog:300, apology:300, wanted:600, monologue:500, stash:300, studynotes:300 };
  const tokens = (appName && APP_TOKENS[appName]) ? APP_TOKENS[appName] : (store.config.maxTokens || 1500);
  return await c.generateRaw({ systemPrompt: systemPrompt||'', prompt: userPrompt||'', max_new_tokens: tokens, streaming: false });
}
function getRecentChat(limit) {
  try { const { chat } = ctx(); return (chat||[]).slice(-(limit||10)).map(m => ({ role:m.is_user?'user':'assistant', content:m.mes||'', name:m.name||'' })); }
  catch(e) { return []; }
}
function getChatRange(s, e) {
  try {
    const { chat } = ctx(), arr = chat||[];
    if (!s && !e) return getRecentChat(10);
    const si = s ? Math.max(1,parseInt(s)) : 1, ei = e ? Math.min(arr.length,parseInt(e)) : arr.length;
    return arr.slice(si-1,ei).map(m => ({ role:m.is_user?'user':'assistant', content:m.mes||'', name:m.name||'' }));
  } catch(e) { return getRecentChat(10); }
}

// ═══════════════════════════════════════════
// 툴바 데이터
// ═══════════════════════════════════════════
const TOOLBAR_ID = 'pc-nsfw-toolbar';

// NSFW 고정 그룹/태그
const NSFW_FIXED_TAGS = {
  sfw:      ['Kiss','Hug','Cuddle','Head Pat','Back Hug','Forehead Kiss','Pout','Whisper in Ear'],
  mood:     ['Romantic','Dominant','Bed','Wall','Angry'],
  foreplay: ['Kissing','Fingering','Blowjob','Cunnilingus'],
  position: ['Missionary','Doggy','Cowgirl','Standing'],
  action:   ['Slow','Fast','Rough','Penetrate','Continue'],
  finish:   ['Internal','External','On Body'],
  orgasm:   ['Squirt','Scream'],
  fetish:   ['Tie','Blindfold','Choke','Spank','Hair Pull'],
};
const NSFW_DEFAULT_GROUPS = [
  {id:'sfw',label:'SFW'},{id:'mood',label:'Mood & Place'},
  {id:'foreplay',label:'Foreplay'},{id:'position',label:'Position'},
  {id:'action',label:'Action'},{id:'finish',label:'Finish'},
  {id:'orgasm',label:'Orgasm'},{id:'fetish',label:'Fetish'},
];

// SFW 고정 그룹 (태그 없음)
const SFW_FIXED_TAGS = { daily:[], emotion:[], physical:[] };
const SFW_DEFAULT_GROUPS = [
  {id:'daily',label:'Daily'},
  {id:'emotion',label:'Emotion'},
  {id:'physical',label:'Physical'},
];

const ROLE_OPTIONS = [
  {id:'c2u',label:'C→U'},{id:'u2c',label:'U→C'},
  {id:'c',label:'C'},{id:'u',label:'U'},{id:'none',label:'없음'},
];

// ── 모드 상태 ──
let tbMode        = 'nsfw'; // 'nsfw' | 'sfw'
let tbCollapsed   = false;
let tbEditMode    = false;
let tbActiveGroup = 'sfw';
let tbSelected    = [];
let tbPendingTag  = null;
let dragSrc = null, dragSrcIdx = null;

// ── 모드별 데이터 접근 헬퍼 ──
function isNsfw() { return tbMode === 'nsfw'; }
function getFixedTags(groupId) { return isNsfw() ? (NSFW_FIXED_TAGS[groupId]||[]) : (SFW_FIXED_TAGS[groupId]||[]); }
function getDefaultGroups()    { return isNsfw() ? NSFW_DEFAULT_GROUPS : SFW_DEFAULT_GROUPS; }

function getVisibleGroups() {
  const store  = getStore();
  const order  = isNsfw() ? (store.config.tbGroupOrder||[])    : (store.config.sfwGroupOrder||[]);
  const dg     = isNsfw() ? (store.config.deletedGroups||[])   : (store.config.sfwDeletedGroups||[]);
  const cg     = isNsfw() ? (store.config.customGroups||[])    : (store.config.sfwCustomGroups||[]);
  const defaults = getDefaultGroups().filter(g => !dg.includes(g.id));
  const all    = [...defaults, ...cg];
  if (!order.length) return all;
  return [...order.map(id => all.find(g => g.id===id)).filter(Boolean), ...all.filter(g => !order.includes(g.id))];
}

function getVisibleTags(groupId) {
  const store     = getStore();
  const isDefault = getDefaultGroups().some(g => g.id===groupId);
  const fixed     = getFixedTags(groupId);
  const deleted   = isNsfw() ? (store.config.deletedTags?.[groupId]||[])    : (store.config.sfwDeletedTags?.[groupId]||[]);
  const custom    = isNsfw() ? (store.config.customTags?.[groupId]||[])     : (store.config.sfwCustomTags?.[groupId]||[]);
  const cg        = isNsfw() ? (store.config.customGroups||[]).find(g => g.id===groupId) : (store.config.sfwCustomGroups||[]).find(g => g.id===groupId);
  const base      = isDefault ? fixed.filter(t => !deleted.includes(t)) : (cg?.tags||[]);
  return [...base, ...custom];
}

function getRecentCombos() { const s=getStore(); return isNsfw() ? (s.config.recentCombos||[]) : (s.config.sfwRecentCombos||[]); }
function getSavedCombos()  { const s=getStore(); return isNsfw() ? (s.config.savedCombos||[])  : (s.config.sfwSavedCombos||[]); }
function getFavTags()      { const s=getStore(); return isNsfw() ? (s.config.favoriteTags||[])  : (s.config.sfwFavoriteTags||[]); }
function getFavTabEnabled(){ const s=getStore(); return isNsfw() ? (s.config.favoriteTabEnabled||false) : (s.config.sfwFavoriteTabEnabled||false); }

function pushRecentCombo(combo) {
  const s = getStore();
  if (isNsfw()) { s.config.recentCombos.unshift(combo); s.config.recentCombos = s.config.recentCombos.slice(0,3); }
  else          { s.config.sfwRecentCombos.unshift(combo); s.config.sfwRecentCombos = s.config.sfwRecentCombos.slice(0,3); }
}
function pushSavedCombo(combo) {
  const s = getStore();
  if (isNsfw()) { if (!s.config.savedCombos.some(c => JSON.stringify(c)===JSON.stringify(combo))) s.config.savedCombos.unshift(combo); }
  else          { if (!s.config.sfwSavedCombos.some(c => JSON.stringify(c)===JSON.stringify(combo))) s.config.sfwSavedCombos.unshift(combo); }
}

// ═══════════════════════════════════════════
// CSS 주입
// ═══════════════════════════════════════════
function injectToolbarStyle() {
  document.getElementById('pc-tb-style')?.remove();
  const s = document.createElement('style');
  s.id = 'pc-tb-style';
  s.textContent = `
#${TOOLBAR_ID}{width:100%;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;}
.pc-tb-wrap{background:#fff;border-top:0.5px solid #e8e8e8;}
.pc-tb-wrap.sfw-mode{border-top-color:#b8d8f0;}
.pc-tb-topbar{display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid #ddd;overflow-x:auto;scrollbar-width:none;}
.pc-tb-topbar::-webkit-scrollbar{display:none;}
.sfw-mode .pc-tb-topbar{border-bottom-color:#cce4f4;}
.pc-tb-title{font-size:16px;cursor:pointer;flex-shrink:0;user-select:none;}
.pc-tb-spacer{flex:1;}
.pc-tb-icon-btn{font-size:13px;color:#888;background:none;border:none;cursor:pointer;padding:2px 6px;font-family:inherit;flex-shrink:0;}
.pc-tb-icon-btn:hover{color:#333;}
.pc-tb-icon-btn.edit-on{color:#1a1a1a;font-weight:600;}
.pc-tb-condom{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid #d8d8d8;background:transparent;color:#555;cursor:pointer;transition:all .12s;font-family:inherit;flex-shrink:0;white-space:nowrap;}
.pc-tb-condom.active{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
.pc-tb-collapsible.hidden{display:none;}
.pc-tb-tabs{display:flex;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid #ddd;padding:0 12px;gap:2px;}
.pc-tb-tabs::-webkit-scrollbar{display:none;}
.sfw-mode .pc-tb-tabs{border-bottom-color:#cce4f4;}
.pc-tb-tab{padding:8px 10px;font-size:13px;font-weight:500;color:#555;border:none;background:none;cursor:pointer;white-space:nowrap;border-bottom:3px solid transparent;font-family:inherit;flex-shrink:0;margin-bottom:-1px;transition:color .12s;display:inline-flex;align-items:center;gap:4px;}
.pc-tb-tab:hover{color:#1a1a1a;}
.pc-tb-tab.active{color:#1a1a1a;border-bottom-color:#1a1a1a;}
.sfw-mode .pc-tb-tab.active{color:#2a6a9a;border-bottom-color:#2a6a9a;}
.pc-tb-tab.fav-tab{color:#c8801a;}
.pc-tb-tab.fav-tab.active{color:#a06000;border-bottom-color:#a06000;}
.pc-tb-tab.recent-tab{color:#6a6a8a;}
.pc-tb-tab.recent-tab.active{color:#3a3a6a;border-bottom-color:#3a3a6a;}
.pc-tb-tab-x{font-size:12px;color:#ccc;cursor:pointer;padding:0 1px;transition:color .1s;display:none;}
.pc-tb-tab-x:hover{color:#c03020;}
.edit-mode .pc-tb-tab-x{display:inline;}
.pc-tb-tag-area{display:flex!important;flex-wrap:wrap!important;gap:7px!important;padding:10px 12px 8px;}
.pc-tb-body{}
.pc-tb-tag{padding:6px 13px;border-radius:20px;font-size:13px;font-weight:500;background:#f0f0f4;color:#444;cursor:pointer;border:1px solid #e0e0e6;transition:all .1s;user-select:none;display:inline-flex!important;align-items:center;gap:4px;}
.pc-tb-tag:hover{border-color:#c0c0cc;color:#1a1a1a;}
.pc-tb-tag.active{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}
.sfw-mode .pc-tb-tag.active{background:#2a6a9a;border-color:#2a6a9a;}
.pc-tb-tag.fav-tag{background:#fdf5e0;border-color:#e8d090;color:#7a5a10;}
.pc-tb-tag-x{font-size:12px;color:#bbb;cursor:pointer;padding:0 1px;display:none;transition:color .1s;}
.pc-tb-tag-x:hover{color:#c03020;}
.edit-mode .pc-tb-tag-x{display:inline;}
.pc-tb-add-input{padding:6px 13px;border-radius:20px;font-size:13px;background:#fff;color:#1a1a1a;border:1px solid #e0e0e6;outline:none;font-family:inherit;width:110px;}
.pc-tb-add-input::placeholder{color:#bbb;}
.pc-tb-add-input:focus{border-color:#aaa;}
.pc-tb-mini-popup{display:none;padding:3px 6px;background:#fff;border:1px solid #e0e0e0;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);gap:3px;align-items:center;}
.pc-tb-mini-popup.show{display:inline-flex;}
.pc-tb-mini-role{padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid #e0e0e0;background:#f0f0f4;color:#555;cursor:pointer;font-family:inherit;transition:all .1s;white-space:nowrap;}
.pc-tb-mini-role:hover{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}
.pc-tb-selected-area{padding:4px 12px 8px;display:none;}
.pc-tb-selected-area.show{display:block;}
.pc-tb-selected-label{font-size:11px;color:#aaa;margin-bottom:5px;}
.pc-tb-selected-wrap{display:flex;flex-wrap:wrap;gap:5px;}
.pc-tb-sel-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;font-size:13px;background:#f0f0f4;border:1px solid #e0e0e6;color:#1a1a1a;}
.pc-tb-sel-name{font-weight:500;}
.pc-tb-sel-role{font-size:11px;color:#777;padding:1px 6px;background:#e0e0e6;border-radius:8px;}
.pc-tb-sel-x{font-size:14px;color:#bbb;cursor:pointer;line-height:1;transition:color .1s;}
.pc-tb-sel-x:hover{color:#c03020;}
.pc-tb-combo-card{background:#f8f8fa;border-radius:10px;border:1px solid #e8e8ee;padding:8px 12px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:border-color .1s;}
.pc-tb-combo-card:hover{border-color:#c8c8d8;}
.pc-tb-combo-card:last-child{margin-bottom:0;}
.pc-tb-combo-tags{display:flex;flex-wrap:wrap;gap:4px;flex:1;}
.pc-tb-combo-chip{padding:3px 9px;border-radius:20px;font-size:12px;background:#eaeaf0;border:1px solid #d8d8e4;color:#444;}
.pc-tb-combo-text{font-size:11px;color:#888;margin-left:4px;font-style:italic;}
.pc-tb-combo-star{font-size:16px;color:#ccc;background:none;border:none;cursor:pointer;padding:2px 4px;flex-shrink:0;transition:color .1s;}
.pc-tb-combo-star.on{color:#c8801a;}
.pc-tb-combo-star:hover{color:#c8801a;}
.pc-tb-combo-x{font-size:14px;color:#ccc;background:none;border:none;cursor:pointer;padding:2px 4px;flex-shrink:0;display:none;transition:color .1s;}
.pc-tb-combo-x:hover{color:#c03020;}
.edit-mode .pc-tb-combo-x{display:inline;}
.pc-tb-section-label{font-size:11px;color:#999;letter-spacing:0.4px;padding:6px 0 4px;}
.pc-tb-empty{font-size:13px;color:#bbb;padding:20px 0;text-align:center;width:100%;}
.pc-tb-footer{display:flex;align-items:center;gap:8px;padding:8px 12px 10px;border-top:1px solid #ddd;}
.sfw-mode .pc-tb-footer{border-top-color:#cce4f4;}
.pc-tb-input{flex:1;padding:8px 12px;border-radius:10px;border:1px solid #e0e0e6;background:#f8f8fa;font-size:13px;color:#1a1a1a;outline:none;font-family:inherit;}
.pc-tb-input::placeholder{color:#bbb;}
.pc-tb-input:focus{border-color:#aaa;}
.pc-tb-reset{padding:7px 14px;border-radius:10px;font-size:13px;font-weight:500;color:#666;background:#f0f0f4;border:1px solid #e0e0e6;cursor:pointer;font-family:inherit;white-space:nowrap;}
.pc-tb-reset:hover{color:#333;}
.pc-tb-apply{background:#1a1a1a;color:#fff;border:none;border-radius:10px;padding:7px 16px;font-size:13px;font-weight:500;cursor:pointer;flex-shrink:0;font-family:inherit;white-space:nowrap;transition:opacity .15s;}
.sfw-mode .pc-tb-apply{background:#2a6a9a;}
.pc-tb-apply:active{opacity:.8;}
@media(prefers-color-scheme:dark){
  .pc-tb-wrap{background:#1c1c1e;border-color:#3a3a3c;}
  .pc-tb-topbar,.pc-tb-footer{border-color:#3a3a3c;}
  .pc-tb-tabs{border-color:#3a3a3c;}
  .pc-tb-tab{color:#888;}
  .pc-tb-tab.active{color:#fff;border-bottom-color:#fff;}
  .sfw-mode .pc-tb-tab.active{color:#7ab8e0;border-bottom-color:#7ab8e0;}
  .pc-tb-tag{background:#2a2a2e;color:#ccc;border-color:#3a3a44;}
  .pc-tb-tag.active{background:#fff;color:#000;border-color:#fff;}
  .sfw-mode .pc-tb-tag.active{background:#2a6a9a;color:#fff;border-color:#2a6a9a;}
  .pc-tb-condom{color:#888;border-color:#3a3a3c;}
  .pc-tb-condom.active{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
  .pc-tb-mini-popup{background:#2c2c2e;border-color:#3a3a3c;}
  .pc-tb-mini-role{background:#3a3a3e;color:#ccc;border-color:#555;}
  .pc-tb-mini-role:hover{background:#fff;color:#000;}
  .pc-tb-sel-chip{background:#2c2c2e;border-color:#3a3a3c;color:#e0e0e0;}
  .pc-tb-combo-card{background:#252528;border-color:#3a3a40;}
  .pc-tb-combo-chip{background:#3a3a40;border-color:#4a4a50;color:#ccc;}
  .pc-tb-input{background:#2c2c2e;border-color:#3a3a3c;color:#e0e0e0;}
  .pc-tb-reset{background:#2c2c2e;border-color:#3a3a3c;color:#888;}
  .pc-tb-apply{background:#fff;color:#000;}
  .sfw-mode .pc-tb-apply{background:#2a6a9a;color:#fff;}
  .pc-tb-icon-btn{color:#888;}
  .pc-tb-icon-btn.edit-on{color:#fff;}
}
@media(max-width:430px){
  #pc-popup-overlay{align-items:flex-end!important;justify-content:center!important;}
  #pc-popup-wrap{width:100%!important;height:92vh!important;height:92dvh!important;border-radius:24px 24px 0 0!important;padding-bottom:env(safe-area-inset-bottom,0px)!important;}
}`;
  document.head.appendChild(s);
}

// ═══════════════════════════════════════════
// 툴바 HTML 빌드
// ═══════════════════════════════════════════
function buildToolbarHTML() {
  const store        = getStore();
  const condomActive = store.config.condomState === 'on';
  const groups       = getVisibleGroups();
  if (groups.length > 0 && !groups.find(g => g.id===tbActiveGroup)) tbActiveGroup = groups[0].id;

  const favTab    = getFavTabEnabled()
    ? `<button class="pc-tb-tab fav-tab${tbActiveGroup==='__fav__'?' active':''}" onclick="pcSwitchTab('__fav__')" data-gid="__fav__">★ 즐겨찾기</button>`
    : '';
  const recentTab = `<button class="pc-tb-tab recent-tab${tbActiveGroup==='__recent__'?' active':''}" onclick="pcSwitchTab('__recent__')" data-gid="__recent__">🕐 최근</button>`;
  const tabsHTML  = recentTab + favTab + groups.map((g,idx) =>
    `<button class="pc-tb-tab${g.id===tbActiveGroup?' active':''}" onclick="pcSwitchTab('${g.id}')" data-gid="${g.id}" data-idx="${idx}">${g.label}<span class="pc-tb-tab-x" onclick="pcDeleteGroup('${g.id}',event)">×</span></button>`
  ).join('');

  const condomBtn = isNsfw()
    ? `<button class="pc-tb-condom${condomActive?' active':''}" onclick="pcCondom()">${condomActive?'Condom ON':'Condom'}</button>`
    : '';

  return `
    <div id="${TOOLBAR_ID}">
      <div class="pc-tb-wrap${tbEditMode?' edit-mode':''}${tbMode==='sfw'?' sfw-mode':''}">
        <div class="pc-tb-topbar">
          <span class="pc-tb-title" onclick="pcToggleMode()" title="모드 전환">${tbMode==='nsfw'?'🍑':'☁️'}</span>
          ${condomBtn}
          <span class="pc-tb-spacer"></span>
          <button class="pc-tb-icon-btn${tbEditMode?' edit-on':''}" onclick="pcTbToggleEdit()">⚙</button>
          <button class="pc-tb-icon-btn" onclick="pcTbCollapse()" id="pc-tb-collapse-btn">${tbCollapsed?'▲':'▼'}</button>
          <button class="pc-tb-icon-btn" onclick="pcTbClose()">✕</button>
        </div>
        <div class="pc-tb-collapsible${tbCollapsed?' hidden':''}" id="pc-tb-collapsible">
          <div class="pc-tb-tabs" id="pc-tb-tabs">${tabsHTML}</div>
          <div class="pc-tb-body">
            <div class="pc-tb-tag-area" id="pc-tb-tag-area"></div>
          </div>
          <div id="pc-tb-selected-area" class="pc-tb-selected-area">
            <div class="pc-tb-selected-label">선택됨</div>
            <div class="pc-tb-selected-wrap" id="pc-tb-selected-wrap"></div>
          </div>
        </div>
        <div class="pc-tb-footer">
          <input class="pc-tb-input" id="pc-tb-input" type="text" placeholder="추가 지시를 입력하세요..."/>
          <button class="pc-tb-reset" onclick="pcTbReset()">초기화</button>
          <button class="pc-tb-apply" onclick="pcTbApply()">Apply</button>
        </div>
      </div>
    </div>`;
}

// ── 모드 전환 ──
window.pcToggleMode = function() {
  tbMode = tbMode==='nsfw' ? 'sfw' : 'nsfw';
  tbSelected = [];
  tbActiveGroup = getVisibleGroups()[0]?.id || (tbMode==='nsfw'?'sfw':'daily');
  // 툴바 재빌드
  const toolbar = document.getElementById(TOOLBAR_ID);
  if (!toolbar) return;
  const wrap = toolbar.querySelector('.pc-tb-wrap');
  if (!wrap) return;
  wrap.className = `pc-tb-wrap${tbEditMode?' edit-mode':''}${tbMode==='sfw'?' sfw-mode':''}`;
  // topbar 이모지 + condom 버튼 교체
  const topbar = toolbar.querySelector('.pc-tb-topbar');
  const title  = topbar?.querySelector('.pc-tb-title');
  if (title) title.textContent = tbMode==='nsfw'?'🍑':'☁️';
  // condom 버튼
  const existingCondom = topbar?.querySelector('.pc-tb-condom');
  if (tbMode==='sfw' && existingCondom) existingCondom.remove();
  if (tbMode==='nsfw' && !existingCondom && topbar) {
    const store = getStore();
    const btn = document.createElement('button');
    btn.className = `pc-tb-condom${store.config.condomState==='on'?' active':''}`;
    btn.textContent = store.config.condomState==='on'?'Condom ON':'Condom';
    btn.onclick = pcCondom;
    title.insertAdjacentElement('afterend', btn);
  }
  // 탭/태그 재렌더
  const groups = getVisibleGroups();
  const favTab    = getFavTabEnabled()
    ? `<button class="pc-tb-tab fav-tab${tbActiveGroup==='__fav__'?' active':''}" onclick="pcSwitchTab('__fav__')" data-gid="__fav__">★ 즐겨찾기</button>`
    : '';
  const recentTab = `<button class="pc-tb-tab recent-tab${tbActiveGroup==='__recent__'?' active':''}" onclick="pcSwitchTab('__recent__')" data-gid="__recent__">🕐 최근</button>`;
  const tabsEl = document.getElementById('pc-tb-tabs');
  if (tabsEl) tabsEl.innerHTML = recentTab + favTab + groups.map((g,idx) =>
    `<button class="pc-tb-tab${g.id===tbActiveGroup?' active':''}" onclick="pcSwitchTab('${g.id}')" data-gid="${g.id}" data-idx="${idx}">${g.label}<span class="pc-tb-tab-x" onclick="pcDeleteGroup('${g.id}',event)">×</span></button>`
  ).join('');
  // Apply 버튼 색
  const applyBtn = toolbar.querySelector('.pc-tb-apply');
  if (applyBtn) applyBtn.style.background = tbMode==='sfw'?'#2a6a9a':'';
  renderToolbarTags();
  renderToolbarSelected();
};

// ── 최근/즐겨찾기 패널 ──
function renderComboPane(type) {
  const area = document.getElementById('pc-tb-tag-area');
  if (!area) return;
  const list = type==='__recent__' ? getRecentCombos() : getSavedCombos();
  area.innerHTML = '';
  area.style.display = 'block';

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className='pc-tb-empty';
    empty.textContent = type==='__recent__' ? 'Apply한 조합이 없어요' : '저장된 조합이 없어요';
    area.appendChild(empty); return;
  }

  list.forEach((combo, i) => {
    const card = document.createElement('div');
    card.className='pc-tb-combo-card';
    card.onclick = (e) => {
      if (e.target.classList.contains('pc-tb-combo-star')||e.target.classList.contains('pc-tb-combo-x')) return;
      tbSelected = combo.tags.map(t => ({...t}));
      const inputEl = document.getElementById('pc-tb-input');
      if (inputEl) inputEl.value = combo.inputText||'';
      renderToolbarTags(); renderToolbarSelected();
    };
    const tagsWrap = document.createElement('div');
    tagsWrap.className='pc-tb-combo-tags';
    combo.tags.forEach(t => {
      const chip = document.createElement('span');
      chip.className='pc-tb-combo-chip'; chip.textContent=`${t.tag} · ${t.roleLabel}`;
      tagsWrap.appendChild(chip);
    });
    if (combo.inputText) {
      const txt = document.createElement('span');
      txt.className='pc-tb-combo-text'; txt.textContent=`"${combo.inputText}"`;
      tagsWrap.appendChild(txt);
    }
    const starBtn = document.createElement('button');
    starBtn.className='pc-tb-combo-star'+(type==='__fav__'?' on':'');
    starBtn.textContent = type==='__fav__'?'★':'☆';
    starBtn.onclick = (e) => {
      e.stopPropagation();
      if (type==='__recent__') { pushSavedCombo({...combo}); saveStore(); starBtn.textContent='★'; starBtn.classList.add('on'); }
    };
    const xBtn = document.createElement('button');
    xBtn.className='pc-tb-combo-x'; xBtn.textContent='×';
    xBtn.onclick = (e) => {
      e.stopPropagation();
      const s = getStore();
      if (type==='__recent__') { if(isNsfw()) s.config.recentCombos.splice(i,1); else s.config.sfwRecentCombos.splice(i,1); }
      else                     { if(isNsfw()) s.config.savedCombos.splice(i,1);  else s.config.sfwSavedCombos.splice(i,1); }
      saveStore(); renderComboPane(type);
    };
    card.appendChild(tagsWrap); card.appendChild(starBtn); card.appendChild(xBtn);
    area.appendChild(card);
  });
}

function renderFavPane() {
  const area = document.getElementById('pc-tb-tag-area');
  if (!area) return;
  area.innerHTML = '';
  area.style.display = 'flex';
  const store = getStore();
  const savedCombos = getSavedCombos();
  const favTags     = getFavTags();

  if (savedCombos.length) {
    const sec = document.createElement('div'); sec.className='pc-tb-section-label'; sec.textContent='저장된 조합'; area.appendChild(sec);
    savedCombos.forEach((combo,i) => {
      const card = document.createElement('div'); card.className='pc-tb-combo-card';
      card.onclick = (e) => {
        if (e.target.classList.contains('pc-tb-combo-x')) return;
        tbSelected = combo.tags.map(t=>({...t}));
        const inputEl=document.getElementById('pc-tb-input'); if(inputEl) inputEl.value=combo.inputText||'';
        renderToolbarTags(); renderToolbarSelected();
      };
      const tagsWrap = document.createElement('div'); tagsWrap.className='pc-tb-combo-tags';
      combo.tags.forEach(t=>{ const chip=document.createElement('span'); chip.className='pc-tb-combo-chip'; chip.textContent=`${t.tag} · ${t.roleLabel}`; tagsWrap.appendChild(chip); });
      if (combo.inputText) { const txt=document.createElement('span'); txt.className='pc-tb-combo-text'; txt.textContent=`"${combo.inputText}"`; tagsWrap.appendChild(txt); }
      const xBtn=document.createElement('button'); xBtn.className='pc-tb-combo-x'; xBtn.textContent='×';
      xBtn.onclick=(e)=>{ e.stopPropagation(); if(isNsfw()) store.config.savedCombos.splice(i,1); else store.config.sfwSavedCombos.splice(i,1); saveStore(); renderFavPane(); };
      card.appendChild(tagsWrap); card.appendChild(xBtn); area.appendChild(card);
    });
  }

  if (favTags.length) {
    const sec2=document.createElement('div'); sec2.className='pc-tb-section-label'; sec2.textContent='개별 태그'; area.appendChild(sec2);
    const wrap=document.createElement('div'); wrap.style.cssText='display:flex;flex-wrap:wrap;gap:7px;';
    favTags.forEach((tag,i) => {
      const el=document.createElement('div'); el.className='pc-tb-tag fav-tag';
      const lb=document.createElement('span'); lb.textContent=tag;
      const xBtn=document.createElement('span'); xBtn.className='pc-tb-tag-x'; xBtn.textContent='×';
      xBtn.onclick=(e)=>{ e.stopPropagation(); if(isNsfw()) store.config.favoriteTags.splice(i,1); else store.config.sfwFavoriteTags.splice(i,1); saveStore(); renderFavPane(); };
      el.appendChild(lb); el.appendChild(xBtn);
      el.onclick=(e)=>{ if(tbEditMode) return; e.stopPropagation(); pcShowMiniPopup(el,tag,'__fav__'); };
      wrap.appendChild(el);
    });
    area.appendChild(wrap);
  }

  if (!savedCombos.length && !favTags.length) {
    const empty=document.createElement('div'); empty.className='pc-tb-empty'; empty.textContent='즐겨찾기가 없어요'; area.appendChild(empty);
  }
}

function renderToolbarTags() {
  const area = document.getElementById('pc-tb-tag-area');
  if (!area) return;
  if (tbActiveGroup==='__recent__') { area.style.display='block'; renderComboPane('__recent__'); return; }
  if (tbActiveGroup==='__fav__')    { renderFavPane(); return; }

  area.style.display='flex';
  area.innerHTML='';
  const tags = getVisibleTags(tbActiveGroup);

  tags.forEach(tag => {
    const isSel = tbSelected.some(s => s.tag===tag && s.group===tbActiveGroup);
    const el    = document.createElement('div');
    el.className='pc-tb-tag'+(isSel?' active':'');
    const lb=document.createElement('span'); lb.textContent=tag;
    const xBtn=document.createElement('span'); xBtn.className='pc-tb-tag-x'; xBtn.textContent='×';
    xBtn.onclick=(e)=>{ e.stopPropagation(); pcDeleteTag(tag); };
    el.appendChild(lb); el.appendChild(xBtn);
    el.onclick=(e)=>{ if(tbEditMode) return; e.stopPropagation(); if(isSel){ tbSelected=tbSelected.filter(s=>!(s.tag===tag&&s.group===tbActiveGroup)); pcHideMiniPopup(); renderToolbarTags(); renderToolbarSelected(); } else { pcShowMiniPopup(el,tag,tbActiveGroup); } };
    area.appendChild(el);
  });

  const addInput=document.createElement('input');
  addInput.className='pc-tb-add-input'; addInput.type='text'; addInput.placeholder='Tag name... ↵';
  addInput.onclick=e=>e.stopPropagation();
  addInput.onkeydown=(e)=>{
    if (e.key==='Enter') {
      e.preventDefault(); const val=addInput.value.trim(); if(!val) return;
      const s=getStore();
      if (isNsfw()) { if(!s.config.customTags[tbActiveGroup]) s.config.customTags[tbActiveGroup]=[]; if(!s.config.customTags[tbActiveGroup].includes(val)&&!getFixedTags(tbActiveGroup).includes(val)) s.config.customTags[tbActiveGroup].push(val); }
      else          { if(!s.config.sfwCustomTags[tbActiveGroup]) s.config.sfwCustomTags[tbActiveGroup]=[]; if(!s.config.sfwCustomTags[tbActiveGroup].includes(val)&&!getFixedTags(tbActiveGroup).includes(val)) s.config.sfwCustomTags[tbActiveGroup].push(val); }
      saveStore(); addInput.value=''; renderToolbarTags();
    }
  };
  area.appendChild(addInput);
}

function pcDeleteTag(tag) {
  const s=getStore();
  const defaultG=getDefaultGroups(); const isDefault=defaultG.some(g=>g.id===tbActiveGroup);
  const fixed=getFixedTags(tbActiveGroup);
  if (isNsfw()) {
    s.config.favoriteTags=(s.config.favoriteTags||[]).filter(t=>t!==tag);
    if (fixed.includes(tag)) { if(!s.config.deletedTags[tbActiveGroup]) s.config.deletedTags[tbActiveGroup]=[]; s.config.deletedTags[tbActiveGroup].push(tag); }
    else { s.config.customTags[tbActiveGroup]=(s.config.customTags[tbActiveGroup]||[]).filter(t=>t!==tag); const cg=s.config.customGroups?.find(g=>g.id===tbActiveGroup); if(cg) cg.tags=cg.tags.filter(t=>t!==tag); }
  } else {
    s.config.sfwFavoriteTags=(s.config.sfwFavoriteTags||[]).filter(t=>t!==tag);
    if (fixed.includes(tag)) { if(!s.config.sfwDeletedTags[tbActiveGroup]) s.config.sfwDeletedTags[tbActiveGroup]=[]; s.config.sfwDeletedTags[tbActiveGroup].push(tag); }
    else { s.config.sfwCustomTags[tbActiveGroup]=(s.config.sfwCustomTags[tbActiveGroup]||[]).filter(t=>t!==tag); const cg=s.config.sfwCustomGroups?.find(g=>g.id===tbActiveGroup); if(cg) cg.tags=cg.tags.filter(t=>t!==tag); }
  }
  saveStore(); tbSelected=tbSelected.filter(s=>!(s.tag===tag&&s.group===tbActiveGroup)); renderToolbarTags(); renderToolbarSelected();
}

function pcShowMiniPopup(el, tag, group) {
  pcHideMiniPopup();
  const popup=document.createElement('div'); popup.id='pc-tb-mini-popup'; popup.className='pc-tb-mini-popup show';
  ROLE_OPTIONS.forEach(r=>{
    const btn=document.createElement('button'); btn.className='pc-tb-mini-role'; btn.textContent=r.label;
    btn.onclick=(ev)=>{ ev.stopPropagation(); tbSelected.push({tag,group,role:r.id,roleLabel:r.label}); pcHideMiniPopup(); renderToolbarTags(); renderToolbarSelected(); };
    popup.appendChild(btn);
  });
  const rect=el.getBoundingClientRect();
  popup.style.cssText=`position:fixed;top:${rect.bottom+4}px;left:${rect.left}px;z-index:99999;`;
  document.body.appendChild(popup);
}

function pcHideMiniPopup() { document.getElementById('pc-tb-mini-popup')?.remove(); tbPendingTag=null; }

function renderToolbarSelected() {
  const area=document.getElementById('pc-tb-selected-area'), wrap=document.getElementById('pc-tb-selected-wrap');
  if (!area||!wrap) return;
  if (!tbSelected.length) { area.className='pc-tb-selected-area'; return; }
  area.className='pc-tb-selected-area show'; wrap.innerHTML='';
  tbSelected.forEach((s,i)=>{
    const chip=document.createElement('div'); chip.className='pc-tb-sel-chip';
    chip.innerHTML=`<span class="pc-tb-sel-name">${s.tag.replace(/</g,'&lt;')}</span><span class="pc-tb-sel-role">${s.roleLabel}</span><span class="pc-tb-sel-x">×</span>`;
    chip.querySelector('.pc-tb-sel-x').onclick=()=>{ tbSelected.splice(i,1); renderToolbarTags(); renderToolbarSelected(); };
    wrap.appendChild(chip);
  });
}

function initTabDrag() { /* 툴바 탭 드래그 비활성화 */ }

window.pcDeleteGroup = function(gid, e) {
  e.stopPropagation();
  const store=getStore();
  if (isNsfw()) {
    const isDefault=NSFW_DEFAULT_GROUPS.some(g=>g.id===gid);
    if (isDefault) { if(!store.config.deletedGroups.includes(gid)) store.config.deletedGroups.push(gid); }
    else { store.config.customGroups=store.config.customGroups.filter(g=>g.id!==gid); delete store.config.customTags[gid]; }
    store.config.tbGroupOrder=store.config.tbGroupOrder.filter(id=>id!==gid);
  } else {
    const isDefault=SFW_DEFAULT_GROUPS.some(g=>g.id===gid);
    if (isDefault) { if(!store.config.sfwDeletedGroups.includes(gid)) store.config.sfwDeletedGroups.push(gid); }
    else { store.config.sfwCustomGroups=store.config.sfwCustomGroups.filter(g=>g.id!==gid); delete store.config.sfwCustomTags[gid]; }
    store.config.sfwGroupOrder=store.config.sfwGroupOrder.filter(id=>id!==gid);
  }
  saveStore();
  const groups=getVisibleGroups(); if(groups.length) tbActiveGroup=groups[0].id;
  // 탭만 재렌더
  const tabsEl=document.getElementById('pc-tb-tabs'); if(!tabsEl) return;
  const favTab=getFavTabEnabled()?`<button class="pc-tb-tab fav-tab${tbActiveGroup==='__fav__'?' active':''}" onclick="pcSwitchTab('__fav__')" data-gid="__fav__">★ 즐겨찾기</button>`:'';
  const recentTab=`<button class="pc-tb-tab recent-tab${tbActiveGroup==='__recent__'?' active':''}" onclick="pcSwitchTab('__recent__')" data-gid="__recent__">🕐 최근</button>`;
  tabsEl.innerHTML=recentTab+favTab+groups.map((g,idx)=>`<button class="pc-tb-tab${g.id===tbActiveGroup?' active':''}" onclick="pcSwitchTab('${g.id}')" data-gid="${g.id}" data-idx="${idx}">${g.label}<span class="pc-tb-tab-x" onclick="pcDeleteGroup('${g.id}',event)">×</span></button>`).join('');
  renderToolbarTags(); renderToolbarSelected();
};

function renderToolbar() {
  removeToolbar();
  if (!getStore().config.toolbarEnabled) return;
  injectToolbarStyle();
  const div=document.createElement('div'); div.innerHTML=buildToolbarHTML();
  const sendForm=document.getElementById('send_form');
  if (sendForm) sendForm.insertAdjacentElement('beforebegin',div.firstElementChild);
  else document.body.appendChild(div.firstElementChild);
  renderToolbarTags(); renderToolbarSelected();
  document.addEventListener('click', pcDocClick);
  const toolbar=document.getElementById(TOOLBAR_ID);
  if (toolbar) ['touchstart','touchmove','touchend'].forEach(evt=>toolbar.addEventListener(evt,e=>e.stopPropagation(),{passive:false}));
}

function pcDocClick(e) { const p=document.getElementById('pc-tb-mini-popup'); if(!p) return; if(!p.contains(e.target)&&!e.target.classList.contains('pc-tb-tag')) pcHideMiniPopup(); }
function removeToolbar() { document.getElementById(TOOLBAR_ID)?.remove(); document.removeEventListener('click',pcDocClick); }

window.pcTbToggleEdit = function() {
  tbEditMode=!tbEditMode;
  const wrap=document.querySelector('.pc-tb-wrap'); if(wrap) wrap.classList.toggle('edit-mode',tbEditMode);
  const btn=document.querySelector('.pc-tb-icon-btn[onclick="pcTbToggleEdit()"]'); if(btn) btn.classList.toggle('edit-on',tbEditMode);
};

window.pcTbCollapse = function() {
  tbCollapsed=!tbCollapsed;
  const col=document.getElementById('pc-tb-collapsible'), btn=document.getElementById('pc-tb-collapse-btn');
  if(col) col.classList.toggle('hidden',tbCollapsed);
  if(btn) btn.textContent=tbCollapsed?'▲':'▼';
};

window.pcSwitchTab = function(groupId) {
  tbActiveGroup=groupId;
  document.querySelectorAll('.pc-tb-tab').forEach(t=>t.classList.toggle('active',t.dataset.gid===groupId));
  pcHideMiniPopup(); renderToolbarTags();
};

window.pcCondom = function() {
  const store=getStore(); store.config.condomState=store.config.condomState==='on'?'':'on'; saveStore();
  const btn=document.querySelector('.pc-tb-condom');
  if(btn){ const on=store.config.condomState==='on'; btn.classList.toggle('active',on); btn.textContent=on?'Condom ON':'Condom'; }
};

window.pcTbReset = function() {
  tbSelected=[]; tbPendingTag=null; pcHideMiniPopup(); renderToolbarTags(); renderToolbarSelected();
  const input=document.getElementById('pc-tb-input'); if(input) input.value='';
};

function buildRoleInstruction(tag, role) {
  const cname=getCurrentCharName(), uname=getCurrentUserName();
  switch(role) {
    case 'c2u': return `${cname} performs "${tag}" on/toward ${uname}`;
    case 'u2c': return `${uname} performs "${tag}" on/toward ${cname}`;
    case 'c':   return `${cname} independently does "${tag}"`;
    case 'u':   return `${uname} independently does "${tag}"`;
    default:    return tag.toLowerCase();
  }
}

window.pcTbApply = async function() {
  const store=getStore(), userText=document.getElementById('pc-tb-input')?.value?.trim()||'';
  const parts=[];
  tbSelected.forEach(s=>parts.push(buildRoleInstruction(s.tag,s.role)));
  if (isNsfw() && store.config.condomState==='on') parts.push('put on a condom first');
  if (userText) parts.push(`User's additional instruction: "${userText}"`);
  if (!parts.length) return;

  const actionMsg=`IMMEDIATE INSTRUCTION: In your very next response, you MUST — ${parts.join('. ')}. Stay in character. Do this without exception.`;

  if (tbSelected.length||userText) {
    const combo={tags:tbSelected.map(s=>({...s})),inputText:userText};
    pushRecentCombo(combo); saveStore();
  }

  tbSelected=[]; renderToolbarTags(); renderToolbarSelected();
  const inputEl=document.getElementById('pc-tb-input'); if(inputEl) inputEl.value='';

  try {
    const {setExtensionPrompt,generate}=ctx();
    setExtensionPrompt(MODULE_NAME+'_action',actionMsg,1,0);
    await generate('normal',{});
    setTimeout(()=>{ try{setExtensionPrompt(MODULE_NAME+'_action','',1,0);}catch(e){} },300);
  } catch(e) { console.error(`[${MODULE_NAME}] apply error`,e); }
};

window.pcTbClose = function() {
  const store=getStore(); store.config.toolbarEnabled=false; saveStore(); removeToolbar();
  try { const iw=window.__PC_IFRAME__?.contentWindow; if(iw&&typeof iw.pcSyncToolbarToggle==='function') iw.pcSyncToolbarToggle(false); } catch(e){}
};

window.__PC_TOOLBAR_TOGGLE__ = function(enabled) {
  const store=getStore(); store.config.toolbarEnabled=enabled; saveStore();
  if(enabled) renderToolbar(); else removeToolbar();
};

// ═══════════════════════════════════════════
// ST 설정 패널
// ═══════════════════════════════════════════
function renderSettingsPanel() {
  const store=getStore();
  $('#extensions_settings2').append(`
    <div id="pc-settings-panel">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>🍑 Peaches &amp; Cream Core</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <label style="white-space:nowrap;">최대 토큰</label>
            <input id="pc-max-tokens" type="number" value="${store.config.maxTokens||1500}" min="100" max="8000" style="width:80px;padding:4px 8px;border-radius:6px;border:1px solid #ccc;font-size:13px;"/>
          </div>
          <hr>
          <small style="color:#888;">요술봉 메뉴에서 🍑 Peaches &amp; Cream Core를 클릭해 여세요.</small>
        </div>
      </div>
    </div>
  `);
  $('#pc-max-tokens').on('change',function(){getStore().config.maxTokens=parseInt($(this).val())||1500;saveStore();});
}

function addWandMenuItem() {
  const $item=$(`<div id="pc-wand-btn" class="list-group-item flex-container flexGap5"><span>🍑</span><span>Peaches &amp; Cream Core</span></div>`);
  $item.on('click',function(){$('#extensionsMenu').hide();openMainHub();});
  $('#extensionsMenu').append($item);
}

// ═══════════════════════════════════════════
// POPUP / BRIDGE
// ═══════════════════════════════════════════
const POPUP_ID='pc-popup-overlay';

async function openMainHub() {
  if ($(`#${POPUP_ID}`).length) return;
  injectToolbarStyle();
  const bridgeData={
    __PC_STORE__:getCharStore(), __PC_GLOBAL_STORE__:getStore(),
    __PC_CLOSE__:closeMainHub,
    __PC_GENERATE__:(sys,usr,app)=>generateWithRole(sys,usr,app),
    __PC_GET_CHAT__:getRecentChat, __PC_GET_CHAT_RANGE__:getChatRange,
    __PC_CHAR__:getCurrentCharName(), __PC_USER__:getCurrentUserName(),
    __PC_CHAR_DESC__:getCharDescription(), __PC_USER_PERSONA__:getUserPersona(),
    __PC_SAVE__:saveStore, __PC_REFRESH_PROMPT__:refreshPrompt,
    __PC_CHAR_KEY__:getCharKey(), __PC_TOOLBAR_TOGGLE__:window.__PC_TOOLBAR_TOGGLE__,
  };
  Object.assign(window,bridgeData);
  const extUrl=`scripts/extensions/third-party/${MODULE_NAME}/main.html`;
  const mobile=isMobile();
  const overlay=document.createElement('div'); overlay.id=POPUP_ID;
  overlay.style.cssText=`position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:9999;display:flex;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);${mobile?'align-items:flex-end;justify-content:center;':'align-items:center;justify-content:center;'}`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeMainHub();});
  overlay.addEventListener('touchstart',e=>{if(e.target===overlay)closeMainHub();},{passive:true});
  const wrap=document.createElement('div'); wrap.id='pc-popup-wrap';
  wrap.style.cssText=mobile?'position:relative;width:100%;height:92vh;height:92dvh;border-radius:24px 24px 0 0;overflow:hidden;box-shadow:0 -8px 40px rgba(0,0,0,0.4);':'position:relative;width:min(460px,92vw);height:min(90vh,800px);border-radius:24px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.5);';
  const iframe=document.createElement('iframe'); iframe.src=extUrl; iframe.style.cssText='width:100%;height:100%;border:none;display:block;'; iframe.id='pc-iframe';
  window.__PC_IFRAME__=iframe;
  iframe.addEventListener('load',function(){ try{ const iw=iframe.contentWindow; Object.assign(iw,bridgeData); if(typeof iw.__PC_ON_BRIDGE__==='function') iw.__PC_ON_BRIDGE__(); }catch(e){console.error(`[${MODULE_NAME}] bridge error`,e);} });
  wrap.appendChild(iframe); overlay.appendChild(wrap); document.body.appendChild(overlay);
}

function closeMainHub() {
  $(`#${POPUP_ID}`).remove(); window.__PC_IFRAME__=null;
  refreshPrompt(); if(getStore().config.toolbarEnabled) renderToolbar();
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
(async function init() {
  getStore(); renderSettingsPanel(); addWandMenuItem(); injectToolbarStyle();
  const {eventSource,event_types}=ctx();
  eventSource.on(event_types.MESSAGE_RECEIVED,refreshPrompt);
  eventSource.on(event_types.CHAT_CHANGED,()=>{
    refreshPrompt(); if(getStore().config.toolbarEnabled) renderToolbar();
    try {
      const iw=window.__PC_IFRAME__?.contentWindow;
      if(iw){
        const ns=getCharStore(),nk=getCharKey(),nn=getCurrentCharName();
        Object.assign(iw,{__PC_STORE__:ns,__PC_CHAR_KEY__:nk,__PC_CHAR__:nn,__PC_USER__:getCurrentUserName(),__PC_CHAR_DESC__:getCharDescription(),__PC_USER_PERSONA__:getUserPersona()});
        Object.assign(window,{__PC_STORE__:ns,__PC_CHAR_KEY__:nk,__PC_CHAR__:nn});
        if(typeof iw.router?.go==='function') iw.router.go('home');
      }
    } catch(e){console.warn(`[${MODULE_NAME}] CHAT_CHANGED error`,e);}
  });
  refreshPrompt(); if(getStore().config.toolbarEnabled) renderToolbar();
  window.__PC_REFRESH_PROMPT__=refreshPrompt; window.__PC_SAVE_STORE__=saveStore; window.__PC_GET_CHAR_STORE__=getCharStore;
  console.log(`[${MODULE_NAME}] v3.3 로드 완료`);
})();
