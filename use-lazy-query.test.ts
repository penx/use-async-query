import {
  renderHook,
  act,
  RenderHookResult,
} from "@testing-library/react-hooks";
import {
  LazyQueryOptionsWithVariables,
  LazyQueryResult,
  useLazyQuery,
} from "./use-lazy-query";

class Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void = () => null;
  reject: (reason?: any) => void = () => null;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

describe("useLazyQuery", () => {
  describe("when an asyncronous query", () => {
    let deferred: Deferred<string>;
    const mockQuery = jest.fn<Promise<string>, [{ option: string }]>();

    beforeEach(() => {
      deferred = new Deferred<string>();
      mockQuery.mockReturnValue(deferred.promise);
    });
    afterEach(() => {
      mockQuery.mockReset();
    });

    describe("is called with variables", () => {
      let renderHookResult: RenderHookResult<
        LazyQueryOptionsWithVariables<string, { option: string }>,
        LazyQueryResult<string, { option: string }>
      >;
      const onCompleted = jest.fn<void, [string]>();
      const onError = jest.fn<void, [any]>();
      beforeEach(() => {
        renderHookResult = renderHook<
          LazyQueryOptionsWithVariables<string, { option: string }>,
          LazyQueryResult<string, { option: string }>
        >(
          (options) =>
            useLazyQuery<string, { option: string }>(mockQuery, options),
          {
            initialProps: {
              variables: { option: "run1" },
              onCompleted,
              onError,
            },
          }
        );
      });
      it("should start with loading set to false", async () => {
        expect(mockQuery).toHaveBeenCalledTimes(0);
        expect(renderHookResult.result.current[1].error).toBe(null);
        expect(renderHookResult.result.current[1].loading).toBe(false);
        expect(renderHookResult.result.current[1].data).toBe(null);
        expect(renderHookResult.result.all.length).toBe(1);
      });
      describe("refetch is called", () => {
        beforeEach(() => {
          act(() => {
            renderHookResult.result.current[1].refetch({ option: "run2" });
          });
        });
        it("should call the query", () => {
          expect(mockQuery).toHaveBeenCalledWith({ option: "run2" });
          expect(mockQuery).toHaveBeenCalledTimes(1);
          expect(renderHookResult.result.all.length).toBe(2);
        });
        it("should set loading to true", () => {
          expect(renderHookResult.result.current[1].error).toBe(null);
          expect(renderHookResult.result.current[1].loading).toBe(true);
          expect(renderHookResult.result.current[1].data).toBe(null);
          expect(renderHookResult.result.all.length).toBe(2);
        });
        describe("the query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.resolve("resolved");
            });
          });
          it("should return with loading set to false", () => {
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(renderHookResult.result.current[1].error).toBe(null);
            expect(renderHookResult.result.current[1].loading).toBe(false);
            expect(renderHookResult.result.current[1].data).toBe("resolved");
            expect(renderHookResult.result.all.length).toBe(3);
          });
        });
      });
    });
  });
});
