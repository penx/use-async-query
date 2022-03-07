import { expectType } from "tsd";
import { useAsyncQuery } from "./index";

expectType<{
  foo: string;
} | null>(
  useAsyncQuery<{ foo: string }, { bar: string }>(
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
    useAsyncQuery<{ foo: string }>(
      () =>
        new Promise<{ foo: string }>((resolve) =>
          setTimeout(() => resolve({ foo: "test" }), 0)
        ),
    ).data
  );
  