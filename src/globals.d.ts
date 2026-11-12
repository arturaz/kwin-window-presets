// Globals that KWin injects into the JavaScript (QJSEngine) scripting context.
// The object/interface shapes come from the `kwin-api` package; it only ships
// interfaces, so the globals themselves are declared here.
import type { Workspace, KWin } from "kwin-api";

declare global {
  const workspace: Workspace;
  const readConfig: KWin["readConfig"];
  const registerShortcut: KWin["registerShortcut"];
  /** Fire-and-forget D-Bus call; an optional trailing function receives the reply. */
  function callDBus(service: string, path: string, iface: string, method: string, ...args: unknown[]): void;
  function print(...args: unknown[]): void;
}
