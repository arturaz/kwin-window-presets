import { ClientAreaOption, type Output } from "kwin-api";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const right = (r: Rect) => r.x + r.width;
const bottom = (r: Rect) => r.y + r.height;

export function rectOf(q: Rect): Rect {
  return { x: q.x, y: q.y, width: q.width, height: q.height };
}

export function roundRect(r: Rect): Rect {
  const x = Math.round(r.x), y = Math.round(r.y);
  return { x, y, width: Math.round(right(r)) - x, height: Math.round(bottom(r)) - y };
}

export function boundingRect(rs: Rect[]): Rect {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, width: Math.max(...rs.map(right)) - x, height: Math.max(...rs.map(bottom)) - y };
}

/** Sorts outputs left-to-right, then top-to-bottom. */
export function sortOutputs(outputs: Output[]): Output[] {
  return outputs.slice().sort((a, b) => a.geometry.x - b.geometry.x || a.geometry.y - b.geometry.y);
}

/** "h" if `b` sits directly right of `a`, "v" if directly below, else null. */
export function adjacency(a: Rect, b: Rect): "h" | "v" | null {
  const overlapY = Math.min(bottom(a), bottom(b)) - Math.max(a.y, b.y);
  const overlapX = Math.min(right(a), right(b)) - Math.max(a.x, b.x);
  if (right(a) === b.x && overlapY > 0) return "h";
  if (bottom(a) === b.y && overlapX > 0) return "v";
  return null;
}

/**
 * Bounding rect of the outputs. With `useWorkArea`, each edge of that rect is
 * pulled in by the largest panel/strut inset of any output touching that edge,
 * so the result never overlaps a panel.
 */
export function spanRect(outputs: Output[], useWorkArea: boolean): Rect {
  const geoms = outputs.map((o) => rectOf(o.geometry));
  const box = boundingRect(geoms);
  if (!useWorkArea) return box;

  let top = 0, bot = 0, left = 0, rgt = 0;
  outputs.forEach((o, i) => {
    const g = geoms[i];
    const a = rectOf(workspace.clientArea(ClientAreaOption.MaximizeArea, o, workspace.currentDesktop));
    if (g.y === box.y) top = Math.max(top, a.y - g.y);
    if (bottom(g) === bottom(box)) bot = Math.max(bot, bottom(g) - bottom(a));
    if (g.x === box.x) left = Math.max(left, a.x - g.x);
    if (right(g) === right(box)) rgt = Math.max(rgt, right(g) - right(a));
  });
  return { x: box.x + left, y: box.y + top, width: box.width - left - rgt, height: box.height - top - bot };
}

/** One-screen-sized rect centred on the seam between two adjacent outputs. */
export function seamRect(a: Output, b: Output, useWorkArea: boolean): Rect | null {
  const ga = rectOf(a.geometry), gb = rectOf(b.geometry);
  const dir = adjacency(ga, gb);
  if (!dir) return null;
  const span = spanRect([a, b], useWorkArea);
  if (dir === "h") {
    const w = Math.min(ga.width, gb.width);
    return { x: right(ga) - w / 2, y: span.y, width: w, height: span.height };
  }
  const h = Math.min(ga.height, gb.height);
  return { x: span.x, y: bottom(ga) - h / 2, width: span.width, height: h };
}

/** Part `index` of `parts` equal slices of `r`, split along its longer side. */
export function slice(r: Rect, parts: number, index: number): Rect {
  if (r.width >= r.height) {
    const x0 = r.x + (r.width * index) / parts, x1 = r.x + (r.width * (index + 1)) / parts;
    return { x: x0, y: r.y, width: x1 - x0, height: r.height };
  }
  const y0 = r.y + (r.height * index) / parts, y1 = r.y + (r.height * (index + 1)) / parts;
  return { x: r.x, y: y0, width: r.width, height: y1 - y0 };
}
