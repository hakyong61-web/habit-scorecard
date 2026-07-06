// ─── 상수 ───────────────────────────────────────────
const STORAGE_KEY = 'hsc_v3';
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAY_NAMES   = ['일','월','화','수','목','금','토'];
const COLORS = [
  '#8B5CF6','#3B82F6','#10B981','#F59E0B','#06B6D4',
  '#EC4899','#6366F1','#EF4444','#F97316','#14B8A6'
];

const DEFAULT_HABITS = [
  { id:1,  name:'🧘 좌선 20분/일',    color:'#8B5CF6' },
  { id:2,  name:'📚 배움 2시간/일',   color:'#3B82F6' },
  { id:3,  name:'🤝 봉사 1시간/일',   color:'#10B981' },
  { id:4,  name:'💪 운동 2시간/일',   color:'#F59E0B' },
  { id:5,  name:'💻 디지털 2시간/일', color:'#06B6D4' },
  { id:6,  name:'🙏 감사 10분/일',    color:'#EC4899' },
  { id:7,  name:'🌙 숙면 6시간/일',   color:'#6366F1' },
  { id:8,  name:'🩸 혈당 150/월목',   color:'#EF4444' },
  { id:9,  name:'🏃 런닝 30분/주',    color:'#F97316' },
  { id:10, name:'🏔️ 산행 2시간/격주', color:'#14B8A6' },
];

// ─── 저장 / 불러오기 ─────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      habits: state.habits,
      checks: state.checks,
      year:   state.year,
      month:  state.month
    }));
    const b = document.getElementById('saveBadge');
    if (b) {
      b.textContent = '✅ 저장됨';
      clearTimeout(window._saveTimer);
      window._saveTimer = setTimeout(() => { b.textContent = '💾 자동저장 ON'; }, 1500);
    }
  } catch(e) {}
}

// ─── 초기 상태 ───────────────────────────────────────
const today = new Date();
const saved  = loadState();

const state = {
  habits:     saved?.habits  || DEFAULT_HABITS,
  checks:     saved?.checks  || {},
  year:       saved?.year    || today.getFullYear(),
  month:      saved?.month   || today.getMonth(),
  view:       'month',
  tab:        'tracker',
  newName:    '',
  editingId:  null,
  editingName: ''
};

// ─── 유틸 ───────────────────────────────────────────
const daysIn   = (y, m) => new Date(y, m+1, 0).getDate();
const firstDay = (y, m) => new Date(y, m, 1).getDay();
const makeKey  = (y, m, d, hid) =>
  `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}-${hid}`;
const isChk    = (y, m, d, hid) => !!state.checks[makeKey(y, m, d, hid)];
const sc       = p => p >= 80 ? '#10B981' : p >= 50 ? '#F59E0B' : '#EF4444';
const dayScore = (y, m, d) => state.habits.filter(h => isChk(y, m, d, h.id)).length;

const getWeekDates = () => {
  const c = new Date(today);
  const f = new Date(c.setDate(c.getDate() - c.getDay()));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(f);
    dd.setDate(f.getDate() + i);
    return dd;
  });
};

const calcStats = () => {
  const days = daysIn(state.year, state.month);
  let done = 0;
  for (let d = 1; d <= days; d++)
    state.habits.forEach(h => { if (isChk(state.year, state.month, d, h.id)) done++; });
  const total = state.habits.length * days;
  return { done, total, pct: total ? Math.round(done / total * 100) : 0, days };
};

// ─── 링 SVG ─────────────────────────────────────────
function makeRing(pct, size, sw) {
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - circ * pct / 100;
  const color = sc(pct);
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
      style="position:absolute;top:0;left:0;">
      <circle cx="${size/2}" cy="${size/2}" r="${r}"
        fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${sw}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}"
        fill="none" stroke="${color}" stroke-width="${sw}"
        stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"
        style="transition:all 0.5s;"/>
    </svg>
    <div style="position:absolute;inset:${sw+2}px;border-radius:50%;
      background:#1a1535;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:${size>60?18:12}px;font-weight:900;color:${color};">${pct}%</span>
    </div>`;
}

// ─── 탭 / 뷰 전환 ────────────────────────────────────
function setTab(t) { state.tab = t; render(); }
function setView(v) { state.view = v; render(); }

function prevMonth() {
  if (state.month === 0) { state.month = 11; state.year--; }
  else state.month--;
  saveState(); render();
}
function nextMonth() {
  if (state.month === 11) { state.month = 0; state.year++; }
  else state.month++;
  saveState(); render();
}

// ─── 체크 토글 ───────────────────────────────────────
function toggle(y, m, d, hid) {
  state.checks[makeKey(y, m, d, hid)] = !isChk(y, m, d, hid);
  saveState();
  render();
}

// ─── 습관 추가 ───────────────────────────────────────
function addHabit() {
  const inp  = document.getElementById('newHabitInp');
  const name = inp ? inp.value.trim() : '';
  if (!name) return;
  state.habits.push({
    id:    Date.now(),
    name,
    color: COLORS[state.habits.length % COLORS.length]
  });
  state.newName = '';
  saveState(); render();
}

// ─── 습관 수정 ───────────────────────────────────────
function startEdit(id) {
  const h = state.habits.find(h => h.id === id);
  if (!h) return;
  state.editingId   = id;
  state.editingName = h.name;
  render();
  setTimeout(() => {
    const inp = document.getElementById('editInp_' + id);
    if (inp) { inp.focus(); inp.select(); }
  }, 50);
}

function saveEdit(id) {
  const inp  = document.getElementById('editInp_' + id);
  const name = inp ? inp.value.trim() : '';
  if (!name) return;
  state.habits = state.habits.map(h => h.id === id ? { ...h, name } : h);
  state.editingId   = null;
  state.editingName = '';
  saveState(); render();
}

function cancelEdit() {
  state.editingId   = null;
  state.editingName = '';
  render();
}

// ─── 습관 삭제 ───────────────────────────────────────
function removeHabit(id) {
  if (!confirm('이 습관을 삭제할까요?')) return;
  state.habits = state.habits.filter(h => h.id !== id);
  saveState(); render();
}

// ─── 데이터 백업 / 초기화 ────────────────────────────
function exportData() {
  const json = JSON.stringify({ habits: state.habits, checks: state.checks }, null, 2);
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = `habit-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

function resetChecks() {
  if (!confirm('모든 체크 기록을 삭제할까요?')) return;
  state.checks = {};
  saveState(); render();
}

// ─── 메인 렌더 ───────────────────────────────────────
function render() {
  // 탭 활성화
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['tracker','stats','settings'][i] === state.tab);
  });

  // 헤더 링
  const { pct } = calcStats();
  const hr = document.getElementById('headerRing');
  if (hr) {
    hr.style.cssText = 'position:relative;width:52px;height:52px;flex-shrink:0;';
    hr.innerHTML     = makeRing(pct, 52, 5);
  }

  // 본문
  const body = document.getElementById('mainBody');
  if (!body) return;
  if      (state.tab === 'tracker')  body.innerHTML = renderTracker();
  else if (state.tab === 'stats')    body.innerHTML = renderStats();
  else                                body.innerHTML = renderSettings();

  // 새 습관 입력창 이벤트
  const inp = document.getElementById('newHabitInp');
  if (inp) {
    inp.value = state.newName;
    inp.addEventListener('input',   e => { state.newName = e.target.value; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });
  }

  // 수정 입력창 이벤트
  if (state.editingId) {
    const ei = document.getElementById('editInp_' + state.editingId);
    if (ei) {
      ei.addEventListener('input',   e => { state.editingName = e.target.value; });
      ei.addEventListener('keydown', e => {
        if (e.key === 'Enter')  saveEdit(state.editingId);
        if (e.key === 'Escape') cancelEdit();
      });
    }
  }
}

// ─── 트래커 렌더 ─────────────────────────────────────
function renderTracker() {
  const { year:y, month:m, habits, view } = state;
  const days = daysIn(y, m);

  let html = `<div class="view-bar">
    <div class="toggle-group">
      <button class="toggle-btn ${view==='month'?'active':''}" onclick="setView('month')">월간</button>
      <button class="toggle-btn ${view==='week'?'active':''}"  onclick="setView('week')">주간</button>
    </div>`;

  if (view === 'month') {
    html += `<div class="nav">
      <button class="nav-btn" onclick="prevMonth()">‹</button>
      <span class="nav-label">${y}년 ${MONTH_NAMES[m]}</span>
      <button class="nav-btn" onclick="nextMonth()">›</button>
    </div>`;
  } else {
    html += `<span style="font-weight:700;font-size:12px;">이번 주</span>`;
  }
  html += `</div>`;

  if (view === 'month') {
    // ── 월간 뷰 ──
    const cols = `130px repeat(${days}, minmax(26px,1fr))`;
    html += `<div class="grid-wrap">
      <div class="month-grid" style="grid-template-columns:${cols};">`;

    // 헤더행
    html += `<div style="padding:8px 10px;font-size:11px;color:#94a3b8;font-weight:700;
      border-bottom:1px solid rgba(255,255,255,0.07);">습관</div>`;

    for (let d = 1; d <= days; d++) {
      const dow   = new Date(y, m, d).getDay();
      const isTod = today.getDate()===d && today.getMonth()===m && today.getFullYear()===y;
      const c     = isTod ? '#8B5CF6' : dow===0 ? '#EF4444' : dow===6 ? '#3B82F6' : '#64748b';
      html += `<div style="padding:5px 1px;text-align:center;font-size:9px;font-weight:700;
        color:${c};${isTod?'background:rgba(139,92,246,0.1);':''}
        border-left:1px solid rgba(255,255,255,0.04);
        border-bottom:1px solid rgba(255,255,255,0.07);">
        ${d}<br><span style="font-size:8px;">${DAY_NAMES[dow]}</span>
      </div>`;
    }

    // 습관 행 (★ 글씨 굵게: font-size:12px, font-weight:700)
    habits.forEach(h => {
      html += `<div style="padding:6px 10px;font-size:12px;font-weight:700;
        display:flex;align-items:center;gap:5px;
        border-bottom:1px solid rgba(255,255,255,0.04);color:#e2e8f0;">
        <div style="width:4px;height:18px;border-radius:2px;
          background:${h.color};flex-shrink:0;"></div>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h.name}</span>
      </div>`;

      for (let d = 1; d <= days; d++) {
        const chk = isChk(y, m, d, h.id);
        html += `<div class="grid-cell"
          style="background:${chk ? h.color+'22' : 'transparent'};"
          onclick="toggle(${y},${m},${d},${h.id})">
          ${chk
            ? `<div class="check-done"
                style="background:${h.color};box-shadow:0 0 6px ${h.color}66;">✓</div>`
            : `<div class="check-empty"></div>`}
        </div>`;
      }
    });

    // 일별 점수 행
    html += `<div style="padding:6px 10px;font-size:10px;color:#64748b;font-weight:700;
      display:flex;align-items:center;background:rgba(255,255,255,0.02);">일별점수</div>`;
    for (let d = 1; d <= days; d++) {
      const s  = dayScore(y, m, d);
      const p  = habits.length ? Math.round(s / habits.length * 100) : 0;
      const bg = p>=80 ? 'rgba(16,185,129,0.22)'
               : p>=50 ? 'rgba(245,158,11,0.17)'
               : s>0   ? 'rgba(239,68,68,0.12)' : 'transparent';
      html += `<div style="display:flex;align-items:center;justify-content:center;
        padding:5px 1px;font-size:9px;font-weight:800;
        border-left:1px solid rgba(255,255,255,0.04);
        background:${bg};color:${sc(p)};">${s > 0 ? s : '·'}</div>`;
    }
    html += `</div></div>`;

  } else {
    // ── 주간 뷰 ──
    const wk = getWeekDates();
    html += `<div class="grid-wrap"><div class="week-header-row">`;

    wk.forEach((d, i) => {
      const isTod = d.toDateString() === today.toDateString();
      const s     = dayScore(d.getFullYear(), d.getMonth(), d.getDate());
      html += `<div style="padding:10px 4px;text-align:center;
        ${isTod ? 'background:rgba(139,92,246,0.1);' : ''}
        ${i > 0 ? 'border-left:1px solid rgba(255,255,255,0.06);' : ''}">
        <div style="font-size:9px;font-weight:700;
          color:${i===0?'#EF4444':i===6?'#3B82F6':'#94a3b8'};">${DAY_NAMES[i]}</div>
        <div style="font-size:17px;font-weight:800;
          color:${isTod?'#a78bfa':'#e2e8f0'};margin-top:2px;">${d.getDate()}</div>
        <div style="font-size:8px;color:#64748b;margin-top:1px;">${s}/${habits.length}</div>
      </div>`;
    });
    html += `</div>`;

    habits.forEach(h => {
      html += `<div style="border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="padding:5px 10px;font-size:11px;font-weight:700;color:#e2e8f0;
          display:flex;align-items:center;gap:5px;
          border-bottom:1px solid rgba(255,255,255,0.03);">
          <div style="width:7px;height:7px;border-radius:2px;background:${h.color};"></div>
          ${h.name}
        </div>
        <div class="week-cells">`;

      wk.forEach((d, i) => {
        const chk   = isChk(d.getFullYear(), d.getMonth(), d.getDate(), h.id);
        const isTod = d.toDateString() === today.toDateString();
        html += `<div class="week-cell"
          style="background:${chk ? h.color+'22' : isTod ? 'rgba(139,92,246,0.05)' : 'transparent'};
                 ${i > 0 ? 'border-left:1px solid rgba(255,255,255,0.04);' : ''}"
          onclick="toggle(${d.getFullYear()},${d.getMonth()},${d.getDate()},${h.id})">
          ${chk
            ? `<div style="width:27px;height:27px;border-radius:7px;
                background:linear-gradient(135deg,${h.color},${h.color}bb);
                display:flex;align-items:center;justify-content:center;
                font-size:15px;box-shadow:0 0 10px ${h.color}44;">✓</div>`
            : `<div style="width:27px;height:27px;border-radius:7px;
                border:1.5px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.02);"></div>`}
        </div>`;
      });
      html += `</div></div>`;
    });
    html += `</div>`;
  }
  return html;
}

// ─── 통계 렌더 ───────────────────────────────────────
function renderStats() {
  const { year:y, month:m, habits } = state;
  const { done, total, pct, days }  = calcStats();
  const msg = pct>=80 ? '🌟 훌륭합니다! 엔트로피를 이기고 있어요'
            : pct>=50 ? '💪 좋아요! 꾸준함이 승리입니다'
            :            '🔥 지금이 시작입니다. 작은 습관부터!';

  let html = `
    <div class="nav" style="margin-bottom:14px;">
      <button class="nav-btn" onclick="prevMonth()">‹</button>
      <span class="nav-label">${y}년 ${MONTH_NAMES[m]}</span>
      <button class="nav-btn" onclick="nextMonth()">›</button>
    </div>
    <div class="stat-card">
      <div style="position:relative;width:76px;height:76px;flex-shrink:0;">
        ${makeRing(pct, 76, 6)}
      </div>
      <div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">이번 달 전체 실천율</div>
        <div style="font-size:24px;font-weight:900;">${done}
          <span style="font-size:13px;color:#64748b;font-weight:400;"> / ${total}</span>
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:4px;">${msg}</div>
      </div>
    </div>`;

  const hStats = habits.map(h => {
    let d = 0;
    for (let dd = 1; dd <= days; dd++) if (isChk(y, m, dd, h.id)) d++;
    return { ...h, done: d, pct: Math.round(d / days * 100) };
  }).sort((a, b) => b.pct - a.pct);

  hStats.forEach(h => {
    html += `<div class="habit-stat-item">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;">
          <div style="width:7px;height:7px;border-radius:2px;background:${h.color};"></div>
          ${h.name}
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:11px;color:#64748b;">${h.done}일/${days}일</span>
          <span style="font-size:13px;font-weight:800;color:${sc(h.pct)};">${h.pct}%</span>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill"
          style="width:${h.pct}%;background:linear-gradient(90deg,${h.color},${h.color}bb);
                 box-shadow:0 0 6px ${h.color}55;"></div>
      </div>
    </div>`;
  });

  // 히트맵
  const fd = firstDay(y, m);
  html += `<div class="heatmap-wrap">
    <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:10px;">
      📅 일별 달성 현황
    </div>
    <div class="heatmap-grid">`;

  DAY_NAMES.forEach(d => {
    html += `<div style="text-align:center;font-size:9px;color:#475569;
      padding-bottom:3px;font-weight:700;">${d}</div>`;
  });
  for (let i = 0; i < fd; i++) html += `<div></div>`;

  for (let d = 1; d <= days; d++) {
    const s     = dayScore(y, m, d);
    const p     = habits.length ? s / habits.length : 0;
    const isTod = today.getDate()===d && today.getMonth()===m && today.getFullYear()===y;
    const bg    = p>=0.8 ? 'rgba(16,185,129,0.3)'
                : p>=0.5 ? 'rgba(245,158,11,0.25)'
                : p>0    ? 'rgba(239,68,68,0.2)'
                :           'rgba(255,255,255,0.04)';
    html += `<div class="heatmap-day"
      style="background:${bg};
             border:${isTod?'1.5px solid #8B5CF6':'1px solid rgba(255,255,255,0.04)'};">
      <span style="font-size:10px;font-weight:700;
        color:${isTod?'#a78bfa':'#e2e8f0'};">${d}</span>
      ${s > 0 ? `<span style="font-size:8px;color:${sc(Math.round(p*100))};">${s}</span>` : ''}
    </div>`;
  }

  html += `</div>
    <div style="display:flex;gap:10px;margin-top:10px;justify-content:center;">
      ${[['rgba(16,185,129,0.3)','80%+'],['rgba(245,158,11,0.25)','50%+'],
         ['rgba(239,68,68,0.2)','1개+'],['rgba(255,255,255,0.04)','미실천']]
        .map(([bg,l]) => `
          <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:10px;height:10px;border-radius:2px;background:${bg};"></div>
            <span style="font-size:9px;color:#64748b;">${l}</span>
          </div>`).join('')}
    </div>
  </div>`;

  return html;
}

// ─── 설정 렌더 ───────────────────────────────────────
function renderSettings() {
  let html = `
    <p style="font-size:12px;color:#94a3b8;margin-bottom:14px;line-height:1.6;">
      나만의 비전 기반 습관을 추가하거나 수정하세요.<br>
      <span style="color:#8B5CF6;">각 습관은 당신의 비전카드와 연결됩니다.</span>
    </p>
    <div class="add-row">
      <input class="add-input" id="newHabitInp" placeholder="새 습관 입력 (예: 🧘 명상 10분/일)">
      <button class="add-btn" onclick="addHabit()">+ 추가</button>
    </div>`;

  state.habits.forEach(h => {
    if (state.editingId === h.id) {
      // 수정 중 → 인라인 입력창
      html += `<div class="edit-row">
        <div style="width:10px;height:10px;border-radius:2px;
          background:${h.color};flex-shrink:0;"></div>
        <input class="edit-input" id="editInp_${h.id}"
          value="${h.name.replace(/"/g,'&quot;')}">
        <button class="save-edit-btn" onclick="saveEdit(${h.id})">저장</button>
        <button class="cancel-edit-btn" onclick="cancelEdit()">취소</button>
      </div>`;
    } else {
      // 일반 표시 → 수정 + 삭제 버튼
      html += `<div class="habit-row-item">
        <div style="width:10px;height:10px;border-radius:2px;
          background:${h.color};flex-shrink:0;"></div>
        <span style="flex:1;font-size:12px;font-weight:600;">${h.name}</span>
        <button class="edit-btn" onclick="startEdit(${h.id})">✏️ 수정</button>
        <button class="del-btn"  onclick="removeHabit(${h.id})">삭제</button>
      </div>`;
    }
  });

  html += `
    <div class="entropy-box">
      <div style="font-size:11px;font-weight:700;color:#a78bfa;margin-bottom:5px;">
        💡 엔트로피 법칙
      </div>
      <div style="font-size:11px;color:#94a3b8;line-height:1.7;">
        에너지를 투입하지 않으면 모든 시스템은 무질서해집니다.<br>
        매일 습관을 실천하는 것은 삶의 엔트로피를 낮추는 행위입니다.<br>
        작은 실천이 모여 비전에 가까워집니다.
      </div>
    </div>
    <div class="save-info-box">
      <div style="font-size:11px;font-weight:700;color:#10B981;margin-bottom:5px;">
        💾 데이터 자동저장
      </div>
      <div style="font-size:11px;color:#94a3b8;line-height:1.7;">
        체크한 내용이 각자 기기에 자동으로 저장됩니다.<br>
        앱을 닫았다 열어도 데이터가 그대로 유지됩니다.<br>
        다른 사람과 링크를 공유해도 각자 데이터는 따로 저장됩니다.
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="action-btn"
          style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#10B981;"
          onclick="exportData()">📤 데이터 백업</button>
        <button class="action-btn"
          style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#EF4444;"
          onclick="resetChecks()">🗑️ 기록 초기화</button>
      </div>
    </div>`;

  return html;
}

// ─── 앱 시작 ─────────────────────────────────────────
render();
