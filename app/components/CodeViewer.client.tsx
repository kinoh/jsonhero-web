import { json as jsonLang } from "@codemirror/lang-json";
import { useCodeMirror } from "@uiw/react-codemirror";
import { useRef, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { getViewerSetup } from "~/utilities/codeMirrorSetup";
import { darkTheme, lightTheme } from "~/utilities/codeMirrorTheme";
import { useTheme } from "./ThemeProvider";

export function CodeViewerClient({
  code,
  lang,
}: {
  code: string;
  lang?: "json";
}) {
  const editor = useRef(null);

  const extensions = getViewerSetup();

  if (!lang || lang === "json") {
    extensions.push(jsonLang());
  }

  const [theme] = useTheme();

  const { setContainer, view, state } = useCodeMirror({
    container: editor.current,
    extensions,
    value: code,
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

  useHotkeys(
    "ctrl+a,meta+a,command+a",
    (e) => {
      e.preventDefault();
      view?.dispatch({ selection: { anchor: 0, head: state?.doc.length } });
    },
    [view, state]
  );

  return (
    <div>
      <div ref={editor} />
    </div>
  );
}
