import { useCallback, useState } from "react";

import {
  useQuery,
  Variables,
  QueryOptions,
  QueryResult,
  QueryOptionsWithVariables,
} from "./use-query";

export type LazyQueryOptions<TData> = Omit<QueryOptions<TData>, "skip">;

export type LazyQueryOptionsWithVariables<
  TData,
  TVariables extends Variables
> = Omit<QueryOptionsWithVariables<TData, TVariables>, "skip">;

export type LazyQueryResult<TData, TVariables extends Variables> = [
  (
    options?:
      | {
          variables: TVariables;
        }
      | undefined
  ) => Promise<QueryResult<TData, TVariables> & { called?: boolean }>,
  QueryResult<TData, TVariables> & { called?: boolean }
];

export function useLazyQuery<TData>(
  query: () => Promise<TData>,
  options?: LazyQueryOptions<TData>
): LazyQueryResult<TData, never>;
export function useLazyQuery<TData, TVariables extends Variables>(
  query: (variables: TVariables) => Promise<TData>,
  options: LazyQueryOptionsWithVariables<TData, TVariables>
): LazyQueryResult<TData, TVariables>;
export function useLazyQuery<TData, TVariables extends Variables>(
  query: (variables?: TVariables) => Promise<TData>,
  options?:
    | LazyQueryOptionsWithVariables<TData, TVariables>
    | LazyQueryOptions<TData>
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
  >(query, Object.assign({}, options, execution.options, { skip: true }));

  if (!execution.called) {
    result = {
      ...result,
      called: false,
    };
  }

  const execute = useCallback(
    (executeOptions?: { variables: TVariables }) => {
      setExecution({ called: true, options: executeOptions });
      return result.refetch(executeOptions?.variables).then((newResult) => ({
        ...result,
        data: newResult.data,
        error: newResult.error,
        called: true,
        loading: false,
      }));
    },
    [result]
  );

  return [execute, result];
}
