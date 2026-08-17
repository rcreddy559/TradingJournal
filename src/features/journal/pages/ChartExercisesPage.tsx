import { FormEvent, useMemo, useState } from "react";
import { ChartExercise, MarketBias } from "../types/trade";
import { useJournalActions, useJournalState } from "../store/hooks";
import { generateId } from "../../../shared/lib/helpers";
import { Modal, useConfirm, useToast } from "../../../shared/ui";

const BIAS_META: Record<MarketBias, { label: string; icon: string }> = {
  BULLISH: { label: "Bullish", icon: "\u25B2" },
  BEARISH: { label: "Bearish", icon: "\u25BC" },
  NEUTRAL: { label: "Neutral", icon: "\u25C6" },
  SIDEWAYS: { label: "Sideways", icon: "\u2194" },
};

const BIAS_ORDER: MarketBias[] = ["BULLISH", "BEARISH", "NEUTRAL", "SIDEWAYS"];

const todayIso = (): string => new Date().toISOString().slice(0, 10);

interface ExerciseForm {
  exerciseDate: string;
  instrument: string;
  title: string;
  bias: MarketBias;
  timeframe: string;
  description: string;
  strategy: string;
  keyLevels: string;
  outcome: string;
  confidence: number;
  tags: string;
  screenshots: string[];
}

const emptyForm = (instrument: string): ExerciseForm => ({
  exerciseDate: todayIso(),
  instrument,
  title: "",
  bias: "NEUTRAL",
  timeframe: "15m",
  description: "",
  strategy: "",
  keyLevels: "",
  outcome: "",
  confidence: 3,
  tags: "",
  screenshots: [],
});

const formatDate = (iso: string): string => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ChartExercisesPage() {
  const { exercises, instruments } = useJournalState();
  const { createExercise, updateExercise, deleteExercise } =
    useJournalActions();
  const { notify } = useToast();
  const confirm = useConfirm();

  const defaultInstrument = instruments[0]?.symbol ?? "NIFTY50";

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExerciseForm>(() =>
    emptyForm(defaultInstrument),
  );
  const [formError, setFormError] = useState("");
  const [viewing, setViewing] = useState<ChartExercise | null>(null);
  const [instrumentFilter, setInstrumentFilter] = useState<string>("ALL");
  const [biasFilter, setBiasFilter] = useState<"ALL" | MarketBias>("ALL");
  const [search, setSearch] = useState("");

  const instrumentLabel = useMemo(() => {
    const map = new Map(instruments.map((item) => [item.symbol, item.name]));
    return (symbol: string) => map.get(symbol) ?? symbol;
  }, [instruments]);

  const sorted = useMemo(() => {
    return [...exercises].sort((a, b) => {
      if (a.exerciseDate !== b.exerciseDate) {
        return a.exerciseDate < b.exerciseDate ? 1 : -1;
      }
      return a.createdAt < b.createdAt ? 1 : -1;
    });
  }, [exercises]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sorted.filter((exercise) => {
      if (instrumentFilter !== "ALL" && exercise.instrument !== instrumentFilter)
        return false;
      if (biasFilter !== "ALL" && exercise.bias !== biasFilter) return false;
      if (!query) return true;
      const haystack = [
        exercise.title,
        exercise.description,
        exercise.strategy,
        exercise.keyLevels,
        exercise.outcome,
        (exercise.tags ?? []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [sorted, instrumentFilter, biasFilter, search]);

  const stats = useMemo(() => {
    const total = exercises.length;
    const now = new Date();
    const thisMonth = exercises.filter((exercise) => {
      const date = new Date(exercise.exerciseDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;

    const biasCounts = BIAS_ORDER.reduce<Record<MarketBias, number>>(
      (acc, bias) => {
        acc[bias] = exercises.filter((e) => e.bias === bias).length;
        return acc;
      },
      { BULLISH: 0, BEARISH: 0, NEUTRAL: 0, SIDEWAYS: 0 },
    );

    // Consecutive-day streak counting back from today (or the latest entry).
    const days = new Set(exercises.map((e) => e.exerciseDate));
    let streak = 0;
    const cursor = new Date();
    // Allow the streak to "start" from the most recent logged day.
    if (!days.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { total, thisMonth, biasCounts, streak };
  }, [exercises]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(defaultInstrument));
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (exercise: ChartExercise) => {
    setEditingId(exercise.id);
    setForm({
      exerciseDate: exercise.exerciseDate,
      instrument: exercise.instrument,
      title: exercise.title,
      bias: exercise.bias,
      timeframe: exercise.timeframe ?? "",
      description: exercise.description,
      strategy: exercise.strategy ?? "",
      keyLevels: exercise.keyLevels ?? "",
      outcome: exercise.outcome ?? "",
      confidence: exercise.confidence ?? 3,
      tags: (exercise.tags ?? []).join(", "),
      screenshots: exercise.screenshots ?? [],
    });
    setFormError("");
    setViewing(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const patch = (updates: Partial<ExerciseForm>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const handleScreenshots = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setForm((prev) => ({
          ...prev,
          screenshots: [...prev.screenshots, String(reader.result ?? "")],
        }));
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (index: number) => {
    setForm((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setFormError("Give the exercise a short title.");
      return;
    }
    if (!form.exerciseDate) {
      setFormError("Pick the date this chart is for.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Describe what you read on the chart.");
      return;
    }

    const now = new Date().toISOString();
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (editingId) {
      const existing = exercises.find((e) => e.id === editingId);
      updateExercise({
        id: editingId,
        exerciseDate: form.exerciseDate,
        instrument: form.instrument,
        title,
        bias: form.bias,
        timeframe: form.timeframe.trim() || undefined,
        description: form.description.trim(),
        strategy: form.strategy.trim() || undefined,
        keyLevels: form.keyLevels.trim() || undefined,
        outcome: form.outcome.trim() || undefined,
        confidence: form.confidence,
        tags,
        screenshots: form.screenshots,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
      notify(`Updated "${title}".`, "success");
    } else {
      createExercise({
        id: generateId(),
        exerciseDate: form.exerciseDate,
        instrument: form.instrument,
        title,
        bias: form.bias,
        timeframe: form.timeframe.trim() || undefined,
        description: form.description.trim(),
        strategy: form.strategy.trim() || undefined,
        keyLevels: form.keyLevels.trim() || undefined,
        outcome: form.outcome.trim() || undefined,
        confidence: form.confidence,
        tags,
        screenshots: form.screenshots,
        createdAt: now,
        updatedAt: now,
      });
      notify(`Logged "${title}".`, "success");
    }

    closeForm();
  };

  const handleDelete = async (exercise: ChartExercise) => {
    const confirmed = await confirm({
      title: "Delete exercise",
      message: `Delete "${exercise.title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    deleteExercise(exercise.id);
    if (viewing?.id === exercise.id) setViewing(null);
    notify(`Deleted "${exercise.title}".`, "success");
  };

  return (
    <section className="page exercises-page">
      <div className="exercises-head">
        <div>
          <h2>Chart Reading Practice</h2>
          <p className="subhead-inline">
            Log how you read NIFTY / BANK NIFTY each day, the plan you'd take and
            how it played out.
          </p>
        </div>
        <button type="button" className="primary-btn" onClick={openCreate}>
          + New Exercise
        </button>
      </div>

      <div className="metrics-grid exercise-metrics">
        <article className="metric-card">
          <span>Total Exercises</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="metric-card">
          <span>This Month</span>
          <strong>{stats.thisMonth}</strong>
        </article>
        <article className="metric-card">
          <span>Day Streak</span>
          <strong>
            {stats.streak}
            {stats.streak > 0 ? " \uD83D\uDD25" : ""}
          </strong>
        </article>
        <article className="metric-card bias-breakdown">
          <span>Bias Breakdown</span>
          <div className="bias-mini-row">
            {BIAS_ORDER.map((bias) => (
              <span key={bias} className={`bias-mini bias-${bias.toLowerCase()}`}>
                {BIAS_META[bias].icon} {stats.biasCounts[bias]}
              </span>
            ))}
          </div>
        </article>
      </div>

      <div className="exercise-toolbar">
        <input
          type="search"
          className="exercise-search"
          placeholder="Search title, notes, tags..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          value={instrumentFilter}
          onChange={(event) => setInstrumentFilter(event.target.value)}
        >
          <option value="ALL">All Instruments</option>
          {instruments.map((instrument) => (
            <option key={instrument.id} value={instrument.symbol}>
              {instrument.name}
            </option>
          ))}
        </select>
        <select
          value={biasFilter}
          onChange={(event) =>
            setBiasFilter(event.target.value as "ALL" | MarketBias)
          }
        >
          <option value="ALL">All Bias</option>
          {BIAS_ORDER.map((bias) => (
            <option key={bias} value={bias}>
              {BIAS_META[bias].label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="exercise-empty">
          <p>
            {exercises.length === 0
              ? "No chart exercises yet. Start your daily practice by logging today's read."
              : "No exercises match the current filters."}
          </p>
          {exercises.length === 0 && (
            <button type="button" className="primary-btn" onClick={openCreate}>
              Log Today's Chart
            </button>
          )}
        </div>
      ) : (
        <div className="exercise-grid">
          {filtered.map((exercise) => {
            const cover = exercise.screenshots?.[0];
            return (
              <article
                key={exercise.id}
                className="exercise-card"
                onClick={() => setViewing(exercise)}
              >
                <div className="exercise-card-media">
                  {cover ? (
                    <img src={cover} alt={exercise.title} />
                  ) : (
                    <div className="exercise-card-noimg">No screenshot</div>
                  )}
                  <span
                    className={`bias-badge bias-${exercise.bias.toLowerCase()}`}
                  >
                    {BIAS_META[exercise.bias].icon}{" "}
                    {BIAS_META[exercise.bias].label}
                  </span>
                  {exercise.screenshots && exercise.screenshots.length > 1 && (
                    <span className="exercise-count-badge">
                      {exercise.screenshots.length} shots
                    </span>
                  )}
                </div>
                <div className="exercise-card-body">
                  <div className="exercise-card-meta">
                    <span className="exercise-instrument">
                      {instrumentLabel(exercise.instrument)}
                    </span>
                    <span className="exercise-date">
                      {formatDate(exercise.exerciseDate)}
                    </span>
                  </div>
                  <h3 className="exercise-card-title">{exercise.title}</h3>
                  <p className="exercise-card-desc">{exercise.description}</p>
                  {exercise.tags && exercise.tags.length > 0 && (
                    <div className="exercise-tags">
                      {exercise.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="exercise-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className="exercise-card-actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setViewing(exercise)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => openEdit(exercise)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(exercise)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {viewing && (
        <Modal
          title={viewing.title}
          onClose={() => setViewing(null)}
          footer={
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
              <button type="button" onClick={() => openEdit(viewing)}>
                Edit
              </button>
            </>
          }
        >
          <div className="exercise-view">
            <div className="exercise-view-meta">
              <span
                className={`bias-badge bias-${viewing.bias.toLowerCase()}`}
              >
                {BIAS_META[viewing.bias].icon} {BIAS_META[viewing.bias].label}
              </span>
              <span className="exercise-instrument">
                {instrumentLabel(viewing.instrument)}
              </span>
              <span className="exercise-date">
                {formatDate(viewing.exerciseDate)}
              </span>
              {viewing.timeframe && (
                <span className="exercise-tf">{viewing.timeframe}</span>
              )}
              {typeof viewing.confidence === "number" && (
                <span className="exercise-confidence">
                  Confidence: {"\u2605".repeat(viewing.confidence)}
                  {"\u2606".repeat(Math.max(0, 5 - viewing.confidence))}
                </span>
              )}
            </div>

            {viewing.screenshots && viewing.screenshots.length > 0 && (
              <div className="exercise-view-shots">
                {viewing.screenshots.map((shot, index) => (
                  <a
                    key={index}
                    href={shot}
                    target="_blank"
                    rel="noreferrer"
                    className="exercise-view-shot"
                  >
                    <img src={shot} alt={`Chart ${index + 1}`} />
                  </a>
                ))}
              </div>
            )}

            <div className="exercise-view-section">
              <h4>Chart Reading</h4>
              <p>{viewing.description}</p>
            </div>

            {viewing.strategy && (
              <div className="exercise-view-section">
                <h4>Strategy / Plan</h4>
                <p>{viewing.strategy}</p>
              </div>
            )}

            {viewing.keyLevels && (
              <div className="exercise-view-section">
                <h4>Key Levels</h4>
                <p>{viewing.keyLevels}</p>
              </div>
            )}

            {viewing.outcome && (
              <div className="exercise-view-section">
                <h4>Outcome / Review</h4>
                <p>{viewing.outcome}</p>
              </div>
            )}

            {viewing.tags && viewing.tags.length > 0 && (
              <div className="exercise-tags">
                {viewing.tags.map((tag) => (
                  <span key={tag} className="exercise-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {formOpen && (
        <Modal
          title={editingId ? "Edit Exercise" : "New Chart Exercise"}
          onClose={closeForm}
          footer={
            <>
              <button type="button" className="secondary" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" form="exercise-form">
                {editingId ? "Update Exercise" : "Save Exercise"}
              </button>
            </>
          }
        >
          <form
            id="exercise-form"
            className="exercise-form"
            onSubmit={handleSubmit}
          >
            {formError && <p className="warning">{formError}</p>}

            <div className="exercise-form-row">
              <label>
                Date
                <input
                  type="date"
                  value={form.exerciseDate}
                  onChange={(event) =>
                    patch({ exerciseDate: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Instrument
                <select
                  value={form.instrument}
                  onChange={(event) => patch({ instrument: event.target.value })}
                >
                  {instruments.map((instrument) => (
                    <option key={instrument.id} value={instrument.symbol}>
                      {instrument.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Title
              <input
                value={form.title}
                onChange={(event) => patch({ title: event.target.value })}
                placeholder="e.g. Gap-up rejection at PDH"
                required
              />
            </label>

            <div className="exercise-form-row">
              <label>
                Market Bias
                <select
                  value={form.bias}
                  onChange={(event) =>
                    patch({ bias: event.target.value as MarketBias })
                  }
                >
                  {BIAS_ORDER.map((bias) => (
                    <option key={bias} value={bias}>
                      {BIAS_META[bias].label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Timeframe
                <input
                  value={form.timeframe}
                  onChange={(event) => patch({ timeframe: event.target.value })}
                  placeholder="5m / 15m / 1h"
                />
              </label>
            </div>

            <label>
              Chart Reading
              <textarea
                value={form.description}
                onChange={(event) => patch({ description: event.target.value })}
                rows={4}
                placeholder="What is the chart telling you? Trend, structure, candles, volume..."
                required
              />
            </label>

            <label>
              Strategy / Plan
              <textarea
                value={form.strategy}
                onChange={(event) => patch({ strategy: event.target.value })}
                rows={3}
                placeholder="How would you trade this? Entry trigger, stop, target..."
              />
            </label>

            <label>
              Key Levels
              <input
                value={form.keyLevels}
                onChange={(event) => patch({ keyLevels: event.target.value })}
                placeholder="Support / resistance, CPR, pivots..."
              />
            </label>

            <label>
              Outcome / Review
              <textarea
                value={form.outcome}
                onChange={(event) => patch({ outcome: event.target.value })}
                rows={2}
                placeholder="How did the day actually play out? (optional)"
              />
            </label>

            <div className="exercise-form-row">
              <label>
                Confidence: {form.confidence}/5
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.confidence}
                  onChange={(event) =>
                    patch({ confidence: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                Tags
                <input
                  value={form.tags}
                  onChange={(event) => patch({ tags: event.target.value })}
                  placeholder="breakout, gap, trap"
                />
              </label>
            </div>

            <label>
              Chart Screenshots
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleScreenshots(event.target.files)}
              />
            </label>

            {form.screenshots.length > 0 && (
              <div className="exercise-form-shots">
                {form.screenshots.map((shot, index) => (
                  <div key={index} className="exercise-form-shot">
                    <img src={shot} alt={`Screenshot ${index + 1}`} />
                    <button
                      type="button"
                      className="exercise-shot-remove"
                      onClick={() => removeScreenshot(index)}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>
        </Modal>
      )}
    </section>
  );
}
