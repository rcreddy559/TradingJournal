import { FormEvent, useMemo, useState } from "react";
import { Strategy, StrategyTimeframe } from "../types/trade";
import { useJournalActions, useJournalState } from "../store/hooks";
import { generateId } from "../../../shared/lib/helpers";
import { Modal, useConfirm, useToast } from "../../../shared/ui";

const TIMEFRAME_LABELS: Record<StrategyTimeframe, string> = {
  SCALPING: "Scalping",
  INTRADAY: "Intraday",
  POSITIONAL: "Positional",
};

const COMMON_OPTIONS_STRATEGIES: Array<
  Pick<Strategy, "name" | "timeframe" | "rules">
> = [
  {
    name: "Bull Call Spread",
    timeframe: "INTRADAY",
    rules:
      "Moderately bullish view; buy ATM/ITM call and sell higher strike OTM call in same expiry.",
  },
  {
    name: "Bull Put Spread",
    timeframe: "INTRADAY",
    rules:
      "Moderately bullish view; sell higher strike put and buy lower strike put for hedge.",
  },
  {
    name: "Bear Put Spread",
    timeframe: "INTRADAY",
    rules:
      "Moderately bearish view; buy higher strike put and sell lower strike put.",
  },
  {
    name: "Bear Call Spread",
    timeframe: "INTRADAY",
    rules:
      "Moderately bearish view; sell lower strike call and buy higher strike call.",
  },
  {
    name: "Long Straddle",
    timeframe: "INTRADAY",
    rules:
      "Expect big move in any direction; buy ATM call and ATM put of same expiry.",
  },
  {
    name: "Short Straddle",
    timeframe: "INTRADAY",
    rules:
      "Expect range-bound market; sell ATM call and ATM put with strict risk controls.",
  },
  {
    name: "Long Strangle",
    timeframe: "INTRADAY",
    rules: "Expect large volatility expansion; buy OTM call and OTM put.",
  },
  {
    name: "Short Strangle",
    timeframe: "INTRADAY",
    rules:
      "Expect low volatility/range; sell OTM call and OTM put with hedges.",
  },
  {
    name: "Iron Condor",
    timeframe: "INTRADAY",
    rules:
      "Range strategy; combine bull put spread + bear call spread with defined risk.",
  },
  {
    name: "Long Call Butterfly",
    timeframe: "INTRADAY",
    rules:
      "Neutral to low-volatility view around center strike; limited risk/reward strategy.",
  },
];

const EMPTY_FORM = {
  name: "",
  timeframe: "INTRADAY" as StrategyTimeframe,
  rules: "",
};

export default function StrategiesPage() {
  const { strategies, trades } = useJournalState();
  const {
    createStrategy,
    updateStrategy,
    deleteStrategy,
    deleteStrategyWithReassign,
  } = useJournalActions();
  const { notify } = useToast();
  const confirm = useConfirm();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState(EMPTY_FORM.name);
  const [timeframe, setTimeframe] = useState<StrategyTimeframe>(
    EMPTY_FORM.timeframe,
  );
  const [rules, setRules] = useState(EMPTY_FORM.rules);
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Strategy | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const isEditing = editingId !== null;

  const tradeCountByStrategy = useMemo(() => {
    const counts = new Map<string, number>();
    trades.forEach((trade) => {
      if (!trade.strategyId) return;
      counts.set(trade.strategyId, (counts.get(trade.strategyId) ?? 0) + 1);
    });
    return counts;
  }, [trades]);

  const resetForm = () => {
    setEditingId(null);
    setName(EMPTY_FORM.name);
    setTimeframe(EMPTY_FORM.timeframe);
    setRules(EMPTY_FORM.rules);
    setFormError("");
  };

  const isDuplicateName = (
    candidate: string,
    ignoreId: string | null,
  ): boolean => {
    const normalized = candidate.trim().toLowerCase();
    return strategies.some(
      (strategy) =>
        strategy.id !== ignoreId &&
        strategy.name.trim().toLowerCase() === normalized,
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Strategy name is required.");
      return;
    }
    if (isDuplicateName(trimmedName, editingId)) {
      setFormError("A strategy with this name already exists.");
      return;
    }

    if (isEditing) {
      const existing = strategies.find((strategy) => strategy.id === editingId);
      updateStrategy({
        id: editingId,
        name: trimmedName,
        timeframe,
        rules: rules.trim(),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      notify(`Updated "${trimmedName}".`, "success");
    } else {
      createStrategy({
        id: generateId(),
        name: trimmedName,
        timeframe,
        rules: rules.trim(),
        createdAt: new Date().toISOString(),
      });
      notify(`Added "${trimmedName}".`, "success");
    }

    resetForm();
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingId(strategy.id);
    setName(strategy.name);
    setTimeframe(strategy.timeframe ?? "INTRADAY");
    setRules(strategy.rules ?? "");
    setFormError("");
  };

  const handleDelete = async (strategy: Strategy) => {
    const usageCount = tradeCountByStrategy.get(strategy.id) ?? 0;

    if (usageCount > 0) {
      setReassignTo("");
      setPendingDelete(strategy);
      return;
    }

    const confirmed = await confirm({
      title: "Delete strategy",
      message: `Delete "${strategy.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    deleteStrategy(strategy.id);
    if (editingId === strategy.id) resetForm();
    notify(`Deleted "${strategy.name}".`, "success");
  };

  const confirmReassignDelete = () => {
    if (!pendingDelete) return;
    deleteStrategyWithReassign(pendingDelete.id, reassignTo || null);
    if (editingId === pendingDelete.id) resetForm();
    notify(`Deleted "${pendingDelete.name}".`, "success");
    setPendingDelete(null);
  };

  const handleAddCommonStrategies = () => {
    const existing = new Set(
      strategies.map((strategy) => strategy.name.trim().toLowerCase()),
    );
    const toAdd = COMMON_OPTIONS_STRATEGIES.filter(
      (strategy) => !existing.has(strategy.name.toLowerCase()),
    );

    toAdd.forEach((strategy) => {
      createStrategy({
        id: generateId(),
        name: strategy.name,
        timeframe: strategy.timeframe,
        rules: strategy.rules,
        createdAt: new Date().toISOString(),
      });
    });

    if (toAdd.length === 0) {
      notify("All common strategies are already added.", "info");
      return;
    }
    notify(`Added ${toAdd.length} common strategies.`, "success");
  };

  const pendingUsage = pendingDelete
    ? (tradeCountByStrategy.get(pendingDelete.id) ?? 0)
    : 0;

  return (
    <section className="page strategies-page">
      <h2>Strategies</h2>
      <form className="form-card strategy-form" onSubmit={handleSubmit}>
        <h3>{isEditing ? "Edit Strategy" : "Add Strategy"}</h3>
        {!isEditing && (
          <button
            type="button"
            className="secondary"
            onClick={handleAddCommonStrategies}
          >
            Add Common Strategies (Web)
          </button>
        )}
        {formError && <p className="warning">{formError}</p>}
        <label>
          Strategy Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ORB Breakout"
            required
          />
        </label>
        <label>
          Timeframe
          <select
            value={timeframe}
            onChange={(event) =>
              setTimeframe(event.target.value as StrategyTimeframe)
            }
          >
            <option value="SCALPING">Scalping</option>
            <option value="INTRADAY">Intraday</option>
            <option value="POSITIONAL">Positional</option>
          </select>
        </label>
        <label>
          Rules
          <textarea
            value={rules}
            onChange={(event) => setRules(event.target.value)}
            rows={3}
            placeholder="Entry/exit rules"
          />
        </label>
        <div className="form-actions">
          <button type="submit">
            {isEditing ? "Update Strategy" : "Add Strategy"}
          </button>
          {isEditing && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Timeframe</th>
              <th>Rules</th>
              <th>Trades</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {strategies.length === 0 && (
              <tr>
                <td colSpan={5}>No strategies yet.</td>
              </tr>
            )}
            {strategies.map((strategy) => (
              <tr key={strategy.id}>
                <td>{strategy.name}</td>
                <td>
                  {strategy.timeframe
                    ? TIMEFRAME_LABELS[strategy.timeframe]
                    : "-"}
                </td>
                <td className="strategy-rules-cell">{strategy.rules || "-"}</td>
                <td>{tradeCountByStrategy.get(strategy.id) ?? 0}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleEdit(strategy)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(strategy)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <Modal
          title={`Delete "${pendingDelete.name}"`}
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={confirmReassignDelete}
              >
                Delete Strategy
              </button>
            </>
          }
        >
          <p className="confirm-message">
            This strategy is linked to {pendingUsage} trade
            {pendingUsage === 1 ? "" : "s"}. Choose what happens to those
            trades.
          </p>
          <label>
            Reassign trades to
            <select
              value={reassignTo}
              onChange={(event) => setReassignTo(event.target.value)}
            >
              <option value="">Leave unassigned</option>
              {strategies
                .filter((strategy) => strategy.id !== pendingDelete.id)
                .map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
            </select>
          </label>
        </Modal>
      )}
    </section>
  );
}
