import { Instrument, OptionType, Strategy, Trade, TradeStatus } from "../types/trade";

const escapeCsv = (value: string | number): string => {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const exportTradesCsv = (trades: Trade[], strategies: Strategy[], fileName = "trading-journal.csv"): void => {
  const strategyMap = new Map(strategies.map((strategy) => [strategy.id, strategy.name]));

  const headers = [
    "tradeDate",
    "instrument",
    "segment",
    "strikePrice",
    "optionType",
    "entryTime",
    "exitTime",
    "buyPrice",
    "sellPrice",
    "quantity",
    "charges",
    "netPnl",
    "strategy",
    "status",
    "notes"
  ];

  const rows = trades.map((trade) => [
    trade.tradeDate,
    trade.instrument,
    trade.segment,
    trade.strikePrice ?? "",
    trade.optionType ?? "",
    trade.entryTime,
    trade.exitTime,
    trade.buyPrice,
    trade.sellPrice,
    trade.quantity,
    trade.charges,
    trade.netPnl,
    strategyMap.get(trade.strategyId) ?? "Unknown",
    trade.status,
    trade.notes ?? ""
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

export interface ParsedImportTrade {
  tradeDate: string;
  instrument: Instrument;
  strikePrice?: number;
  optionType?: OptionType;
  entryTime: string;
  exitTime: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  charges: number;
  netPnl: number;
  strategyName: string;
  status: TradeStatus;
  notes?: string;
}

const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
};

const toNumber = (value: string, fallback = 0): number => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const normalizeInstrument = (value: string): Instrument | null => {
  const upper = value.trim().toUpperCase();
  if (["BANKNIFTY", "BANK NIFTY"].includes(upper)) return "BANKNIFTY";
  if (["NIFTY50", "NIFTY 50", "NIFTY"].includes(upper)) return "NIFTY50";
  if (["MCX_CRUDE", "MCX CRUDE", "CRUDE", "CRUDEOIL"].includes(upper)) return "MCX_CRUDE";
  return null;
};

const normalizeOptionType = (value: string): OptionType | undefined => {
  const upper = value.trim().toUpperCase();
  if (upper === "CE" || upper === "CALL") return "CE";
  if (upper === "PE" || upper === "PUT") return "PE";
  return undefined;
};

const normalizeStatus = (value: string): TradeStatus => {
  const upper = value.trim().toUpperCase();
  return upper === "SUCCESSFUL" ? "SUCCESSFUL" : "FAILED";
};

export const parseImportedTradesCsv = (text: string): ParsedImportTrade[] => {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim());
  const index = (name: string) => headers.findIndex((header) => header.toLowerCase() === name.toLowerCase());

  const idxTradeDate = index("tradeDate");
  const idxInstrument = index("instrument");
  const idxStrike = index("strikePrice");
  const idxOptionType = index("optionType");
  const idxEntryTime = index("entryTime");
  const idxExitTime = index("exitTime");
  const idxBuy = index("buyPrice");
  const idxSell = index("sellPrice");
  const idxQty = index("quantity");
  const idxCharges = index("charges");
  const idxNet = index("netPnl");
  const idxStrategy = index("strategy");
  const idxStatus = index("status");
  const idxNotes = index("notes");

  const requiredIndexes = [idxTradeDate, idxInstrument, idxBuy, idxSell, idxQty, idxStrategy];
  if (requiredIndexes.some((entry) => entry < 0)) return [];

  const output: ParsedImportTrade[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const instrument = normalizeInstrument(row[idxInstrument] ?? "");
    if (!instrument) continue;

    const tradeDate = row[idxTradeDate] ?? "";
    if (!tradeDate) continue;

    const buyPrice = toNumber(row[idxBuy]);
    const sellPrice = toNumber(row[idxSell]);
    const quantity = toNumber(row[idxQty]);
    const charges = idxCharges >= 0 ? toNumber(row[idxCharges]) : 0;

    output.push({
      tradeDate,
      instrument,
      strikePrice: idxStrike >= 0 && row[idxStrike] ? toNumber(row[idxStrike]) : undefined,
      optionType: idxOptionType >= 0 ? normalizeOptionType(row[idxOptionType]) : undefined,
      entryTime: idxEntryTime >= 0 && row[idxEntryTime] ? row[idxEntryTime] : new Date(`${tradeDate}T00:00:00`).toISOString(),
      exitTime: idxExitTime >= 0 && row[idxExitTime] ? row[idxExitTime] : new Date(`${tradeDate}T00:00:00`).toISOString(),
      buyPrice,
      sellPrice,
      quantity,
      charges,
      netPnl: idxNet >= 0 && row[idxNet] ? toNumber(row[idxNet]) : (sellPrice - buyPrice) * quantity - charges,
      strategyName: row[idxStrategy] ?? "Imported",
      status: idxStatus >= 0 ? normalizeStatus(row[idxStatus]) : "FAILED",
      notes: idxNotes >= 0 ? row[idxNotes] : ""
    });
  }

  return output;
};
