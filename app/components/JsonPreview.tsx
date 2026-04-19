import { useEffect, useState } from "react";

export type JsonPreviewProps = {
  json: unknown;
  highlightPath?: string;
};

export function JsonPreview({ json, highlightPath }: JsonPreviewProps) {
  const [ClientJsonPreview, setClientJsonPreview] = useState<null | ((props: JsonPreviewProps) => JSX.Element)>(null);

  useEffect(() => {
    let mounted = true;

    import("./JsonPreview.client").then((module) => {
      if (mounted) {
        setClientJsonPreview(() => module.JsonPreviewClient);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ClientJsonPreview) {
    return (
      <pre className="h-full overflow-auto whitespace-pre-wrap break-all">
        {JSON.stringify(json, null, 2)}
      </pre>
    );
  }

  return <ClientJsonPreview json={json} highlightPath={highlightPath} />;
}
