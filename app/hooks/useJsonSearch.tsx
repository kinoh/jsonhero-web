import { useJson } from "./useJson";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

import { SearchResult } from "@jsonhero/fuzzy-json-search";

export type InitializeIndexEvent = {
  type: "initialize-index";
  payload: { json: unknown };
};

export type SearchEvent = {
  type: "search";
  payload: { query: string };
};

export type SearchSendWorkerEvent = InitializeIndexEvent | SearchEvent;

export type IndexInitializedEvent = {
  type: "index-initialized";
};

export type SearchResultsEvent = {
  type: "search-results";
  payload: { results: Array<SearchResult<string>>; query: string };
};

export type SearchReceiveWorkerEvent =
  | IndexInitializedEvent
  | SearchResultsEvent;

export type JsonSearchApi = {
  search: (query: string) => void;
  reset: () => void;
};

const JsonSearchStateContext = createContext<JsonSearchState>(
  {} as JsonSearchState
);

const JsonSearchApiContext = createContext<JsonSearchApi>({} as JsonSearchApi);

export type JsonSearchState = {
  status: "initializing" | "idle" | "searching";
  query?: string;
  results?: Array<SearchResult<string>>;
};

type SearchAction = {
  type: "search";
  payload: { query: string };
};

type ResetAction = {
  type: "reset";
};

type JsonSearchAction = SearchReceiveWorkerEvent | SearchAction | ResetAction;

function reducer(
  state: JsonSearchState,
  action: JsonSearchAction
): JsonSearchState {
  switch (state.status) {
    case "initializing": {
      if (action.type === "index-initialized") {
        return {
          ...state,
          status: "idle",
          results: undefined,
        };
      }

      return state;
    }
    case "idle": {
      if (action.type === "reset") {
        return {
          ...state,
          query: undefined,
          results: undefined,
        };
      }

      if (action.type === "search") {
        return {
          ...state,
          status: "searching",
          query: action.payload.query,
        };
      }

      return state;
    }
    case "searching": {
      if (action.type === "reset") {
        return {
          ...state,
          status: "idle",
          query: undefined,
          results: undefined,
        };
      }

      if (
        action.type === "search-results" &&
        state.query === action.payload.query
      ) {
        return {
          ...state,
          status: "idle",
          results: action.payload.results,
        };
      }

      return state;
    }
  }
}

export function JsonSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [json] = useJson();

  const [state, dispatch] = useReducer<
    React.Reducer<JsonSearchState, JsonSearchAction>
  >(reducer, { status: "initializing" });

  const search = useCallback(
    (query: string) => {
      dispatch({ type: "search", payload: { query } });
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
  }, [dispatch]);

  const handleWorkerMessage = useCallback(
    (e: MessageEvent<SearchReceiveWorkerEvent>) => dispatch(e.data),
    [dispatch]
  );

  const workerRef = useRef<Worker | null>();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.Worker === "undefined") {
      return;
    }

    if (workerRef.current) {
      return;
    }

    const worker = new Worker("/entry.worker.js");
    worker.onmessage = handleWorkerMessage;

    workerRef.current = worker;

    workerRef.current.postMessage({
      type: "initialize-index",
      payload: {
        json,
      },
    });
  }, [json, workerRef.current]);

  useEffect(() => {
    if (state.status !== "searching") {
      return;
    }

    workerRef.current?.postMessage({
      type: "search",
      payload: { query: state.query },
    });
  }, [state.status, workerRef.current]);

  return (
    <JsonSearchStateContext.Provider value={state}>
      <JsonSearchApiContext.Provider value={{ search, reset }}>
        {children}
      </JsonSearchApiContext.Provider>
    </JsonSearchStateContext.Provider>
  );
}

export function useJsonSearchState(): JsonSearchState {
  return useContext(JsonSearchStateContext);
}

export function useJsonSearchApi(): JsonSearchApi {
  return useContext(JsonSearchApiContext);
}
