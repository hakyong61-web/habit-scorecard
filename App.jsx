import { useState, useEffect, useCallback } from "react";

// ───────────────────────────────────────────────
// 기본 데이터
// ───────────────────────────────────────────────
const DEFAULT_HABITS = [
  { id: 1,  name: "🧘 좌선 20분/일",    color: "#8B5CF6" },
  { id: 2,  name: "📚 배움 2시간/일",   color: "#3B82F6" },
  { id: 3,  name: "🤝 봉사 1시간/일",   color: "#10B981" },
  { id: 4,  name: "💪 운동 2시간/일",   color: "#F59E0B" },
  { id: 5,  name: "💻 디지털 2시간/일", color: "#06B6D4" },
  { id: 6,  name: "🙏 감사 10분/일",    color: "#EC4899" },
  { id: 7,  name: "🌙 숙면 6시간/일",   color: "#6366F1" },
  { id: 8,  name: "🩸 혈당 150/월목",   color: "#EF4444" },
  { id: 9,  name: "🏃 런닝 30분/주",    color: "#F97316" },
  { id: 10, name: "🏔️ 산행 2시간/격주", color: "#14B8A6" },
];

const COLORS = [
  "#8B5CF6","#3B82F6","#10B981","#F59E0B","#06B6D4",
  "#EC4899","#6366F1","#EF4444","#F97316","#14B8A6",
];

const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_NAMES   = ["일","월","화","수","목","금","토"];
const STORAGE_KEY = "habit_scorecard_data";

// ───────────────────────────────────────────────
// 유틸
// ───────────────────────────────────────────────
const getDaysInMonth  = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
const makeKey = (y, m, d, hid) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}-${hid}`;

const scoreColor = (pct) =>
  pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";

// ───────────────────────────────────────────────
// localStorage 헬퍼
// ───────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ───────────────────────────────────────────────
// 메인 컴포넌트
// ───────────────────────────────────────────────
export default function App() {
  const today = new Date();

  // ── 상태 초기화: localStorage 우선, 없으면 기본값 ──
  const init = loadFromStorage();

  const [habits,       setHabits]       = useState(init?.habits       ?? DEFAULT_HABITS);
  const [checks,       setChecks]       = useState(init?.checks       ?? {});
  const [currentYear,  setCurrentYear]  = useState(init?.currentYear  ?? today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(init?.currentMonth ?? today.getMonth());
  const [viewMode,     setViewMode]     = useState("month");
  const [activeTab,    setActiveTab]    = useState("tracker");
  const [newHabitName, setNewHabitName] = useState("");
  const [saveStatus,   setSaveStatus]   = useState("saved"); // "saved" | "saving"

  // ── 저장 트리거: habits 또는 checks 변경 시 자동 저장 ──
  useEffect(() => {
    setSaveStatus("saving");
    const ok = saveToStorage({ habits, checks, currentYear, currentMonth });
    const timer = setTimeout(() => setSaveStatus(ok ? "saved" : "error"), 400);
    return () => clearTimeout(timer);
  }, [habits, checks, currentYear, currentMonth]);

  // ── 체크 토글 ──
  const toggle = useCallback((y, m, d, hid) => {
    const k = makeKey(y, m, d, hid);
    setChecks(prev => ({ ...prev, [k]: !prev[k] }));
  }, []);

  const isChecked = (y, m, d, hid) => !!checks[makeKey(y, m, d, hid)];

  // ── 통계 계산 ──
  const daysInMonth  = getDaysInMonth(currentYear, currentMonth);
  const totalPossible = habits.length * daysInMonth;

  let totalDone = 0;
  for (let d = 1; d <= daysInMonth; d++)
    habits.forEach(h => { if (isChecked(currentYear, currentMonth, d, h.id)) totalDone++; });

  const overallPct = totalPossible ? Math.round((totalDone / totalPossible) * 100) : 0;

  const habitStats = habits.map(h => {
    let done = 0;
    for (let d = 1; d <= daysInMonth; d++)
      if (isChecked(currentYear, currentMonth, d, h.id)) done++;
    return { ...h, done, pct: Math.round((done / daysInMonth) * 100) };
  });

  const getDayScore = (y, m, d) =>
    habits.filter(h => isChecked(y, m, d, h.id)).length;

  // ── 이번 주 날짜 ──
  const getWeekDates = () => {
    const curr  = new Date(today);
    const first = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(first);
      dd.setDate(first.getDate() + i);
      return dd;
    });
  };
  const weekDates = getWeekDates();

  // ── 월 이동 ──
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // ── 습관 추가/삭제 ──
  const addHabit = () => {
    if (!newHabitName.trim()) return;
    setHabits(prev => [...prev, {
      id:    Date.now(),
      name:  newHabitName.trim(),
      color: COLORS[prev.length % COLORS.length],
    }]);
    setNewHabitName("");
  };
  const removeHabit = (id) => setHabits(prev => prev.filter(h => h.id !== id));

  // ── 데이터 내보내기 ──
  const exportData = () => {
    const json = JSON.stringify({ habits, checks }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `habit-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── 데이터 초기화 ──
  const resetData = () => {
    if (!window.confirm("모든 체크 기록을 삭제하시겠습니까?")) return;
    setChecks({});
  };

  // ── 배경색 ──
  const dayScoreBg = (score) => {
    const pct = habits.length ? score / habits.length : 0;
    if (pct >= 0.8) return "rgba(16,185,129,0.25)";
    if (pct >= 0.5) return "rgba(245,158,11,0.2)";
    if (pct > 0)    return "rgba(239,68,68,0.15)";
    return "transparent";
  };

  // ════════════════════════════════════════════
  // 렌더링
  // ════════════════════════════════════════════
  const s = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",
      fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif",
      color: "#e2e8f0",
      fontSize: 13,
    },
    header: {
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      padding: "16px 16px 0",
      position: "sticky", top: 0, zIndex: 100,
    },
    headerTop: {
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: 12,
    },
    tab: (active) => ({
      flex: 1, padding: "9px 0", fontSize: 11, fontWeight: 700,
      background: active ? "rgba(139,92,246,0.3)" : "transparent",
      color: active ? "#a78bfa" : "#94a3b8",
      border: "none",
      borderBottom: active ? "2px solid #8B5CF6" : "2px solid transparent",
      cursor: "pointer", borderRadius: "4px 4px 0 0", transition: "all 0.2s",
    }),
    navBtn: {
      background: "rgba(255,255,255,0.08)", border: "none", color: "#e2e8f0",
      borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14,
    },
    gridWrap: {
      background: "rgba(255,255,255,0.03)", borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.07)", overflowX: "auto",
    },
    card: {
      background: "rgba(255,255,255,0.03)", borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px",
      marginBottom: 8,
    },
  };

  // 저장 상태 뱃지
  const saveBadge = saveStatus === "saving"
    ? { text: "저장 중...", bg: "rgba(245,158,11,0.2)", border: "rgba(245,158,11,0.4)", color: "#F59E0B" }
    : saveStatus === "error"
    ? { text: "저장 실패", bg: "rgba(239,68,68,0.2)", border: "rgba(239,68,68,0.4)", color: "#EF4444" }
    : { text: "💾 자동저장 ON", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)", color: "#10B981" };

  // ── 도넛 링 ──
  const Ring = ({ pct, size = 52, strokeWidth = 5 }) => {
    const r = (size - strokeWidth * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (circ * pct) / 100;
    const c = scoreColor(pct);
    return (
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={c} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s" }} />
        </svg>
        <div style={{
          position: "absolute", inset: strokeWidth + 2, borderRadius: "50%",
          background: "#1a1535", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: size > 60 ? 18 : 12, fontWeight: 900,
            color: c, lineHeight: 1 }}>{pct}%</span>
        </div>
      </div>
    );
  };

  // ── 월간 트래커 ──
  const MonthTracker = () => {
    const cols = `120px repeat(${daysInMonth}, minmax(28px,1fr))`;
    return (
      <div style={s.gridWrap}>
        <div style={{ display: "grid", gridTemplateColumns: cols, minWidth: "max-content" }}>
          {/* 헤더 행 */}
          <div style={{ padding: "8px 10px", fontSize: 10, color: "#64748b", fontWeight: 700,
            borderBottom: "1px solid rgba(255,255,255,0.07)" }}>습관</div>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
            const dow = new Date(currentYear, currentMonth, d).getDay();
            const isTod = today.getDate() === d && today.getMonth() === currentMonth
              && today.getFullYear() === currentYear;
            return (
              <div key={d} style={{
                padding: "5px 1px", textAlign: "center", fontSize: 9, fontWeight: 700,
                color: isTod ? "#8B5CF6" : dow === 0 ? "#EF4444" : dow === 6 ? "#3B82F6" : "#64748b",
                background: isTod ? "rgba(139,92,246,0.1)" : "transparent",
                borderLeft: "1px solid rgba(255,255,255,0.04)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div>{d}</div>
                <div style={{ fontSize: 8, opacity: 0.7 }}>{DAY_NAMES[dow]}</div>
              </div>
            );
          })}

          {/* 습관 행 */}
          {habits.map(h => (
            <>
              <div key={`name-${h.id}`} style={{
                padding: "6px 10px", fontSize: 10,
                display: "flex", alignItems: "center", gap: 5,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ width: 3, height: 18, borderRadius: 2,
                  background: h.color, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap" }}>{h.name}</span>
              </div>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const chk = isChecked(currentYear, currentMonth, d, h.id);
                return (
                  <div key={`${h.id}-${d}`}
                    onClick={() => toggle(currentYear, currentMonth, d, h.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", minHeight: 32,
                      borderLeft: "1px solid rgba(255,255,255,0.04)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: chk ? `${h.color}22` : "transparent",
                      transition: "background 0.12s",
                    }}>
                    {chk
                      ? <div style={{
                          width: 18, height: 18, borderRadius: 4,
                          background: h.color, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: 11, boxShadow: `0 0 6px ${h.color}66`,
                        }}>✓</div>
                      : <div style={{
                          width: 18, height: 18, borderRadius: 4,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.02)",
                        }} />}
                  </div>
                );
              })}
            </>
          ))}

          {/* 일별 점수 행 */}
          <div style={{ padding: "6px 10px", fontSize: 10, color: "#64748b",
            fontWeight: 700, display: "flex", alignItems: "center",
            background: "rgba(255,255,255,0.02)" }}>일별점수</div>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
            const score = getDayScore(currentYear, currentMonth, d);
            const pct = habits.length ? Math.round(score / habits.length * 100) : 0;
            return (
              <div key={d} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "5px 1px", fontSize: 9, fontWeight: 800,
                borderLeft: "1px solid rgba(255,255,255,0.04)",
                background: dayScoreBg(score),
                color: scoreColor(pct),
              }}>
                {score > 0 ? score : "·"}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── 주간 트래커 ──
  const WeekTracker = () => (
    <div style={s.gridWrap}>
      {/* 요일 헤더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)",
        borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {weekDates.map((d, i) => {
          const isTod = d.toDateString() === today.toDateString();
          const score = getDayScore(d.getFullYear(), d.getMonth(), d.getDate());
          return (
            <div key={i} style={{
              padding: "10px 4px", textAlign: "center",
              background: isTod ? "rgba(139,92,246,0.1)" : "transparent",
              borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700,
                color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#94a3b8" }}>
                {DAY_NAMES[i]}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800,
                color: isTod ? "#a78bfa" : "#e2e8f0", marginTop: 2 }}>
                {d.getDate()}
              </div>
              <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>
                {score}/{habits.length}
              </div>
            </div>
          );
        })}
      </div>
      {/* 습관 행 */}
      {habits.map(h => (
        <div key={h.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{
            padding: "5px 10px", fontSize: 10, color: "#94a3b8",
            display: "flex", alignItems: "center", gap: 5,
            borderBottom: "1px solid rgba(255,255,255,0.03)",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: h.color }} />
            {h.name}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
            {weekDates.map((d, i) => {
              const chk = isChecked(d.getFullYear(), d.getMonth(), d.getDate(), h.id);
              const isTod = d.toDateString() === today.toDateString();
              return (
                <div key={i}
                  onClick={() => toggle(d.getFullYear(), d.getMonth(), d.getDate(), h.id)}
                  style={{
                    height: 50, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    background: chk ? `${h.color}22` : isTod ? "rgba(139,92,246,0.05)" : "transparent",
                    borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    transition: "background 0.12s",
                  }}>
                  {chk
                    ? <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: `linear-gradient(135deg,${h.color},${h.color}bb)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, boxShadow: `0 0 10px ${h.color}44`,
                      }}>✓</div>
                    : <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        border: "1.5px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.02)",
                      }} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── 통계 탭 ──
  const StatsTab = () => {
    const msg = overallPct >= 80
      ? "🌟 훌륭합니다! 엔트로피를 이기고 있어요"
      : overallPct >= 50 ? "💪 좋아요! 꾸준함이 승리입니다"
      : "🔥 지금이 시작입니다. 작은 습관부터!";

    const fdow = getFirstDayOfMonth(currentYear, currentMonth);

    return (
      <>
        {/* 월 네비 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button style={s.navBtn} onClick={prevMonth}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {currentYear}년 {MONTH_NAMES[currentMonth]}
          </span>
          <button style={s.navBtn} onClick={nextMonth}>›</button>
        </div>

        {/* 전체 실천율 카드 */}
        <div style={{
          background: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.15))",
          border: "1px solid rgba(139,92,246,0.3)", borderRadius: 14,
          padding: 18, marginBottom: 14,
          display: "flex", alignItems: "center", gap: 18,
        }}>
          <Ring pct={overallPct} size={76} strokeWidth={6} />
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>이번 달 전체 실천율</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>
              {totalDone}
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400 }}> / {totalPossible}</span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{msg}</div>
          </div>
        </div>

        {/* 습관별 통계 */}
        {[...habitStats].sort((a, b) => b.pct - a.pct).map(h => (
          <div key={h.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: h.color }} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{h.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>{h.done}일/{daysInMonth}일</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(h.pct) }}>
                  {h.pct}%
                </span>
              </div>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.06)",
              borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${h.pct}%`,
                background: `linear-gradient(90deg,${h.color},${h.color}bb)`,
                borderRadius: 3, transition: "width 0.5s ease",
                boxShadow: `0 0 7px ${h.color}55`,
              }} />
            </div>
          </div>
        ))}

        {/* 히트맵 */}
        <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)", padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>
            📅 일별 달성 현황
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 9,
                color: "#475569", paddingBottom: 3, fontWeight: 700 }}>{d}</div>
            ))}
            {Array.from({ length: fdow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
              const score = getDayScore(currentYear, currentMonth, d);
              const pct   = habits.length ? score / habits.length : 0;
              const isTod = today.getDate() === d && today.getMonth() === currentMonth
                && today.getFullYear() === currentYear;
              const bg = pct >= 0.8 ? "rgba(16,185,129,0.3)"
                : pct >= 0.5 ? "rgba(245,158,11,0.25)"
                : pct > 0    ? "rgba(239,68,68,0.2)"
                :               "rgba(255,255,255,0.04)";
              return (
                <div key={d} style={{
                  aspectRatio: "1", borderRadius: 5,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: bg,
                  border: isTod ? "1.5px solid #8B5CF6" : "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700,
                    color: isTod ? "#a78bfa" : "#e2e8f0" }}>{d}</span>
                  {score > 0 && (
                    <span style={{ fontSize: 8, color: scoreColor(Math.round(pct * 100)) }}>
                      {score}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* 범례 */}
          <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "center" }}>
            {[
              ["rgba(16,185,129,0.3)",  "80%+"],
              ["rgba(245,158,11,0.25)", "50%+"],
              ["rgba(239,68,68,0.2)",   "1개+"],
              ["rgba(255,255,255,0.04)","미실천"],
            ].map(([bg, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />
                <span style={{ fontSize: 9, color: "#64748b" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  // ── 설정 탭 ──
  const SettingsTab = () => (
    <>
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.6 }}>
        나만의 비전 기반 습관을 추가하거나 수정하세요.<br />
        <span style={{ color: "#8B5CF6" }}>각 습관은 당신의 비전카드와 연결됩니다.</span>
      </p>

      {/* 추가 입력 */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
        <input
          value={newHabitName}
          onChange={e => setNewHabitName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addHabit()}
          placeholder="새 습관 입력 (예: 🧘 명상 10분/일)"
          style={{
            flex: 1, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 9, padding: "9px 12px",
            color: "#e2e8f0", fontSize: 12, outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button onClick={addHabit} style={{
          background: "#8B5CF6", border: "none", borderRadius: 9,
          padding: "9px 14px", color: "#fff",
          fontWeight: 700, cursor: "pointer", fontSize: 12, flexShrink: 0,
        }}>+ 추가</button>
      </div>

      {/* 습관 목록 */}
      {habits.map(h => (
        <div key={h.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.03)", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 14px", marginBottom: 7,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 2,
            background: h.color, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12 }}>{h.name}</span>
          <button onClick={() => removeHabit(h.id)} style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 5, padding: "3px 8px",
            color: "#EF4444", cursor: "pointer", fontSize: 10, fontWeight: 700,
          }}>삭제</button>
        </div>
      ))}

      {/* 엔트로피 설명 */}
      <div style={{
        marginTop: 20, padding: 14,
        background: "rgba(139,92,246,0.07)",
        border: "1px solid rgba(139,92,246,0.18)", borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 5 }}>
          💡 엔트로피 법칙
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
          에너지를 투입하지 않으면 모든 시스템은 무질서해집니다.<br />
          매일 습관을 실천하는 것은 삶의 엔트로피를 낮추는 행위입니다.<br />
          작은 실천이 모여 비전에 가까워집니다.
        </div>
      </div>

      {/* 저장 안내 */}
      <div style={{
        marginTop: 16, padding: 14,
        background: "rgba(16,185,129,0.07)",
        border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", marginBottom: 5 }}>
          💾 데이터 자동저장
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
          체크한 내용이 이 기기의 브라우저에 자동으로 저장됩니다.<br />
          앱을 닫았다 열어도 데이터가 그대로 유지됩니다.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={exportData} style={{
            flex: 1, padding: 9,
            background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 8, color: "#10B981",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>📤 데이터 백업</button>
          <button onClick={resetData} style={{
            flex: 1, padding: 9,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 8, color: "#EF4444",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>🗑️ 기록 초기화</button>
        </div>
      </div>
    </>
  );

  // ════════════════════════════════════════════
  // 최종 JSX
  // ════════════════════════════════════════════
  return (
    <div style={s.app}>
      {/* 헤더 */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div>
            <div style={{ fontSize: 10, color: "#8B5CF6", letterSpacing: 3,
              textTransform: "uppercase", fontWeight: 700 }}>VISION CARD</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              습관 스코어카드
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* 저장 상태 뱃지 */}
            <span style={{
              fontSize: 10, padding: "3px 10px", borderRadius: 20,
              background: saveBadge.bg,
              border: `1px solid ${saveBadge.border}`,
              color: saveBadge.color, fontWeight: 700,
            }}>{saveBadge.text}</span>
            <Ring pct={overallPct} size={52} strokeWidth={5} />
          </div>
        </div>
        {/* 탭 */}
        <div style={{ display: "flex", gap: 2 }}>
          {[["tracker","📋 트래커"],["stats","📊 통계"],["settings","⚙️ 습관관리"]].map(([k,l]) => (
            <button key={k} style={s.tab(activeTab === k)} onClick={() => setActiveTab(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div style={{ padding: "16px 14px 40px" }}>
        {activeTab === "tracker" && (
          <>
            {/* 뷰 토글 + 월 네비 */}
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.06)",
                borderRadius: 8, padding: 3, gap: 2 }}>
                {[["month","월간"],["week","주간"]].map(([k,l]) => (
                  <button key={k} onClick={() => setViewMode(k)} style={{
                    padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: viewMode === k ? "#8B5CF6" : "transparent",
                    color: viewMode === k ? "#fff" : "#94a3b8",
                    border: "none", cursor: "pointer", transition: "all 0.2s",
                  }}>{l}</button>
                ))}
              </div>
              {viewMode === "month"
                ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button style={s.navBtn} onClick={prevMonth}>‹</button>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                      {currentYear}년 {MONTH_NAMES[currentMonth]}
                    </span>
                    <button style={s.navBtn} onClick={nextMonth}>›</button>
                  </div>
                : <span style={{ fontWeight: 700, fontSize: 12 }}>이번 주</span>}
            </div>
            {viewMode === "month" ? <MonthTracker /> : <WeekTracker />}
          </>
        )}
        {activeTab === "stats"    && <StatsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
