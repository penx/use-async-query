import { expectType } from "tsd";
import { useQuery } from "./use-query";

expectType<{
  foo: string;
} | null>(
  useQuery<{ foo: string }, { bar: string }>(
    () =>
      new Promise<{ foo: string }>((resolve) =>
        setTimeout(() => resolve({ foo: "test" }), 0)
      ),
    {
      variables: { bar: "test" },
    }
  ).data
);

expectType<{
  foo: string;
} | null>(
  useQuery<{ foo: string }>(
    () =>
      new Promise<{ foo: string }>((resolve) =>
        setTimeout(() => resolve({ foo: "test" }), 0)
      )
  ).data
);
