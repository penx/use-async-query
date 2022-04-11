import { useCallback, useState } from "react";

import { useQuery, Options, Result as UseQueryResult } from "./use-query";

export type LazyQueryHookOptions<TData, TVariables> = Omit<
  Options<TData, TVariables>,
  "skip"
>;

export type Result<TData, TVariables> = [
  (
    options?:
      | {
          variables: TVariables;
        }
      | undefined
  ) => Promise<UseQueryResult<TData, TVariables> & { called?: boolean }>,
  UseQueryResult<TData, TVariables> & { called?: boolean }
];

export function useLazyQuery<TData = any, TVariables = Record<string, any>>(
  query: (variables?: TVariables) => Promise<TData>,
  options?: LazyQueryHookOptions<TData, TVariables>
): Result<TData, TVariables> {
  const [execution, setExecution] = useState<{
    called: boolean;
    options?: { variables: TVariables };
  }>({
    called: false,
  });

  let result: UseQueryResult<TData, TVariables> & { called?: boolean } =
    useQuery<TData, TVariables>(query, {
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
