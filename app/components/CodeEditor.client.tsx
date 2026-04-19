import { json as jsonLang } from "@codemirror/lang-json";
import {
  EditorView,
  TransactionSpec,
  useCodeMirror,
  ViewUpdate,
} from "@uiw/react-codemirror";
import { useRef, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { getEditorSetup } from "~/utilities/codeMirrorSetup";
import { darkTheme, lightTheme } from "~/utilities/codeMirrorTheme";
import type { CodeEditorProps } from "./CodeEditor";
import { useTheme } from "./ThemeProvider";

const languages = {
  json: jsonLang,
};

type CodeEditorDefaultProps = Required<
  Omit<CodeEditorProps, "content" | "onChange" | "onUpdate">
>;

const defaultProps: CodeEditorDefaultProps = {
  language: "json",
  readOnly: true,
  selection: { start: 0, end: 0 },
};

export function CodeEditorClient(opts: CodeEditorProps) {
  const { content, language, readOnly, onChange, onUpdate, selection } = {
    ...defaultProps,
    ...opts,
  };

  const [theme] = useTheme();

  const extensions = getEditorSetup();

  const languageExtension = languages[language];

  extensions.push(languageExtension());

  const editor = useRef(null);
  const { setContainer, view, state } = useCodeMirror({
    container: editor.current,
    extensions,
    editable: !readOnly,
    contentEditable: !readOnly,
    value: content,
    autoFocus: false,
    theme: theme === "light" ? lightTheme() : darkTheme(),
    indentWithTab: false,
    basicSetup: false,
    onChange,
    onUpdate,
  });

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current);
    }
  }, [editor.current]);

  const setSelectionRef = useRef(false);

  useEffect(() => {
    if (setSelectionRef.current) {
      return;
    }

    if (view) {
      setSelectionRef.current = true;

      const selectionStart = selection?.start ?? defaultProps.selection.start;
      const selectionEnd = selection?.end ?? defaultProps.selection.end;

      const transactionSpec: TransactionSpec = {
        selection: { anchor: selectionStart, head: selectionEnd },
        effects: EditorView.scrollIntoView(selectionStart, {
          y: "start",
          yMargin: 100,
        }),
      };

      view.dispatch(transactionSpec);
    }
  }, [selection, view, setSelectionRef.current]);

  useHotkeys(
    "ctrl+a,meta+a,command+a",
    (e) => {
      e.preventDefault();
      view?.dispatch({ selection: { anchor: 0, head: state?.doc.length } });
    },
    [view, state]
  );

  return (
    <div className="flex-1 min-h-0">
      <div
        className="h-full overflow-y-auto no-scrollbar"
        ref={editor}
      />
    </div>
  );
}

export type { ViewUpdate };
