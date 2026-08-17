import { InstrumentDef } from "../../types/trade";

const MCX_CRUDE_QUANTITY = 100;
const DEFAULT_QUANTITY = 75;
const MCX_CRUDE_OIL_KEY = "MCX_CRUDE_OIL";

const normalizeInstrumentKey = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const isMcxCrudeOil = (
  instrument: Pick<InstrumentDef, "symbol" | "name"> | null,
): boolean => {
  if (!instrument) return false;
  const normalizedSymbol = normalizeInstrumentKey(instrument.symbol);
  const normalizedName = normalizeInstrumentKey(instrument.name);
  return (
    normalizedName === MCX_CRUDE_OIL_KEY ||
    normalizedSymbol === "MCX_CRUDE" ||
    normalizedSymbol === MCX_CRUDE_OIL_KEY
  );
};

export const getDefaultQuantityForInstrument = (
  instrument: Pick<InstrumentDef, "symbol" | "name"> | null,
): number => {
  return isMcxCrudeOil(instrument) ? MCX_CRUDE_QUANTITY : DEFAULT_QUANTITY;
};
