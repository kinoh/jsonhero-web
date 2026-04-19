import { useEffect, useState } from "react";

export type CodeEditorProps = {
  content: string;
  language?: "json";
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onUpdate?: (update: import("./CodeEditor.client").ViewUpdate) => void;
  selection?: { start: number; end: number };
};

export function CodeEditor(opts: CodeEditorProps) {
  const [ClientCodeEditor, setClientCodeEditor] = useState<null | ((props: CodeEditorProps) => JSX.Element)>(null);

  useEffect(() => {
    let mounted = true;

    import("./CodeEditor.client").then((module) => {
      if (mounted) {
        setClientCodeEditor(() => module.CodeEditorClient);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ClientCodeEditor) {
    return (
      <pre className="h-jsonViewerHeight overflow-auto whitespace-pre-wrap break-all">
        {opts.content}
      </pre>
    );
  }

  return <ClientCodeEditor {...opts} />;
}
