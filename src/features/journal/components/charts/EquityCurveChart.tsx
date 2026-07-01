import { useMemo } from "react";
import { EquityPoint, formatCurrency } from "../../lib/calculations";

interface EquityCurveChartProps {
  points: EquityPoint[];
}

const WIDTH = 720;
const HEIGHT = 220;
const PADDING = 8;

export default function EquityCurveChart({ points }: EquityCurveChartProps) {
  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const values = points.map((point) => point.cumulative);
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const innerW = WIDTH - PADDING * 2;
    const innerH = HEIGHT - PADDING * 2;
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

    const toY = (value: number) =>
      PADDING + innerH - ((value - min) / range) * innerH;

    const coords = points.map((point, index) => ({
      x: PADDING + index * stepX,
      y: toY(point.cumulative),
    }));

    const line = coords
      .map(
        (c, index) =>
          `${index === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`,
      )
      .join(" ");

    const last = coords[coords.length - 1];
    const area = `${line} L ${last.x.toFixed(1)} ${(PADDING + innerH).toFixed(1)} L ${PADDING} ${(PADDING + innerH).toFixed(1)} Z`;

    return { line, area, zeroY: toY(0), final: values[values.length - 1] };
  }, [points]);

  if (!geometry) {
    return <p className="subtext">No trades to plot yet.</p>;
  }

  const isPositive = geometry.final >= 0;

  return (
    <div className="chart-card">
      <div className="chart-head">
        <span>Equity Curve (cumulative P&L)</span>
        <strong className={isPositive ? "profit" : "loss"}>
          {formatCurrency(geometry.final)}
        </strong>
      </div>
      <svg
        className="equity-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Equity curve"
      >
        <line
          x1={PADDING}
          x2={WIDTH - PADDING}
          y1={geometry.zeroY}
          y2={geometry.zeroY}
          className="equity-zero"
        />
        <path d={geometry.area} className="equity-area" />
        <path d={geometry.line} className="equity-line" />
      </svg>
    </div>
  );
}
