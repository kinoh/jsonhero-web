import { useEffect, useState } from "react";

export function CodeViewer({ code, lang }: { code: string; lang?: "json" }) {
  const [ClientCodeViewer, setClientCodeViewer] = useState<null | ((props: {
    code: string;
    lang?: "json";
  }) => JSX.Element)>(null);

  useEffect(() => {
    let mounted = true;

    import("./CodeViewer.client").then((module) => {
      if (mounted) {
        setClientCodeViewer(() => module.CodeViewerClient);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ClientCodeViewer) {
    return <pre className="overflow-auto whitespace-pre-wrap break-all">{code}</pre>;
  }

  return <ClientCodeViewer code={code} lang={lang} />;
}
