import type { Output } from "kwin-api";
import { adjacency, rectOf, seamRect, slice, sortOutputs, spanRect, type Rect } from "./geometry.ts";

export interface Action {
  name: string;
  shortcut: string;
  /** Geometry to apply, computed when the shortcut fires; null = can't apply now. */
  resolve(): Rect | null;
}

export interface AutoOptions {
  spanAll: boolean;
  spanPairs: boolean;
  seams: boolean;
  halves: boolean;
  thirds: boolean;
  useWorkArea: boolean;
}

/** Looks outputs up by name at trigger time, so geometry/scale changes are picked up live. */
function findOutputs(names: string[]): Output[] | null {
  const found = names.map((n) => workspace.screens.find((o) => o.name === n));
  return found.every((o) => o !== undefined) ? (found as Output[]) : null;
}

/**
 * Generated layouts. Which actions exist is decided at load (from the outputs
 * present then); each action's geometry is computed when it fires.
 */
export function buildAutoActions(opt: AutoOptions): Action[] {
  const actions: Action[] = [];
  const outputs = sortOutputs(workspace.screens);
  const all = () => spanRect(workspace.screens, opt.useWorkArea);

  if (opt.spanAll && outputs.length > 1) {
    actions.push({ name: "Auto: Span all screens", shortcut: "", resolve: all });
  }

  const pairs: [Output, Output][] = [];
  for (let i = 0; i < outputs.length; i++) {
    for (let j = 0; j < outputs.length; j++) {
      if (i !== j && adjacency(rectOf(outputs[i].geometry), rectOf(outputs[j].geometry))) {
        pairs.push([outputs[i], outputs[j]]);
      }
    }
  }
  for (const [a, b] of pairs) {
    const names = [a.name, b.name];
    if (opt.spanPairs) {
      actions.push({
        name: `Auto: Span ${a.name} + ${b.name}`,
        shortcut: "",
        resolve: () => {
          const os = findOutputs(names);
          return os && spanRect(os, opt.useWorkArea);
        },
      });
    }
    if (opt.seams) {
      actions.push({
        name: `Auto: Centre on ${a.name}/${b.name} seam`,
        shortcut: "",
        resolve: () => {
          const os = findOutputs(names);
          return os && seamRect(os[0], os[1], opt.useWorkArea);
        },
      });
    }
  }

  const splits: [boolean, number, string][] = [
    [opt.halves, 2, "half"],
    [opt.thirds, 3, "third"],
  ];
  for (const [enabled, parts, word] of splits) {
    if (!enabled) continue;
    for (let i = 0; i < parts; i++) {
      actions.push({
        name: `Auto: Desktop ${word} ${i + 1} of ${parts}`,
        shortcut: "",
        resolve: () => slice(all(), parts, i),
      });
    }
  }
  return actions;
}
