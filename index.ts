import { useState, useRef, useMemo } from "react";

/**
 * Mirrors the functionality of
 * [Apollo's useQuery hook](https://www.apollographql.com/docs/react/data/queries/#usequery-api),
 * but with a "query" being any async function rather than GQL statement.
 */
export const useAsyncQuery = <Data, Variables>(
  query: (variables: Variables) => Promise<Data>,
  options: {
    variables: Variables; //TODO: call signature without Variables, optional Options
    skip?: boolean;
    onCompleted?: (data: Data) => void;
    onError?: (error: Error) => void;
  }
): { loading: boolean; error: Error | null; data: Data | null } => {
  const { variables, skip, onCompleted, onError } = options || {};

  const data = useRef<Data>(null);
  const loading = useRef<boolean>(!skip);
  const error = useRef(null);
  const cancelLast = useRef<() => void>();
  const [, forceUpdate] = useState(0);

  cancelLast.current = useMemo(() => {
    cancelLast.current?.();
    let isLatest = true;
    if (skip) {
      loading.current = false;
      error.current = null;
    } else {
      data.current = null;
      loading.current = true;
      error.current = null;
      query(variables)
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
            data.current = null;
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

  return { loading: loading.current, error: error.current, data: data.current };
};

export default useAsyncQuery;
