import { useCallback, useState } from "react";

import { useQuery, QueryOptions, QueryResult } from "./use-query";

export type LazyQueryOptions<TData, TVariables> = Omit<
  QueryOptions<TData, TVariables>,
  "skip"
>;

export type LazyQueryResult<TData, TVariables> = [
  (
    options?:
      | {
          variables: TVariables;
        }
      | undefined
  ) => Promise<QueryResult<TData, TVariables> & { called?: boolean }>,
  QueryResult<TData, TVariables> & { called?: boolean }
];

export function useLazyQuery<TData = any, TVariables = Record<string, any>>(
  query: (variables?: TVariables) => Promise<TData>,
  options?: LazyQueryOptions<TData, TVariables>
): LazyQueryResult<TData, TVariables> {
  const [execution, setExecution] = useState<{
    called: boolean;
    options?: { variables: TVariables };
  }>({
    called: false,
  });

  let result: QueryResult<TData, TVariables> & { called?: boolean } = useQuery<
    TData,
    TVariables
  >(query, {
    ...options,
    ...execution.options,
    skip: true,
  });

  if (!execution.called) {
    result = {
      ...result,
      called: false,
    };
  }

  const execute = useCallback((executeOptions?: { variables: TVariables }) => {
    setExecution({ called: true, options: executeOptions });
    return result.refetch(executeOptions?.variables).then((newResult) => ({
      ...result,
      data: newResult.data,
      error: newResult.error,
      called: true,
      loading: false,
    }));
  }, []);

  return [execute, result];
}
