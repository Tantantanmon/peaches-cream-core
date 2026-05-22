// screens/sfw-settings.js — Peaches & Cream Core v3.3

const SFW_DEFAULT_GROUPS = [
  { id:'daily',    label:'Daily'    },
  { id:'emotion',  label:'Emotion'  },
  { id:'physical', label:'Physical' },
];

let sfwActiveGroup = 'daily';
let sfwDragSrc = null, sfwDragSrcIdx = null;

export function render() {
  if (!document.getElementById('tbs-style')) {
    const s = document.createElement('style');
    s.id = 'tbs-style';
    s.textContent = `
.tbs-layout{display:flex;height:100%;position:relative;}
.tbs-sidebar{width:108px;flex-shrink:0;background:#f5f5f7;border-right:0.5px solid var(--divider-light);overflow-y:hidden;display:flex;flex-direction:column;padding:0;scrollbar-width:none;}
.tbs-sidebar::-webkit-scrollbar{display:none;}
.tbs-sb-top{padding:10px 10px 8px;display:flex;justify-content:flex-start;border-bottom:0.5px solid var(--divider-light);flex-shrink:0;}
.tbs-hamburger{width:34px;height:34px;border-radius:10px;background:#2c6a9a;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;transition:opacity .1s;}
.tbs-hamburger:active{opacity:.8;}
.tbs-hamburger-icon{display:flex;flex-direction:column;gap:3px;}
.tbs-hamburger-line{width:16px;height:1.8px;background:#fff;border-radius:1px;}
.tbs-sb-items{flex:1;overflow-y:auto;padding:6px 0;scrollbar-width:none;}
.tbs-sb-items::-webkit-scrollbar{display:none;}
.tbs-sb-item{padding:10px 14px;font-size:12.5px;cursor:pointer;transition:all .1s;color:var(--text-muted);border-left:2.5px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;user-select:none;}
.tbs-sb-item:hover{color:var(--text-secondary);background:rgba(0,0,0,0.02);}
.tbs-sb-item.active{color:var(--text-primary);background:var(--surface);border-left-color:#2a6a9a;font-weight:600;}
.tbs-sb-add{padding:10px 14px;font-size:12.5px;color:var(--text-hint);cursor:pointer;border-left:2.5px solid transparent;transition:color .1s;margin-top:2px;}
.tbs-sb-add:hover{color:var(--text-muted);}
.tbs-main{flex:1;display:flex;flex-direction:column;min-width:0;background:var(--surface);}
.tbs-header{padding:14px 16px 8px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.tbs-header-label{font-size:17px;font-weight:600;color:var(--text-primary);}
.tbs-del-group{padding:5px 12px;border-radius:8px;font-size:12px;font-weight:500;color:#c03020;background:transparent;border:0.5px solid rgba(200,60,60,0.3);cursor:pointer;font-family:inherit;}
.tbs-tag-area{flex:1;padding:8px 16px;overflow-y:auto;scrollbar-width:none;}
.tbs-tag-area::-webkit-scrollbar{display:none;}
.tbs-tag-wrap{display:flex;flex-wrap:wrap;gap:7px;align-content:flex-start;}
.tbs-tag{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:20px;font-size:13px;background:var(--surface);color:var(--text-secondary);cursor:default;border:0.5px solid var(--divider);}
.tbs-fav{font-size:13px;cursor:pointer;color:var(--text-hint);transition:color .1s;}
.tbs-fav.on{color:#f0a020;}
.tbs-tag-x{font-size:14px;color:var(--text-hint);cursor:pointer;line-height:1;transition:color .1s;}
.tbs-tag-x:hover{color:var(--danger);}
.tbs-add-input{padding:7px 12px;border-radius:20px;font-size:13px;background:var(--surface);color:var(--text-primary);border:0.5px solid var(--divider);outline:none;font-family:inherit;width:110px;}
.tbs-add-input::placeholder{color:var(--text-hint);}
.tbs-add-input:focus{border-color:#aaa;}
.tbs-empty{font-size:13px;color:var(--text-hint);padding:40px 0;text-align:center;width:100%;}
.tbs-bottom{padding:12px 16px 16px;display:flex;gap:10px;flex-shrink:0;}
.tbs-save-btn{flex:1;padding:14px;border-radius:var(--radius-sm);font-size:15px;font-weight:500;color:#fff;background:#2a6a9a;border:none;cursor:pointer;font-family:inherit;}
.tbs-save-btn:active{opacity:.8;}
.tbs-reset-btn{flex:1;padding:14px;border-radius:var(--radius-sm);font-size:15px;font-weight:500;color:var(--danger);background:#fff0f0;border:none;cursor:pointer;font-family:inherit;}
.tbs-menu-overlay{display:none;position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.25);z-index:10;}
.tbs-menu-overlay.show{display:block;}
.tbs-menu{display:none;position:absolute;top:52px;left:8px;background:var(--surface);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:11;min-width:200px;padding:6px 0;border:0.5px solid var(--divider);}
.tbs-menu.show{display:block;}
.tbs-menu-item{padding:11px 16px;font-size:13.5px;color:var(--text-primary);cursor:pointer;display:flex;align-items:center;gap:10px;font-family:inherit;}
.tbs-menu-item:hover{background:#f5f5f7;}
.tbs-menu-item.danger{color:var(--danger);}
.tbs-menu-divider{height:0.5px;background:var(--divider);margin:4px 0;}
    `;
    document.head.appendChild(s);
  }

  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs) return;
  if (!gs.config.sfwCustomTags)    gs.config.sfwCustomTags    = {};
  if (!gs.config.sfwDeletedTags)   gs.config.sfwDeletedTags   = {};
  if (!gs.config.sfwDeletedGroups) gs.config.sfwDeletedGroups = [];
  if (!gs.config.sfwCustomGroups)  gs.config.sfwCustomGroups  = [];
  if (!gs.config.sfwFavoriteTags)  gs.config.sfwFavoriteTags  = [];
  if (!gs.config.sfwGroupOrder)    gs.config.sfwGroupOrder    = [];

  const area = document.getElementById('scroll-area');
  area.style.padding    = '0';
  area.style.background = '#f5f5f7';

  area.innerHTML = `
    <div class="tbs-layout">
      <div class="tbs-sidebar">
        <div class="tbs-sb-top">
          <button class="tbs-hamburger" id="sfw-hamburger">
            <div class="tbs-hamburger-icon">
              <div class="tbs-hamburger-line"></div>
              <div class="tbs-hamburger-line"></div>
              <div class="tbs-hamburger-line"></div>
            </div>
          </button>
        </div>
        <div class="tbs-sb-items" id="sfw-sidebar"></div>
      </div>
      <div class="tbs-main">
        <div class="tbs-header">
          <span class="tbs-header-label" id="sfw-header-label"></span>
          <button class="tbs-del-group" id="sfw-del-group">그룹 삭제</button>
        </div>
        <div class="tbs-tag-area" id="sfw-tag-area"></div>
        <div class="tbs-bottom">
          <button class="tbs-save-btn" id="sfw-save-btn">저장</button>
          <button class="tbs-reset-btn" id="sfw-reset-btn">초기화</button>
        </div>
      </div>
      <div class="tbs-menu-overlay" id="sfw-menu-overlay"></div>
      <div class="tbs-menu" id="sfw-menu">
        <div class="tbs-menu-item" id="sfw-menu-export"><span>↑</span><span>설정 내보내기</span></div>
        <div class="tbs-menu-item" id="sfw-menu-import"><span>↓</span><span>설정 가져오기</span></div>
        <div class="tbs-menu-divider"></div>
        <div class="tbs-menu-item danger" id="sfw-menu-reset"><span>↻</span><span>전체 초기화</span></div>
      </div>
    </div>
  `;

  sfwRenderSidebar();
  sfwRenderTags();

  document.getElementById('sfw-hamburger').onclick = (e) => { e.stopPropagation(); sfwToggleMenu(); };
  document.getElementById('sfw-menu-overlay').onclick = () => sfwToggleMenu(false);

  document.getElementById('sfw-menu-export').onclick = () => {
    sfwToggleMenu(false);
    const gs2 = window.parent?.__PC_GLOBAL_STORE__;
    if (!gs2) return;
    const groups = sfwGetOrderedGroups(gs2);
    const data = { groups: groups.map(g => {
      const isDefault = SFW_DEFAULT_GROUPS.some(dg => dg.id===g.id);
      const deleted   = gs2.config.sfwDeletedTags?.[g.id]||[];
      const custom    = gs2.config.sfwCustomTags?.[g.id]||[];
      const cg        = gs2.config.sfwCustomGroups?.find(cg => cg.id===g.id);
      const base      = isDefault ? [] : (cg?.tags||[]);
      return { id:g.id, label:g.label, tags:[...base.filter(t=>!deleted.includes(t)), ...custom] };
    })};
    if (navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(data,null,2)).then(()=>showToast('클립보드에 복사됨 ✓'));
  };

  document.getElementById('sfw-menu-import').onclick = () => {
    sfwToggleMenu(false);
    const val = prompt('태그를 붙여넣으세요:\n\n[그룹명]\n태그1\n태그2\n\n또는 JSON 형식도 가능해요.');
    if (!val?.trim()) return;
    const gs2 = window.parent?.__PC_GLOBAL_STORE__;
    if (!gs2) return;

    // ── JSON 시도
    try {
      const data = JSON.parse(val.trim());
      if (data.groups && Array.isArray(data.groups)) {
        data.groups.forEach(ig => {
          const isDefault = SFW_DEFAULT_GROUPS.some(dg => dg.id===ig.id);
          if (!isDefault) {
            if (!gs2.config.sfwCustomGroups.find(cg => cg.id===ig.id))
              gs2.config.sfwCustomGroups.push({ id:ig.id, label:ig.label, tags:[] });
          }
          if (!gs2.config.sfwCustomTags[ig.id]) gs2.config.sfwCustomTags[ig.id]=[];
          const existing = [...(gs2.config.sfwCustomTags[ig.id]||[])];
          (ig.tags||[]).forEach(t => { if (!existing.includes(t)) gs2.config.sfwCustomTags[ig.id].push(t); });
        });
        if (saveStore) saveStore();
        showToast('가져오기 완료 ✓');
        sfwRenderSidebar(); sfwRenderTags();
        return;
      }
    } catch(e) { /* 자유 형식으로 파싱 */ }

    // ── 자유 형식 파싱: [그룹명] + 태그 목록
    const lines = val.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    let currentGroup = null;
    let added = 0, skipped = 0;

    lines.forEach(line => {
      const groupMatch = line.match(/^\[(.+)\]$/);
      if (groupMatch) {
        currentGroup = groupMatch[1].trim();
        const isDefault = SFW_DEFAULT_GROUPS.some(g => g.label.toLowerCase() === currentGroup.toLowerCase());
        if (!isDefault && !gs2.config.sfwCustomGroups.find(g => g.label === currentGroup)) {
          const id = 'sfw_custom_' + currentGroup.replace(/[^a-zA-Z0-9가-힣]/g,'_') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
          gs2.config.sfwCustomGroups.push({ id, label: currentGroup, tags: [] });
          if (!gs2.config.sfwCustomTags[id]) gs2.config.sfwCustomTags[id] = [];
        }
        return;
      }
      if (!currentGroup || !line) return;

      const defaultGroup = SFW_DEFAULT_GROUPS.find(g => g.label.toLowerCase() === currentGroup.toLowerCase());
      const customGroup  = gs2.config.sfwCustomGroups.find(g => g.label === currentGroup);
      const groupId      = defaultGroup?.id || customGroup?.id;
      if (!groupId) return;

      const deleted  = gs2.config.sfwDeletedTags?.[groupId] || [];
      const custom   = gs2.config.sfwCustomTags?.[groupId]  || [];
      const cg       = gs2.config.sfwCustomGroups?.find(g => g.id === groupId);
      const existing = [...(cg?.tags||[]).filter(t=>!deleted.includes(t)), ...custom];

      if (existing.includes(line)) { skipped++; return; }
      if (!gs2.config.sfwCustomTags[groupId]) gs2.config.sfwCustomTags[groupId] = [];
      gs2.config.sfwCustomTags[groupId].push(line);
      added++;
    });

    if (added === 0 && skipped === 0) { showToast('추가할 태그가 없어요'); return; }
    if (saveStore) saveStore();
    showToast(`${added}개 추가, ${skipped}개 중복 건너뜀 ✓`);
    sfwRenderSidebar(); sfwRenderTags();
  };

  document.getElementById('sfw-menu-reset').onclick = () => {
    sfwToggleMenu(false);
    showModal({ title:'전체 초기화', desc:'SFW 모든 그룹과 태그를 초기화할까요?', confirmText:'초기화', danger:true, onConfirm:() => {
      const gs2 = window.parent?.__PC_GLOBAL_STORE__;
      if (!gs2) return;
      gs2.config.sfwCustomTags    = {};
      gs2.config.sfwDeletedTags   = {};
      gs2.config.sfwDeletedGroups = [];
      gs2.config.sfwCustomGroups  = [];
      gs2.config.sfwGroupOrder    = [];
      gs2.config.sfwFavoriteTags  = [];
      if (saveStore) saveStore();
      sfwActiveGroup = 'daily';
      showToast('초기화됐어요');
      sfwRenderSidebar(); sfwRenderTags();
    }});
  };

  document.getElementById('sfw-del-group').onclick = () => {
    const gs2 = window.parent?.__PC_GLOBAL_STORE__;
    if (!gs2) return;
    const group = sfwGetOrderedGroups(gs2).find(g => g.id===sfwActiveGroup);
    showModal({ title:'그룹 삭제', desc:`"${group?.label||sfwActiveGroup}" 그룹을 삭제할까요?`, confirmText:'삭제', danger:true, onConfirm:() => {
      const isDefault = SFW_DEFAULT_GROUPS.some(g => g.id===sfwActiveGroup);
      if (isDefault) { if (!gs2.config.sfwDeletedGroups.includes(sfwActiveGroup)) gs2.config.sfwDeletedGroups.push(sfwActiveGroup); }
      else { gs2.config.sfwCustomGroups = gs2.config.sfwCustomGroups.filter(g => g.id!==sfwActiveGroup); }
      gs2.config.sfwGroupOrder = (gs2.config.sfwGroupOrder||[]).filter(id => id!==sfwActiveGroup);
      if (saveStore) saveStore();
      const visible = sfwGetOrderedGroups(gs2);
      sfwActiveGroup = visible[0]?.id || 'daily';
      sfwRenderSidebar(); sfwRenderTags();
      showToast('삭제됐어요');
    }});
  };

  document.getElementById('sfw-save-btn').onclick = () => {
    if (saveStore) saveStore();
    const btn = document.getElementById('sfw-save-btn');
    btn.textContent='저장됨 ✓'; btn.style.background='#2a7a40';
    setTimeout(()=>{ btn.textContent='저장'; btn.style.background='#2a6a9a'; },1200);
  };

  document.getElementById('sfw-reset-btn').onclick = () => {
    showModal({ title:'이 그룹 초기화', desc:'이 그룹의 태그를 초기화할까요?', confirmText:'초기화', danger:true, onConfirm:() => {
      const gs2 = window.parent?.__PC_GLOBAL_STORE__;
      if (!gs2) return;
      gs2.config.sfwDeletedTags[sfwActiveGroup] = [];
      gs2.config.sfwCustomTags[sfwActiveGroup]  = [];
      if (saveStore) saveStore();
      showToast('초기화됐어요'); sfwRenderTags();
    }});
  };
}

function sfwToggleMenu(show) {
  const m = document.getElementById('sfw-menu');
  const o = document.getElementById('sfw-menu-overlay');
  if (!m||!o) return;
  const val = typeof show==='boolean' ? show : !m.classList.contains('show');
  m.classList.toggle('show', val);
  o.classList.toggle('show', val);
}

function sfwGetOrderedGroups(gs) {
  const dg       = gs.config.sfwDeletedGroups||[];
  const defaults = SFW_DEFAULT_GROUPS.filter(g => !dg.includes(g.id));
  const custom   = gs.config.sfwCustomGroups||[];
  const all      = [...defaults, ...custom];
  const order    = gs.config.sfwGroupOrder||[];
  if (!order.length) return all;
  return [...order.map(id=>all.find(g=>g.id===id)).filter(Boolean), ...all.filter(g=>!order.includes(g.id))];
}

function sfwRenderSidebar() {
  const sb = document.getElementById('sfw-sidebar');
  if (!sb) return;
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs) return;
  const groups = sfwGetOrderedGroups(gs);
  sb.innerHTML = '';

  groups.forEach((g, idx) => {
    const item = document.createElement('div');
    item.className = 'tbs-sb-item' + (g.id===sfwActiveGroup?' active':'');
    item.textContent = g.label;
    item.dataset.id  = g.id;
    item.dataset.idx = idx;
    item.onclick = () => { sfwActiveGroup=g.id; sfwRenderSidebar(); sfwRenderTags(); };
    sb.appendChild(item);
  });

  const addDiv = document.createElement('div');
  addDiv.className = 'tbs-sb-add';
  addDiv.textContent = '+ Group';
  addDiv.onclick = () => {
    const name = prompt('그룹 이름:');
    if (!name?.trim()) return;
    const gs2 = window.parent?.__PC_GLOBAL_STORE__;
    if (!gs2) return;
    if (gs2.config.sfwCustomGroups.find(g => g.label===name.trim())) { showToast('이미 있는 그룹이에요'); return; }
    const id = 'sfw_custom_' + Date.now();
    gs2.config.sfwCustomGroups.push({ id, label:name.trim(), tags:[] });
    if (!gs2.config.sfwCustomTags[id]) gs2.config.sfwCustomTags[id]=[];
    if (saveStore) saveStore();
    sfwActiveGroup = id;
    sfwRenderSidebar(); sfwRenderTags();
  };
  sb.appendChild(addDiv);
}

function sfwRenderTags() {
  const tagArea = document.getElementById('sfw-tag-area');
  const header  = document.getElementById('sfw-header-label');
  if (!tagArea||!header) return;
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs) return;

  const groups = sfwGetOrderedGroups(gs);
  if (!groups.length) { header.textContent=''; tagArea.innerHTML='<div class="tbs-empty">그룹이 없어요</div>'; return; }
  const group = groups.find(g=>g.id===sfwActiveGroup);
  if (!group) { sfwActiveGroup=groups[0].id; sfwRenderSidebar(); sfwRenderTags(); return; }

  header.textContent = group.label;
  const isDefault = SFW_DEFAULT_GROUPS.some(g=>g.id===sfwActiveGroup);
  const deleted   = gs.config.sfwDeletedTags?.[sfwActiveGroup]||[];
  const custom    = gs.config.sfwCustomTags?.[sfwActiveGroup]||[];
  const cg        = gs.config.sfwCustomGroups?.find(g=>g.id===sfwActiveGroup);
  const base      = isDefault ? [] : (cg?.tags||[]);
  const allTags   = [...base.filter(t=>!deleted.includes(t)), ...custom];

  tagArea.innerHTML='';
  const wrap = document.createElement('div');
  wrap.className='tbs-tag-wrap';

  allTags.forEach((tag, i) => {
    const chip = document.createElement('div');
    chip.className='tbs-tag';
    const label = document.createElement('span'); label.textContent=tag;
    const fav = document.createElement('span');
    const isFav = (gs.config.sfwFavoriteTags||[]).includes(tag);
    fav.className='tbs-fav'+(isFav?' on':''); fav.textContent=isFav?'★':'☆';
    fav.onclick=()=>{
      if (!gs.config.sfwFavoriteTags) gs.config.sfwFavoriteTags=[];
      if (isFav) gs.config.sfwFavoriteTags=gs.config.sfwFavoriteTags.filter(t=>t!==tag);
      else gs.config.sfwFavoriteTags.push(tag);
      if (saveStore) saveStore(); sfwRenderTags();
    };
    const xBtn=document.createElement('span'); xBtn.className='tbs-tag-x'; xBtn.textContent='×';
    xBtn.onclick=()=>{
      gs.config.sfwFavoriteTags=(gs.config.sfwFavoriteTags||[]).filter(t=>t!==tag);
      if (i<base.length) { if (!gs.config.sfwDeletedTags[sfwActiveGroup]) gs.config.sfwDeletedTags[sfwActiveGroup]=[]; gs.config.sfwDeletedTags[sfwActiveGroup].push(tag); }
      else { gs.config.sfwCustomTags[sfwActiveGroup]=(gs.config.sfwCustomTags[sfwActiveGroup]||[]).filter(t=>t!==tag); if(cg) cg.tags=cg.tags.filter(t=>t!==tag); }
      if (saveStore) saveStore(); sfwRenderTags();
    };
    chip.appendChild(label); chip.appendChild(fav); chip.appendChild(xBtn);
    wrap.appendChild(chip);
  });

  const addInput=document.createElement('input');
  addInput.className='tbs-add-input'; addInput.type='text'; addInput.placeholder='Tag name... ↵';
  addInput.onkeydown=(e)=>{
    if (e.key==='Enter') {
      e.preventDefault();
      const val=addInput.value.trim();
      if (!val) return;
      if (allTags.includes(val)) { showToast('이미 있는 태그예요'); return; }
      if (!gs.config.sfwCustomTags[sfwActiveGroup]) gs.config.sfwCustomTags[sfwActiveGroup]=[];
      gs.config.sfwCustomTags[sfwActiveGroup].push(val);
      if (saveStore) saveStore(); addInput.value=''; sfwRenderTags();
    }
  };
  wrap.appendChild(addInput);

  if (!allTags.length) {
    const empty=document.createElement('div'); empty.className='tbs-empty'; empty.textContent='태그가 없어요 — 추가하세요';
    wrap.insertBefore(empty, addInput);
  }

  tagArea.appendChild(wrap);
}
