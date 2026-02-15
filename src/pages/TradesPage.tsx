import { useMemo } from "react";
import { Strategy, Trade } from "../types/trade";
import { formatCurrency } from "../utils/calculations";

interface TradesPageProps {
  trades: Trade[];
  strategies: Strategy[];
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onEditTrade: (tradeId: string) => void;
  onDeleteTrade: (tradeId: string) => void;
}

export default function TradesPage({
  trades,
  strategies,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onEditTrade,
  onDeleteTrade
}: TradesPageProps) {
  const strategyMap = useMemo(() => new Map(strategies.map((s) => [s.id, s.name])), [strategies]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const inStart = !startDate || trade.tradeDate >= startDate;
      const inEnd = !endDate || trade.tradeDate <= endDate;
      return inStart && inEnd;
    });
  }, [trades, startDate, endDate]);

  const rangePnl = filteredTrades.reduce((sum, trade) => sum + trade.netPnl, 0);

  return (
    <section className="page">
      <h2>Trades</h2>
      <div className="filters-row">
        <label>Start Date<input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} /></label>
        <label>End Date<input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} /></label>
        <div>Range Net P&L: <strong className={rangePnl >= 0 ? "profit" : "loss"}>{formatCurrency(rangePnl)}</strong></div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Instrument</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>Qty</th>
              <th>Charges</th>
              <th>P&L</th>
              <th>Strategy</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 && (
              <tr>
                <td colSpan={11}>No trades for selected range.</td>
              </tr>
            )}
            {filteredTrades.map((trade) => (
              <tr key={trade.id}>
                <td>{trade.tradeDate}</td>
                <td>{trade.instrument}</td>
                <td>{trade.buyPrice}</td>
                <td>{trade.sellPrice}</td>
                <td>{trade.quantity}</td>
                <td>{trade.charges}</td>
                <td className={trade.netPnl >= 0 ? "profit" : "loss"}>{formatCurrency(trade.netPnl)}</td>
                <td>{strategyMap.get(trade.strategyId) ?? "Unknown"}</td>
                <td>{trade.status}</td>
                <td>{trade.notes || "-"}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="secondary" onClick={() => onEditTrade(trade.id)}>Edit</button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (window.confirm("Delete this trade? This cannot be undone.")) {
                          onDeleteTrade(trade.id);
                        }
                      }}
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
    </section>
  );
}
