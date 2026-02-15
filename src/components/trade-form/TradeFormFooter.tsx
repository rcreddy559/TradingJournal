import { formatCurrency } from "../../utils/calculations";

interface TradeFormFooterProps {
  readonly pnlPreview: number;
  readonly riskWarnings: string[];
  readonly isEditing: boolean;
  readonly canSubmit: boolean;
  readonly onCancelEdit: () => void;
}

export default function TradeFormFooter({
  pnlPreview,
  riskWarnings,
  isEditing,
  canSubmit,
  onCancelEdit,
}: TradeFormFooterProps) {
  return (
    <>
      <label className="full-width">
        Calculated Net P&L:{" "}
        <strong className={pnlPreview >= 0 ? "profit" : "loss"}>
          {formatCurrency(pnlPreview)}
        </strong>
      </label>

      {riskWarnings.length > 0 && (
        <div className="risk-alert">
          {riskWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      <div className="action-row">
        <button type="submit" disabled={!canSubmit}>
          {isEditing ? "Update Trade" : "Save Trade"}
        </button>
        {isEditing && (
          <button type="button" className="secondary" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </div>
    </>
  );
}
