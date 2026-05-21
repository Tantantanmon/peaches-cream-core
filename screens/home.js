// screens/home.js — Peaches & Cream Core v3.2

export function render() {
  const globalStore = window.parent?.__PC_GLOBAL_STORE__;
  const toolbarEnabled = globalStore?.config?.toolbarEnabled || false;
  const charStore = window.parent?.__PC_STORE__ || {};
  const hasBody   = !!(charStore.userBody || charStore.charBody);
  const hasSexual = !!(charStore.userErogenous || charStore.charErogenous);

  if (!document.getElementById('home-style')) {
    const s = document.createElement('style');
    s.id = 'home-style';
    s.textContent = `
.home-hero{background:#fff0f0;border-radius:18px;border:0.5px solid #f5d8d8;padding:18px 20px;display:flex;align-items:center;gap:14px;margin-bottom:20px;}
.home-hero-icon{width:50px;height:50px;border-radius:13px;background:#fff;border:0.5px solid #f0d0d0;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
.home-hero-title{font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:2px;}
.home-hero-sub{font-size:12px;color:#c08888;}
.home-badge-ok{font-size:11px;background:#fff0f0;color:#e05050;border-radius:6px;padding:2px 7px;border:0.5px solid #f5d0d0;}
.home-badge-no{font-size:11px;background:#f5f5f5;color:#bbb;border-radius:6px;padding:2px 7px;border:0.5px solid #eee;}
.home-list-group{background:#fff;border-radius:16px;border:0.5px solid #f0d8d8;overflow:hidden;margin-bottom:10px;}
.home-list-row{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:0.5px solid #fceaea;cursor:pointer;}
.home-list-row:last-child{border-bottom:none;}
.home-list-row.no-tap{cursor:default;}
.home-row-label{font-size:15px;font-weight:500;color:var(--text-primary);margin-bottom:2px;}
.home-row-sub{font-size:12px;color:#c09090;}
.home-chevron{font-size:17px;color:#e0b8b8;}
.home-toggle{width:48px;height:28px;border-radius:14px;background:#f0d8d8;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;}
.home-toggle.on{background:#e05050;}
.home-toggle-thumb{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.15);transition:left .2s;}
.home-toggle.on .home-toggle-thumb{left:23px;}
    `;
    document.head.appendChild(s);
  }

  const area = document.getElementById('scroll-area');
  area.style.background = '#fff';
  area.innerHTML = `
    <div class="home-hero">
      <div class="home-hero-icon">🍑</div>
      <div>
        <div class="home-hero-title">Peaches & Cream</div>
        <div class="home-hero-sub">RP Control Core · v3.2</div>
      </div>
    </div>

    <div style="font-size:11px;font-weight:600;letter-spacing:0.8px;color:#c09090;text-transform:uppercase;padding:0 2px;margin:16px 0 8px;">Toolbar</div>
    <div class="home-list-group">
      <div class="home-list-row no-tap">
        <div>
          <div class="home-row-label" id="pc-toolbar-label">Toolbar ${toolbarEnabled?'ON':'OFF'}</div>
          <div class="home-row-sub">ST 입력창 위 툴바 표시</div>
        </div>
        <div class="home-toggle${toolbarEnabled?' on':''}" id="pc-toolbar-btn" onclick="pcToggleToolbar()">
          <div class="home-toggle-thumb" id="pc-toolbar-thumb"></div>
        </div>
      </div>
      <div class="home-list-row" onclick="router.go('toolbar-settings')">
        <div>
          <div class="home-row-label">NSFW 태그 관리</div>
          <div class="home-row-sub">그룹 · 태그 추가 · 삭제</div>
        </div>
        <span class="home-chevron">›</span>
      </div>
      <div class="home-list-row" onclick="router.go('sfw-settings')">
        <div>
          <div class="home-row-label">SFW 태그 관리</div>
          <div class="home-row-sub">일상 · 감정 · 접촉 그룹</div>
        </div>
        <span class="home-chevron">›</span>
      </div>
    </div>

    <div style="font-size:11px;font-weight:600;letter-spacing:0.8px;color:#c09090;text-transform:uppercase;padding:0 2px;margin:16px 0 8px;">Character</div>
    <div class="home-list-group">
      <div class="home-list-row" onclick="router.go('profile')">
        <div>
          <div class="home-row-label">Profile</div>
          <div class="home-row-sub">신체 · 성감대 데이터</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="display:flex;gap:4px;">
            <span class="${hasBody?'home-badge-ok':'home-badge-no'}">Body ${hasBody?'✓':'✗'}</span>
            <span class="${hasSexual?'home-badge-ok':'home-badge-no'}">Sexual ${hasSexual?'✓':'✗'}</span>
          </div>
          <span class="home-chevron">›</span>
        </div>
      </div>
    </div>
  `;
}

window.pcToggleToolbar = function() {
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs) return;
  const newVal = !gs.config.toolbarEnabled;
  gs.config.toolbarEnabled = newVal;
  if (window.parent?.__PC_SAVE__) window.parent.__PC_SAVE__();
  if (window.parent?.__PC_TOOLBAR_TOGGLE__) window.parent.__PC_TOOLBAR_TOGGLE__(newVal);
  document.getElementById('pc-toolbar-label').textContent = `Toolbar ${newVal?'ON':'OFF'}`;
  document.getElementById('pc-toolbar-btn').className = `home-toggle${newVal?' on':''}`;
};

window.pcSyncToolbarToggle = function(val) {
  const label = document.getElementById('pc-toolbar-label');
  const btn   = document.getElementById('pc-toolbar-btn');
  if (label) label.textContent = `Toolbar ${val?'ON':'OFF'}`;
  if (btn)   btn.className = `home-toggle${val?' on':''}`;
};
