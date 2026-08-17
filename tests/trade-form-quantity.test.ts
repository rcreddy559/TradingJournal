import { describe, expect, it } from "vitest";
import { getDefaultQuantityForInstrument } from "../src/features/journal/lib/trade-form/quantity";

describe("getDefaultQuantityForInstrument", () => {
  it("returns 100 for MCX crude by default symbol", () => {
    expect(
      getDefaultQuantityForInstrument({
        symbol: "MCX_CRUDE",
        name: "Any name",
      }),
    ).toBe(100);
  });

  it("returns 100 for instrument named MCX Crude Oil", () => {
    expect(
      getDefaultQuantityForInstrument({
        symbol: "CUSTOM_CRUDE",
        name: "MCX Crude Oil",
      }),
    ).toBe(100);
  });

  it("returns 75 for all other instruments", () => {
    expect(
      getDefaultQuantityForInstrument({
        symbol: "NIFTY50",
        name: "Nifty 50",
      }),
    ).toBe(75);
  });
});
