// screens/profile.js — Peaches & Cream Core v3.0

function escTA(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function render() {
  syncStore();
  const area = document.getElementById('scroll-area');

  if (!document.getElementById('pf-style')) {
    const s = document.createElement('style');
    s.id = 'pf-style';
    s.textContent = `
.pf-textarea{width:100%;padding:4px 0;border:none;background:transparent;color:var(--text-primary);font-size:15px;font-family:inherit;resize:vertical;outline:none;line-height:1.7;pointer-events:auto;user-select:text;-webkit-user-select:text;cursor:text;display:block;min-height:90px;box-sizing:border-box;}
.pf-textarea::placeholder{color:var(--text-hint);font-size:14px;}
.pf-section-label{font-size:11px;font-weight:600;letter-spacing:0.8px;color:var(--text-muted);text-transform:uppercase;padding:14px 16px 8px;display:flex;align-items:center;justify-content:space-between;}
.pf-inject-badge{font-size:10px;font-weight:500;letter-spacing:0;text-transform:none;color:var(--text-hint);background:var(--btn-idle);border-radius:6px;padding:2px 7px;}
.pf-field-wrap{padding:0 16px 16px;width:100%;box-sizing:border-box;}
    `;
    document.head.appendChild(s);
  }

  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="pf-tab-user" onclick="pfSwitchTab('user')">User</button>
      <button class="tab-item" id="pf-tab-char" onclick="pfSwitchTab('char')">Character</button>
    </div>

    <!-- USER TAB -->
    <div id="pf-pane-user" style="display:flex;flex-direction:column;gap:10px;">
      <div class="list-group">
        <div class="pf-section-label">
          <span>Body &amp; Appearance</span>
          <span class="pf-inject-badge">항상 적용</span>
        </div>
        <div class="pf-field-wrap">
          <textarea class="pf-textarea" id="pf-userBody"
            placeholder="키, 체형, 피부, 머리카락, 눈에 띄는 특징 등&#10;예: 슬림한 체형, 긴 갈색 머리, 쇄골 아래 작은 점">${escTA(store.userBody || '')}${escTA(store.userMarks ? (store.userBody ? '\n' + store.userMarks : store.userMarks) : '')}</textarea>
        </div>
      </div>
      <div class="list-group">
        <div class="pf-section-label">
          <span>Sexual</span>
          <span class="pf-inject-badge">성적 씬에서만 적용</span>
        </div>
        <div class="pf-field-wrap">
          <textarea class="pf-textarea" id="pf-userSexual"
            placeholder="성감대, 반응 패턴, 특이사항 등&#10;예: 귀와 목이 예민함, 자극에 빠르게 반응">${escTA(store.userErogenous || '')}</textarea>
        </div>
      </div>
    </div>

    <!-- CHARACTER TAB -->
    <div id="pf-pane-char" style="display:none;flex-direction:column;gap:10px;">
      <div class="list-group">
        <div class="pf-section-label">
          <span>Body &amp; Appearance</span>
          <span class="pf-inject-badge">항상 적용</span>
        </div>
        <div class="pf-field-wrap">
          <textarea class="pf-textarea" id="pf-charBody"
            placeholder="키, 체형, 외형적 특징 등&#10;예: 넓은 어깨, 근육질 체형, 왼쪽 어깨 흉터">${escTA(store.charBody || '')}${escTA(store.charMarks ? (store.charBody ? '\n' + store.charMarks : store.charMarks) : '')}</textarea>
        </div>
      </div>
      <div class="list-group">
        <div class="pf-section-label">
          <span>Sexual</span>
          <span class="pf-inject-badge">성적 씬에서만 적용</span>
        </div>
        <div class="pf-field-wrap">
          <textarea class="pf-textarea" id="pf-charSexual"
            placeholder="성감대, 반응 패턴, 특이사항 등&#10;예: 귀 뒤쪽과 목덜미 예민함, 낮고 조용한 신음">${escTA(store.charErogenous || '')}</textarea>
        </div>
      </div>
    </div>

    <div style="height:80px;"></div>
  `;

  // auto-resize all textareas
  document.querySelectorAll('.pf-textarea').forEach(ta => {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
    ta.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  });

  // Save bar
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = '<button class="save-btn" id="pf-save-btn">Save</button>';
  document.getElementById('popup').appendChild(saveBar);
  document.getElementById('pf-save-btn').onclick = pfSave;
}

window.pfSwitchTab = function (tab) {
  document.getElementById('pf-tab-user').className = 'tab-item' + (tab === 'user' ? ' active' : '');
  document.getElementById('pf-tab-char').className = 'tab-item' + (tab === 'char' ? ' active' : '');
  document.getElementById('pf-pane-user').style.display = tab === 'user' ? 'flex' : 'none';
  document.getElementById('pf-pane-char').style.display = tab === 'char' ? 'flex' : 'none';
};

function pfSave() {
  // Body & Appearance = 기존 userBody 필드에 통합 저장 (userMarks 비움)
  const data = {
    userBody:      document.getElementById('pf-userBody')?.value  || '',
    userMarks:     '',
    userErogenous: document.getElementById('pf-userSexual')?.value || '',
    charBody:      document.getElementById('pf-charBody')?.value  || '',
    charMarks:     '',
    charErogenous: document.getElementById('pf-charSexual')?.value || '',
  };
  doSave(() => {
    if (window.parent?.__PC_STORE__) Object.assign(window.parent.__PC_STORE__, data);
    Object.assign(store, data);
  });
}
