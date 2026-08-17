import { useMemo } from "react";
import {
  SYLLABUS,
  SyllabusPhase,
  SyllabusWeek,
  TOTAL_SYLLABUS_DAYS,
} from "../constants/syllabus";
import { useSyllabusProgress } from "../drive";
import { useConfirm, useToast } from "../../../shared/ui";

const countWeekDays = (week: SyllabusWeek): number => week.days.length;

const countPhaseDays = (phase: SyllabusPhase): number =>
  phase.weeks.reduce((total, week) => total + countWeekDays(week), 0);

interface ProgressBarProps {
  done: number;
  total: number;
  compact?: boolean;
}

function ProgressBar({ done, total, compact }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className={compact ? "syllabus-progress compact" : "syllabus-progress"}
    >
      <div className="syllabus-progress-track">
        <div className="syllabus-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="syllabus-progress-label">
        {done}/{total} {compact ? "" : "days"} ({pct}%)
      </span>
    </div>
  );
}

export default function SyllabusPage() {
  const { notify } = useToast();
  const confirm = useConfirm();

  const [completedDayIds, setCompletedDayIds] = useSyllabusProgress();
  const completed = useMemo(
    () => new Set(completedDayIds),
    [completedDayIds],
  );

  const persist = (next: Set<string>) => {
    setCompletedDayIds(Array.from(next));
  };

  const toggleDay = (dayId: string) => {
    const next = new Set(completed);
    if (next.has(dayId)) {
      next.delete(dayId);
    } else {
      next.add(dayId);
    }
    persist(next);
  };

  const setWeekDays = (week: SyllabusWeek, value: boolean) => {
    const next = new Set(completed);
    week.days.forEach((day) => {
      if (value) next.add(day.id);
      else next.delete(day.id);
    });
    persist(next);
  };

  const countDone = (dayIds: string[]): number =>
    dayIds.reduce((total, id) => (completed.has(id) ? total + 1 : total), 0);

  const overallDone = useMemo(() => {
    let total = 0;
    SYLLABUS.forEach((phase) =>
      phase.weeks.forEach((week) =>
        week.days.forEach((day) => {
          if (completed.has(day.id)) total += 1;
        }),
      ),
    );
    return total;
  }, [completed]);

  const handleReset = async () => {
    const ok = await confirm({
      title: "Reset syllabus progress",
      message: "Clear all completed days? This cannot be undone.",
      confirmLabel: "Reset",
      danger: true,
    });
    if (!ok) return;
    persist(new Set());
    notify("Syllabus progress reset.", "success");
  };

  return (
    <section className="page syllabus-page">
      <div className="syllabus-head">
        <div>
          <h2>Trading Syllabus</h2>
          <p className="subhead-inline">
            A structured 26-week, {TOTAL_SYLLABUS_DAYS}-day path from market
            basics to professional trading. Expand a phase, then a week, and
            tick off each day as you learn.
          </p>
        </div>
        {overallDone > 0 && (
          <button type="button" className="secondary" onClick={handleReset}>
            Reset Progress
          </button>
        )}
      </div>

      <div className="syllabus-overall">
        <ProgressBar done={overallDone} total={TOTAL_SYLLABUS_DAYS} />
      </div>

      <div className="syllabus-phases">
        {SYLLABUS.map((phase, phaseIndex) => {
          const phaseTotal = countPhaseDays(phase);
          const phaseDone = countDone(
            phase.weeks.flatMap((week) => week.days.map((day) => day.id)),
          );
          return (
            <details
              key={phase.title}
              className="syllabus-phase"
              open={phaseIndex === 0}
            >
              <summary className="syllabus-phase-summary">
                <span className="syllabus-phase-title">{phase.title}</span>
                <ProgressBar done={phaseDone} total={phaseTotal} compact />
              </summary>

              <div className="syllabus-weeks">
                {phase.weeks.map((week) => {
                  const weekIds = week.days.map((day) => day.id);
                  const weekDone = countDone(weekIds);
                  const allDone = weekDone === week.days.length;
                  return (
                    <details key={week.title} className="syllabus-week">
                      <summary className="syllabus-week-summary">
                        <span className="syllabus-week-title">
                          {week.title}
                        </span>
                        <span className="syllabus-week-count">
                          {weekDone}/{week.days.length}
                        </span>
                      </summary>

                      <div className="syllabus-week-body">
                        <button
                          type="button"
                          className="syllabus-week-toggle"
                          onClick={() => setWeekDays(week, !allDone)}
                        >
                          {allDone ? "Clear week" : "Mark week complete"}
                        </button>
                        <ul className="syllabus-days">
                          {week.days.map((day) => {
                            const isDone = completed.has(day.id);
                            return (
                              <li
                                key={day.id}
                                className={
                                  isDone ? "syllabus-day done" : "syllabus-day"
                                }
                              >
                                <label className="syllabus-day-head">
                                  <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={() => toggleDay(day.id)}
                                  />
                                  <span className="syllabus-day-num">
                                    Day {day.dayNumber}
                                  </span>
                                  <span className="syllabus-day-topic">
                                    {day.topic}
                                  </span>
                                </label>
                                <p className="syllabus-day-desc">
                                  {day.description}
                                </p>
                                {day.subtopics.length > 0 && (
                                  <ul className="syllabus-day-subtopics">
                                    {day.subtopics.map((subtopic) => (
                                      <li key={subtopic}>{subtopic}</li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
