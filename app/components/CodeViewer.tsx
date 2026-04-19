import { JsonRender } from "./JsonRender";

export function CodeViewer({ code, lang }: { code: string; lang?: "json" }) {
  // Only JSON highlighting is implemented; non-JSON content renders as plain text
  // inside the same monospace layout, which matches the previous CodeMirror behavior
  // closely enough for the few non-JSON call sites.
  void lang;
  return <JsonRender code={code} />;
}
