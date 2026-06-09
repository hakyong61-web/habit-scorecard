import { useState, useEffect } from "react";

const DEFAULT_HABITS = [
  { id: 1, name: "🌅 기상 & 명상", color: "#F59E0B" },
  { id: 2, name: "🏃 운동", color: "#10B981" },
  { id: 3, name: "📖 독서 30분", color: "#3B82F6" },
  { id: 4, name: "✍️ 비전카드 확인", color: "#8B5CF6" },
  { id: 5, name: "🥗 건강한 식사", color: "#EC4899" },
  { id: 6, name: "💡 학습 & 성장", color: "#06B6D4" },
  { id: 7, name: "🤝 관계 & 소통", color: "#F97316" },
  { id: 8, name: "🌙 수면 루틴", color: "#6366F1" },
];

const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_NAMES = ["일","월","화","수","목","금","토"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function HabitScorecard() {
  const today = new Date();
  const [viewMode, setViewMode] = useState("month"); // "month" | "week"
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [checks, setChecks] = useState({}); // key: "YYYY-MM-DD-habitId"
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [activeTab, setActiveTab] = useState("tracker"); // "tracker" | "stats"

  const getKey = (year, month, day, habitId) =>
    `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}-${habitId}`;

  const toggle = (year, month, day, habitId) => {
    const key = getKey(year, month, day, habitId);
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isChecked = (year, month, day, habitId) => {
    return !!checks[getKey(year, month, day, habitId)];
  };

  // Week calculation
  const getWeekDates = () => {
    const curr = new Date(today);
    const first = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    return Array.from({length:7}, (_,i) => {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  // Stats
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const totalPossible = habits.length * daysInMonth;
  let totalDone = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    habits.forEach(h => { if (isChecked(currentYear, currentMonth, d, h.id)) totalDone++; });
  }
  const overallPct = totalPossible ? Math.round((totalDone/totalPossible)*100) : 0;

  const habitStats = habits.map(h => {
    let done = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (isChecked(currentYear, currentMonth, d, h.id)) done++;
    }
    return { ...h, done, pct: Math.round((done/daysInMonth)*100) };
  });

  const getDayScore = (year, month, day) => {
    const done = habits.filter(h => isChecked(year, month, day, h.id)).length;
    return done;
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const colors = ["#F59E0B","#10B981","#3B82F6","#8B5CF6","#EC4899","#06B6D4","#F97316","#6366F1","#14B8A6","#EF4444"];
    setHabits(prev => [...prev, {
      id: Date.now(),
      name: newHabitName.trim(),
      color: colors[prev.length % colors.length]
    }]);
    setNewHabitName("");
  };

  const removeHabit = (id) => setHabits(prev => prev.filter(h => h.id !== id));

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y-1); }
    else setCurrentMonth(m => m-1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y+1); }
    else setCurrentMonth(m => m+1);
  };

  const scoreColor = (pct) => {
    if (pct >= 80) return "#10B981";
    if (pct >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const dayScoreBg = (score) => {
    const pct = habits.length ? score/habits.length : 0;
    if (pct >= 0.8) return "rgba(16,185,129,0.25)";
    if (pct >= 0.5) return "rgba(245,158,11,0.2)";
    if (pct > 0) return "rgba(239,68,68,0.15)";
    return "transparent";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      color: "#e2e8f0",
      padding: "0 0 40px 0"
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "20px 20px 0",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 16}}>
          <div>
            <div style={{fontSize:11, color:"#8B5CF6", letterSpacing:3, textTransform:"uppercase", fontWeight:700}}>VISION CARD</div>
            <div style={{fontSize:22, fontWeight:800, letterSpacing:-0.5}}>습관 스코어카드</div>
          </div>
          <div style={{
            background: `conic-gradient(${scoreColor(overallPct)} ${overallPct*3.6}deg, rgba(255,255,255,0.08) 0deg)`,
            borderRadius: "50%", width:56, height:56,
            display:"flex", alignItems:"center", justifyContent:"center",
            position:"relative"
          }}>
            <div style={{
              position:"absolute", inset:5, borderRadius:"50%",
              background:"#1a1535", display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center"
            }}>
              <span style={{fontSize:14, fontWeight:800, color: scoreColor(overallPct), lineHeight:1}}>{overallPct}%</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex", gap:4}}>
          {[["tracker","📋 트래커"], ["stats","📊 통계"], ["settings","⚙️ 습관관리"]].map(([key,label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              flex:1, padding:"10px 0", fontSize:12, fontWeight:700,
              background: activeTab===key ? "rgba(139,92,246,0.3)" : "transparent",
              color: activeTab===key ? "#a78bfa" : "#94a3b8",
              border: "none", borderBottom: activeTab===key ? "2px solid #8B5CF6" : "2px solid transparent",
              cursor:"pointer", borderRadius:"4px 4px 0 0", transition:"all 0.2s"
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 16px"}}>

        {/* TRACKER TAB */}
        {activeTab === "tracker" && (<>
          {/* View toggle + Navigation */}
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
            <div style={{display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:8, padding:3, gap:2}}>
              {[["month","월간"],["week","주간"]].map(([k,l]) => (
                <button key={k} onClick={() => setViewMode(k)} style={{
                  padding:"6px 16px", borderRadius:6, fontSize:12, fontWeight:700,
                  background: viewMode===k ? "#8B5CF6" : "transparent",
                  color: viewMode===k ? "#fff" : "#94a3b8",
                  border:"none", cursor:"pointer", transition:"all 0.2s"
                }}>{l}</button>
              ))}
            </div>
            {viewMode === "month" && (
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <button onClick={prevMonth} style={{background:"rgba(255,255,255,0.08)", border:"none", color:"#e2e8f0", borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14}}>‹</button>
                <span style={{fontWeight:700, fontSize:14}}>{currentYear}년 {MONTH_NAMES[currentMonth]}</span>
                <button onClick={nextMonth} style={{background:"rgba(255,255,255,0.08)", border:"none", color:"#e2e8f0", borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14}}>›</button>
              </div>
            )}
            {viewMode === "week" && (
              <span style={{fontWeight:700, fontSize:13}}>이번 주</span>
            )}
          </div>

          {/* MONTH VIEW */}
          {viewMode === "month" && (
            <div style={{background:"rgba(255,255,255,0.03)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden"}}>
              {/* Day headers */}
              <div style={{display:"grid", gridTemplateColumns:`120px repeat(${daysInMonth}, minmax(32px,1fr))`, borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{padding:"10px 12px", fontSize:11, color:"#64748b", fontWeight:700}}>습관</div>
                {Array.from({length:daysInMonth},(_,i)=>i+1).map(d => {
                  const dow = new Date(currentYear, currentMonth, d).getDay();
                  const isToday = today.getDate()===d && today.getMonth()===currentMonth && today.getFullYear()===currentYear;
                  return (
                    <div key={d} style={{
                      padding:"6px 2px", textAlign:"center", fontSize:10, fontWeight:700,
                      color: isToday ? "#8B5CF6" : dow===0?"#EF4444":dow===6?"#3B82F6":"#64748b",
                      background: isToday ? "rgba(139,92,246,0.1)" : "transparent",
                      borderLeft:"1px solid rgba(255,255,255,0.04)"
                    }}>
                      <div>{d}</div>
                      <div style={{fontSize:9, opacity:0.7}}>{DAY_NAMES[dow]}</div>
                    </div>
                  );
                })}
              </div>

              {/* Habit rows */}
              {habits.map(h => (
                <div key={h.id} style={{display:"grid", gridTemplateColumns:`120px repeat(${daysInMonth}, minmax(32px,1fr))`, borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <div style={{padding:"8px 12px", fontSize:12, display:"flex", alignItems:"center", gap:6}}>
                    <div style={{width:4, height:20, borderRadius:2, background:h.color, flexShrink:0}}/>
                    <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:11}}>{h.name}</span>
                  </div>
                  {Array.from({length:daysInMonth},(_,i)=>i+1).map(d => {
                    const checked = isChecked(currentYear, currentMonth, d, h.id);
                    return (
                      <div key={d} onClick={() => toggle(currentYear, currentMonth, d, h.id)}
                        style={{
                          display:"flex", alignItems:"center", justifyContent:"center",
                          cursor:"pointer", borderLeft:"1px solid rgba(255,255,255,0.04)",
                          background: checked ? `${h.color}22` : "transparent",
                          transition:"all 0.15s"
                        }}>
                        {checked ? (
                          <div style={{
                            width:20, height:20, borderRadius:4,
                            background: h.color,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:12, boxShadow:`0 0 8px ${h.color}66`
                          }}>✓</div>
                        ) : (
                          <div style={{
                            width:20, height:20, borderRadius:4,
                            border:"1px solid rgba(255,255,255,0.1)",
                            background:"rgba(255,255,255,0.02)"
                          }}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Daily score row */}
              <div style={{display:"grid", gridTemplateColumns:`120px repeat(${daysInMonth}, minmax(32px,1fr))`, background:"rgba(255,255,255,0.03)"}}>
                <div style={{padding:"8px 12px", fontSize:11, color:"#64748b", fontWeight:700, display:"flex", alignItems:"center"}}>일별점수</div>
                {Array.from({length:daysInMonth},(_,i)=>i+1).map(d => {
                  const score = getDayScore(currentYear, currentMonth, d);
                  const pct = habits.length ? Math.round(score/habits.length*100) : 0;
                  return (
                    <div key={d} style={{
                      display:"flex", alignItems:"center", justifyContent:"center",
                      padding:"6px 2px", borderLeft:"1px solid rgba(255,255,255,0.04)",
                      background: dayScoreBg(score)
                    }}>
                      <span style={{fontSize:10, fontWeight:800, color: scoreColor(pct)}}>
                        {score > 0 ? score : "·"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {viewMode === "week" && (
            <div style={{background:"rgba(255,255,255,0.03)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden"}}>
              {/* Day headers */}
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr 1fr", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                {weekDates.map((d,i) => {
                  const isToday = d.toDateString() === today.toDateString();
                  return (
                    <div key={i} style={{
                      padding:"12px 4px", textAlign:"center",
                      background: isToday ? "rgba(139,92,246,0.12)" : "transparent",
                      borderLeft: i>0 ? "1px solid rgba(255,255,255,0.06)" : "none"
                    }}>
                      <div style={{fontSize:10, color: i===0?"#EF4444":i===6?"#3B82F6":"#94a3b8", fontWeight:700}}>{DAY_NAMES[i]}</div>
                      <div style={{fontSize:18, fontWeight:800, color: isToday ? "#a78bfa" : "#e2e8f0", marginTop:2}}>{d.getDate()}</div>
                      <div style={{fontSize:9, color:"#64748b", marginTop:2}}>
                        {getDayScore(d.getFullYear(), d.getMonth(), d.getDate())}/{habits.length}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Habit rows for week */}
              {habits.map(h => (
                <div key={h.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <div style={{padding:"6px 12px", fontSize:11, color:"#94a3b8", display:"flex", alignItems:"center", gap:6, borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                    <div style={{width:8, height:8, borderRadius:2, background:h.color}}/>
                    {h.name}
                  </div>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr 1fr"}}>
                    {weekDates.map((d,i) => {
                      const checked = isChecked(d.getFullYear(), d.getMonth(), d.getDate(), h.id);
                      const isToday = d.toDateString() === today.toDateString();
                      return (
                        <div key={i} onClick={() => toggle(d.getFullYear(), d.getMonth(), d.getDate(), h.id)}
                          style={{
                            height:52, display:"flex", alignItems:"center", justifyContent:"center",
                            cursor:"pointer",
                            background: checked ? `${h.color}22` : isToday ? "rgba(139,92,246,0.06)" : "transparent",
                            borderLeft: i>0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            transition:"all 0.15s"
                          }}>
                          {checked ? (
                            <div style={{
                              width:30, height:30, borderRadius:8,
                              background: `linear-gradient(135deg, ${h.color}, ${h.color}bb)`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:16, boxShadow:`0 0 12px ${h.color}44`
                            }}>✓</div>
                          ) : (
                            <div style={{
                              width:30, height:30, borderRadius:8,
                              border:`1.5px solid rgba(255,255,255,0.12)`,
                              background:"rgba(255,255,255,0.02)"
                            }}/>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* STATS TAB */}
        {activeTab === "stats" && (<>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <button onClick={prevMonth} style={{background:"rgba(255,255,255,0.08)", border:"none", color:"#e2e8f0", borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14}}>‹</button>
              <span style={{fontWeight:700, fontSize:14}}>{currentYear}년 {MONTH_NAMES[currentMonth]}</span>
              <button onClick={nextMonth} style={{background:"rgba(255,255,255,0.08)", border:"none", color:"#e2e8f0", borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:14}}>›</button>
            </div>
          </div>

          {/* Overall score card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))",
            border:"1px solid rgba(139,92,246,0.3)", borderRadius:16, padding:20, marginBottom:16,
            display:"flex", alignItems:"center", gap:20
          }}>
            <div style={{
              width:80, height:80,
              background: `conic-gradient(${scoreColor(overallPct)} ${overallPct*3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0
            }}>
              <div style={{position:"absolute", inset:8, borderRadius:"50%", background:"#1a1535", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                <span style={{fontSize:20, fontWeight:900, color:scoreColor(overallPct), lineHeight:1}}>{overallPct}%</span>
              </div>
            </div>
            <div>
              <div style={{fontSize:13, color:"#94a3b8", marginBottom:4}}>이번 달 전체 실천율</div>
              <div style={{fontSize:24, fontWeight:900}}>{totalDone}<span style={{fontSize:14, color:"#64748b", fontWeight:400}}> / {totalPossible}</span></div>
              <div style={{fontSize:12, color:"#64748b", marginTop:4}}>
                {overallPct >= 80 ? "🌟 훌륭합니다! 엔트로피를 이기고 있어요" :
                 overallPct >= 50 ? "💪 좋아요! 꾸준함이 승리입니다" : "🔥 지금이 시작입니다. 작은 습관부터!"}
              </div>
            </div>
          </div>

          {/* Per-habit stats */}
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {habitStats.sort((a,b)=>b.pct-a.pct).map(h => (
              <div key={h.id} style={{
                background:"rgba(255,255,255,0.03)", borderRadius:12,
                border:"1px solid rgba(255,255,255,0.06)", padding:"14px 16px"
              }}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                  <div style={{display:"flex", alignItems:"center", gap:8}}>
                    <div style={{width:8, height:8, borderRadius:2, background:h.color}}/>
                    <span style={{fontSize:13, fontWeight:600}}>{h.name}</span>
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:8}}>
                    <span style={{fontSize:12, color:"#64748b"}}>{h.done}일/{daysInMonth}일</span>
                    <span style={{fontSize:14, fontWeight:800, color:scoreColor(h.pct)}}>{h.pct}%</span>
                  </div>
                </div>
                <div style={{height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden"}}>
                  <div style={{
                    height:"100%", width:`${h.pct}%`,
                    background: `linear-gradient(90deg, ${h.color}, ${h.color}bb)`,
                    borderRadius:3, transition:"width 0.5s ease",
                    boxShadow:`0 0 8px ${h.color}66`
                  }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly heatmap calendar */}
          <div style={{marginTop:20, background:"rgba(255,255,255,0.03)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", padding:16}}>
            <div style={{fontSize:13, fontWeight:700, marginBottom:12, color:"#94a3b8"}}>📅 일별 달성 현황</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4}}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{textAlign:"center", fontSize:10, color:"#475569", paddingBottom:4, fontWeight:700}}>{d}</div>
              ))}
              {Array.from({length:getFirstDayOfMonth(currentYear,currentMonth)}).map((_,i) => (
                <div key={`e${i}`}/>
              ))}
              {Array.from({length:daysInMonth},(_,i)=>i+1).map(d => {
                const score = getDayScore(currentYear, currentMonth, d);
                const pct = habits.length ? score/habits.length : 0;
                const isToday = today.getDate()===d && today.getMonth()===currentMonth && today.getFullYear()===currentYear;
                return (
                  <div key={d} style={{
                    aspectRatio:"1", borderRadius:6, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    background: pct>=0.8?"rgba(16,185,129,0.3)":pct>=0.5?"rgba(245,158,11,0.25)":pct>0?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.04)",
                    border: isToday ? "1.5px solid #8B5CF6" : "1px solid rgba(255,255,255,0.04)"
                  }}>
                    <span style={{fontSize:11, fontWeight:700, color: isToday?"#a78bfa":"#e2e8f0"}}>{d}</span>
                    {score > 0 && <span style={{fontSize:9, color:scoreColor(Math.round(pct*100))}}>{score}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex", gap:12, marginTop:12, justifyContent:"center"}}>
              {[["rgba(16,185,129,0.3)","80%+"],["rgba(245,158,11,0.25)","50%+"],["rgba(239,68,68,0.2)","1개+"],["rgba(255,255,255,0.04)","미실천"]].map(([bg,label]) => (
                <div key={label} style={{display:"flex", alignItems:"center", gap:4}}>
                  <div style={{width:12, height:12, borderRadius:3, background:bg}}/>
                  <span style={{fontSize:10, color:"#64748b"}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (<>
          <div style={{fontSize:13, color:"#94a3b8", marginBottom:16, lineHeight:1.6}}>
            나만의 비전 기반 습관을 추가하거나 수정하세요.<br/>
            <span style={{color:"#8B5CF6"}}>각 습관은 당신의 비전카드와 연결됩니다.</span>
          </div>

          {/* Add habit */}
          <div style={{display:"flex", gap:8, marginBottom:20}}>
            <input
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              onKeyDown={e => e.key==="Enter" && addHabit()}
              placeholder="새 습관 입력 (예: 💼 업무 계획)"
              style={{
                flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
                borderRadius:10, padding:"10px 14px", color:"#e2e8f0", fontSize:13,
                outline:"none"
              }}
            />
            <button onClick={addHabit} style={{
              background:"#8B5CF6", border:"none", borderRadius:10, padding:"10px 16px",
              color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, flexShrink:0
            }}>+ 추가</button>
          </div>

          {/* Habit list */}
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {habits.map((h, idx) => (
              <div key={h.id} style={{
                display:"flex", alignItems:"center", gap:12,
                background:"rgba(255,255,255,0.03)", borderRadius:12,
                border:"1px solid rgba(255,255,255,0.07)", padding:"12px 16px"
              }}>
                <div style={{width:12, height:12, borderRadius:3, background:h.color, flexShrink:0}}/>
                <span style={{flex:1, fontSize:13}}>{h.name}</span>
                <button onClick={() => removeHabit(h.id)} style={{
                  background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:6, padding:"4px 10px", color:"#EF4444",
                  cursor:"pointer", fontSize:11, fontWeight:700
                }}>삭제</button>
              </div>
            ))}
          </div>

          <div style={{
            marginTop:24, padding:16, background:"rgba(139,92,246,0.08)",
            border:"1px solid rgba(139,92,246,0.2)", borderRadius:12
          }}>
            <div style={{fontSize:12, fontWeight:700, color:"#a78bfa", marginBottom:6}}>💡 엔트로피 법칙</div>
            <div style={{fontSize:12, color:"#94a3b8", lineHeight:1.7}}>
              에너지를 투입하지 않으면 모든 시스템은 무질서해집니다.<br/>
              매일 습관을 실천하는 것은 삶의 엔트로피를 낮추는 행위입니다.<br/>
              작은 실천이 모여 비전에 가까워집니다.
            </div>
          </div>
        </>)}

      </div>
    </div>
  );
}
