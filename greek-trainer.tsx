import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ============================================================
   ΕΛΛΗΝΙΚΑ · тренажёр греческой лексики
   Уроки 1–2 + Упр. 9 + дни недели
   — интервальные повторения (система Лейтнера, 5 коробок)
   — озвучка по-гречески (Web Speech API)
   — режимы: карточки / выбор / ввод
   — направления: GR→RU и RU→GR
   — прогресс СОХРАНЯЕТСЯ между заходами (window.storage)
   — можно добавлять свои слова
   Прогресс привязан к самому греческому слову, поэтому
   обновление колоды не сбрасывает выученное.
   ============================================================ */

// [категория, греческий, русский, транслитерация]
const BUILTIN = [
  // Месяцы
  ["months", "Ιανουάριος", "январь", "януа́риос"],
  ["months", "Φεβρουάριος", "февраль", "февруа́риос"],
  ["months", "Μάρτιος", "март", "ма́ртиос"],
  ["months", "Απρίλιος", "апрель", "апри́лиос"],
  ["months", "Μάιος", "май", "ма́иос"],
  ["months", "Ιούνιος", "июнь", "ю́ниос"],
  ["months", "Ιούλιος", "июль", "ю́лиос"],
  ["months", "Αύγουστος", "август", "а́вгустос"],
  ["months", "Σεπτέμβριος", "сентябрь", "септэ́мвриос"],
  ["months", "Οκτώβριος", "октябрь", "окто́вриос"],
  ["months", "Νοέμβριος", "ноябрь", "ноэ́мвриос"],
  ["months", "Δεκέμβριος", "декабрь", "дэкэ́мвриос"],
  // Дни недели
  ["days", "η Δευτέρα", "понедельник", "и Дэфтэ́ра"],
  ["days", "η Τρίτη", "вторник", "и Три́ти"],
  ["days", "η Τετάρτη", "среда", "и Тэта́рти"],
  ["days", "η Πέμπτη", "четверг", "и Пэ́мпти"],
  ["days", "η Παρασκευή", "пятница", "и Параскэви́"],
  ["days", "το Σάββατο", "суббота", "то Са́вато"],
  ["days", "η Κυριακή", "воскресенье", "и Кириаки́"],
  // Времена года
  ["seasons", "ο χειμώνας", "зима", "о химо́нас"],
  ["seasons", "η άνοιξη", "весна", "и а́никси"],
  ["seasons", "το καλοκαίρι", "лето", "то калокэ́ри"],
  ["seasons", "το φθινόπωρο", "осень", "то фтхино́поро"],
  ["seasons", "η εποχή", "время года / сезон", "и эпохи́"],
  ["seasons", "ο χρόνος", "год", "о хро́нос"],
  // Погода
  ["weather", "Τι καιρό έχει σήμερα;", "Какая сегодня погода?", "ти кэро́ э́хи си́мэра"],
  ["weather", "Ο καιρός είναι καλός", "Погода хорошая", "о кэро́с и́нэ кало́с"],
  ["weather", "κάνει καλό καιρό", "хорошая погода", "ка́ни кало́ кэро́"],
  ["weather", "κάνει κακό καιρό", "плохая погода", "ка́ни како́ кэро́"],
  ["weather", "κάνει ζέστη", "жарко", "ка́ни зэ́сти"],
  ["weather", "κάνει κρύο", "холодно", "ка́ни кри́о"],
  ["weather", "βρέχει", "идёт дождь", "врэ́хи"],
  ["weather", "χιονίζει", "идёт снег", "хьони́зи"],
  ["weather", "φυσάει", "дует ветер", "физа́и"],
  ["weather", "έχει ήλιο", "солнечно", "э́хи и́лио"],
  ["weather", "έχει συννεφιά", "облачно", "э́хи синэфья́"],
  ["weather", "έχει ομίχλη", "туман", "э́хи оми́хли"],
  ["weather", "αστραπές", "молния", "астрапэ́с"],
  ["weather", "βροντές", "гром", "вронтэ́с"],
  ["weather", "η βροχή", "дождь", "и врохи́"],
  ["weather", "το χιόνι", "снег", "то хьо́ни"],
  ["weather", "ο άνεμος", "ветер", "о а́нэмос"],
  ["weather", "η ζέστη", "жара", "и зэ́сти"],
  ["weather", "το κρύο", "холод", "то кри́о"],
  // Природа
  ["nature", "η λιακάδα", "солнечный свет / солнышко", "и лиака́да"],
  ["nature", "η θάλασσα", "море", "и та́ласа"],
  ["nature", "το βουνό", "гора", "то вуно́"],
  ["nature", "το δάσος", "лес", "то да́сос"],
  ["nature", "το λουλούδι", "цветок", "то лулу́ди"],
  ["nature", "το φύλλο", "лист", "то фи́ло"],
  ["nature", "το δέντρο", "дерево", "то дэ́ндро"],
  ["nature", "η άμμος", "песок", "и а́мос"],
  // Занятия
  ["activities", "πηγαίνω διακοπές", "ехать в отпуск", "пийэ́но дьяко́пэс"],
  ["activities", "κάνω σκι", "кататься на лыжах", "ка́но ски"],
  ["activities", "πάω στην παραλία", "идти на пляж", "па́о стин паралья́"],
  ["activities", "κάνω βόλτα", "гулять", "ка́но во́лта"],
  ["activities", "βγάζω τον σκύλο μου βόλτα", "выгуливать собаку", "вґа́зо тон ски́ло му во́лта"],
  ["activities", "πάω στο σινεμά", "пойти в кино", "па́о сто синэма́"],
  ["activities", "πάω με το αυτοκίνητο", "ехать на машине", "па́о мэ то афтоки́нито"],
  // Люди и быт
  ["people", "Έχω έναν γιο και μία κόρη", "У меня есть сын и дочь", "э́хо э́нан йо кэ ми́а ко́ри"],
  ["people", "ο γιος", "сын", "о йос"],
  ["people", "η κόρη", "дочь", "и ко́ри"],
  ["people", "ο σκύλος", "собака (пёс)", "о ски́лос"],
  ["people", "η σκύλα", "собака (самка)", "и ски́ла"],
  // Диалоги (Упр. 9)
  ["dialogue", "Πότε πηγαίνεις διακοπές;", "Когда ты идёшь в отпуск?", "по́тэ пийэ́нис дьяко́пэс"],
  ["dialogue", "Τι ώρα ξυπνάς το πρωί;", "В котором часу ты просыпаешься утром?", "ти о́ра ксипна́с то прои́"],
  ["dialogue", "Πού είσαι;", "Где ты?", "пу и́сэ"],
  ["dialogue", "Τι μέρα είναι;", "Какой сегодня день?", "ти мэ́ра и́нэ"],
  ["dialogue", "Πότε φεύγεις;", "Когда ты уезжаешь?", "по́тэ фэ́вйис"],
  ["dialogue", "Σου αρέσει ο κινηματογράφος;", "Тебе нравится кино?", "су арэ́си о кинимато́ґрафос"],
  ["dialogue", "Τι κάνεις στον ελεύθερό σου χρόνο;", "Что ты делаешь в свободное время?", "ти ка́нис стон элэ́фтхэро́ су хро́но"],
  ["dialogue", "Πηγαίνεις συχνά σινεμά;", "Ты часто ходишь в кино?", "пийэ́нис сихна́ синэма́"],
  ["dialogue", "Για ψώνια", "за покупками", "я псо́ня"],
  ["dialogue", "Κάθε Σάββατο", "каждую субботу", "ка́тхэ са́вато"],
  ["dialogue", "Τον Αύγουστο", "в августе", "тон а́вгусто"],
  ["dialogue", "Την Κυριακή", "в воскресенье", "тин кириаки́"],
  ["dialogue", "Πηγαίνω σινεμά", "я хожу в кино", "пийэ́но синэма́"],
  ["dialogue", "ξυπνάω", "просыпаться", "ксипна́о"],
  ["dialogue", "φεύγω", "уезжать / уходить", "фэ́вґо"],
  ["dialogue", "συχνά", "часто", "сихна́"],
  ["dialogue", "ο κινηματογράφος", "кинематограф / кино", "о кинимато́ґрафос"],
];

const CATS = {
  months: { title: "Месяцы", icon: "📅" },
  days: { title: "Дни недели", icon: "🗓️" },
  seasons: { title: "Времена года", icon: "🍂" },
  weather: { title: "Погода", icon: "🌦️" },
  nature: { title: "Природа", icon: "🌿" },
  activities: { title: "Занятия", icon: "🎿" },
  people: { title: "Люди и быт", icon: "👨‍👩‍👧" },
  dialogue: { title: "Диалоги (Упр. 9)", icon: "💬" },
  custom: { title: "Мои слова", icon: "⭐" },
};

// Интервалы для коробок 1..5 (в днях)
const INTERVALS = [0, 1, 3, 7, 16];
const STORAGE_KEY = "greek-trainer-v2";

const T = {
  bg: "#FBF8F1",
  surface: "#FFFFFF",
  ink: "#15334A",
  inkSoft: "#5B7183",
  line: "#E8E1D2",
  accent: "#C0902B",
  accentSoft: "#F1E6C8",
  good: "#3E7C63",
  goodSoft: "#E2EFE7",
  bad: "#B14B34",
  badSoft: "#F5E3DC",
};

const DAY = 86400000;
const todayKey = () => new Date().toISOString().slice(0, 10);

function stripGreek(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[;.,!?·:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- persistence helpers (window.storage) ----
async function loadState() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(STORAGE_KEY);
      if (r && r.value) return JSON.parse(r.value);
    }
  } catch (e) {
    /* fresh */
  }
  return null;
}
async function persist(state) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    /* ignore */
  }
}

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function GreekTrainer() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState({}); // greek -> {box, due, seen}
  const [custom, setCustom] = useState([]); // [cat, gr, ru, tr]
  const [streak, setStreak] = useState({ count: 0, last: null });
  const [activeCats, setActiveCats] = useState(null); // null => все

  const [screen, setScreen] = useState("home"); // home | study | done
  const [mode, setMode] = useState("flash"); // flash | choice | type
  const [dir, setDir] = useState("gr-ru"); // gr-ru | ru-gr

  // Загрузка сохранённого состояния
  useEffect(() => {
    (async () => {
      const s = await loadState();
      if (s) {
        setProgress(s.progress || {});
        setCustom(s.custom || []);
        setStreak(s.streak || { count: 0, last: null });
        setActiveCats(s.activeCats || null);
        if (s.mode) setMode(s.mode);
        if (s.dir) setDir(s.dir);
      }
      setLoaded(true);
    })();
  }, []);

  // Автосохранение
  const saveRef = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      persist({ progress, custom, streak, activeCats, mode, dir });
    }, 250);
  }, [progress, custom, streak, activeCats, mode, dir, loaded]);

  const allCards = useMemo(() => {
    const seen = new Set();
    const out = [];
    [...BUILTIN, ...custom].forEach(([cat, gr, ru, tr]) => {
      const key = gr.trim();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ cat, gr: key, ru, tr: tr || "" });
    });
    return out;
  }, [custom]);

  const catsInUse = useMemo(() => {
    const set = new Set(allCards.map((c) => c.cat));
    return Object.keys(CATS).filter((k) => set.has(k));
  }, [allCards]);

  const isActive = useCallback(
    (cat) => activeCats === null || activeCats.includes(cat),
    [activeCats]
  );

  const pool = useMemo(
    () => allCards.filter((c) => isActive(c.cat)),
    [allCards, isActive]
  );

  const now = Date.now();
  const dueCards = useMemo(() => {
    return pool.filter((c) => {
      const p = progress[c.gr];
      if (!p || !p.seen) return true; // новые
      return (p.due || 0) <= now;
    });
  }, [pool, progress, now]);

  const learnedCount = useMemo(
    () => pool.filter((c) => (progress[c.gr]?.box || 0) >= 5).length,
    [pool, progress]
  );
  const seenCount = useMemo(
    () => pool.filter((c) => progress[c.gr]?.seen).length,
    [pool, progress]
  );

  // ---- study session ----
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [choices, setChoices] = useState([]);
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState("");
  const [typeResult, setTypeResult] = useState(null); // null|true|false
  const [doneCount, setDoneCount] = useState(0);

  const startSession = () => {
    const q = shuffle(dueCards).slice(0, 40);
    if (q.length === 0) return;
    setQueue(q);
    setIdx(0);
    setDoneCount(0);
    resetCard(q[0]);
    setScreen("study");
  };

  const resetCard = useCallback(
    (card) => {
      setRevealed(false);
      setPicked(null);
      setTyped("");
      setTypeResult(null);
      if (mode === "choice" && card) {
        const answerField = dir === "gr-ru" ? "ru" : "gr";
        const correct = card[answerField];
        const others = shuffle(
          pool.filter((c) => c[answerField] !== correct)
        )
          .slice(0, 3)
          .map((c) => c[answerField]);
        setChoices(shuffle([correct, ...others]));
      }
    },
    [mode, dir, pool]
  );

  const promptOf = (c) => (dir === "gr-ru" ? c.gr : c.ru);
  const answerOf = (c) => (dir === "gr-ru" ? c.ru : c.gr);

  const grade = (correct) => {
    const card = queue[idx];
    setProgress((prev) => {
      const p = prev[card.gr] || { box: 0, due: 0, seen: false };
      let box = p.box || 1;
      if (correct) box = Math.min(5, (p.seen ? box : 1) + 1);
      else box = 1;
      const due = Date.now() + INTERVALS[box - 1] * DAY;
      return { ...prev, [card.gr]: { box, due, seen: true } };
    });
    // streak
    setStreak((s) => {
      const tk = todayKey();
      if (s.last === tk) return s;
      const yk = new Date(Date.now() - DAY).toISOString().slice(0, 10);
      return { count: s.last === yk ? s.count + 1 : 1, last: tk };
    });
    setDoneCount((d) => d + 1);
    advance();
  };

  const advance = () => {
    if (idx + 1 >= queue.length) {
      setScreen("done");
    } else {
      const n = idx + 1;
      setIdx(n);
      resetCard(queue[n]);
    }
  };

  // ---- TTS ----
  const speak = useCallback((text) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "el-GR";
      const v = synth
        .getVoices()
        .find((vo) => vo.lang && vo.lang.toLowerCase().startsWith("el"));
      if (v) u.voice = v;
      u.rate = 0.9;
      synth.speak(u);
    } catch (e) {}
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // ---- add own word ----
  const [showAdd, setShowAdd] = useState(false);
  const [ngr, setNgr] = useState("");
  const [nru, setNru] = useState("");
  const [ntr, setNtr] = useState("");
  const addWord = () => {
    if (!ngr.trim() || !nru.trim()) return;
    setCustom((c) => [...c, ["custom", ngr.trim(), nru.trim(), ntr.trim()]]);
    setNgr("");
    setNru("");
    setNtr("");
    setShowAdd(false);
  };

  const resetProgress = () => {
    if (!window.confirm("Сбросить весь прогресс и серию дней? Слова останутся."))
      return;
    setProgress({});
    setStreak({ count: 0, last: null });
  };

  // ================= styles =================
  const S = {
    wrap: {
      minHeight: "100vh",
      background: T.bg,
      color: T.ink,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "flex",
      justifyContent: "center",
    },
    inner: { width: "100%", maxWidth: 440, padding: "18px 16px 40px" },
    h1: {
      fontSize: 15,
      letterSpacing: 3,
      textTransform: "uppercase",
      color: T.accent,
      fontWeight: 700,
      margin: 0,
    },
    greek: { fontFamily: "Georgia, 'Times New Roman', serif" },
    card: {
      background: T.surface,
      border: `1px solid ${T.line}`,
      borderRadius: 16,
      padding: 16,
    },
    btn: {
      border: "none",
      borderRadius: 12,
      padding: "14px 16px",
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      width: "100%",
    },
    chip: (on) => ({
      border: `1px solid ${on ? T.accent : T.line}`,
      background: on ? T.accentSoft : T.surface,
      color: on ? T.ink : T.inkSoft,
      borderRadius: 999,
      padding: "7px 12px",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
    }),
    seg: (on) => ({
      flex: 1,
      border: `1px solid ${on ? T.ink : T.line}`,
      background: on ? T.ink : T.surface,
      color: on ? "#fff" : T.inkSoft,
      borderRadius: 10,
      padding: "9px 6px",
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
    }),
  };

  if (!loaded) {
    return (
      <div style={S.wrap}>
        <div style={{ ...S.inner, paddingTop: 80, textAlign: "center", color: T.inkSoft }}>
          Загрузка…
        </div>
      </div>
    );
  }

  // ================= HOME =================
  if (screen === "home") {
    return (
      <div style={S.wrap}>
        <div style={S.inner}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h1 style={S.h1}>Ελληνικά</h1>
            <div style={{ fontSize: 14, color: T.inkSoft }}>
              🔥 <b style={{ color: T.ink }}>{streak.count}</b>
            </div>
          </div>
          <p style={{ color: T.inkSoft, fontSize: 13, margin: "4px 0 18px" }}>
            Ежедневный тренажёр слов · уроки 1–2
          </p>

          {/* stat card */}
          <div style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <Stat label="К повтору" value={dueCards.length} big color={T.accent} />
              <Stat label="Выучено" value={learnedCount} />
              <Stat label="Всего" value={pool.length} />
            </div>
            <button
              style={{
                ...S.btn,
                marginTop: 14,
                background: dueCards.length ? T.ink : T.line,
                color: dueCards.length ? "#fff" : T.inkSoft,
              }}
              disabled={!dueCards.length}
              onClick={startSession}
            >
              {dueCards.length ? `Заниматься · ${Math.min(dueCards.length, 40)} слов` : "На сегодня всё повторено 🎉"}
            </button>
          </div>

          {/* mode + direction */}
          <div style={{ marginBottom: 6, fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>РЕЖИМ</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button style={S.seg(mode === "flash")} onClick={() => setMode("flash")}>Карточки</button>
            <button style={S.seg(mode === "choice")} onClick={() => setMode("choice")}>Выбор</button>
            <button style={S.seg(mode === "type")} onClick={() => setMode("type")}>Ввод</button>
          </div>
          <div style={{ marginBottom: 6, fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>НАПРАВЛЕНИЕ</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button style={S.seg(dir === "gr-ru")} onClick={() => setDir("gr-ru")}>🇬🇷 → 🇷🇺 узнавание</button>
            <button style={S.seg(dir === "ru-gr")} onClick={() => setDir("ru-gr")}>🇷🇺 → 🇬🇷 вспоминание</button>
          </div>

          {/* categories */}
          <div style={{ marginBottom: 8, fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>ТЕМЫ</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {catsInUse.map((k) => (
              <button
                key={k}
                style={S.chip(isActive(k))}
                onClick={() =>
                  setActiveCats((prev) => {
                    const base = prev === null ? catsInUse.slice() : prev.slice();
                    if (base.includes(k)) {
                      const nx = base.filter((x) => x !== k);
                      return nx.length ? nx : catsInUse.slice();
                    }
                    const nx = [...base, k];
                    return nx.length === catsInUse.length ? null : nx;
                  })
                }
              >
                {CATS[k].icon} {CATS[k].title}
              </button>
            ))}
          </div>

          {/* add word */}
          {!showAdd ? (
            <button
              style={{ ...S.btn, background: T.surface, border: `1px dashed ${T.accent}`, color: T.accent }}
              onClick={() => setShowAdd(true)}
            >
              ＋ Добавить своё слово
            </button>
          ) : (
            <div style={{ ...S.card, borderColor: T.accent }}>
              <Input placeholder="Греческий (напр. το βιβλίο)" value={ngr} onChange={setNgr} greek />
              <Input placeholder="Перевод (напр. книга)" value={nru} onChange={setNru} />
              <Input placeholder="Произношение — по желанию" value={ntr} onChange={setNtr} />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button style={{ ...S.btn, background: T.ink, color: "#fff" }} onClick={addWord}>Добавить</button>
                <button style={{ ...S.btn, background: T.line, color: T.ink }} onClick={() => setShowAdd(false)}>Отмена</button>
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 22 }}>
            <button
              onClick={resetProgress}
              style={{ background: "none", border: "none", color: T.inkSoft, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            >
              Сбросить прогресс
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= DONE =================
  if (screen === "done") {
    return (
      <div style={S.wrap}>
        <div style={{ ...S.inner, paddingTop: 60, textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>🎉</div>
          <h2 style={{ color: T.ink, marginBottom: 6 }}>Готово!</h2>
          <p style={{ color: T.inkSoft }}>
            Повторено слов: <b style={{ color: T.ink }}>{doneCount}</b>. Серия: 🔥 {streak.count}
          </p>
          <p style={{ color: T.inkSoft, fontSize: 13, marginTop: 14 }}>
            {dueCards.length > 0
              ? `Ещё ${dueCards.length} слов ждут повтора сегодня.`
              : "Всё на сегодня повторено. Возвращайся завтра!"}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            {dueCards.length > 0 && (
              <button style={{ ...S.btn, background: T.ink, color: "#fff" }} onClick={startSession}>
                Ещё круг
              </button>
            )}
            <button style={{ ...S.btn, background: T.line, color: T.ink }} onClick={() => setScreen("home")}>
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= STUDY =================
  const card = queue[idx];
  const prompt = promptOf(card);
  const answer = answerOf(card);
  const promptIsGreek = dir === "gr-ru";

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => setScreen("home")}
            style={{ background: "none", border: "none", color: T.inkSoft, fontSize: 22, cursor: "pointer", lineHeight: 1 }}
          >
            ✕
          </button>
          <div style={{ flex: 1, height: 6, background: T.line, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(idx / queue.length) * 100}%`, height: "100%", background: T.accent, transition: "width .2s" }} />
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, minWidth: 42, textAlign: "right" }}>
            {idx + 1}/{queue.length}
          </div>
        </div>

        {/* prompt card */}
        <div style={{ ...S.card, textAlign: "center", padding: "34px 18px", minHeight: 128, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: T.inkSoft }}>
            {CATS[card.cat]?.icon} {CATS[card.cat]?.title}
          </div>
          <div style={{ ...(promptIsGreek ? S.greek : {}), fontSize: prompt.length > 22 ? 22 : 30, fontWeight: 600, lineHeight: 1.25 }}>
            {prompt}
          </div>
          {promptIsGreek && (
            <button
              onClick={() => speak(card.gr)}
              style={{ background: T.accentSoft, border: "none", borderRadius: 999, padding: "6px 16px", fontSize: 14, color: T.ink, cursor: "pointer", alignSelf: "center" }}
            >
              🔊 Прослушать
            </button>
          )}
        </div>

        {/* ---- FLASH ---- */}
        {mode === "flash" && (
          <div style={{ marginTop: 14 }}>
            {!revealed ? (
              <button style={{ ...S.btn, background: T.ink, color: "#fff" }} onClick={() => setRevealed(true)}>
                Показать ответ
              </button>
            ) : (
              <>
                <div style={{ ...S.card, textAlign: "center", padding: "22px 16px", marginBottom: 12 }}>
                  <div style={{ ...(promptIsGreek ? {} : S.greek), fontSize: answer.length > 22 ? 20 : 26, fontWeight: 600 }}>
                    {answer}
                  </div>
                  {card.tr && <div style={{ color: T.inkSoft, fontSize: 14, marginTop: 6 }}>[{card.tr}]</div>}
                  {!promptIsGreek && (
                    <button onClick={() => speak(card.gr)} style={{ marginTop: 10, background: T.accentSoft, border: "none", borderRadius: 999, padding: "5px 14px", fontSize: 13, cursor: "pointer" }}>🔊</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ ...S.btn, background: T.badSoft, color: T.bad }} onClick={() => grade(false)}>Не вспомнил</button>
                  <button style={{ ...S.btn, background: T.goodSoft, color: T.good }} onClick={() => grade(true)}>Знаю ✓</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ---- CHOICE ---- */}
        {mode === "choice" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {choices.map((ch, i) => {
              const isCorrect = ch === answer;
              const show = picked !== null;
              let bg = T.surface, col = T.ink, bd = T.line;
              if (show && isCorrect) { bg = T.goodSoft; col = T.good; bd = T.good; }
              else if (show && ch === picked) { bg = T.badSoft; col = T.bad; bd = T.bad; }
              return (
                <button
                  key={i}
                  disabled={show}
                  onClick={() => { setPicked(ch); }}
                  style={{ ...S.btn, textAlign: "left", background: bg, color: col, border: `1px solid ${bd}`, ...(promptIsGreek ? {} : S.greek) }}
                >
                  {ch}{show && isCorrect ? "  ✓" : ""}
                </button>
              );
            })}
            {picked !== null && (
              <button style={{ ...S.btn, background: T.ink, color: "#fff", marginTop: 4 }} onClick={() => grade(picked === answer)}>
                Дальше →
              </button>
            )}
          </div>
        )}

        {/* ---- TYPE ---- */}
        {mode === "type" && (
          <div style={{ marginTop: 14 }}>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && typeResult === null && typed.trim()) setTypeResult(stripGreek(typed) === stripGreek(answer)); }}
              placeholder={promptIsGreek ? "Перевод на русском…" : "Напиши по-гречески…"}
              disabled={typeResult !== null}
              style={{
                width: "100%", boxSizing: "border-box", padding: "14px 14px",
                fontSize: 18, borderRadius: 12, border: `1px solid ${typeResult === null ? T.line : typeResult ? T.good : T.bad}`,
                background: T.surface, color: T.ink, outline: "none",
                ...(promptIsGreek ? {} : S.greek),
              }}
            />
            {typeResult === null ? (
              <button
                style={{ ...S.btn, background: typed.trim() ? T.ink : T.line, color: typed.trim() ? "#fff" : T.inkSoft, marginTop: 12 }}
                disabled={!typed.trim()}
                onClick={() => setTypeResult(stripGreek(typed) === stripGreek(answer))}
              >
                Проверить
              </button>
            ) : (
              <>
                <div style={{ ...S.card, marginTop: 12, background: typeResult ? T.goodSoft : T.badSoft, borderColor: typeResult ? T.good : T.bad, textAlign: "center" }}>
                  <div style={{ fontWeight: 700, color: typeResult ? T.good : T.bad, marginBottom: 4 }}>
                    {typeResult ? "Верно! ✓" : "Правильный ответ:"}
                  </div>
                  <div style={{ ...(promptIsGreek ? {} : S.greek), fontSize: 20, fontWeight: 600 }}>{answer}</div>
                  {card.tr && <div style={{ color: T.inkSoft, fontSize: 13, marginTop: 4 }}>[{card.tr}]</div>}
                </div>
                <button style={{ ...S.btn, background: T.ink, color: "#fff", marginTop: 12 }} onClick={() => grade(typeResult)}>
                  Дальше →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, big, color }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: big ? 34 : 26, fontWeight: 700, color: color || "#15334A", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#5B7183", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Input({ placeholder, value, onChange, greek }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", boxSizing: "border-box", padding: "11px 12px", marginBottom: 8,
        fontSize: 15, borderRadius: 10, border: "1px solid #E8E1D2", background: "#fff",
        color: "#15334A", outline: "none",
        ...(greek ? { fontFamily: "Georgia, serif" } : {}),
      }}
    />
  );
}
