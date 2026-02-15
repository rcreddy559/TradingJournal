import { Strategy, Trade } from "../../types/trade";

interface TradeBasicsSectionProps {
  tradeDate: string;
  instrument: Trade["instrument"];
  strikePrice: string;
  optionType: Trade["optionType"];
  entryTime: string;
  exitTime: string;
  buyPrice: string;
  sellPrice: string;
  quantity: string;
  charges: string;
  strategyId: string;
  status: Trade["status"];
  strategies: Strategy[];
  onTradeDateChange: (value: string) => void;
  onInstrumentChange: (value: Trade["instrument"]) => void;
  onStrikePriceChange: (value: string) => void;
  onOptionTypeChange: (value: Trade["optionType"]) => void;
  onEntryTimeChange: (value: string) => void;
  onExitTimeChange: (value: string) => void;
  onBuyPriceChange: (value: string) => void;
  onSellPriceChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onChargesChange: (value: string) => void;
  onStrategyIdChange: (value: string) => void;
  onStatusChange: (value: Trade["status"]) => void;
}

export default function TradeBasicsSection(props: TradeBasicsSectionProps) {
  const {
    tradeDate,
    instrument,
    strikePrice,
    optionType,
    entryTime,
    exitTime,
    buyPrice,
    sellPrice,
    quantity,
    charges,
    strategyId,
    status,
    strategies,
    onTradeDateChange,
    onInstrumentChange,
    onStrikePriceChange,
    onOptionTypeChange,
    onEntryTimeChange,
    onExitTimeChange,
    onBuyPriceChange,
    onSellPriceChange,
    onQuantityChange,
    onChargesChange,
    onStrategyIdChange,
    onStatusChange,
  } = props;

  return (
    <>
      <label>
        Trade Date
        <input
          type="date"
          value={tradeDate}
          onChange={(event) => onTradeDateChange(event.target.value)}
          required
        />
      </label>
      <label>
        Instrument
        <select
          value={instrument}
          onChange={(event) =>
            onInstrumentChange(event.target.value as Trade["instrument"])
          }
        >
          <option value="BANKNIFTY">Bank Nifty</option>
          <option value="NIFTY50">Nifty 50</option>
          <option value="MCX_CRUDE">MCX Crude Oil</option>
        </select>
      </label>
      <label>
        Strike Price
        <input
          type="number"
          value={strikePrice}
          onChange={(event) => onStrikePriceChange(event.target.value)}
          placeholder="Optional"
        />
      </label>
      <label>
        Option Type
        <select
          value={optionType}
          onChange={(event) =>
            onOptionTypeChange(event.target.value as Trade["optionType"])
          }
        >
          <option value="CE">CE</option>
          <option value="PE">PE</option>
        </select>
      </label>
      <label>
        Entry Time
        <input
          type="time"
          value={entryTime}
          onChange={(event) => onEntryTimeChange(event.target.value)}
        />
      </label>
      <label>
        Exit Time
        <input
          type="time"
          value={exitTime}
          onChange={(event) => onExitTimeChange(event.target.value)}
        />
      </label>
      <label>
        Buy Price
        <input
          type="number"
          step="0.01"
          value={buyPrice}
          onChange={(event) => onBuyPriceChange(event.target.value)}
          required
        />
      </label>
      <label>
        Sell Price
        <input
          type="number"
          step="0.01"
          value={sellPrice}
          onChange={(event) => onSellPriceChange(event.target.value)}
          required
        />
      </label>
      <label>
        Quantity
        <input
          type="number"
          value={quantity}
          onChange={(event) => onQuantityChange(event.target.value)}
          required
        />
      </label>
      <label>
        Charges
        <input
          type="number"
          step="0.01"
          value={charges}
          onChange={(event) => onChargesChange(event.target.value)}
        />
      </label>
      <label>
        Strategy
        <select
          value={strategyId}
          onChange={(event) => onStrategyIdChange(event.target.value)}
          required
        >
          <option value="">Select strategy</option>
          {strategies.map((strategy) => (
            <option key={strategy.id} value={strategy.id}>
              {strategy.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as Trade["status"])}
        >
          <option value="SUCCESSFUL">Successful</option>
          <option value="FAILED">Failed</option>
        </select>
      </label>
    </>
  );
}
