import { JSONHeroPath } from "@jsonhero/path";
import jsonMap from "json-source-map";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useJson } from "~/hooks/useJson";
import {
  useJsonColumnViewAPI,
  useJsonColumnViewState,
} from "~/hooks/useJsonColumnView";
import { usePreferences } from "~/components/PreferencesProvider";
import { JsonRender } from "./JsonRender";

export function JsonEditor() {
  const [json] = useJson();
  const { selectedNodeId } = useJsonColumnViewState();
  const { goToNodeId } = useJsonColumnViewAPI();
  const [preferences] = usePreferences();
  const indent = preferences?.indent || 2;

  const { code, pointers } = useMemo(() => {
    const result = jsonMap.stringify(json, null, indent);
    return { code: result.json, pointers: result.pointers };
  }, [json, indent]);

  const lineForNodeId = useCallback(
    (nodeId: string | undefined) => {
      if (!nodeId) return undefined;
      const pointer = new JSONHeroPath(nodeId).jsonPointer();
      const info = pointers[pointer];
      if (!info) return undefined;
      const anchor = info.key ?? info.value;
      return anchor.line + 1;
    },
    [pointers]
  );

  // Local caret: decoupled from selectedNodeId so the user can move through
  // lines that don't map to a pointer (e.g. lines holding only `}` or `]`).
  const [currentLine, setCurrentLine] = useState<number | undefined>(() =>
    lineForNodeId(selectedNodeId)
  );
  const lastSyncedNodeIdRef = useRef(selectedNodeId);

  // Re-sync only when selectedNodeId was changed from outside this editor.
  useEffect(() => {
    if (selectedNodeId === lastSyncedNodeIdRef.current) return;
    lastSyncedNodeIdRef.current = selectedNodeId;
    const line = lineForNodeId(selectedNodeId);
    if (line !== undefined) setCurrentLine(line);
  }, [selectedNodeId, lineForNodeId]);

  const onSelectedLineChange = useCallback(
    (line: number) => {
      setCurrentLine(line);
      const target = line - 1;
      const entries = Object.entries(pointers);
      let match = entries.find(([, info]) => info.value.line === target);
      if (!match) {
        for (let i = entries.length - 1; i >= 0; i--) {
          if (entries[i][1].valueEnd.line === target) {
            match = entries[i];
            break;
          }
        }
      }
      if (!match) return;
      const path = JSONHeroPath.fromPointer(match[0]);
      const nodeId = path.toString();
      lastSyncedNodeIdRef.current = nodeId;
      goToNodeId(nodeId, "editor");
    },
    [pointers, goToNodeId]
  );

  return (
    <JsonRender
      code={code}
      selectedLine={currentLine}
      onSelectedLineChange={onSelectedLineChange}
      focusable
      showCopyButton
    />
  );
}
