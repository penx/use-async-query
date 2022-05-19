import { renderHook, act, RenderHookResult } from "@testing-library/react";
import {
  LazyQueryOptionsWithPartialVariables,
  LazyQueryOptionsWithVariables,
  LazyQueryResult,
  LazyQueryResultVariablesRequiredInRefetch,
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
  describe("when an asyncronous query with variables", () => {
    let deferred: Deferred<string>;
    const mockQuery = jest.fn<Promise<string>, [{ option: string }]>();
    afterEach(() => {
      mockQuery.mockReset();
    });
    beforeEach(() => {
      deferred = new Deferred<string>();
      mockQuery.mockReturnValue(deferred.promise);
    });

    describe("is called with variables", () => {
      let renderHookResult: RenderHookResult<
        LazyQueryResult<string, { option: string }>,
        LazyQueryOptionsWithVariables<string, { option: string }>
      >;
      const onCompleted = jest.fn<void, [string]>();
      const onError = jest.fn<void, [any]>();
      afterEach(() => {
        onCompleted.mockReset();
        onError.mockReset();
      });
      beforeEach(() => {
        renderHookResult = renderHook<
          LazyQueryResult<string, { option: string }>,
          LazyQueryOptionsWithVariables<string, { option: string }>
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
        });
        it("should set loading to true", () => {
          expect(renderHookResult.result.current[1].error).toBe(null);
          expect(renderHookResult.result.current[1].loading).toBe(true);
          expect(renderHookResult.result.current[1].data).toBe(null);
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
          });
        });
      });

      describe("execute is called", () => {
        beforeEach(() => {
          act(() => {
            renderHookResult.result.current[0]({
              variables: { option: "run2" },
            });
          });
        });
        it("should call the query", () => {
          expect(mockQuery).toHaveBeenCalledWith({ option: "run2" });
          expect(mockQuery).toHaveBeenCalledTimes(1);
        });
        it("should set loading to true", () => {
          expect(renderHookResult.result.current[1].error).toBe(null);
          expect(renderHookResult.result.current[1].loading).toBe(true);
          expect(renderHookResult.result.current[1].data).toBe(null);
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
          });
        });
        describe("the query rejects", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.reject("some error");
            });
          });
          it("should call onError and return the error", () => {
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledTimes(1);
            expect(renderHookResult.result.current[1].error).toEqual(
              "some error"
            );
            expect(renderHookResult.result.current[1].loading).toBe(false);
            expect(renderHookResult.result.current[1].data).toBe(null);
          });
        });
        describe("execute is called with different variables", () => {
          let deferred2: Deferred<string>;
          beforeEach(async () => {
            deferred2 = new Deferred<string>();
            mockQuery.mockReturnValue(deferred2.promise);
            await act(async () => {
              renderHookResult.result.current[0]({
                variables: { option: "run3" },
              });
            });
          });
          it("should call the query", () => {
            expect(mockQuery).toHaveBeenCalledWith({ option: "run3" });
            expect(renderHookResult.result.current[1].error).toBe(null);
            expect(renderHookResult.result.current[1].loading).toBe(true);
            expect(renderHookResult.result.current[1].data).toBe(null);
          });
          describe("the first query rejects", () => {
            beforeEach(async () => {
              await act(async () => {
                deferred.reject("an error");
              });
            });
            it("should not call onError or return the error", () => {
              expect(onError).toHaveBeenCalledTimes(0);
              expect(renderHookResult.result.current[1].error).toBe(null);
              expect(renderHookResult.result.current[1].loading).toBe(true);
              expect(renderHookResult.result.current[1].data).toBe(null);
            });
            describe("the second query resolves", () => {
              beforeEach(async () => {
                await act(async () => {
                  deferred2.resolve("2nd resolved");
                });
              });
              it("should return with loading set to false", () => {
                expect(renderHookResult.result.current[1].error).toBe(null);
                expect(renderHookResult.result.current[1].loading).toBe(false);
                expect(renderHookResult.result.current[1].data).toBe(
                  "2nd resolved"
                );
                expect(onError).toHaveBeenCalledTimes(0);
                expect(mockQuery).toHaveBeenCalledTimes(2);
              });
            });
          });
        });
      });
    });
    describe("is called without options or variables", () => {
      let renderHookResult: RenderHookResult<
        LazyQueryResultVariablesRequiredInRefetch<string, { option: string }>,
        LazyQueryOptionsWithVariables<string, { option: string }>
      >;
      beforeEach(() => {
        renderHookResult = renderHook<
          LazyQueryResultVariablesRequiredInRefetch<string, { option: string }>,
          LazyQueryOptionsWithVariables<string, { option: string }>
        >(() => useLazyQuery<string, { option: string }>(mockQuery), {
        });
      });
      it("should start with loading set to false", async () => {
        expect(mockQuery).toHaveBeenCalledTimes(0);
        expect(renderHookResult.result.current[1].error).toBe(null);
        expect(renderHookResult.result.current[1].loading).toBe(false);
        expect(renderHookResult.result.current[1].data).toBe(null);
      });
    });
    describe("is called with options but no variables", () => {
      let renderHookResult: RenderHookResult<
        LazyQueryResultVariablesRequiredInRefetch<string, { option: string }>,
        LazyQueryOptionsWithVariables<string, { option: string }>
      >;
      const onCompleted = jest.fn<void, [string]>();
      const onError = jest.fn<void, [any]>();
      afterEach(() => {
        onCompleted.mockReset();
        onError.mockReset();
      });
      beforeEach(() => {
        renderHookResult = renderHook<
          LazyQueryResultVariablesRequiredInRefetch<string, { option: string }>,
          LazyQueryOptionsWithPartialVariables<string, { option: string }>
        >(
          (options) =>
            useLazyQuery<string, { option: string }>(mockQuery, options),
          {
            initialProps: {
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
      });
    });
  });
});
