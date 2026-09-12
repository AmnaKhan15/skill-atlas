import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./client";

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Fetches `path` whenever any value in `deps` changes. Pass `null` for
 * `path` to skip fetching (e.g. while a required parameter isn't ready
 * yet) -- the hook stays in a loading:false, data:null idle state. */
export function useApiQuery<T>(path: string | null, deps: unknown[] = []): QueryState<T> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: path !== null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Something went wrong.";
        setState({ data: null, loading: false, error: message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refetch };
}

/** Fires a POST request on demand via `mutate(body)`, tracking loading/error. */
export function useApiMutation<TBody, TResult>(path: string) {
  const [state, setState] = useState<QueryState<TResult>>({ data: null, loading: false, error: null });

  const mutate = useCallback(
    async (body: TBody) => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await api.post<TResult>(path, body);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Something went wrong.";
        setState({ data: null, loading: false, error: message });
        throw err;
      }
    },
    [path]
  );

  return { ...state, mutate };
}
