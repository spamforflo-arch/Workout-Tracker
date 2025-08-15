const e = React.createElement;
const { useState, useEffect, useMemo } = React;

const todayKey = () => new Date().toISOString().slice(0, 10);
const STORAGE_KEY = "daily-quest-tracker-v1";

const DEFAULT_TASKS = [
  { id: "pushups", label: "Push-ups", unit: "reps", target: 100, steps: [5, 10, 25] },
  { id: "situps", label: "Sit-ups", unit: "reps", target: 100, steps: [5, 10, 25] },
  { id: "squats", label: "Squats", unit: "reps", target: 100, steps: [5, 10, 25] },
  { id: "running", label: "Running", unit: "km", target: 5, steps: [0.5, 1, 2] }
];

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function DailyQuestTracker() {
  const [dateKey, setDateKey] = useState(todayKey());
  const [tasks] = useState(DEFAULT_TASKS);
  const [progress, setProgress] = useState(() => {
    const init = {};
    DEFAULT_TASKS.forEach(t => (init[t.id] = 0));
    return init;
  });

  const allDone = useMemo(() => tasks.every(t => (progress[t.id] ?? 0) >= t.target), [tasks, progress]);

  useEffect(() => {
    const stored = loadState();
    const today = todayKey();
    if (stored && stored.dateKey === today) {
      setProgress(stored.progress);
    } else {
      const reset = {};
      DEFAULT_TASKS.forEach(t => (reset[t.id] = 0));
      setProgress(reset);
      saveState({ dateKey: today, progress: reset });
    }
    setDateKey(today);
  }, []);

  useEffect(() => {
    saveState({ dateKey, progress });
  }, [dateKey, progress]);

  const increment = (id, amount) => {
    setProgress(prev => {
      const task = tasks.find(t => t.id === id);
      const cap = task ? task.target : Infinity;
      const next = { ...prev, [id]: Math.max(0, Math.min(prev[id] + amount, cap)) };
      return next;
    });
  };

  const setDirect = (id, val) => {
    const num = Number(val);
    if (!isNaN(num)) {
      setProgress(prev => {
        const task = tasks.find(t => t.id === id);
        const cap = task ? task.target : Infinity;
        return { ...prev, [id]: Math.max(0, Math.min(num, cap)) };
      });
    }
  };

  const resetToday = () => {
    const reset = {};
    tasks.forEach(t => (reset[t.id] = 0));
    setProgress(reset);
  };

  return e("div", { style: { padding: "20px" } },
    e("h1", null, "Daily Quest Tracker"),
    e("p", null, "Date: ", dateKey),
    tasks.map(t => {
      const val = progress[t.id] ?? 0;
      const done = val >= t.target;
      return e("div", {
        key: t.id,
        style: { background: "#1e293b", padding: "10px", borderRadius: "10px", marginBottom: "10px" }
      },
        e("strong", null, `${t.label}: ${val}/${t.target} ${t.unit}`),
        done && e("span", { style: { color: "lightgreen", marginLeft: "10px" } }, "✓ Completed"),
        e("div", { style: { marginTop: "5px" } },
          t.steps.map(s => e("button", {
            onClick: () => increment(t.id, s),
            disabled: done,
            style: { marginRight: "5px" }
          }, `+${s}${t.unit === "km" ? "km" : ""}`)),
          e("button", { onClick: () => increment(t.id, -1) }, "−")
        ),
        e("div", null,
          e("input", {
            type: "number",
            step: t.unit === "km" ? 0.1 : 1,
            value: val,
            onChange: e => setDirect(t.id, e.target.value)
          })
        )
      );
    }),
    allDone && e("p", { style: { color: "lightgreen", fontWeight: "bold" } }, "Quest Complete! 🎉"),
    e("button", { onClick: resetToday, style: { marginTop: "20px" } }, "Reset Today")
  );
}

ReactDOM.render(e(DailyQuestTracker), document.getElementById("root"));
