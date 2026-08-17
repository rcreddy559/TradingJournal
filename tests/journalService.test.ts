import { describe, expect, it } from "vitest";
import { DEFAULT_STRATEGIES } from "../src/features/journal/api/journalService";

describe("DEFAULT_STRATEGIES", () => {
  it("includes RSI Market Structure Zones Pro strategy", () => {
    const strategy = DEFAULT_STRATEGIES.find(
      (entry) => entry.id === "strategy-rsi-market-structure-zones-pro",
    );

    expect(strategy).toBeDefined();
    expect(strategy?.name).toBe("RSI Market Structure Zones Pro");
    expect(strategy?.timeframe).toBe("INTRADAY");
  });
});
