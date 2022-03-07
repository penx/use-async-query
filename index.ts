import { useState, useRef, useMemo } from "react";

interface OptionsWithVariables<TData, TVariables> extends Options<TData> {
  variables: TVariables;
  skip?: boolean;
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
}
type Options<TData> = {
  skip?: boolean;
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
};

export type Result<TData> = {
  loading: boolean;
  error: any;
  data: TData | null;
  previousData: TData | null;
};

/**
 * Mirrors the functionality of
 * [Apollo's useQuery hook](https://www.apollographql.com/docs/react/data/queries/#usequery-api),
 * but with a "query" being any async function rather than GQL statement.
 */
function useAsyncQuery<TData>(
  query: () => Promise<TData>,
  options?: Options<TData>
): Result<TData>;
function useAsyncQuery<TData, TVariables>(
  query: (variables: TVariables) => Promise<TData>,
  options: OptionsWithVariables<TData, TVariables>
): Result<TData>;
function useAsyncQuery<TData, TVariables>(
  query: (variables?: TVariables) => Promise<TData>,
  options?: OptionsWithVariables<TData, TVariables> | Options<TData>
): Result<TData> {
  const { skip, onCompleted, onError } = options || {};

  const data = useRef<TData | null>(null);
  const previousData = useRef<TData | null>(null);
  const loading = useRef<boolean>(!skip);
  const error = useRef<any>(null);
  const cancelLast = useRef<() => void>();
  const [, forceUpdate] = useState(0);
  const variables =
    options && "variables" in options ? options.variables : undefined;
  cancelLast.current = useMemo(() => {
    cancelLast.current?.();
    let isLatest = true;
    if (skip) {
      loading.current = false;
      error.current = null;
    } else {
      previousData.current = data.current;
      data.current = null;
      loading.current = true;
      error.current = null;
      query(...(variables ? [variables] : []))
        .then((response) => {
          if (isLatest) {
            data.current = response;
            loading.current = false;
            error.current = null;
            forceUpdate((x) => x + 1);
            onCompleted?.(response);
          }
        })
        .catch((e) => {
          if (isLatest) {
            loading.current = false;
            error.current = e;
            forceUpdate((x) => x + 1);
            onError?.(e);
          }
        });
    }
    return () => {
      isLatest = false;
    };
  }, [query, variables, onCompleted, onError, skip]);

  return {
    loading: loading.current,
    error: error.current,
    data: data.current,
    previousData: previousData.current,
  };
}

export { useAsyncQuery };
export default useAsyncQuery;
