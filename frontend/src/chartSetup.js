import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Title,
  Tooltip
);

export const CHART = {
  muted: "#8b9cb3",
  grid: "rgba(45, 58, 74, 0.9)",
  income: "rgba(95, 216, 154, 0.75)",
  incomeSolid: "#5fd89a",
  expense: "rgba(240, 113, 120, 0.75)",
  expenseSolid: "#f07178",
};

export function tooltipMoneyLabel(context) {
  const parsed = context.parsed;
  let value;
  if (parsed != null && typeof parsed === "object") {
    if ("y" in parsed && parsed.y != null) value = parsed.y;
    else if ("x" in parsed && parsed.x != null) value = parsed.x;
    else value = context.raw;
  } else if (typeof parsed === "number") {
    value = parsed;
  } else {
    value = context.raw;
  }
  const n = Number(value);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      })
    : String(value);

  const ds = context.dataset?.label;
  const piece = context.label;
  if (piece && !ds) return ` ${piece}: ${formatted}`;
  if (ds) return ` ${ds}: ${formatted}`;
  return ` ${formatted}`;
}
