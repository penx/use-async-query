import { useState, useRef, useMemo, useCallback } from "react";

type Variables = Record<string, any>;

export interface Options<TData, TVariables> {
  variables?: TVariables;
  skip?: boolean;
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
}

export type Result<TData, TVariables = Variables> = {
  loading: boolean;
  error: any;
  data: TData | null;
  previousData: TData | null;
  refetch: (
    variables?: TVariables | undefined
  ) => Promise<Result<TData, TVariables>>;
};

/**
 * Mirrors the functionality of
 * [Apollo's useQuery hook](https://www.apollographql.com/docs/react/data/queries/#usequery-api),
 * but with a "query" being any async function rather than GQL statement.
 */
function useQuery<TData = any, TVariables = Variables>(
  query: (variables?: TVariables) => Promise<TData>,
  options?: Options<TData, TVariables>
): Result<TData, TVariables> {
  const { skip, onCompleted, onError } = options || {};

  const data = useRef<TData | null>(null);
  const previousData = useRef<TData | null>(null);
  const loading = useRef<boolean>(!skip);
  const error = useRef<any>(null);
  const cancelLast = useRef<() => void>();
  const [, forceUpdate] = useState(0);
  const variables =
    options && "variables" in options ? options.variables : undefined;

  const fetch: (
    refetchVariables?: TVariables | undefined
  ) => Promise<Result<TData, TVariables>> = useCallback(
    async (refetchVariables: TVariables | undefined = variables) => {
      cancelLast.current?.();
      let isLatest = true;
      previousData.current = data.current;
      data.current = null;
      loading.current = true;
      error.current = null;
      cancelLast.current = () => {
        isLatest = false;
      };
      return query(...(refetchVariables ? [refetchVariables] : []))
        .then((response) => {
          if (isLatest) {
            data.current = response;
            loading.current = false;
            error.current = null;
            forceUpdate((x) => x + 1);
            onCompleted?.(response);
          }
          return {
            loading: loading.current,
            error: error.current,
            data: data.current,
            previousData: previousData.current,
            refetch: fetch,
          };
        })
        .catch((e) => {
          if (isLatest) {
            loading.current = false;
            error.current = e;
            forceUpdate((x) => x + 1);
            onError?.(e);
          }
          throw e;
        });
    },
    [query, variables, onCompleted, onError, skip]
  );

  useMemo(async () => {
    if (!skip) {
      try {
        await fetch();
      } catch (e) {}
    }
  }, [fetch, skip]);

  return {
    loading: loading.current,
    error: error.current,
    data: data.current,
    previousData: previousData.current,
    refetch: fetch,
  };
}

export { useQuery };
export default useQuery;
