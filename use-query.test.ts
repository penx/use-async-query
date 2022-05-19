import { renderHook, act, RenderHookResult } from "@testing-library/react";
import {
  QueryOptions,
  QueryOptionsWithVariables,
  QueryResult,
  useQuery,
} from "./use-query";

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

describe("useQuery", () => {
  describe("when an asyncronous query with variables", () => {
    type QueryVariables = { optionA: string; optionB: string };
    type QueryResponse = string;
    let deferred: Deferred<QueryResponse>;
    const mockQuery = jest.fn<Promise<QueryResponse>, [QueryVariables]>();
    afterEach(() => {
      mockQuery.mockReset();
    });

    beforeEach(() => {
      deferred = new Deferred<QueryResponse>();
      mockQuery.mockReturnValue(deferred.promise);
    });

    describe("is called", () => {
      let renderHookResult: RenderHookResult<
        QueryResult<QueryResponse, QueryVariables>,
        QueryOptionsWithVariables<QueryResponse, QueryVariables>
      >;
      const onCompleted = jest.fn<void, [string]>();
      const onError = jest.fn<void, [any]>();
      afterEach(() => {
        onCompleted.mockReset();
        onError.mockReset();
      });
      beforeEach(() => {
        renderHookResult = renderHook<
          QueryResult<QueryResponse, QueryVariables>,
          QueryOptionsWithVariables<QueryResponse, QueryVariables>
        >(
          (options) =>
            useQuery<QueryResponse, QueryVariables>(mockQuery, options),
          {
            initialProps: {
              variables: { optionA: "run1-A", optionB: "run1-B" },
              onCompleted,
              onError,
            },
          }
        );
      });
      it("should start with loading set to true", async () => {
        expect(mockQuery).toHaveBeenCalledWith<[QueryVariables]>({
          optionA: "run1-A",
          optionB: "run1-B",
        });
        expect(renderHookResult.result.current.error).toBe(null);
        expect(renderHookResult.result.current.loading).toBe(true);
        expect(renderHookResult.result.current.data).toBe(null);
      });

      describe("the query resolves", () => {
        beforeEach(async () => {
          await act(async () => {
            deferred.resolve("resolved");
          });
        });
        it("should return with loading set to false", () => {
          expect(mockQuery).toHaveBeenCalledTimes(1);
          expect(renderHookResult.result.current.error).toBe(null);
          expect(renderHookResult.result.current.loading).toBe(false);
          expect(renderHookResult.result.current.data).toBe("resolved");
        });
        it("should call onCompleted with data returned from query", async () => {
          expect(onCompleted).toHaveBeenCalledTimes(1);
          expect(onCompleted).toHaveBeenCalledWith("resolved");
        });
        it("should not return any previousData", () => {
          expect(renderHookResult.result.current.previousData).toBe(null);
        });

        describe("refetch is called with the same variables", () => {
          beforeEach(async () => {
            await act(async () => {
              await renderHookResult.result.current.refetch({
                optionA: "run1-A",
                optionB: "run1-B",
              });
            });
          });
          it("should call the query again with the same variables", () => {
            expect(mockQuery).toHaveBeenCalledTimes(2);
            expect(mockQuery).toHaveBeenCalledWith({
              optionA: "run1-A",
              optionB: "run1-B",
            });
          });
        });
        describe("refetch is called with partial variables", () => {
          beforeEach(async () => {
            await act(async () => {
              await renderHookResult.result.current.refetch({
                optionB: "run2-B",
              });
            });
          });
          it("should call the query again with merged variables", () => {
            expect(mockQuery).toHaveBeenCalledTimes(2);
            expect(mockQuery).toHaveBeenCalledWith({
              optionA: "run1-A",
              optionB: "run2-B",
            });
          });
        });

        describe("the hook is called again with the same props", () => {
          beforeEach(async () => {
            await act(async () => {
              renderHookResult.rerender({
                variables: { optionA: "run1-A", optionB: "run1-B" },
                onCompleted,
                onError,
              });
            });
          });
          it("should not call the query again", () => {
            expect(mockQuery).toHaveBeenCalledTimes(1);
          });
          it("should not call onCompleted again", () => {
            expect(onCompleted).toHaveBeenCalledTimes(1);
          });
          it("should not call onError", () => {
            expect(onError).not.toHaveBeenCalled();
          });
          it("should not return any previousData", () => {
            expect(renderHookResult.result.current.previousData).toBe(null);
          });
        });

        describe("is called with different variables", () => {
          let deferred2: Deferred<string>;
          beforeEach(() => {
            deferred2 = new Deferred<string>();
            mockQuery.mockReturnValue(deferred2.promise);
            renderHookResult.rerender({
              variables: { optionA: "run2-A", optionB: "run2-B" },
            });
          });

          it("should return with loading=true and data=null", () => {
            expect(mockQuery).toHaveBeenCalledTimes(2);
            expect(mockQuery).toHaveBeenCalledWith({
              optionA: "run2-A",
              optionB: "run2-B",
            });
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(true);
            expect(renderHookResult.result.current.data).toBe(null);
          });

          it("should return previousData", () => {
            expect(renderHookResult.result.current.previousData).toBe(
              "resolved"
            );
          });

          describe("the second query resolves", () => {
            beforeEach(async () => {
              await act(async () => {
                deferred2.resolve("2nd resolved");
              });
            });

            it("should return with data from the second query", () => {
              expect(renderHookResult.result.current.error).toBe(null);
              expect(renderHookResult.result.current.loading).toBe(false);
              expect(renderHookResult.result.current.data).toBe("2nd resolved");
            });
            it("should return previousData from the first query", () => {
              expect(renderHookResult.result.current.previousData).toBe(
                "resolved"
              );
            });
          });
        });
      });

      describe("the query is rejected", () => {
        beforeEach(async () => {
          await act(async () => {
            deferred.reject("rejected");
          });
        });

        it("reports an error and calls onError", async () => {
          expect(renderHookResult.result.current.error).toBe("rejected");
          expect(onError).toHaveBeenCalledTimes(1);
          expect(onError).toHaveBeenCalledWith("rejected");
        });
      });

      describe("is called with different variables", () => {
        let deferred2: Deferred<string>;
        beforeEach(() => {
          deferred2 = new Deferred<string>();
          mockQuery.mockReturnValue(deferred2.promise);
          renderHookResult.rerender({
            variables: { optionA: "run2-A", optionB: "run2-B" },
          });
        });

        it("should return with loading=true and data=null", () => {
          expect(mockQuery).toHaveBeenCalledTimes(2);
          expect(mockQuery).toHaveBeenCalledWith({
            optionA: "run2-A",
            optionB: "run2-B",
          });
          expect(renderHookResult.result.current.error).toBe(null);
          expect(renderHookResult.result.current.loading).toBe(true);
          expect(renderHookResult.result.current.data).toBe(null);
        });

        describe("the second query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred2.resolve("2nd resolved");
            });
          });

          it("should return with data from the second query", () => {
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(false);
            expect(renderHookResult.result.current.data).toBe("2nd resolved");
          });

          describe("the first query resolves", () => {
            beforeEach(async () => {
              await act(async () => {
                deferred.resolve("1st resolved");
              });
            });

            it("should return with data from the second query", () => {
              expect(renderHookResult.result.current.error).toBe(null);
              expect(renderHookResult.result.current.loading).toBe(false);
              expect(renderHookResult.result.current.data).toBe("2nd resolved");
            });
          });
        });

        describe("the first query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.resolve("resolved");
            });
          });

          it("should return loading=true and data=null", () => {
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(true);
            expect(renderHookResult.result.current.data).toBe(null);
          });

          describe("the second query resolves", () => {
            beforeEach(async () => {
              await act(async () => {
                deferred2.resolve("2nd resolved");
              });
            });

            it("should return with data from the second query", () => {
              expect(renderHookResult.result.current.error).toBe(null);
              expect(renderHookResult.result.current.loading).toBe(false);
              expect(renderHookResult.result.current.data).toBe("2nd resolved");
            });
          });
        });
        describe("the first query rejects", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.reject("rejected");
            });
          });
          it("should return loading=true and data=null", () => {
            expect(renderHookResult.result.current.loading).toBe(true);
            expect(renderHookResult.result.current.data).toBe(null);
          });
          it("should not return an error or call onError", () => {
            expect(renderHookResult.result.current.error).toBe(null);
            expect(onError).toHaveBeenCalledTimes(0);
          });
        });
      });
    });

    describe("is called with skip set to true", () => {
      let renderHookResult: RenderHookResult<
        QueryResult<QueryResponse, QueryVariables>,
        QueryOptionsWithVariables<QueryResponse, QueryVariables>
      >;
      beforeEach(() => {
        renderHookResult = renderHook<
          QueryResult<QueryResponse, QueryVariables>,
          QueryOptionsWithVariables<QueryResponse, QueryVariables>
        >(
          (options) =>
            useQuery<QueryResponse, QueryVariables>(mockQuery, options),
          {
            initialProps: {
              variables: { optionA: "run1-A", optionB: "run1-B" },
              skip: true,
            },
          }
        );
      });
      it("should start with loading set to false", async () => {
        expect(mockQuery).toHaveBeenCalledTimes(0);
        expect(renderHookResult.result.current.error).toBe(null);
        expect(renderHookResult.result.current.loading).toBe(false);
        expect(renderHookResult.result.current.data).toBe(null);
      });
      describe("is called again with skip not set", () => {
        beforeEach(() => {
          renderHookResult.rerender({
            variables: { optionA: "run2-A", optionB: "run2-B" },
          });
        });
        it("should set loading to true", () => {
          expect(mockQuery).toHaveBeenCalledWith({
            optionA: "run2-A",
            optionB: "run2-B",
          });
          expect(mockQuery).toHaveBeenCalledTimes(1);
          expect(renderHookResult.result.current.error).toBe(null);
          expect(renderHookResult.result.current.loading).toBe(true);
          expect(renderHookResult.result.current.data).toBe(null);
        });
        describe("the query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.resolve("resolved");
            });
          });
          it("should return with loading set to false", () => {
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(false);
            expect(renderHookResult.result.current.data).toBe("resolved");
          });
        });
      });
      describe("refetch is called with partial variables", () => {
        beforeEach(() => {
          act(() => {
            renderHookResult.result.current.refetch({ optionB: "run2-B" });
          });
        });
        it("should call the query with merged variabls", () => {
          expect(mockQuery).toHaveBeenCalledWith({
            optionA: "run1-A",
            optionB: "run2-B",
          });
          expect(mockQuery).toHaveBeenCalledTimes(1);
        });
        it("should set loading to true", () => {
          expect(renderHookResult.result.current.error).toBe(null);
          expect(renderHookResult.result.current.loading).toBe(true);
          expect(renderHookResult.result.current.data).toBe(null);
        });
        describe("the query resolves", () => {
          beforeEach(async () => {
            await act(async () => {
              deferred.resolve("resolved");
            });
          });
          it("should return with loading set to false", () => {
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(renderHookResult.result.current.error).toBe(null);
            expect(renderHookResult.result.current.loading).toBe(false);
            expect(renderHookResult.result.current.data).toBe("resolved");
          });
        });
      });
    });
  });

  describe("when an asyncronous query without variables", () => {
    let deferred: Deferred<string>;
    const mockQuery = jest.fn<Promise<string>, never>();
    afterEach(() => {
      mockQuery.mockReset();
    });

    beforeEach(() => {
      deferred = new Deferred<string>();
      mockQuery.mockReturnValue(deferred.promise);
    });

    describe("is called without variables", () => {
      let renderHookResult: RenderHookResult<
        QueryResult<string, never>,
        QueryOptions<string>
      >;
      beforeEach(() => {
        renderHookResult = renderHook<
          QueryResult<string, never>,
          QueryOptions<string>
        >(() => useQuery<string>(mockQuery));
      });
      it("should start with loading set to true", async () => {
        expect(mockQuery).toHaveBeenCalled();
        expect(mockQuery).toHaveBeenCalledTimes(1);
        expect(renderHookResult.result.current.error).toBe(null);
        expect(renderHookResult.result.current.loading).toBe(true);
        expect(renderHookResult.result.current.data).toBe(null);
      });
    });
  });
});
