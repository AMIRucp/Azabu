import type { Time } from "lightweight-charts";

export interface ChartPoint {
  time: Time;
  price: number;
}

export const DRAWING_STROKE = "#D4A574";
export const DRAWING_FILL = "rgba(212,165,116,0.12)";
