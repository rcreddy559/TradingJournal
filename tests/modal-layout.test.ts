import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(
  resolve(process.cwd(), "src/shared/styles/app.css"),
  "utf8",
);

const getBlock = (selector: string): string => {
  const match = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`, "m"));
  return match?.[1] ?? "";
};

describe("modal layout styles", () => {
  it("keeps modal content within viewport so footer buttons remain reachable", () => {
    const modalCard = getBlock("modal-card");
    const modalBody = getBlock("modal-body");

    expect(modalCard).toContain("max-height: 92vh;");
    expect(modalCard).toContain("overflow: hidden;");
    expect(modalCard).toContain("display: flex;");
    expect(modalCard).toContain("flex-direction: column;");
    expect(modalBody).toContain("overflow-y: auto;");
  });
});
