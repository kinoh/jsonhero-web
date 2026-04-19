import { JSONHeroPath } from "@jsonhero/path";
import jsonMap from "json-source-map";
import { useMemo } from "react";
import { usePreferences } from "./PreferencesProvider";
import { JsonRender } from "./JsonRender";

export type JsonPreviewProps = {
  json: unknown;
  highlightPath?: string;
};

export function JsonPreview({ json, highlightPath }: JsonPreviewProps) {
  const [preferences] = usePreferences();
  const indent = preferences?.indent || 2;

  const { code, pointers } = useMemo(() => {
    const result = jsonMap.stringify(json, null, indent);
    return { code: result.json, pointers: result.pointers };
  }, [json, indent]);

  const highlightLines = useMemo(() => {
    if (!highlightPath) return undefined;
    const pointer = new JSONHeroPath(highlightPath).jsonPointer();
    const info = pointers[pointer];
    if (!info) return undefined;
    return { from: info.value.line + 1, to: info.valueEnd.line + 1 };
  }, [highlightPath, pointers]);

  return <JsonRender code={code} highlightLines={highlightLines} showCopyButton />;
}
