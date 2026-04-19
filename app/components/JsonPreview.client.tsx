import { RangeSetBuilder } from "@codemirror/rangeset";
import { JSONHeroPath } from "@jsonhero/path";
import {
  useCodeMirror,
  EditorView,
  Decoration,
  Facet,
  ViewPlugin,
  Compartment,
  TransactionSpec,
} from "@uiw/react-codemirror";
import jsonMap from "json-source-map";
import { useRef, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { getPreviewSetup } from "~/utilities/codeMirrorSetup";
import { lightTheme, darkTheme } from "~/utilities/codeMirrorTheme";
import type { JsonPreviewProps } from "./JsonPreview";
import { CopyTextButton } from "./CopyTextButton";
import { usePreferences } from "./PreferencesProvider";
import { useTheme } from "./ThemeProvider";

export function JsonPreviewClient({ json, highlightPath }: JsonPreviewProps) {
  const editor = useRef(null);
  const [preferences] = usePreferences();

  const jsonMapped = useMemo(() => {
    return jsonMap.stringify(json, null, preferences?.indent || 2);
  }, [json, preferences]);

  const lines: LineRange | undefined = useMemo(() => {
    if (!highlightPath) {
      return;
    }

    const path = new JSONHeroPath(highlightPath);
    const pointer = path.jsonPointer();
    const selectionInfo = jsonMapped.pointers[pointer];

    return {
      from: selectionInfo.value.line + 1,
      to: selectionInfo.valueEnd.line + 1,
    };
  }, [jsonMapped, highlightPath]);

  const extensions = getPreviewSetup();
  const highlighting = new Compartment();

  if (lines) {
    extensions.push(highlighting.of(highlightLineRange(lines)));
  }

  const [theme] = useTheme();

  const { setContainer, view, state } = useCodeMirror({
    container: editor.current,
    extensions,
    value: jsonMapped.json,
    editable: false,
    contentEditable: false,
    autoFocus: false,
    basicSetup: false,
    theme: theme === "light" ? lightTheme() : darkTheme(),
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [editor.current]);

  useEffect(() => {
    if (!view) {
      return;
    }

    const transactionSpec: TransactionSpec = {
      changes: { from: 0, to: view.state.doc.length, insert: jsonMapped.json },
    };

    if (lines != null) {
      transactionSpec.effects = highlighting.reconfigure(
        highlightLineRange(lines)
      );
    }

    view.dispatch(transactionSpec);
  }, [view, highlighting, jsonMapped, highlightPath]);

  useHotkeys(
    "ctrl+a,meta+a,command+a",
    (e) => {
      e.preventDefault();
      view?.dispatch({ selection: { anchor: 0, head: state?.doc.length } });
    },
    [view, state]
  );

  const [hovering, setHovering] = useState(false);

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div ref={editor} />
      <div
        className={`absolute top-1 right-0 flex w-full justify-end transition ${
          hovering ? "opacity-100" : "opacity-0"
        }`}
      >
        <CopyTextButton
          value={jsonMapped.json}
          className="mr-1 h-fit rounded-sm bg-slate-200 px-2 py-0.5 transition hover:cursor-pointer hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
        />
      </div>
    </div>
  );
}

interface LineRange {
  from: number;
  to: number;
}

const baseTheme = EditorView.baseTheme({
  "&light .cm-highlighted": { backgroundColor: "#ffee0055" },
  "&dark .cm-highlighted": { backgroundColor: "#ffee0055" },
});

const highlightedRange = Facet.define<LineRange, LineRange>({
  combine: (values) => (values.length ? values[0] : { from: -1, to: -1 }),
});

function highlightLineRange(range: LineRange | null) {
  return [
    baseTheme,
    range == null ? [] : highlightedRange.of(range),
    highlightLineRangePlugin,
  ];
}

const lineHighlightDecoration = Decoration.line({
  attributes: { class: "cm-highlighted" },
});

function highlightLines(view: EditorView) {
  const highlightRange = view.state.facet(highlightedRange);
  const builder = new RangeSetBuilder();

  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);

      if (
        line.number >= highlightRange.from &&
        line.number <= highlightRange.to
      ) {
        builder.add(line.from, line.from, lineHighlightDecoration);
      }

      pos = line.to + 1;
    }
  }

  return builder.finish();
}

const highlightLineRangePlugin = ViewPlugin.fromClass(
  class {
    decorations: any;

    constructor(view: any) {
      this.decorations = highlightLines(view);
    }

    update(update: { docChanged: any; viewportChanged: any; view: any }) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = highlightLines(update.view);
      }
    }
  },
  {
    decorations: (view) => view.decorations,
  }
);
