/// <reference lib="WebWorker" />
import { JSONHeroSearch } from "@jsonhero/fuzzy-json-search";
import { inferType } from "@jsonhero/json-infer-types";
import { formatValue } from "./utilities/formatter";

type SearchWorker = {
  searcher?: JSONHeroSearch;
};

export type {};
declare let self: DedicatedWorkerGlobalScope & SearchWorker;

type InitializeIndexEvent = {
  type: "initialize-index";
  payload: { json: unknown };
};

type SearchEvent = {
  type: "search";
  payload: { query: string };
};

type SearchWorkerEvent = InitializeIndexEvent | SearchEvent;

self.onmessage = (e: MessageEvent<SearchWorkerEvent>) => {
  const { type, payload } = e.data;

  switch (type) {
    case "initialize-index": {
      const { json } = payload;

      self.searcher = new JSONHeroSearch(json, {
        cacheSettings: { max: 100, enabled: true },
        formatter: valueFormatter,
      });
      self.searcher.prepareIndex();

      self.postMessage({ type: "index-initialized" });

      break;
    }
    case "search": {
      const { query } = payload;

      if (!self.searcher) {
        throw new Error("Search index not initialized");
      }

      const start = performance.now();

      const results = self.searcher.search(query);

      self.postMessage({
        type: "search-results",
        payload: { results, query },
      });
    }
  }
};

function valueFormatter(value: unknown): string | undefined {
  const inferredType = inferType(value);

  return formatValue(inferredType);
}
